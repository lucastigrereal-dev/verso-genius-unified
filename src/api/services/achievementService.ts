/**
 * Achievement Service
 * Sistema de conquistas (achievements) e badges
 */

import { supabase } from '../../../config/supabase'
import type { Achievement, UserAchievement } from '../../types/monetization'
import { CurrencyService } from './currencyService'

export class AchievementService {
  /**
   * Obter todas as conquistas disponíveis
   */
  static async getAllAchievements(): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('category', { ascending: true })

    if (error) throw new Error(`Erro ao buscar conquistas: ${error.message}`)

    return data || []
  }

  /**
   * Obter conquistas por categoria
   */
  static async getAchievementsByCategory(
    category: 'practice' | 'social' | 'progression' | 'special'
  ): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('category', category)
      .order('tier', { ascending: true })

    if (error) throw new Error(`Erro ao buscar conquistas: ${error.message}`)

    return data || []
  }

  /**
   * Obter conquistas do usuário
   */
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false })

    if (error) throw new Error(`Erro ao buscar conquistas: ${error.message}`)

    return data || []
  }

  /**
   * Verificar progresso de uma conquista específica
   */
  static async checkProgress(
    userId: string,
    achievementId: string
  ): Promise<{
    achievement: Achievement
    progress: number
    isUnlocked: boolean
  }> {
    // Buscar conquista
    const { data: achievement, error: achievementError } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', achievementId)
      .single()

    if (achievementError) throw new Error(`Erro ao buscar conquista: ${achievementError.message}`)

    // Verificar se já está desbloqueada
    const { data: userAchievement } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .maybeSingle()

    if (userAchievement) {
      return {
        achievement,
        progress: userAchievement.progress,
        isUnlocked: true
      }
    }

    // Calcular progresso atual baseado no tipo de conquista
    const progress = await this.calculateProgress(userId, achievement)

    return {
      achievement,
      progress,
      isUnlocked: false
    }
  }

  /**
   * Calcular progresso atual baseado no tipo de conquista
   */
  private static async calculateProgress(
    userId: string,
    achievement: Achievement
  ): Promise<number> {
    const requirement = achievement.requirement as any

    switch (requirement.type) {
      case 'rhyme_count': {
        // Contar rimas criadas
        const { count } = await supabase
          .from('rimas_banco')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)

        return count || 0
      }

      case 'practice_streak': {
        // TODO: Implementar lógica de streak
        // Por enquanto retorna 0
        return 0
      }

      case 'battle_wins': {
        // Contar vitórias em batalhas
        const { count } = await supabase
          .from('battles')
          .select('*', { count: 'exact', head: true })
          .eq('winner_id', userId)

        return count || 0
      }

      case 'total_xp': {
        // Buscar XP total do usuário
        const { data: profile } = await supabase
          .from('users')
          .select('xp')
          .eq('id', userId)
          .single()

        return profile?.xp || 0
      }

      case 'level_reached': {
        // Buscar nível do usuário
        const { data: profile } = await supabase
          .from('users')
          .select('level')
          .eq('id', userId)
          .single()

        return profile?.level || 0
      }

      case 'friends_count': {
        // Contar amigos
        const { count } = await supabase
          .from('friendships')
          .select('*', { count: 'exact', head: true })
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
          .eq('status', 'accepted')

        return count || 0
      }

      case 'cosmetic_collection': {
        // Contar cosméticos
        const { count } = await supabase
          .from('user_cosmetics')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)

        return count || 0
      }

      default:
        return 0
    }
  }

  /**
   * Atualizar progresso de uma conquista
   */
  static async updateProgress(
    userId: string,
    achievementId: string,
    newProgress: number
  ): Promise<{
    userAchievement: UserAchievement | null
    unlocked: boolean
  }> {
    const { achievement, isUnlocked } = await this.checkProgress(userId, achievementId)

    if (isUnlocked) {
      // Já desbloqueada
      return { userAchievement: null, unlocked: false }
    }

    // Verificar se atingiu o objetivo
    const requirement = achievement.requirement as any
    const targetValue = requirement.target

    if (newProgress >= targetValue) {
      // Desbloquear conquista
      return await this.unlockAchievement(userId, achievementId, newProgress)
    }

    // Apenas atualizar progresso (não salva se não estiver completa)
    return { userAchievement: null, unlocked: false }
  }

  /**
   * Desbloquear conquista
   */
  static async unlockAchievement(
    userId: string,
    achievementId: string,
    progress: number
  ): Promise<{
    userAchievement: UserAchievement
    unlocked: boolean
  }> {
    // Verificar se já foi desbloqueada
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .maybeSingle()

    if (existing) {
      return { userAchievement: existing, unlocked: false }
    }

    // Buscar conquista para obter recompensas
    const { data: achievement } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', achievementId)
      .single()

    if (!achievement) throw new Error('Conquista não encontrada')

    // Criar user_achievement
    const { data: userAchievement, error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
        progress,
        unlocked_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao desbloquear conquista: ${error.message}`)

    // Conceder recompensas
    if (achievement.reward_coins > 0) {
      await CurrencyService.addCurrency(
        userId,
        'coins',
        achievement.reward_coins,
        `achievement_${achievement.id}`
      )
    }

    if (achievement.reward_gems > 0) {
      await CurrencyService.addCurrency(
        userId,
        'gems',
        achievement.reward_gems,
        `achievement_${achievement.id}`
      )
    }

    if (achievement.reward_xp > 0) {
      // TODO: Adicionar XP ao usuário
      // await XPService.addXP(userId, achievement.reward_xp, 'achievement')
    }

    return { userAchievement, unlocked: true }
  }

  /**
   * Verificar e atualizar múltiplas conquistas baseadas em evento
   */
  static async checkEventAchievements(
    userId: string,
    event: {
      type: 'rhyme_created' | 'battle_won' | 'level_up' | 'friend_added' | 'cosmetic_acquired'
      data?: any
    }
  ): Promise<UserAchievement[]> {
    const unlockedAchievements: UserAchievement[] = []

    // Buscar conquistas relacionadas ao evento
    const achievements = await this.getAllAchievements()

    for (const achievement of achievements) {
      const requirement = achievement.requirement as any

      // Verificar se o tipo de conquista corresponde ao evento
      let shouldCheck = false

      if (event.type === 'rhyme_created' && requirement.type === 'rhyme_count') {
        shouldCheck = true
      } else if (event.type === 'battle_won' && requirement.type === 'battle_wins') {
        shouldCheck = true
      } else if (event.type === 'level_up' && requirement.type === 'level_reached') {
        shouldCheck = true
      } else if (event.type === 'friend_added' && requirement.type === 'friends_count') {
        shouldCheck = true
      } else if (
        event.type === 'cosmetic_acquired' &&
        requirement.type === 'cosmetic_collection'
      ) {
        shouldCheck = true
      }

      if (shouldCheck) {
        const { progress } = await this.checkProgress(userId, achievement.id)
        const { userAchievement, unlocked } = await this.updateProgress(
          userId,
          achievement.id,
          progress
        )

        if (unlocked && userAchievement) {
          unlockedAchievements.push(userAchievement)
        }
      }
    }

    return unlockedAchievements
  }

  /**
   * Obter estatísticas de conquistas do usuário
   */
  static async getUserStats(userId: string): Promise<{
    totalAchievements: number
    unlockedAchievements: number
    percentComplete: number
    totalCoinsEarned: number
    totalGemsEarned: number
    totalXPEarned: number
    byCategory: Record<
      string,
      { total: number; unlocked: number; percent: number }
    >
  }> {
    const allAchievements = await this.getAllAchievements()
    const userAchievements = await this.getUserAchievements(userId)

    const totalAchievements = allAchievements.length
    const unlockedAchievements = userAchievements.length
    const percentComplete =
      totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0

    // Calcular recompensas totais ganhas
    let totalCoinsEarned = 0
    let totalGemsEarned = 0
    let totalXPEarned = 0

    for (const userAch of userAchievements) {
      const achievement = allAchievements.find(a => a.id === userAch.achievement_id)
      if (achievement) {
        totalCoinsEarned += achievement.reward_coins
        totalGemsEarned += achievement.reward_gems
        totalXPEarned += achievement.reward_xp
      }
    }

    // Estatísticas por categoria
    const categories = ['practice', 'social', 'progression', 'special']
    const byCategory: Record<string, { total: number; unlocked: number; percent: number }> =
      {}

    for (const category of categories) {
      const categoryAchievements = allAchievements.filter(a => a.category === category)
      const categoryUnlocked = userAchievements.filter(ua =>
        categoryAchievements.some(ca => ca.id === ua.achievement_id)
      )

      byCategory[category] = {
        total: categoryAchievements.length,
        unlocked: categoryUnlocked.length,
        percent:
          categoryAchievements.length > 0
            ? (categoryUnlocked.length / categoryAchievements.length) * 100
            : 0
      }
    }

    return {
      totalAchievements,
      unlockedAchievements,
      percentComplete,
      totalCoinsEarned,
      totalGemsEarned,
      totalXPEarned,
      byCategory
    }
  }

  /**
   * Criar nova conquista (admin)
   */
  static async createAchievement(
    data: Omit<Achievement, 'id' | 'created_at'>
  ): Promise<Achievement> {
    const { data: achievement, error } = await supabase
      .from('achievements')
      .insert(data)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar conquista: ${error.message}`)

    return achievement
  }
}
