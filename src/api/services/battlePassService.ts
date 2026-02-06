/**
 * Battle Pass Service
 * Gerenciamento de temporadas, tiers, progressão e recompensas
 */

import { supabase } from '../../../config/supabase'
import type {
  BattlePass,
  BattlePassTier,
  UserBattlePass,
  BattlePassReward
} from '../../types/monetization'
import { CurrencyService } from './currencyService'

export class BattlePassService {
  /**
   * Obter Battle Pass ativo
   */
  static async getActiveBattlePass(): Promise<BattlePass | null> {
    const { data, error } = await supabase
      .from('battle_passes')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Não encontrado
      throw new Error(`Erro ao buscar Battle Pass ativo: ${error.message}`)
    }

    return data
  }

  /**
   * Obter todos os tiers de um Battle Pass
   */
  static async getBattlePassTiers(battlePassId: string): Promise<BattlePassTier[]> {
    const { data, error } = await supabase
      .from('battle_pass_tiers')
      .select('*')
      .eq('battle_pass_id', battlePassId)
      .order('tier_number', { ascending: true })

    if (error) throw new Error(`Erro ao buscar tiers: ${error.message}`)

    return data || []
  }

  /**
   * Obter progresso do usuário no Battle Pass
   */
  static async getUserBattlePass(userId: string): Promise<UserBattlePass | null> {
    const activeBattlePass = await this.getActiveBattlePass()
    if (!activeBattlePass) return null

    const { data, error } = await supabase
      .from('user_battle_passes')
      .select('*')
      .eq('user_id', userId)
      .eq('battle_pass_id', activeBattlePass.id)
      .maybeSingle()

    if (error) throw new Error(`Erro ao buscar progresso: ${error.message}`)

    // Se não existe, criar entrada inicial (free tier)
    if (!data) {
      return await this.initializeUserBattlePass(userId, activeBattlePass.id)
    }

    return data
  }

  /**
   * Inicializar Battle Pass para usuário (tier gratuito)
   */
  static async initializeUserBattlePass(
    userId: string,
    battlePassId: string
  ): Promise<UserBattlePass> {
    const { data, error } = await supabase
      .from('user_battle_passes')
      .insert({
        user_id: userId,
        battle_pass_id: battlePassId,
        is_premium: false,
        current_tier: 0,
        xp_earned: 0
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao inicializar Battle Pass: ${error.message}`)

    return data
  }

  /**
   * Comprar Battle Pass Premium
   */
  static async purchasePremium(
    userId: string,
    battlePassId: string
  ): Promise<UserBattlePass> {
    const battlePass = await this.getActiveBattlePass()
    if (!battlePass) throw new Error('Nenhum Battle Pass ativo')

    // Verificar saldo de gems
    const canAfford = await CurrencyService.canAfford(
      userId,
      'gems',
      battlePass.price_gems
    )

    if (!canAfford) {
      throw new Error('Gems insuficientes')
    }

    // Debitar gems
    await CurrencyService.spendCurrency(
      userId,
      'gems',
      battlePass.price_gems,
      'battle_pass_purchase'
    )

    // Atualizar para premium
    const { data, error } = await supabase
      .from('user_battle_passes')
      .update({
        is_premium: true,
        purchased_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('battle_pass_id', battlePassId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao ativar premium: ${error.message}`)

    return data
  }

  /**
   * Adicionar XP ao Battle Pass do usuário
   */
  static async addXP(
    userId: string,
    amount: number,
    source: string
  ): Promise<{
    userBattlePass: UserBattlePass
    tiersUnlocked: BattlePassTier[]
    rewardsClaimed: BattlePassReward[]
  }> {
    if (amount <= 0) throw new Error('XP deve ser positivo')

    const userBattlePass = await this.getUserBattlePass(userId)
    if (!userBattlePass) throw new Error('Battle Pass não encontrado')

    const tiers = await this.getBattlePassTiers(userBattlePass.battle_pass_id)

    // Calcular novo XP e tier
    const newXP = userBattlePass.xp_earned + amount
    let newTier = userBattlePass.current_tier
    let cumulativeXP = 0

    for (const tier of tiers) {
      cumulativeXP += tier.xp_required

      if (newXP >= cumulativeXP) {
        newTier = tier.tier_number
      } else {
        break
      }
    }

    // Atualizar progresso
    const { data: updatedBattlePass, error } = await supabase
      .from('user_battle_passes')
      .update({
        xp_earned: newXP,
        current_tier: newTier
      })
      .eq('id', userBattlePass.id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao adicionar XP: ${error.message}`)

    // Determinar quais tiers foram desbloqueados
    const tiersUnlocked = tiers.filter(
      t => t.tier_number > userBattlePass.current_tier && t.tier_number <= newTier
    )

    // Auto-reivindicar recompensas dos tiers desbloqueados
    const rewardsClaimed: BattlePassReward[] = []

    for (const tier of tiersUnlocked) {
      // Reivindicar recompensa free
      const freeReward = await this.claimTierReward(
        userBattlePass.id,
        tier.id,
        false
      )
      if (freeReward) rewardsClaimed.push(freeReward)

      // Reivindicar recompensa premium (se aplicável)
      if (updatedBattlePass.is_premium) {
        const premiumReward = await this.claimTierReward(
          userBattlePass.id,
          tier.id,
          true
        )
        if (premiumReward) rewardsClaimed.push(premiumReward)
      }
    }

    return {
      userBattlePass: updatedBattlePass,
      tiersUnlocked,
      rewardsClaimed
    }
  }

  /**
   * Reivindicar recompensa de um tier
   */
  static async claimTierReward(
    userBattlePassId: string,
    tierId: string,
    isPremium: boolean
  ): Promise<BattlePassReward | null> {
    // Buscar tier
    const { data: tier, error: tierError } = await supabase
      .from('battle_pass_tiers')
      .select('*')
      .eq('id', tierId)
      .single()

    if (tierError) throw new Error(`Erro ao buscar tier: ${tierError.message}`)

    // Buscar user battle pass
    const { data: userBattlePass, error: userError } = await supabase
      .from('user_battle_passes')
      .select('*')
      .eq('id', userBattlePassId)
      .single()

    if (userError) throw new Error(`Erro ao buscar progresso: ${userError.message}`)

    // Verificar se usuário desbloqueou o tier
    if (tier.tier_number > userBattlePass.current_tier) {
      throw new Error('Tier não desbloqueado ainda')
    }

    // Verificar se é premium e usuário tem acesso
    if (isPremium && !userBattlePass.is_premium) {
      throw new Error('Battle Pass Premium necessário')
    }

    // Verificar se já foi reivindicado
    const { data: existingReward } = await supabase
      .from('battle_pass_rewards')
      .select('*')
      .eq('user_battle_pass_id', userBattlePassId)
      .eq('tier_id', tierId)
      .eq('is_premium', isPremium)
      .maybeSingle()

    if (existingReward) {
      return null // Já reivindicado
    }

    // Determinar recompensa
    const rewardType = isPremium ? tier.premium_reward_type : tier.free_reward_type
    const rewardAmount = isPremium ? tier.premium_reward_amount : tier.free_reward_amount
    const cosmeticId = isPremium
      ? tier.premium_reward_cosmetic_id
      : tier.free_reward_cosmetic_id

    // Aplicar recompensa
    if (rewardType === 'coins' || rewardType === 'gems') {
      await CurrencyService.addCurrency(
        userBattlePass.user_id,
        rewardType,
        rewardAmount,
        `battle_pass_tier_${tier.tier_number}`
      )
    } else if (rewardType === 'cosmetic' && cosmeticId) {
      // TODO: Adicionar cosmético ao inventário
      await supabase.from('user_cosmetics').insert({
        user_id: userBattlePass.user_id,
        cosmetic_id: cosmeticId,
        acquired_from: 'battle_pass',
        acquired_at: new Date().toISOString()
      })
    }

    // Registrar recompensa reivindicada
    const { data: reward, error: rewardError } = await supabase
      .from('battle_pass_rewards')
      .insert({
        user_battle_pass_id: userBattlePassId,
        tier_id: tierId,
        is_premium: isPremium,
        reward_type: rewardType,
        reward_amount: rewardAmount,
        cosmetic_id: cosmeticId,
        claimed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (rewardError) throw new Error(`Erro ao reivindicar: ${rewardError.message}`)

    return reward
  }

  /**
   * Obter estatísticas do Battle Pass do usuário
   */
  static async getUserStats(userId: string): Promise<{
    battlePass: BattlePass | null
    userProgress: UserBattlePass | null
    totalTiers: number
    tiersCompleted: number
    percentComplete: number
    rewardsEarned: number
    daysRemaining: number
  }> {
    const battlePass = await this.getActiveBattlePass()
    if (!battlePass) {
      return {
        battlePass: null,
        userProgress: null,
        totalTiers: 0,
        tiersCompleted: 0,
        percentComplete: 0,
        rewardsEarned: 0,
        daysRemaining: 0
      }
    }

    const userProgress = await this.getUserBattlePass(userId)
    const tiers = await this.getBattlePassTiers(battlePass.id)

    const tiersCompleted = userProgress?.current_tier || 0

    // Calcular recompensas ganhas
    const { data: rewards } = await supabase
      .from('battle_pass_rewards')
      .select('*')
      .eq('user_battle_pass_id', userProgress?.id || '')

    const rewardsEarned = rewards?.length || 0

    // Calcular dias restantes
    const endDate = new Date(battlePass.end_date)
    const now = new Date()
    const daysRemaining = Math.max(
      0,
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    )

    return {
      battlePass,
      userProgress,
      totalTiers: tiers.length,
      tiersCompleted,
      percentComplete: (tiersCompleted / tiers.length) * 100,
      rewardsEarned,
      daysRemaining
    }
  }

  /**
   * Criar novo Battle Pass (admin)
   */
  static async createBattlePass(
    seasonNumber: number,
    name: string,
    startDate: string,
    endDate: string,
    priceGems: number,
    tiersConfig: Array<{
      tierNumber: number
      xpRequired: number
      freeReward: { type: string; amount: number; cosmeticId?: string }
      premiumReward: { type: string; amount: number; cosmeticId?: string }
    }>
  ): Promise<BattlePass> {
    // Desativar Battle Pass anterior
    await supabase
      .from('battle_passes')
      .update({ is_active: false })
      .eq('is_active', true)

    // Criar novo Battle Pass
    const { data: battlePass, error: bpError } = await supabase
      .from('battle_passes')
      .insert({
        season_number: seasonNumber,
        name,
        start_date: startDate,
        end_date: endDate,
        price_gems: priceGems,
        is_active: true
      })
      .select()
      .single()

    if (bpError) throw new Error(`Erro ao criar Battle Pass: ${bpError.message}`)

    // Criar tiers
    const tiersData = tiersConfig.map(tier => ({
      battle_pass_id: battlePass.id,
      tier_number: tier.tierNumber,
      xp_required: tier.xpRequired,
      free_reward_type: tier.freeReward.type,
      free_reward_amount: tier.freeReward.amount,
      free_reward_cosmetic_id: tier.freeReward.cosmeticId,
      premium_reward_type: tier.premiumReward.type,
      premium_reward_amount: tier.premiumReward.amount,
      premium_reward_cosmetic_id: tier.premiumReward.cosmeticId
    }))

    const { error: tiersError } = await supabase
      .from('battle_pass_tiers')
      .insert(tiersData)

    if (tiersError) throw new Error(`Erro ao criar tiers: ${tiersError.message}`)

    return battlePass
  }
}
