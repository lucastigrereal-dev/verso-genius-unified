/**
 * Currency Service
 * Gerencia moedas virtuais (Coins & Gems)
 */

import { supabase } from '../../../config/supabase'
import type {
  UserCurrency,
  CurrencyTransaction,
  CurrencyType
} from '../../types/monetization'

export class CurrencyService {
  /**
   * Inicializa saldo de moedas para novo usuário
   */
  static async initializeUserCurrency(userId: string): Promise<UserCurrency> {
    const { data, error } = await supabase
      .from('user_currency')
      .insert({
        user_id: userId,
        coins: 100, // Coins iniciais
        gems: 10    // Gems iniciais
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao inicializar moedas: ${error.message}`)
    return data
  }

  /**
   * Obtém saldo atual do usuário
   */
  static async getBalance(userId: string): Promise<UserCurrency> {
    const { data, error } = await supabase
      .from('user_currency')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // Se não existe, cria
      if (error.code === 'PGRST116') {
        return await this.initializeUserCurrency(userId)
      }
      throw new Error(`Erro ao buscar saldo: ${error.message}`)
    }

    return data
  }

  /**
   * Adiciona moedas ao usuário
   */
  static async addCurrency(
    userId: string,
    currencyType: CurrencyType,
    amount: number,
    source: string
  ): Promise<UserCurrency> {
    // Validar amount
    if (amount <= 0) {
      throw new Error('Amount deve ser positivo')
    }

    // Chamar função SQL para garantir atomicidade
    const { error } = await supabase.rpc('add_currency', {
      p_user_id: userId,
      p_currency_type: currencyType,
      p_amount: amount,
      p_source: source
    })

    if (error) throw new Error(`Erro ao adicionar moedas: ${error.message}`)

    return await this.getBalance(userId)
  }

  /**
   * Gasta moedas do usuário
   */
  static async spendCurrency(
    userId: string,
    currencyType: CurrencyType,
    amount: number,
    reason: string
  ): Promise<UserCurrency> {
    // Validar amount
    if (amount <= 0) {
      throw new Error('Amount deve ser positivo')
    }

    // Verificar saldo
    const balance = await this.getBalance(userId)
    const currentBalance = currencyType === 'coins' ? balance.coins : balance.gems

    if (currentBalance < amount) {
      throw new Error(`Saldo insuficiente. Necessário: ${amount}, Atual: ${currentBalance}`)
    }

    // Atualizar saldo
    const updateField = currencyType === 'coins' ? 'coins' : 'gems'
    const { error } = await supabase
      .from('user_currency')
      .update({ [updateField]: currentBalance - amount })
      .eq('user_id', userId)

    if (error) throw new Error(`Erro ao gastar moedas: ${error.message}`)

    // Registrar transação
    await supabase.from('currency_transactions').insert({
      user_id: userId,
      currency_type: currencyType,
      amount: -amount,
      balance_after: currentBalance - amount,
      transaction_type: 'spend',
      source: reason
    })

    return await this.getBalance(userId)
  }

  /**
   * Transfere moedas entre usuários
   */
  static async transferCurrency(
    fromUserId: string,
    toUserId: string,
    currencyType: CurrencyType,
    amount: number,
    reason: string
  ): Promise<void> {
    // Gastar do remetente
    await this.spendCurrency(fromUserId, currencyType, amount, `transfer_to_${toUserId}`)

    // Adicionar ao destinatário
    await this.addCurrency(toUserId, currencyType, amount, `transfer_from_${fromUserId}`)
  }

  /**
   * Obtém histórico de transações
   */
  static async getTransactionHistory(
    userId: string,
    limit: number = 50
  ): Promise<CurrencyTransaction[]> {
    const { data, error } = await supabase
      .from('currency_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`Erro ao buscar histórico: ${error.message}`)
    return data
  }

  /**
   * Recompensas diárias
   */
  static async claimDailyReward(userId: string): Promise<{
    coins: number
    gems: number
    streak: number
  }> {
    // TODO: Implementar lógica de streak tracking
    const baseCoins = 50
    const baseGems = 5

    await this.addCurrency(userId, 'coins', baseCoins, 'daily_reward')
    await this.addCurrency(userId, 'gems', baseGems, 'daily_reward')

    return {
      coins: baseCoins,
      gems: baseGems,
      streak: 1 // TODO: Calcular streak real
    }
  }

  /**
   * Recompensa por completar desafio
   */
  static async rewardChallenge(
    userId: string,
    challengeId: string,
    coins: number,
    gems: number = 0
  ): Promise<UserCurrency> {
    if (coins > 0) {
      await this.addCurrency(userId, 'coins', coins, `challenge_${challengeId}`)
    }

    if (gems > 0) {
      await this.addCurrency(userId, 'gems', gems, `challenge_${challengeId}`)
    }

    return await this.getBalance(userId)
  }

  /**
   * Recompensa por assistir anúncio
   */
  static async rewardAd(userId: string, adType: string): Promise<UserCurrency> {
    const rewardCoins = adType === 'rewarded' ? 10 : 5

    await this.addCurrency(userId, 'coins', rewardCoins, `ad_${adType}`)

    return await this.getBalance(userId)
  }

  /**
   * Compra de gems com dinheiro real
   */
  static async purchaseGems(
    userId: string,
    gemsAmount: number,
    purchaseId: string
  ): Promise<UserCurrency> {
    await this.addCurrency(userId, 'gems', gemsAmount, `purchase_${purchaseId}`)

    return await this.getBalance(userId)
  }

  /**
   * Conversão gems → coins (se permitido)
   */
  static async convertGemsToCoin(
    userId: string,
    gemsAmount: number
  ): Promise<UserCurrency> {
    const conversionRate = 1 // 1 gem = 10 coins
    const coinsToReceive = gemsAmount * 10

    // Gastar gems
    await this.spendCurrency(userId, 'gems', gemsAmount, 'conversion_to_coins')

    // Adicionar coins
    await this.addCurrency(userId, 'coins', coinsToReceive, 'conversion_from_gems')

    return await this.getBalance(userId)
  }

  /**
   * Verificar se usuário pode pagar
   */
  static async canAfford(
    userId: string,
    costCoins: number = 0,
    costGems: number = 0
  ): Promise<{ canAfford: boolean; balance: UserCurrency }> {
    const balance = await this.getBalance(userId)

    const canAffordCoins = costCoins === 0 || balance.coins >= costCoins
    const canAffordGems = costGems === 0 || balance.gems >= costGems

    return {
      canAfford: canAffordCoins && canAffordGems,
      balance
    }
  }

  /**
   * Estatísticas de economia do usuário
   */
  static async getUserEconomyStats(userId: string) {
    const balance = await this.getBalance(userId)

    // Total ganho
    const totalEarned = {
      coins: balance.lifetime_coins_earned,
      gems: balance.lifetime_gems_earned
    }

    // Total gasto (current balance - lifetime earned)
    const totalSpent = {
      coins: totalEarned.coins - balance.coins,
      gems: totalEarned.gems - balance.gems
    }

    return {
      current: {
        coins: balance.coins,
        gems: balance.gems
      },
      lifetime_earned: totalEarned,
      lifetime_spent: totalSpent
    }
  }
}
