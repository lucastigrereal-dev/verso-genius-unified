/**
 * Referral Service
 * Sistema de indicações e recompensas por referral
 */

import { supabase } from '../../../config/supabase'
import type { Referral } from '../../types/monetization'
import { CurrencyService } from './currencyService'

export class ReferralService {
  /**
   * Gerar código de indicação único para usuário
   */
  static async generateReferralCode(userId: string): Promise<string> {
    // Verificar se já existe código
    const { data: existing } = await supabase
      .from('users')
      .select('referral_code')
      .eq('id', userId)
      .single()

    if (existing?.referral_code) {
      return existing.referral_code
    }

    // Gerar código único (6 caracteres alfanuméricos)
    let code = ''
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

    let isUnique = false
    while (!isUnique) {
      code = ''
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }

      // Verificar unicidade
      const { data: conflict } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', code)
        .maybeSingle()

      if (!conflict) isUnique = true
    }

    // Salvar código no perfil do usuário
    await supabase.from('users').update({ referral_code: code }).eq('id', userId)

    return code
  }

  /**
   * Buscar código de indicação do usuário
   */
  static async getUserReferralCode(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('users')
      .select('referral_code')
      .eq('id', userId)
      .single()

    return data?.referral_code || null
  }

  /**
   * Validar código de indicação
   */
  static async validateReferralCode(code: string): Promise<{
    valid: boolean
    referrerId?: string
  }> {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('referral_code', code)
      .single()

    if (!data) {
      return { valid: false }
    }

    return { valid: true, referrerId: data.id }
  }

  /**
   * Registrar indicação quando novo usuário se cadastra
   */
  static async registerReferral(
    referrerId: string,
    referredUserId: string,
    referralCode: string
  ): Promise<Referral> {
    // Verificar se já existe referral
    const { data: existing } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_user_id', referredUserId)
      .maybeSingle()

    if (existing) {
      throw new Error('Usuário já foi indicado anteriormente')
    }

    // Criar registro de referral
    const { data: referral, error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_user_id: referredUserId,
        referral_code: referralCode,
        status: 'pending',
        referred_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao registrar indicação: ${error.message}`)

    // Conceder bônus inicial ao indicado (100 coins de boas-vindas)
    await CurrencyService.addCurrency(
      referredUserId,
      'coins',
      100,
      'referral_welcome_bonus'
    )

    return referral
  }

  /**
   * Marcar indicação como completa (quando usuário indicado completa objetivo)
   */
  static async completeReferral(
    referralId: string,
    milestone: 'signup' | 'first_exercise' | 'level_5' | 'purchase'
  ): Promise<{
    referral: Referral
    rewardGranted: boolean
  }> {
    // Buscar referral
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('*')
      .eq('id', referralId)
      .single()

    if (referralError) throw new Error(`Referral não encontrado: ${referralError.message}`)

    if (referral.status === 'completed') {
      return { referral, rewardGranted: false }
    }

    // Definir recompensas por milestone
    const rewards: Record<
      string,
      { coins?: number; gems?: number; updateStatus?: boolean }
    > = {
      signup: { coins: 50 }, // 50 coins quando indicado se cadastra
      first_exercise: { coins: 100 }, // +100 coins quando completa 1º exercício
      level_5: { coins: 200, gems: 10 }, // +200 coins, 10 gems quando atinge nível 5
      purchase: { coins: 500, gems: 50, updateStatus: true } // +500 coins, 50 gems quando faz 1ª compra
    }

    const reward = rewards[milestone]

    if (!reward) {
      throw new Error(`Milestone desconhecido: ${milestone}`)
    }

    // Conceder recompensa ao referrer
    let rewardGranted = false

    if (reward.coins) {
      await CurrencyService.addCurrency(
        referral.referrer_id,
        'coins',
        reward.coins,
        `referral_milestone_${milestone}`
      )
      rewardGranted = true
    }

    if (reward.gems) {
      await CurrencyService.addCurrency(
        referral.referrer_id,
        'gems',
        reward.gems,
        `referral_milestone_${milestone}`
      )
      rewardGranted = true
    }

    // Atualizar status se for milestone final
    if (reward.updateStatus) {
      const { data: updatedReferral, error: updateError } = await supabase
        .from('referrals')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', referralId)
        .select()
        .single()

      if (updateError) throw new Error(`Erro ao atualizar: ${updateError.message}`)

      return { referral: updatedReferral, rewardGranted }
    }

    return { referral, rewardGranted }
  }

  /**
   * Obter indicações de um usuário
   */
  static async getUserReferrals(userId: string): Promise<Referral[]> {
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referred_user:users!referrals_referred_user_id_fkey(id, username, level)
      `)
      .eq('referrer_id', userId)
      .order('referred_at', { ascending: false })

    if (error) throw new Error(`Erro ao buscar indicações: ${error.message}`)

    return data || []
  }

  /**
   * Obter estatísticas de indicação do usuário
   */
  static async getUserReferralStats(userId: string): Promise<{
    totalReferrals: number
    pendingReferrals: number
    completedReferrals: number
    totalCoinsEarned: number
    totalGemsEarned: number
    referralCode: string | null
    recentReferrals: Referral[]
  }> {
    const referralCode = await this.getUserReferralCode(userId)
    const referrals = await this.getUserReferrals(userId)

    const totalReferrals = referrals.length
    const pendingReferrals = referrals.filter(r => r.status === 'pending').length
    const completedReferrals = referrals.filter(r => r.status === 'completed').length

    // Calcular coins/gems ganhos (aproximado)
    // signup: 50 coins
    // first_exercise: +100 coins
    // level_5: +200 coins, +10 gems
    // purchase: +500 coins, +50 gems

    // Simplificado: assumir que referrals completos geraram máximo de recompensas
    const totalCoinsEarned = completedReferrals * (50 + 100 + 200 + 500)
    const totalGemsEarned = completedReferrals * (10 + 50)

    const recentReferrals = referrals.slice(0, 5)

    return {
      totalReferrals,
      pendingReferrals,
      completedReferrals,
      totalCoinsEarned,
      totalGemsEarned,
      referralCode,
      recentReferrals
    }
  }

  /**
   * Obter leaderboard de indicações
   */
  static async getReferralLeaderboard(limit: number = 10): Promise<
    Array<{
      userId: string
      username: string
      totalReferrals: number
      completedReferrals: number
    }>
  > {
    const { data, error } = await supabase.rpc('get_referral_leaderboard', {
      p_limit: limit
    })

    if (error) {
      // Se RPC não existir, fazer manualmente
      const { data: referrals } = await supabase
        .from('referrals')
        .select(`
          referrer_id,
          status,
          users!referrals_referrer_id_fkey(id, username)
        `)

      if (!referrals) return []

      // Agrupar por referrer
      const leaderboard: Record<
        string,
        {
          userId: string
          username: string
          totalReferrals: number
          completedReferrals: number
        }
      > = {}

      for (const ref of referrals) {
        const user = (ref as any).users

        if (!leaderboard[ref.referrer_id]) {
          leaderboard[ref.referrer_id] = {
            userId: ref.referrer_id,
            username: user?.username || 'Unknown',
            totalReferrals: 0,
            completedReferrals: 0
          }
        }

        leaderboard[ref.referrer_id].totalReferrals++
        if (ref.status === 'completed') {
          leaderboard[ref.referrer_id].completedReferrals++
        }
      }

      return Object.values(leaderboard)
        .sort((a, b) => b.completedReferrals - a.completedReferrals)
        .slice(0, limit)
    }

    return data || []
  }

  /**
   * Verificar se usuário pode ser indicado
   */
  static async canBeReferred(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_user_id', userId)
      .maybeSingle()

    return !data // Pode ser indicado se ainda não tiver sido
  }

  /**
   * Processar milestones automaticamente (chamado por hooks)
   */
  static async processReferralMilestone(
    userId: string,
    event: 'first_exercise' | 'level_5' | 'purchase'
  ): Promise<void> {
    // Buscar referral do usuário (se foi indicado)
    const { data: referral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_user_id', userId)
      .eq('status', 'pending')
      .maybeSingle()

    if (!referral) return // Usuário não foi indicado

    // Completar milestone
    await this.completeReferral(referral.id, event)
  }
}
