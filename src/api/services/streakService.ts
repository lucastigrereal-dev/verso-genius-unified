/**
 * Streak Service
 * Sistema de streaks diários com recompensas e proteção
 */

import { supabase } from '../../../config/supabase'
import { CurrencyService } from './currencyService'

interface UserStreak {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_check_in: string
  total_check_ins: number
  streak_frozen_until: string | null
  created_at: string
  updated_at: string
}

interface StreakReward {
  day: number
  coins: number
  gems?: number
  multiplier?: number
}

interface CheckInResult {
  streak: UserStreak
  reward: StreakReward
  levelUp: boolean
  newLevel?: number
}

export class StreakService {
  /**
   * Milestones de recompensas por streak
   */
  private static STREAK_REWARDS: StreakReward[] = [
    { day: 1, coins: 10 },
    { day: 2, coins: 15 },
    { day: 3, coins: 20 },
    { day: 5, coins: 30, gems: 1 },
    { day: 7, coins: 50, gems: 2, multiplier: 1.1 }, // +10% XP por 1 dia
    { day: 14, coins: 100, gems: 5, multiplier: 1.2 },
    { day: 30, coins: 200, gems: 10, multiplier: 1.5 },
    { day: 60, coins: 400, gems: 20, multiplier: 2.0 },
    { day: 100, coins: 1000, gems: 50, multiplier: 3.0 }
  ]

  /**
   * Obter streak do usuário
   */
  static async getUserStreak(userId: string): Promise<UserStreak | null> {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar streak: ${error.message}`)
    }

    return data
  }

  /**
   * Inicializar streak para novo usuário
   */
  static async initializeStreak(userId: string): Promise<UserStreak> {
    const { data, error } = await supabase
      .from('user_streaks')
      .insert({
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_check_in: null,
        total_check_ins: 0,
        streak_frozen_until: null
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao inicializar streak: ${error.message}`)

