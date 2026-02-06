/**
 * Analytics Service
 * Sistema de tracking de eventos e métricas
 */

import { supabase } from '../../../config/supabase'
import { redis } from '../../../config/redis'

interface AnalyticsEvent {
  user_id: string
  event_type: string
  event_properties: Record<string, any>
  timestamp: string
}

export class AnalyticsService {
  /**
   * Track evento genérico
   */
  static async trackEvent(
    userId: string,
    eventType: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Salvar evento no Supabase
      await supabase.from('analytics_events').insert({
        user_id: userId,
        event_type: eventType,
        event_properties: properties,
        timestamp: new Date().toISOString()
      })

      // Incrementar contadores no Redis (para dashboards real-time)
      const today = new Date().toISOString().split('T')[0]
      await redis.hincrby(`analytics:events:${today}`, eventType, 1)
      await redis.hincrby(`analytics:users:${today}`, userId, 1)

      // Expirar após 30 dias
      await redis.expire(`analytics:events:${today}`, 30 * 24 * 60 * 60)
      await redis.expire(`analytics:users:${today}`, 30 * 24 * 60 * 60)
    } catch (error) {
      console.error('Error tracking event:', error)
      // Não fazer throw - analytics não deve quebrar o app
    }
  }

  /**
   * Track page view
   */
  static async trackPageView(
    userId: string,
    page: string,
    referrer?: string
  ): Promise<void> {
    await this.trackEvent(userId, 'page_view', {
      page,
      referrer,
      user_agent: 'web' // Pode pegar do request header
    })
  }

  /**
   * Track compra
   */
  static async trackPurchase(
    userId: string,
    productId: string,
    productType: string,
    amount: number,
    currency: string = 'BRL'
  ): Promise<void> {
    await this.trackEvent(userId, 'purchase', {
      product_id: productId,
      product_type: productType,
      amount,
      currency
    })
  }

  /**
   * Track abertura de loot box
   */
  static async trackLootBoxOpen(
    userId: string,
    lootBoxId: string,
    itemsReceived: any[]
  ): Promise<void> {
    await this.trackEvent(userId, 'loot_box_open', {
      loot_box_id: lootBoxId,
      items_count: itemsReceived.length,
      items: itemsReceived.map((i) => ({
        id: i.id,
        rarity: i.rarity
      }))
    })
  }

  /**
   * Track gacha pull
   */
  static async trackGachaPull(
    userId: string,
    bannerId: string,
    pullType: 'single' | 'multi',
    results: any[]
  ): Promise<void> {
    const rarities = results.reduce((acc: any, r) => {
      acc[r.cosmetic.rarity] = (acc[r.cosmetic.rarity] || 0) + 1
      return acc
    }, {})

    await this.trackEvent(userId, 'gacha_pull', {
      banner_id: bannerId,
      pull_type: pullType,
      items_count: results.length,
      rarities,
      had_pity: results.some((r) => r.was_pity)
    })
  }

  /**
   * Track NFT mint
   */
  static async trackNFTMint(
    userId: string,
    cosmeticId: string,
    blockchain: string
  ): Promise<void> {
    await this.trackEvent(userId, 'nft_mint', {
      cosmetic_id: cosmeticId,
      blockchain
    })
  }

  /**
   * Track crew action
   */
  static async trackCrewAction(
    userId: string,
    action: 'create' | 'join' | 'leave' | 'chat',
    crewId: string
  ): Promise<void> {
    await this.trackEvent(userId, `crew_${action}`, {
      crew_id: crewId
    })
  }

  /**
   * Track event participation
   */
  static async trackEventParticipation(
    userId: string,
    eventId: string,
    action: 'join' | 'complete' | 'claim_reward'
  ): Promise<void> {
    await this.trackEvent(userId, `event_${action}`, {
      event_id: eventId
    })
  }

  /**
   * Track daily check-in
   */
  static async trackCheckIn(
    userId: string,
    currentStreak: number,
    rewardsReceived: any
  ): Promise<void> {
    await this.trackEvent(userId, 'daily_check_in', {
      current_streak: currentStreak,
      rewards: rewardsReceived
    })
  }

  /**
   * Obter métricas do dia
   */
  static async getTodayMetrics(): Promise<{
    total_events: number
    unique_users: number
    events_by_type: Record<string, number>
  }> {
    const today = new Date().toISOString().split('T')[0]

    // Buscar do Redis
    const eventsByType = await redis.hgetall(`analytics:events:${today}`)
    const userIds = await redis.hkeys(`analytics:users:${today}`)

    const totalEvents = Object.values(eventsByType).reduce(
      (sum, count) => sum + parseInt(count),
      0
    )

    return {
      total_events: totalEvents,
      unique_users: userIds.length,
      events_by_type: Object.fromEntries(
        Object.entries(eventsByType).map(([key, value]) => [key, parseInt(value)])
      )
    }
  }

  /**
   * Obter funnel de conversão
   */
  static async getConversionFunnel(
    startDate: string,
    endDate: string
  ): Promise<{
    step: string
    users: number
    conversion_rate: number
  }[]> {
    // Funnel: signup → first_exercise → purchase
    const steps = [
      { name: 'Signup', event: 'user_signup' },
      { name: 'First Exercise', event: 'exercise_completed' },
      { name: 'First Purchase', event: 'purchase' }
    ]

    const funnel = []
    let previousCount = 0

    for (const [index, step] of steps.entries()) {
      const { count } = await supabase
        .from('analytics_events')
        .select('user_id', { count: 'exact', head: true })
        .eq('event_type', step.event)
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)

      const userCount = count || 0
      const conversionRate = index === 0 ? 100 : (userCount / previousCount) * 100

      funnel.push({
        step: step.name,
        users: userCount,
        conversion_rate: parseFloat(conversionRate.toFixed(2))
      })

      previousCount = userCount
    }

    return funnel
  }

  /**
   * Obter retention cohorts
   */
  static async getRetentionCohorts(
    cohortDate: string
  ): Promise<{
    day: number
    retention_rate: number
  }[]> {
    // Usuários que se inscreveram na data do cohort
    const { data: cohortUsers } = await supabase
      .from('analytics_events')
      .select('user_id')
      .eq('event_type', 'user_signup')
      .gte('timestamp', cohortDate)
      .lt('timestamp', new Date(new Date(cohortDate).getTime() + 24 * 60 * 60 * 1000).toISOString())

    if (!cohortUsers || cohortUsers.length === 0) {
      return []
    }

    const cohortUserIds = cohortUsers.map((u) => u.user_id)
    const cohortSize = cohortUserIds.length

    const retention = []

    // Calcular retention para cada dia (0 a 30)
    for (let day = 0; day <= 30; day++) {
      const targetDate = new Date(new Date(cohortDate).getTime() + day * 24 * 60 * 60 * 1000)
      const nextDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)

      const { data: activeUsers } = await supabase
        .from('analytics_events')
        .select('user_id')
        .in('user_id', cohortUserIds)
        .gte('timestamp', targetDate.toISOString())
        .lt('timestamp', nextDate.toISOString())

      const activeCount = new Set(activeUsers?.map((u) => u.user_id)).size
      const retentionRate = (activeCount / cohortSize) * 100

      retention.push({
        day,
        retention_rate: parseFloat(retentionRate.toFixed(2))
      })
    }

    return retention
  }

  /**
   * Obter top produtos por receita
   */
  static async getTopProducts(
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<{
    product_id: string
    product_type: string
    total_revenue: number
    total_purchases: number
  }[]> {
    const { data: purchases } = await supabase
      .from('analytics_events')
      .select('event_properties')
      .eq('event_type', 'purchase')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)

    if (!purchases) return []

    // Agrupar por produto
    const productStats: Record<string, any> = {}

    purchases.forEach((p) => {
      const props = p.event_properties as any
      const key = props.product_id

      if (!productStats[key]) {
        productStats[key] = {
          product_id: props.product_id,
          product_type: props.product_type,
          total_revenue: 0,
          total_purchases: 0
        }
      }

      productStats[key].total_revenue += props.amount
      productStats[key].total_purchases += 1
    })

    // Ordenar por revenue e limitar
    return Object.values(productStats)
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit)
  }

  /**
   * Obter usuários mais ativos
   */
  static async getTopUsers(
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<{
    user_id: string
    total_events: number
  }[]> {
    const { data: events } = await supabase
      .from('analytics_events')
      .select('user_id')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)

    if (!events) return []

    // Contar eventos por usuário
    const userCounts: Record<string, number> = {}
    events.forEach((e) => {
      userCounts[e.user_id] = (userCounts[e.user_id] || 0) + 1
    })

    // Ordenar e limitar
    return Object.entries(userCounts)
      .map(([user_id, total_events]) => ({ user_id, total_events }))
      .sort((a, b) => b.total_events - a.total_events)
      .slice(0, limit)
  }
}
