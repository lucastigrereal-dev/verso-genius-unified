/**
 * Daily Challenges Service
 * Gerencia desafios diários e recompensas
 */

import { supabase } from '../../../config/supabase'
import { CurrencyService } from './currencyService'
import type {
  DailyChallenge,
  UserDailyChallenge,
  ChallengeDifficulty
} from '../../types/monetization'

export class DailyChallengesService {
  /**
   * Obtém desafios do dia atual
   */
  static async getTodaysChallenges(): Promise<DailyChallenge[]> {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('active_date', today)
      .order('difficulty', { ascending: true })

    if (error) throw new Error(`Erro ao buscar desafios: ${error.message}`)

    // Se não existem desafios para hoje, gerar novos
    if (!data || data.length === 0) {
      return await this.generateDailyChallenges()
    }

    return data
  }

  /**
   * Obtém progresso do usuário nos desafios de hoje
   */
  static async getUserProgress(userId: string): Promise<{
    challenges: (DailyChallenge & { progress?: any; completed?: boolean })[]
    total_completed: number
    all_completed: boolean
  }> {
    const challenges = await this.getTodaysChallenges()

    // Buscar progresso do usuário
    const { data: userProgress } = await supabase
      .from('user_daily_challenges')
      .select('*')
      .eq('user_id', userId)
      .in('challenge_id', challenges.map(c => c.id))

    const progressMap = new Map(
      (userProgress || []).map(p => [p.challenge_id, p])
    )

    const challengesWithProgress = challenges.map(challenge => ({
      ...challenge,
      progress: progressMap.get(challenge.id)?.progress || {},
      completed: !!progressMap.get(challenge.id)?.completed_at
    }))

    const totalCompleted = challengesWithProgress.filter(c => c.completed).length
    const allCompleted = totalCompleted === challenges.length

    return {
      challenges: challengesWithProgress,
      total_completed: totalCompleted,
      all_completed: allCompleted
    }
  }