    return data
  }

  /**
   * Fazer check-in diário
   */
  static async checkIn(userId: string): Promise<CheckInResult> {
    let streak = await this.getUserStreak(userId)

    // Se não existe, criar
    if (!streak) {
      streak = await this.initializeStreak(userId)
    }

    const now = new Date()
    const today = this.getDateString(now)

    // Verificar se já fez check-in hoje
    if (streak.last_check_in && this.getDateString(new Date(streak.last_check_in)) === today) {
      throw new Error('Você já fez check-in hoje')
    }

    // Verificar se streak está congelado (proteção ativa)
    const isFrozen = streak.streak_frozen_until && new Date(streak.streak_frozen_until) > now

    // Calcular novo streak
    let newStreak = 1
    const lastCheckIn = streak.last_check_in ? new Date(streak.last_check_in) : null

    if (lastCheckIn) {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayString = this.getDateString(yesterday)

      if (this.getDateString(lastCheckIn) === yesterdayString) {
        // Mantém streak (check-in foi ontem)
        newStreak = streak.current_streak + 1
      } else if (isFrozen) {
        // Streak protegido, mantém
        newStreak = streak.current_streak + 1
      } else {
        // Perdeu streak
        newStreak = 1
      }
    }

    // Atualizar streak
    const { data: updatedStreak, error } = await supabase
      .from('user_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, streak.longest_streak),
        last_check_in: now.toISOString(),
        total_check_ins: streak.total_check_ins + 1,
        updated_at: now.toISOString()
      })
      .eq('id', streak.id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar streak: ${error.message}`)

    // Calcular recompensa
    const reward = this.calculateReward(newStreak)

    // Conceder recompensas
    await CurrencyService.addCurrency(userId, 'coins', reward.coins, `streak_day_${newStreak}`)

    if (reward.gems) {
      await CurrencyService.addCurrency(userId, 'gems', reward.gems, `streak_day_${newStreak}`)
    }

    // TODO: Aplicar multiplicador de XP (integrar com XPService quando existir)
    // if (reward.multiplier) {
    //   await XPService.setMultiplier(userId, reward.multiplier, 24 * 60 * 60)
    // }

    return {
      streak: updatedStreak,
      reward,
      levelUp: false // TODO: Verificar se usuário subiu de nível
    }
  }

  /**
   * Comprar proteção de streak (com gems)
   */
  static async buyStreakProtection(
    userId: string,
    days: number = 1
  ): Promise<UserStreak> {
    const GEMS_PER_DAY = 10

    const cost = days * GEMS_PER_DAY

    // Verificar saldo
    const canAfford = await CurrencyService.canAfford(userId, 'gems', cost)

    if (!canAfford) {
      throw new Error('Gems insuficientes')
    }

    // Debitar gems
    await CurrencyService.spendCurrency(userId, 'gems', cost, 'streak_protection')

    // Obter streak atual
    let streak = await this.getUserStreak(userId)

    if (!streak) {
      streak = await this.initializeStreak(userId)
    }

    // Calcular data de expiração
    const now = new Date()
    const currentFrozenUntil = streak.streak_frozen_until
      ? new Date(streak.streak_frozen_until)
      : now

    const newFrozenUntil = new Date(Math.max(now.getTime(), currentFrozenUntil.getTime()))
    newFrozenUntil.setDate(newFrozenUntil.getDate() + days)

    // Atualizar
    const { data: updatedStreak, error } = await supabase
      .from('user_streaks')
      .update({
        streak_frozen_until: newFrozenUntil.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', streak.id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao ativar proteção: ${error.message}`)

    return updatedStreak
  }

  /**
   * Verificar se usuário pode fazer check-in
   */
  static async canCheckIn(userId: string): Promise<{
    canCheckIn: boolean
    reason?: string
    nextCheckIn?: Date
  }> {
    const streak = await this.getUserStreak(userId)

    if (!streak || !streak.last_check_in) {
      return { canCheckIn: true }
    }

    const now = new Date()
    const today = this.getDateString(now)
    const lastCheckInDate = this.getDateString(new Date(streak.last_check_in))

    if (lastCheckInDate === today) {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      return {
        canCheckIn: false,
        reason: 'Você já fez check-in hoje',
        nextCheckIn: tomorrow
      }
    }

    return { canCheckIn: true }
  }

  /**
   * Obter estatísticas de streak
   */
  static async getStreakStats(userId: string): Promise<{
    currentStreak: number
    longestStreak: number
    totalCheckIns: number
    nextReward: StreakReward | null
    isProtected: boolean
    protectedUntil: Date | null
    canCheckInToday: boolean
    streakAtRisk: boolean
  }> {
    const streak = await this.getUserStreak(userId)

    if (!streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalCheckIns: 0,
        nextReward: this.STREAK_REWARDS[0],
        isProtected: false,
        protectedUntil: null,
        canCheckInToday: true,
        streakAtRisk: false
      }
    }

    const now = new Date()
    const isProtected =
      streak.streak_frozen_until && new Date(streak.streak_frozen_until) > now

    // Determinar próxima recompensa
    const nextReward = this.getNextReward(streak.current_streak)

    // Verificar se pode fazer check-in
    const { canCheckIn } = await this.canCheckIn(userId)

    // Verificar se streak está em risco
    const lastCheckIn = streak.last_check_in ? new Date(streak.last_check_in) : null
    const streakAtRisk =
      lastCheckIn && !isProtected && this.getDateString(lastCheckIn) !== this.getDateString(now)

    return {
      currentStreak: streak.current_streak,
      longestStreak: streak.longest_streak,
      totalCheckIns: streak.total_check_ins,
      nextReward,
      isProtected: !!isProtected,
      protectedUntil: streak.streak_frozen_until ? new Date(streak.streak_frozen_until) : null,
      canCheckInToday: canCheckIn,
      streakAtRisk: !!streakAtRisk
    }
  }

  /**
   * Obter leaderboard de streaks
   */
  static async getStreakLeaderboard(limit: number = 100): Promise<
    Array<{
      userId: string
      username: string
      avatar_url?: string
      currentStreak: number
      longestStreak: number
      rank: number
    }>
  > {
    const { data, error } = await supabase
      .from('user_streaks')
      .select(`
        user_id,
        current_streak,
        longest_streak,
        users!user_streaks_user_id_fkey(id, username, avatar_url)
      `)
      .order('current_streak', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`Erro ao buscar leaderboard: ${error.message}`)

    return (data || []).map((entry: any, index) => ({
      userId: entry.user_id,
      username: entry.users?.username || 'Unknown',
      avatar_url: entry.users?.avatar_url,
      currentStreak: entry.current_streak,
      longestStreak: entry.longest_streak,
      rank: index + 1
    }))
  }

  /**
   * Recuperar streak perdido (feature premium)
   */
  static async recoverLostStreak(userId: string): Promise<UserStreak> {
    const RECOVERY_COST_GEMS = 50

    // Verificar saldo
    const canAfford = await CurrencyService.canAfford(userId, 'gems', RECOVERY_COST_GEMS)

    if (!canAfford) {
      throw new Error('Gems insuficientes')
    }

    const streak = await this.getUserStreak(userId)

    if (!streak) {
      throw new Error('Streak não encontrado')
    }

    if (streak.current_streak === streak.longest_streak) {
      throw new Error('Seu streak atual já é o maior')
    }

    // Debitar gems
    await CurrencyService.spendCurrency(userId, 'gems', RECOVERY_COST_GEMS, 'streak_recovery')

    // Restaurar streak
    const { data: updatedStreak, error } = await supabase
      .from('user_streaks')
      .update({
        current_streak: streak.longest_streak,
        last_check_in: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', streak.id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao recuperar streak: ${error.message}`)

    return updatedStreak
  }

  /**
   * Helpers
   */

  private static getDateString(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  private static calculateReward(streakDay: number): StreakReward {
    // Encontrar milestone mais próximo
    const milestone = [...this.STREAK_REWARDS]
      .reverse()
      .find(r => streakDay >= r.day) || this.STREAK_REWARDS[0]

    // Para dias intermediários, interpolar recompensa
    if (streakDay > milestone.day) {
      const baseCoins = milestone.coins
      const bonus = Math.floor((streakDay - milestone.day) * 2)
      return {
        day: streakDay,
        coins: baseCoins + bonus
      }
    }

    return milestone
  }

  private static getNextReward(currentStreak: number): StreakReward | null {
    const next = this.STREAK_REWARDS.find(r => r.day > currentStreak)
    return next || null
  }
}
