/**
 * Gacha Service
 * Sistema avançado de gacha com pity system, banners rate-up e spark currency
 */

import { supabase } from '../../../config/supabase'
import { CurrencyService } from './currencyService'

// Probabilidades base (sem rate-up)
const BASE_RATES = {
  legendary: 0.01, // 1%
  epic: 0.05, // 5%
  rare: 0.20, // 20%
  common: 0.74 // 74%
}

interface GachaBanner {
  id: string
  name: string
  description: string
  banner_image_url: string
  start_date: string
  end_date: string
  featured_cosmetic_ids: string[]
  rate_up_multiplier: number
  pity_threshold: number
  guaranteed_rarity: string
  cost_gems: number
  multi_pull_discount: number
  banner_type: string
  is_active: boolean
}

interface GachaPull {
  cosmetic: any
  was_pity: boolean
  was_rate_up: boolean
}

export class GachaService {
  /**
   * Listar banners ativos
   */
  static async getActiveBanners(): Promise<GachaBanner[]> {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('gacha_banners')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Erro ao buscar banners: ${error.message}`)

    return data || []
  }

  /**
   * Obter detalhes de um banner
   */
  static async getBannerById(bannerId: string): Promise<GachaBanner> {
    const { data, error } = await supabase
      .from('gacha_banners')
      .select('*')
      .eq('id', bannerId)
      .single()

    if (error || !data) throw new Error('Banner não encontrado')

    return data
  }

  /**
   * Obter status de pity do usuário em um banner
   */
  static async getPityStatus(userId: string, bannerId: string) {
    const { data: pity } = await supabase
      .from('gacha_pity_tracker')
      .select('*')
      .eq('user_id', userId)
      .eq('banner_id', bannerId)
      .maybeSingle()

    if (!pity) {
      // Criar tracker se não existir
      const { data: newPity, error } = await supabase
        .from('gacha_pity_tracker')
        .insert({
          user_id: userId,
          banner_id: bannerId
        })
        .select()
        .single()

      if (error) throw new Error('Erro ao criar pity tracker')
      return newPity
    }

    return pity
  }

  /**
   * Pull único (single pull)
   */
  static async pullSingle(userId: string, bannerId: string): Promise<GachaPull> {
    // Verificar banner
    const banner = await this.getBannerById(bannerId)

    // Verificar saldo
    const canAfford = await CurrencyService.canAfford(userId, 'gems', banner.cost_gems)
    if (!canAfford) throw new Error('Gems insuficientes')

    // Debitar gems
    await CurrencyService.spendCurrency(
      userId,
      'gems',
      banner.cost_gems,
      `gacha_pull_${bannerId}`
    )

    // Obter pity status
    const pity = await this.getPityStatus(userId, bannerId)

    // Determinar se é pity pull
    const isPity = pity.pulls_since_last_legendary >= banner.pity_threshold

    // Fazer pull
    const result = await this.performPull(userId, bannerId, banner, pity, isPity)

    // Atualizar pity tracker
    await this.updatePityTracker(userId, bannerId, result.cosmetic.rarity, 1)

    // Registrar no histórico
    await supabase.from('gacha_pull_history').insert({
      user_id: userId,
      banner_id: bannerId,
      cosmetic_id: result.cosmetic.id,
      cosmetic_rarity: result.cosmetic.rarity,
      was_pity_pull: result.was_pity,
      was_rate_up: result.was_rate_up,
      pull_type: 'single',
      gems_spent: banner.cost_gems
    })

    return result
  }

  /**
   * Multi pull (10-pull com desconto)
   */
  static async pullMulti(userId: string, bannerId: string): Promise<GachaPull[]> {
    const banner = await this.getBannerById(bannerId)

    // Calcular custo com desconto
    const baseCost = banner.cost_gems * 10
    const discount = Math.floor(baseCost * (banner.multi_pull_discount / 100))
    const totalCost = baseCost - discount

    // Verificar saldo
    const canAfford = await CurrencyService.canAfford(userId, 'gems', totalCost)
    if (!canAfford) throw new Error('Gems insuficientes para 10-pull')

    // Debitar gems
    await CurrencyService.spendCurrency(
      userId,
      'gems',
      totalCost,
      `gacha_multi_pull_${bannerId}`
    )

    // Fazer 10 pulls
    const results: GachaPull[] = []
    let pity = await this.getPityStatus(userId, bannerId)

    for (let i = 1; i <= 10; i++) {
      // Verificar se deve ativar pity
      const isPity = pity.pulls_since_last_legendary >= banner.pity_threshold

      // Fazer pull
      const result = await this.performPull(userId, bannerId, banner, pity, isPity, false)
      results.push(result)

      // Atualizar pity em memória (para próximo pull no mesmo multi)
      if (result.cosmetic.rarity === 'legendary') {
        pity.pulls_since_last_legendary = 0
        pity.total_legendary_pulled += 1
      } else {
        pity.pulls_since_last_legendary += 1
      }

      if (result.cosmetic.rarity === 'epic') {
        pity.pulls_since_last_epic = 0
        pity.total_epic_pulled += 1
      } else {
        pity.pulls_since_last_epic += 1
      }

      pity.total_pulls += 1
      pity.spark_tokens += 1

      // Registrar no histórico
      await supabase.from('gacha_pull_history').insert({
        user_id: userId,
        banner_id: bannerId,
        cosmetic_id: result.cosmetic.id,
        cosmetic_rarity: result.cosmetic.rarity,
        was_pity_pull: result.was_pity,
        was_rate_up: result.was_rate_up,
        pull_type: 'multi',
        pull_number: i,
        gems_spent: Math.floor(totalCost / 10) // Dividir custo por 10
      })
    }

    // Atualizar pity tracker (batch update)
    await this.updatePityTracker(userId, bannerId, null, 10)

    return results
  }

  /**
   * Realizar um pull (lógica interna)
   */
  private static async performPull(
    userId: string,
    bannerId: string,
    banner: GachaBanner,
    pity: any,
    isPity: boolean,
    addToInventory: boolean = true
  ): Promise<GachaPull> {
    let rarity: string
    let cosmetic: any
    let wasRateUp = false

    if (isPity) {
      // Pity ativo: garantir legendary
      rarity = banner.guaranteed_rarity
    } else {
      // Roll normal com probabilidades
      rarity = this.rollRarity(banner)
    }

    // Buscar cosmético da raridade sorteada
    // Se tiver featured items, priorizar eles
    if (banner.featured_cosmetic_ids.length > 0 && Math.random() < 0.5) {
      // 50% de chance de ser featured
      const { data: featuredCosmetics } = await supabase
        .from('cosmetics')
        .select('*')
        .in('id', banner.featured_cosmetic_ids)
        .eq('rarity', rarity)

      if (featuredCosmetics && featuredCosmetics.length > 0) {
        cosmetic = featuredCosmetics[Math.floor(Math.random() * featuredCosmetics.length)]
        wasRateUp = true
      }
    }

    // Se não pegou featured, pegar cosmético normal
    if (!cosmetic) {
      const { data: normalCosmetics } = await supabase
        .from('cosmetics')
        .select('*')
        .eq('rarity', rarity)
        .limit(100)

      if (!normalCosmetics || normalCosmetics.length === 0) {
        throw new Error(`Nenhum cosmético ${rarity} disponível`)
      }

      cosmetic = normalCosmetics[Math.floor(Math.random() * normalCosmetics.length)]
    }

    // Adicionar ao inventário do usuário
    if (addToInventory) {
      const { data: existing } = await supabase
        .from('user_cosmetics')
        .select('*')
        .eq('user_id', userId)
        .eq('cosmetic_id', cosmetic.id)
        .maybeSingle()

      if (!existing) {
        await supabase.from('user_cosmetics').insert({
          user_id: userId,
          cosmetic_id: cosmetic.id,
          acquired_from: 'gacha',
          acquired_at: new Date().toISOString()
        })
      } else {
        // Duplicate: converter em coins (5 coins por comum, 25 raro, 100 épico, 500 legendary)
        const duplicateCoins = {
          common: 5,
          rare: 25,
          epic: 100,
          legendary: 500
        }[rarity] || 5

        await CurrencyService.addCurrency(
          userId,
          'coins',
          duplicateCoins,
          `gacha_duplicate_${cosmetic.id}`
        )
      }
    }

    return {
      cosmetic,
      was_pity: isPity,
      was_rate_up: wasRateUp
    }
  }

  /**
   * Roll de raridade (weighted random)
   */
  private static rollRarity(banner: GachaBanner): string {
    const rand = Math.random()
    let cumulative = 0

    // Aplicar rate-up se houver featured items
    const hasFeatures = banner.featured_cosmetic_ids.length > 0
    const multiplier = hasFeatures ? banner.rate_up_multiplier : 1.0

    const rates = {
      legendary: BASE_RATES.legendary * multiplier,
      epic: BASE_RATES.epic * multiplier,
      rare: BASE_RATES.rare,
      common: BASE_RATES.common
    }

    // Normalizar probabilidades para somar 1.0
    const total = Object.values(rates).reduce((a, b) => a + b, 0)
    const normalized = {
      legendary: rates.legendary / total,
      epic: rates.epic / total,
      rare: rates.rare / total,
      common: rates.common / total
    }

    // Roll
    for (const [rarity, probability] of Object.entries(normalized)) {
      cumulative += probability
      if (rand <= cumulative) {
        return rarity
      }
    }

    return 'common' // Fallback
  }

  /**
   * Atualizar pity tracker
   */
  private static async updatePityTracker(
    userId: string,
    bannerId: string,
    pulledRarity: string | null,
    pullCount: number
  ): Promise<void> {
    const pity = await this.getPityStatus(userId, bannerId)

    // Se for multi-pull, apenas incrementar sparks e total
    if (!pulledRarity) {
      await supabase
        .from('gacha_pity_tracker')
        .update({
          spark_tokens: pity.spark_tokens + pullCount,
          total_pulls: pity.total_pulls + pullCount,
          last_pull_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('banner_id', bannerId)

      return
    }

    // Update individual
    const updates: any = {
      total_pulls: pity.total_pulls + 1,
      spark_tokens: pity.spark_tokens + 1,
      last_pull_at: new Date().toISOString()
    }

    if (pulledRarity === 'legendary') {
      updates.pulls_since_last_legendary = 0
      updates.total_legendary_pulled = pity.total_legendary_pulled + 1
    } else {
      updates.pulls_since_last_legendary = pity.pulls_since_last_legendary + 1
    }

    if (pulledRarity === 'epic') {
      updates.pulls_since_last_epic = 0
      updates.total_epic_pulled = pity.total_epic_pulled + 1
    } else {
      updates.pulls_since_last_epic = pity.pulls_since_last_epic + 1
    }

    if (pulledRarity === 'rare') {
      updates.total_rare_pulled = pity.total_rare_pulled + 1
    }

    await supabase
      .from('gacha_pity_tracker')
      .update(updates)
      .eq('user_id', userId)
      .eq('banner_id', bannerId)
  }

  /**
   * Obter histórico de pulls do usuário
   */
  static async getPullHistory(
    userId: string,
    bannerId?: string,
    limit: number = 50,
    offset: number = 0
  ) {
    let query = supabase
      .from('gacha_pull_history')
      .select(`
        *,
        cosmetic:cosmetics(*),
        banner:gacha_banners(name, banner_image_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (bannerId) {
      query = query.eq('banner_id', bannerId)
    }

    const { data, error } = await query

    if (error) throw new Error(`Erro ao buscar histórico: ${error.message}`)

    return data || []
  }

  /**
   * Spark Shop: Listar cosméticos disponíveis para troca
   */
  static async getSparkShop(bannerId: string) {
    const { data, error } = await supabase
      .from('spark_shop')
      .select(`
        *,
        cosmetic:cosmetics(*)
      `)
      .eq('banner_id', bannerId)
      .eq('is_available', true)

    if (error) throw new Error(`Erro ao buscar spark shop: ${error.message}`)

    return data || []
  }

  /**
   * Trocar sparks por cosmético garantido
   */
  static async exchangeSparkForCosmetic(
    userId: string,
    bannerId: string,
    cosmeticId: string
  ): Promise<void> {
    // Buscar item no spark shop
    const { data: shopItem } = await supabase
      .from('spark_shop')
      .select('*')
      .eq('banner_id', bannerId)
      .eq('cosmetic_id', cosmeticId)
      .eq('is_available', true)
      .single()

    if (!shopItem) throw new Error('Item não disponível no spark shop')

    // Verificar se ainda tem trocas disponíveis
    if (shopItem.times_exchanged >= shopItem.max_exchanges) {
      throw new Error('Limite de trocas atingido para este item')
    }

    // Verificar saldo de sparks
    const pity = await this.getPityStatus(userId, bannerId)

    if (pity.spark_tokens < shopItem.spark_cost) {
      throw new Error(`Sparks insuficientes. Necessário: ${shopItem.spark_cost}, Você tem: ${pity.spark_tokens}`)
    }

    // Debitar sparks
    await supabase
      .from('gacha_pity_tracker')
      .update({
        spark_tokens: pity.spark_tokens - shopItem.spark_cost
      })
      .eq('user_id', userId)
      .eq('banner_id', bannerId)

    // Adicionar cosmético ao inventário
    const { data: existing } = await supabase
      .from('user_cosmetics')
      .select('*')
      .eq('user_id', userId)
      .eq('cosmetic_id', cosmeticId)
      .maybeSingle()

    if (!existing) {
      await supabase.from('user_cosmetics').insert({
        user_id: userId,
        cosmetic_id: cosmeticId,
        acquired_from: 'spark_exchange'
      })
    }

    // Incrementar times_exchanged
    await supabase
      .from('spark_shop')
      .update({
        times_exchanged: shopItem.times_exchanged + 1
      })
      .eq('id', shopItem.id)

    // Registrar no histórico
    await supabase.from('spark_exchange_history').insert({
      user_id: userId,
      banner_id: bannerId,
      cosmetic_id: cosmeticId,
      sparks_spent: shopItem.spark_cost
    })
  }

  /**
   * Estatísticas do banner
   */
  static async getBannerStats(bannerId: string) {
    // Total de pulls
    const { count: totalPulls } = await supabase
      .from('gacha_pull_history')
      .select('*', { count: 'exact', head: true })
      .eq('banner_id', bannerId)

    // Pulls por raridade
    const { data: pullsByRarity } = await supabase
      .from('gacha_pull_history')
      .select('cosmetic_rarity')
      .eq('banner_id', bannerId)

    const rarityCount = pullsByRarity?.reduce((acc: any, pull) => {
      acc[pull.cosmetic_rarity] = (acc[pull.cosmetic_rarity] || 0) + 1
      return acc
    }, {}) || {}

    // Usuários únicos
    const { data: uniqueUsers } = await supabase
      .from('gacha_pity_tracker')
      .select('user_id')
      .eq('banner_id', bannerId)

    return {
      total_pulls: totalPulls || 0,
      unique_users: uniqueUsers?.length || 0,
      rarity_distribution: rarityCount
    }
  }
}