  /**
   * Atualiza progresso de um desafio
   */
  static async updateProgress(
    userId: string,
    challengeId: string,
    progressData: any
  ): Promise<{ completed: boolean; challenge: DailyChallenge }> {
    // Buscar desafio
    const { data: challenge, error: challengeError } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (challengeError || !challenge) {
      throw new Error('Desafio não encontrado')
    }

    // Verificar se já completou
    const { data: existing } = await supabase
      .from('user_daily_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single()

    if (existing?.completed_at) {
      return { completed: true, challenge }
    }

    // Verificar se completou o requisito
    const isCompleted = this.checkChallengeCompletion(challenge, progressData)

    // Upsert progresso
    const { error: upsertError } = await supabase
      .from('user_daily_challenges')
      .upsert({
        user_id: userId,
        challenge_id: challengeId,
        progress: progressData,
        completed_at: isCompleted ? new Date().toISOString() : null
      }, {
        onConflict: 'user_id,challenge_id'
      })

    if (upsertError) {
      throw new Error(`Erro ao atualizar progresso: ${upsertError.message}`)
    }

    // Se completou, dar recompensas
    if (isCompleted) {
      await this.giveRewards(userId, challenge)
    }

    return { completed: isCompleted, challenge }
  }

  /**
   * Verifica se o desafio foi completado
   */
  private static checkChallengeCompletion(
    challenge: DailyChallenge,
    progressData: any
  ): boolean {
    const req = challenge.requirements

    switch (req.type) {
      case 'rhyme_count':
        return (progressData.rhymes_created || 0) >= req.target

      case 'freestyle_duration':
        return (progressData.total_duration || 0) >= req.target

      case 'high_score_count':
        return (progressData.high_scores || 0) >= req.target

      case 'streak_days':
        return (progressData.current_streak || 0) >= req.target

      default:
        return false
    }
  }

  /**
   * Dar recompensas ao completar desafio
   */
  private static async giveRewards(
    userId: string,
    challenge: DailyChallenge
  ): Promise<void> {
    // Adicionar coins
    if (challenge.reward_coins > 0) {
      await CurrencyService.addCurrency(
        userId,
        'coins',
        challenge.reward_coins,
        `challenge_${challenge.id}`
      )
    }

    // Adicionar XP (TODO: implementar sistema de XP)
    // await XPService.addXP(userId, challenge.reward_xp)
  }

  /**
   * Reivindicar recompensa de desafio completado
   */
  static async claimReward(
    userId: string,
    challengeId: string
  ): Promise<{ coins: number; xp: number }> {
    // Verificar se completou
    const { data: userChallenge } = await supabase
      .from('user_daily_challenges')
      .select('*, daily_challenges(*)')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single()

    if (!userChallenge || !userChallenge.completed_at) {
      throw new Error('Desafio não completado')
    }

    const challenge = userChallenge.daily_challenges as any

    return {
      coins: challenge.reward_coins,
      xp: challenge.reward_xp
    }
  }

  /**
   * Gerar desafios diários automaticamente
   */
  static async generateDailyChallenges(): Promise<DailyChallenge[]> {
    const today = new Date().toISOString().split('T')[0]

    const challengeTemplates = [
      // Easy
      {
        title: '10 Rimas Rápidas',
        description: 'Crie 10 rimas em sequência',
        difficulty: 'easy' as ChallengeDifficulty,
        reward_coins: 10,
        reward_xp: 50,
        requirements: { type: 'rhyme_count', target: 10 }
      },
      {
        title: 'Aquecimento Diário',
        description: 'Complete 3 exercícios',
        difficulty: 'easy' as ChallengeDifficulty,
        reward_coins: 15,
        reward_xp: 75,
        requirements: { type: 'exercise_count', target: 3 }
      },
      // Medium
      {
        title: 'Freestyle 60s',
        description: 'Grave um freestyle de 60 segundos sem parar',
        difficulty: 'medium' as ChallengeDifficulty,
        reward_coins: 25,
        reward_xp: 100,
        requirements: { type: 'freestyle_duration', target: 60 }
      },
      {
        title: 'Pontuação Alta',
        description: 'Consiga 80+ de score em qualquer exercício',
        difficulty: 'medium' as ChallengeDifficulty,
        reward_coins: 30,
        reward_xp: 125,
        requirements: { type: 'min_score', target: 80 }
      },
      // Hard
      {
        title: 'Mestre das Métricas',
        description: 'Complete 3 exercícios com score acima de 90',
        difficulty: 'hard' as ChallengeDifficulty,
        reward_coins: 50,
        reward_xp: 200,
        requirements: { type: 'high_score_count', target: 3, min_score: 90 }
      },
      {
        title: 'Maratona de Rimas',
        description: 'Crie 50 rimas em um dia',
        difficulty: 'hard' as ChallengeDifficulty,
        reward_coins: 75,
        reward_xp: 300,
        requirements: { type: 'rhyme_count', target: 50 }
      }
    ]

    // Selecionar 3 desafios aleatórios (1 de cada dificuldade)
    const selectedChallenges = [
      challengeTemplates.filter(c => c.difficulty === 'easy')[
        Math.floor(Math.random() * 2)
      ],
      challengeTemplates.filter(c => c.difficulty === 'medium')[
        Math.floor(Math.random() * 2)
      ],
      challengeTemplates.filter(c => c.difficulty === 'hard')[
        Math.floor(Math.random() * 2)
      ]
    ]

    // Inserir no banco
    const { data, error } = await supabase
      .from('daily_challenges')
      .insert(
        selectedChallenges.map(c => ({
          ...c,
          active_date: today
        }))
      )
      .select()

    if (error) throw new Error(`Erro ao gerar desafios: ${error.message}`)

    return data
  }

  /**
   * Bônus por completar todos os desafios do dia
   */
  static async claimDailyBonus(userId: string): Promise<{
    coins: number
    gems: number
  }> {
    const { all_completed } = await this.getUserProgress(userId)

    if (!all_completed) {
      throw new Error('Complete todos os desafios primeiro')
    }

    // Verificar se já reivindicou hoje
    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabase
      .from('user_daily_challenge_bonuses') // TODO: criar tabela
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (existing) {
      throw new Error('Bônus já reivindicado hoje')
    }

    // Dar bônus
    const bonusCoins = 100
    const bonusGems = 10

    await CurrencyService.addCurrency(userId, 'coins', bonusCoins, 'daily_bonus')
    await CurrencyService.addCurrency(userId, 'gems', bonusGems, 'daily_bonus')

    return {
      coins: bonusCoins,
      gems: bonusGems
    }
  }

  /**
   * Estatísticas de desafios do usuário
   */
  static async getUserStats(userId: string): Promise<{
    total_completed: number
    streak_days: number
    best_streak: number
    completion_rate: number
  }> {
    // Total completado
    const { count: totalCompleted } = await supabase
      .from('user_daily_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('completed_at', 'is', null)

    // TODO: Implementar cálculo de streak
    const streakDays = 1 // Placeholder
    const bestStreak = 1 // Placeholder

    return {
      total_completed: totalCompleted || 0,
      streak_days: streakDays,
      best_streak: bestStreak,
      completion_rate: 0 // TODO: calcular
    }
  }
}
