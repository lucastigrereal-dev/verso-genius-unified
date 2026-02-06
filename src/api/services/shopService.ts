/**
 * Shop Service
 * Gerencia compras de itens (cosmetics, loot boxes, etc)
 */

import { supabase } from '../../../config/supabase'
import { CurrencyService } from './currencyService'
import type {
  Cosmetic,
  LootBox,
  LootBoxReward,
  RarityTier,
  ShopProduct
} from '../../types/monetization'

export class ShopService {
  /**
   * Lista todos os cosméticos disponíveis
   */
  static async listCosmetics(filters?: {
    type?: string
    rarity?: RarityTier
    available_only?: boolean
  }): Promise<Cosmetic[]> {
    let query = supabase.from('cosmetics').select('*')

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.rarity) {
      query = query.eq('rarity', filters.rarity)
    }

    if (filters?.available_only !== false) {
      query = query.eq('is_available', true)
    }

    const { data, error } = await query.order('rarity', { ascending: false })

    if (error) throw new Error(`Erro ao listar cosméticos: ${error.message}`)
    return data
  }

  /**
   * Compra um cosmético
   */
  static async purchaseCosmetic(
    userId: string,
    cosmeticId: string
  ): Promise<{ success: boolean; cosmetic: Cosmetic }> {
    // Buscar cosmético
    const { data: cosmetic, error: cosmeticError } = await supabase
      .from('cosmetics')
      .select('*')
      .eq('id', cosmeticId)
      .eq('is_available', true)
      .single()

    if (cosmeticError || !cosmetic) {
      throw new Error('Cosmético não encontrado ou indisponível')
    }

    // Verificar se já possui
    const { data: existing } = await supabase
      .from('user_cosmetics')
      .select('*')
      .eq('user_id', userId)
      .eq('cosmetic_id', cosmeticId)
      .single()

    if (existing) {
      throw new Error('Você já possui este cosmético')
    }

    // Verificar saldo
    const costCoins = cosmetic.cost_coins || 0
    const costGems = cosmetic.cost_gems || 0

    const { canAfford } = await CurrencyService.canAfford(userId, costCoins, costGems)

    if (!canAfford) {
      throw new Error('Saldo insuficiente')
    }

    // Gastar moedas
    if (costCoins > 0) {
      await CurrencyService.spendCurrency(userId, 'coins', costCoins, `cosmetic_${cosmeticId}`)
    }

    if (costGems > 0) {
      await CurrencyService.spendCurrency(userId, 'gems', costGems, `cosmetic_${cosmeticId}`)
    }

    // Adicionar ao inventário
    const { error: inventoryError } = await supabase
      .from('user_cosmetics')
      .insert({
        user_id: userId,
        cosmetic_id: cosmeticId
      })

    if (inventoryError) {
      throw new Error(`Erro ao adicionar cosmético: ${inventoryError.message}`)
    }

    return {
      success: true,
      cosmetic
    }
  }

  /**
   * Equipar/desequipar cosmético
   */
  static async equipCosmetic(
    userId: string,
    cosmeticId: string,
    equip: boolean = true
  ): Promise<void> {
    // Verificar se possui
    const { data: userCosmetic } = await supabase
      .from('user_cosmetics')
      .select('*')
      .eq('user_id', userId)
      .eq('cosmetic_id', cosmeticId)
      .single()

    if (!userCosmetic) {
      throw new Error('Você não possui este cosmético')
    }

    // Se equipando, desequipar outros do mesmo tipo
    if (equip) {
      const { data: cosmetic } = await supabase
        .from('cosmetics')
        .select('type')
        .eq('id', cosmeticId)
        .single()

      if (cosmetic) {
        // Desequipar outros do mesmo tipo
        const { data: otherCosmetics } = await supabase
          .from('cosmetics')
          .select('id')
          .eq('type', cosmetic.type)

        if (otherCosmetics) {
          await supabase
            .from('user_cosmetics')
            .update({ equipped: false })
            .eq('user_id', userId)
            .in('cosmetic_id', otherCosmetics.map(c => c.id))
        }
      }
    }

    // Equipar/desequipar
    const { error } = await supabase
      .from('user_cosmetics')
      .update({ equipped: equip })
      .eq('user_id', userId)
      .eq('cosmetic_id', cosmeticId)

    if (error) throw new Error(`Erro ao equipar cosmético: ${error.message}`)
  }

  /**
   * Lista loot boxes disponíveis
   */
  static async listLootBoxes(): Promise<LootBox[]> {
    const { data, error } = await supabase
      .from('loot_boxes')
      .select('*')
      .eq('is_active', true)

    if (error) throw new Error(`Erro ao listar loot boxes: ${error.message}`)
    return data
  }

  /**
   * Abrir loot box
   */
  static async openLootBox(
    userId: string,
    lootBoxId: string
  ): Promise<{ rewards: LootBoxReward[]; newBalance: any }> {
    // Buscar loot box
    const { data: lootBox, error: boxError } = await supabase
      .from('loot_boxes')
      .select('*')
      .eq('id', lootBoxId)
      .eq('is_active', true)
      .single()

    if (boxError || !lootBox) {
      throw new Error('Loot box não encontrado')
    }

    // Verificar saldo
    const costCoins = lootBox.cost_coins || 0
    const costGems = lootBox.cost_gems || 0

    const { canAfford } = await CurrencyService.canAfford(userId, costCoins, costGems)

    if (!canAfford) {
      throw new Error('Saldo insuficiente para abrir loot box')
    }

    // Gastar moedas
    if (costCoins > 0) {
      await CurrencyService.spendCurrency(userId, 'coins', costCoins, `lootbox_${lootBoxId}`)
    }

    if (costGems > 0) {
      await CurrencyService.spendCurrency(userId, 'gems', costGems, `lootbox_${lootBoxId}`)
    }

    // Gerar recompensas
    const rewards = this.generateLootBoxRewards(lootBox)

    // Salvar no inventário
    const { error: inventoryError } = await supabase
      .from('user_loot_box_inventory')
      .insert({
        user_id: userId,
        loot_box_id: lootBoxId,
        opened_at: new Date().toISOString(),
        rewards: rewards
      })

    if (inventoryError) {
      throw new Error(`Erro ao salvar recompensas: ${inventoryError.message}`)
    }

    // Aplicar recompensas
    await this.applyLootBoxRewards(userId, rewards)

    // Retornar novo saldo
    const newBalance = await CurrencyService.getBalance(userId)

    return {
      rewards,
      newBalance
    }
  }

  /**
   * Gera recompensas aleatórias baseado nas probabilidades
   */
  private static generateLootBoxRewards(lootBox: LootBox): LootBoxReward[] {
    const rarityWeights = lootBox.rarity_weights
    const numRewards = 3 // 3 itens por caixa

    const rewards: LootBoxReward[] = []

    for (let i = 0; i < numRewards; i++) {
      const rarity = this.rollRarity(rarityWeights)
      const reward = this.generateRewardByRarity(rarity)
      rewards.push(reward)
    }

    return rewards
  }

  /**
   * Rola raridade baseado nos pesos
   */
  private static rollRarity(weights: Record<RarityTier, number>): RarityTier {
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0)
    let random = Math.random() * totalWeight

    for (const [rarity, weight] of Object.entries(weights)) {
      random -= weight
      if (random <= 0) {
        return rarity as RarityTier
      }
    }

    return 'common'
  }

  /**
   * Gera recompensa específica baseado na raridade
   */
  private static generateRewardByRarity(rarity: RarityTier): LootBoxReward {
    // Probabilidades de tipo de recompensa
    const rewardTypes = ['coins', 'gems', 'xp', 'cosmetic']
    const randomType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)]

    const amounts = {
      common: { coins: 50, gems: 5, xp: 100 },
      rare: { coins: 150, gems: 15, xp: 300 },
      epic: { coins: 500, gems: 50, xp: 1000 },
      legendary: { coins: 1500, gems: 150, xp: 5000 }
    }

    if (randomType === 'cosmetic') {
      return {
        type: 'cosmetic',
        rarity,
        id: `cosmetic_${rarity}_${Date.now()}` // TODO: ID real de cosmético
      }
    }

    return {
      type: randomType as any,
      amount: amounts[rarity][randomType as 'coins'] || 50,
      rarity
    }
  }

  /**
   * Aplica as recompensas ao usuário
   */
  private static async applyLootBoxRewards(
    userId: string,
    rewards: LootBoxReward[]
  ): Promise<void> {
    for (const reward of rewards) {
      switch (reward.type) {
        case 'coins':
          await CurrencyService.addCurrency(userId, 'coins', reward.amount || 0, 'loot_box_reward')
          break

        case 'gems':
          await CurrencyService.addCurrency(userId, 'gems', reward.amount || 0, 'loot_box_reward')
          break

        case 'xp':
          // TODO: Adicionar XP ao usuário
          break

        case 'cosmetic':
          // TODO: Adicionar cosmético ao inventário
          break

        case 'rhyme':
          // TODO: Adicionar rima ao inventário
          break
      }
    }
  }

  /**
   * Produtos da loja
   */
  static async getShopProducts(): Promise<ShopProduct[]> {
    return [
      {
        id: 'gems_50',
        name: '50 Gems',
        description: 'Pacote pequeno de gems',
        type: 'gems',
        price_brl: 4.90,
        gems_amount: 50,
        is_featured: false,
        image_url: '/shop/gems_50.png'
      },
      {
        id: 'gems_250',
        name: '250 Gems',
        description: 'Pacote médio de gems + 50 bônus',
        type: 'gems',
        price_brl: 19.90,
        gems_amount: 300,
        is_featured: true,
        image_url: '/shop/gems_250.png'
      },
      {
        id: 'gems_700',
        name: '700 Gems',
        description: 'Pacote grande de gems + 200 bônus',
        type: 'gems',
        price_brl: 49.90,
        gems_amount: 900,
        discount_percent: 20,
        is_featured: true,
        image_url: '/shop/gems_700.png'
      },
      {
        id: 'subscription_pro',
        name: 'Pro Mensal',
        description: 'Ilimitado, 20 beats, sem ads',
        type: 'subscription',
        price_brl: 19.90,
        is_featured: false,
        image_url: '/shop/pro.png'
      },
      {
        id: 'subscription_elite',
        name: 'Elite Mensal',
        description: 'Tudo de Pro + IA + batalhas',
        type: 'subscription',
        price_brl: 39.90,
        is_featured: true,
        image_url: '/shop/elite.png'
      }
    ]
  }
}
