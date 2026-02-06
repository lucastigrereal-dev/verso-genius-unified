/**
 * Event Service
 * Sistema de eventos temporários com recompensas e objetivos
 */

import { supabase } from '../../../config/supabase'
import { CurrencyService } from './currencyService'

interface Event {
  id: string
  name: string
  description: string
  image_url?: string
  type: 'challenge' | 'tournament' | 'seasonal' | 'special'
  start_date: string
  end_date: string
  reward_coins: number
  reward_gems: number
  reward_xp: number
  reward_cosmetic_id?: string
  min_level: number
  max_participants?: number
  is_active: boolean
  is_repeating: boolean
  repeat_interval_days?: number
  created_at: string
  updated_at: string
}

interface EventObjective {
  id: string
  event_id: string
  title: string
  description: string
  objective_type:
    | 'rhymes_count'
    | 'battles_won'
    | 'daily_streak'
    | 'xp_earned'
    | 'exercises_completed'
    | 'score_threshold'
  target_value: number
  order_index: number
  created_at: string
}

interface UserEventProgress {
  id: string
  event_id: string
  user_id: string
  current_progress: number
  is_completed: boolean
  reward_claimed: boolean
  reward_claimed_at?: string
  started_at: string
  completed_at?: string
}

export class EventService {
  /**
   * Obter eventos ativos
   */
  static async getActiveEvents(): Promise<Event[]> {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('end_date', { ascending: true })

    if (error) throw new Error(`Erro ao buscar eventos: ${error.message}`)

    return data || []
  }

  /**
   * Obter evento por ID
   */
  static async getEvent(eventId: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Erro ao buscar evento: ${error.message}`)
    }

    return data
  }

  /**
   * Obter objetivos do evento
   */
  static async getEventObjectives(eventId: string): Promise<EventObjective[]> {
    const { data, error } = await supabase
      .from('event_objectives')
      .select('*')
      .eq('event_id', eventId)
      .order('order_index', { ascending: true })

    if (error) throw new Error(`Erro ao buscar objetivos: ${error.message}`)

    return data || []
  }

  /**
   * Obter progresso do usuário em um evento
   */
  static async getUserProgress(
    userId: string,
    eventId: string
  ): Promise<UserEventProgress | null> {
    const { data, error } = await supabase
      .from('user_event_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar progresso: ${error.message}`)
    }

    return data
  }

  /**
   * Iniciar participação em evento
   */
  static async joinEvent(userId: string, eventId: string): Promise<UserEventProgress> {
    const event = await this.getEvent(eventId)

    if (!event) {
      throw new Error('Evento não encontrado')
    }

    if (!event.is_active) {
      throw new Error('Evento não está ativo')
    }

    // Verificar se usuário já está participando
    const existing = await this.getUserProgress(userId, eventId)
    if (existing) {
      return existing
    }

    // Verificar nível mínimo
    const { data: user } = await supabase
      .from('users')
      .select('level')
      .eq('id', userId)
      .single()

    if (user && user.level < event.min_level) {
      throw new Error(`Nível mínimo: ${event.min_level}`)
    }

    // Verificar limite de participantes
    if (event.max_participants) {
      const { count } = await supabase
        .from('user_event_progress')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)

      if (count && count >= event.max_participants) {
        throw new Error('Evento está cheio')
      }
    }

    // Criar progresso
    const { data: progress, error } = await supabase
      .from('user_event_progress')
      .insert({
        event_id: eventId,
        user_id: userId,
        current_progress: 0
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao participar: ${error.message}`)

    return progress
  }

  /**
   * Atualizar progresso do usuário
   */
  static async updateProgress(
    userId: string,
    eventId: string,
    progressAmount: number
  ): Promise<{
    progress: UserEventProgress
    completed: boolean
  }> {
    // Buscar ou criar progresso
    let progress = await this.getUserProgress(userId, eventId)

    if (!progress) {
      progress = await this.joinEvent(userId, eventId)
    }

    if (progress.is_completed) {
      return { progress, completed: false }
    }

    // Atualizar progresso
    const newProgress = progress.current_progress + progressAmount

    // Verificar se completou
    const objectives = await this.getEventObjectives(eventId)
    const totalTarget = objectives.reduce((sum, obj) => sum + obj.target_value, 0)

    const isCompleted = newProgress >= totalTarget

    const { data: updatedProgress, error } = await supabase
      .from('user_event_progress')
      .update({
        current_progress: newProgress,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null
      })
      .eq('id', progress.id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar: ${error.message}`)

    return {
      progress: updatedProgress,
      completed: isCompleted && !progress.is_completed
    }
  }

  /**
   * Reivindicar recompensa do evento
   */
  static async claimReward(
    userId: string,
    eventId: string
  ): Promise<{
    coins: number
    gems: number
    xp: number
    cosmetic_id?: string
  }> {
    const progress = await this.getUserProgress(userId, eventId)

    if (!progress || !progress.is_completed) {
      throw new Error('Evento não completado')
    }

    if (progress.reward_claimed) {
      throw new Error('Recompensa já reivindicada')
    }

    const event = await this.getEvent(eventId)
    if (!event) throw new Error('Evento não encontrado')

    // Conceder recompensas
    if (event.reward_coins > 0) {
      await CurrencyService.addCurrency(
        userId,
        'coins',
        event.reward_coins,
        `event_${event.id}`
      )
    }

    if (event.reward_gems > 0) {
      await CurrencyService.addCurrency(
        userId,
        'gems',
        event.reward_gems,
        `event_${event.id}`
      )
    }

    // TODO: Adicionar XP
    // if (event.reward_xp > 0) {
    //   await XPService.addXP(userId, event.reward_xp, 'event')
    // }

    // TODO: Adicionar cosmético
    // if (event.reward_cosmetic_id) {
    //   await ShopService.grantCosmetic(userId, event.reward_cosmetic_id)
    // }

    // Marcar como reivindicado
    await supabase
      .from('user_event_progress')
      .update({
        reward_claimed: true,
        reward_claimed_at: new Date().toISOString()
      })
      .eq('id', progress.id)

    return {
      coins: event.reward_coins,
      gems: event.reward_gems,
      xp: event.reward_xp,
      cosmetic_id: event.reward_cosmetic_id
    }
  }

  /**
   * Obter leaderboard do evento
   */
  static async getEventLeaderboard(
    eventId: string,
    limit: number = 100
  ): Promise<
    Array<{
      user_id: string
      username: string
      avatar_url?: string
      score: number
      rank: number
    }>
  > {
    const { data, error } = await supabase
      .from('event_leaderboard')
      .select(`
        user_id,
        score,
        rank,
        users!event_leaderboard_user_id_fkey(id, username, avatar_url)
      `)
      .eq('event_id', eventId)
      .order('rank', { ascending: true })
      .limit(limit)

    if (error) throw new Error(`Erro ao buscar leaderboard: ${error.message}`)

    return (data || []).map((entry: any) => ({
      user_id: entry.user_id,
      username: entry.users?.username || 'Unknown',
      avatar_url: entry.users?.avatar_url,
      score: entry.score,
      rank: entry.rank
    }))
  }

  /**
   * Atualizar score no leaderboard do evento
   */
  static async updateEventScore(
    userId: string,
    eventId: string,
    score: number
  ): Promise<void> {
    // Verificar se já existe entrada
    const { data: existing } = await supabase
      .from('event_leaderboard')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      // Atualizar se novo score for maior
      if (score > existing.score) {
        await supabase
          .from('event_leaderboard')
          .update({ score })
          .eq('id', existing.id)
      }
    } else {
      // Criar nova entrada
      await supabase.from('event_leaderboard').insert({
        event_id: eventId,
        user_id: userId,
        score
      })
    }
  }

  /**
   * Obter estatísticas do usuário em eventos
   */
  static async getUserEventStats(userId: string): Promise<{
    totalParticipated: number
    totalCompleted: number
    totalRewardsClaimed: number
    activeEvents: number
  }> {
    const { data: progressList } = await supabase
      .from('user_event_progress')
      .select('*')
      .eq('user_id', userId)

    const stats = {
      totalParticipated: progressList?.length || 0,
      totalCompleted: progressList?.filter(p => p.is_completed).length || 0,
      totalRewardsClaimed: progressList?.filter(p => p.reward_claimed).length || 0,
      activeEvents: 0
    }

    // Contar eventos ativos
    const activeEvents = await this.getActiveEvents()
    stats.activeEvents = activeEvents.length

    return stats
  }

  /**
   * Criar evento (admin)
   */
  static async createEvent(
    data: Omit<Event, 'id' | 'created_at' | 'updated_at'>,
    objectives: Array<Omit<EventObjective, 'id' | 'event_id' | 'created_at'>>
  ): Promise<Event> {
    // Criar evento
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert(data)
      .select()
      .single()

    if (eventError) throw new Error(`Erro ao criar evento: ${eventError.message}`)

    // Criar objetivos
    if (objectives.length > 0) {
      const objectivesData = objectives.map((obj, index) => ({
        ...obj,
        event_id: event.id,
        order_index: index
      }))

      await supabase.from('event_objectives').insert(objectivesData)
    }

    return event
  }

  /**
   * Desativar eventos expirados (chamar via cron)
   */
  static async deactivateExpiredEvents(): Promise<void> {
    await supabase.rpc('deactivate_expired_events')
  }

  /**
   * Processar progresso baseado em evento do jogo
   */
  static async processGameEvent(
    userId: string,
    eventType: 'rhyme_created' | 'battle_won' | 'exercise_completed' | 'xp_gained',
    value: number = 1
  ): Promise<void> {
    // Buscar eventos ativos que correspondem ao tipo
    const activeEvents = await this.getActiveEvents()

    for (const event of activeEvents) {
      const objectives = await this.getEventObjectives(event.id)

      // Verificar se algum objetivo corresponde ao tipo de evento
      const matchingObjective = objectives.find(obj => {
        if (eventType === 'rhyme_created' && obj.objective_type === 'rhymes_count') return true
        if (eventType === 'battle_won' && obj.objective_type === 'battles_won') return true
        if (eventType === 'exercise_completed' && obj.objective_type === 'exercises_completed')
          return true
        if (eventType === 'xp_gained' && obj.objective_type === 'xp_earned') return true
        return false
      })

      if (matchingObjective) {
        await this.updateProgress(userId, event.id, value)
      }
    }
  }
}
