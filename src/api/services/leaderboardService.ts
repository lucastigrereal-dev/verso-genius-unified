/**
 * Leaderboard Service
 * Sistema de rankings e competições
 */

import { supabase } from '../../../config/supabase'
import { redis } from '../../../config/redis'

export type LeaderboardType = 'global' | 'weekly' | 'monthly' | 'friends' | 'battle_wins' | 'streak'
export type LeaderboardPeriod = 'all_time' | 'weekly' | 'monthly' | 'daily'

interface LeaderboardEntry {
  user_id: string
  username: string
  avatar_url?: string
  level: number
  score: number
  rank: number
  badge?: string
}

interface LeaderboardStats {
  userRank: number | null
  userScore: number
  totalParticipants: number
  topPlayers: LeaderboardEntry[]
}

export class LeaderboardService {
  private static CACHE_TTL = 300 // 5 minutos

  /**
   * Obter leaderboard global (baseado em XP total)
   */
  static async getGlobalLeaderboard(
    limit: number = 100,
    offset: number = 0
  ): Promise<LeaderboardEntry[]> {
    const cacheKey = `leaderboard:global:${limit}:${offset}`

    // Tentar cache
    try {
      const cached = await redis.get(cacheKey)
      if (cached) return JSON.parse(cached)
    } catch (err) {
      console.error('Redis cache error:', err)
    }

    // Buscar do banco
    const { data, error } = await supabase
      .from('users')
      .select('id, username, avatar_url, level, xp')
      .order('xp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(`Erro ao buscar leaderboard: ${error.message}`)

    const entries: LeaderboardEntry[] = (data || []).map((user, index) => ({
      user_id: user.id,
      username: user.username,
      avatar_url: user.avatar_url,
      level: user.level,
      score: user.xp,
      rank: offset + index + 1,
      badge: this.getRankBadge(offset + index + 1)
    }))

    // Salvar em cache
    try {
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(entries))
    } catch (err) {
      console.error('Redis cache error:', err)
    }

    return entries
  }

  /**
   * Obter leaderboard semanal
   */
  static async getWeeklyLeaderboard(
    limit: number = 100,
    offset: number = 0
  ): Promise<LeaderboardEntry[]> {
    const cacheKey = `leaderboard:weekly:${limit}:${offset}`

    // Tentar cache
    try {
      const cached = await redis.get(cacheKey)
      if (cached) return JSON.parse(cached)
    } catch (err) {
      console.error('Redis cache error:', err)
    }

    // Data de início da semana (segunda-feira)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)
    monday.setHours(0, 0, 0, 0)

    // Buscar entradas da semana
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select(`
        user_id,
        score,
        users!leaderboard_entries_user_id_fkey(id, username, avatar_url, level)
      `)
      .eq('period', 'weekly')
      .gte('created_at', monday.toISOString())
      .order('score', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(`Erro ao buscar leaderboard semanal: ${error.message}`)

    const entries: LeaderboardEntry[] = (data || []).map((entry: any, index) => ({
      user_id: entry.user_id,
      username: entry.users?.username || 'Unknown',
      avatar_url: entry.users?.avatar_url,
      level: entry.users?.level || 1,
      score: entry.score,
      rank: offset + index + 1,
      badge: this.getRankBadge(offset + index + 1)
    }))

    // Salvar em cache
    try {
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(entries))
    } catch (err) {
      console.error('Redis cache error:', err)
    }

    return entries
  }

  /**
   * Obter leaderboard de amigos
   */
  static async getFriendsLeaderboard(
    userId: string,
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    // Buscar IDs dos amigos
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted')

    if (!friendships || friendships.length === 0) {
      return []
    }

    // Extrair IDs dos amigos
    const friendIds = friendships.map(f =>
      f.user_id === userId ? f.friend_id : f.user_id
    )

    // Incluir o próprio usuário
    friendIds.push(userId)

    // Buscar dados dos amigos
    const { data, error } = await supabase
      .from('users')
      .select('id, username, avatar_url, level, xp')
      .in('id', friendIds)
      .order('xp', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`Erro ao buscar leaderboard de amigos: ${error.message}`)

    const entries: LeaderboardEntry[] = (data || []).map((user, index) => ({
      user_id: user.id,
      username: user.username,
      avatar_url: user.avatar_url,
      level: user.level,
      score: user.xp,
      rank: index + 1,
      badge: this.getRankBadge(index + 1)
    }))

    return entries
  }

  /**
   * Obter leaderboard de vitórias em batalhas
   */
  static async getBattleWinsLeaderboard(
    limit: number = 100,
    offset: number = 0
  ): Promise<LeaderboardEntry[]> {
    const cacheKey = `leaderboard:battle_wins:${limit}:${offset}`

    // Tentar cache
    try {
      const cached = await redis.get(cacheKey)
      if (cached) return JSON.parse(cached)
    } catch (err) {
      console.error('Redis cache error:', err)
    }

    // Contar vitórias por usuário
    const { data, error } = await supabase.rpc('get_battle_wins_leaderboard', {
      p_limit: limit,
      p_offset: offset
    })

    if (error) {
      // Fallback: query manual
      const { data: battles } = await supabase
        .from('battles')
        .select(`
          winner_id,
          users!battles_winner_id_fkey(id, username, avatar_url, level)
        `)
        .not('winner_id', 'is', null)

      if (!battles) return []

      // Agrupar por winner
      const winCounts: Record<string, { user: any; wins: number }> = {}

      for (const battle of battles as any[]) {
        const winnerId = battle.winner_id
        if (!winCounts[winnerId]) {
          winCounts[winnerId] = {
            user: battle.users,
            wins: 0
          }
        }
        winCounts[winnerId].wins++
      }

      // Converter para array e ordenar
      const entries: LeaderboardEntry[] = Object.values(winCounts)
        .sort((a, b) => b.wins - a.wins)
        .slice(offset, offset + limit)
        .map((entry, index) => ({
          user_id: entry.user.id,
          username: entry.user.username,
          avatar_url: entry.user.avatar_url,
          level: entry.user.level,
          score: entry.wins,
          rank: offset + index + 1,
          badge: this.getRankBadge(offset + index + 1)
        }))

      // Salvar em cache
      try {
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(entries))
      } catch (err) {
        console.error('Redis cache error:', err)
      }

      return entries
    }

    const entries: LeaderboardEntry[] = (data || []).map((row: any, index: number) => ({
      user_id: row.user_id,
      username: row.username,
      avatar_url: row.avatar_url,
      level: row.level,
      score: row.win_count,
      rank: offset + index + 1,
      badge: this.getRankBadge(offset + index + 1)
    }))

    // Salvar em cache
    try {
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(entries))
    } catch (err) {
      console.error('Redis cache error:', err)
    }

    return entries
  }

  /**
   * Atualizar pontuação no leaderboard
   */
  static async updateScore(
    userId: string,
    leaderboardId: string,
    score: number,
    period: LeaderboardPeriod = 'all_time'
  ): Promise<void> {
    // Verificar se já existe entrada
    const { data: existing } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('leaderboard_id', leaderboardId)
      .eq('user_id', userId)
      .eq('period', period)
      .maybeSingle()

    if (existing) {
      // Atualizar se nova pontuação for maior
      if (score > existing.score) {
        await supabase
          .from('leaderboard_entries')
          .update({ score, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
      }
    } else {
      // Criar nova entrada
      await supabase.from('leaderboard_entries').insert({
        leaderboard_id: leaderboardId,
        user_id: userId,
        score,
        period
      })
    }

    // Invalidar cache
    this.invalidateCache(leaderboardId, period)
  }

  /**
   * Obter posição do usuário no ranking
   */
  static async getUserRank(
    userId: string,
    type: LeaderboardType = 'global'
  ): Promise<{
    rank: number | null
    score: number
    totalParticipants: number
  }> {
    if (type === 'global') {
      // Contar usuários com XP maior
      const { data: user } = await supabase
        .from('users')
        .select('xp')
        .eq('id', userId)
        .single()

      if (!user) {
        return { rank: null, score: 0, totalParticipants: 0 }
      }

      const { count: higherCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gt('xp', user.xp)

      const { count: totalCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      return {
        rank: (higherCount || 0) + 1,
        score: user.xp,
        totalParticipants: totalCount || 0
      }
    } else if (type === 'weekly') {
      // TODO: Implementar lógica semanal
      return { rank: null, score: 0, totalParticipants: 0 }
    } else if (type === 'battle_wins') {
      // Contar vitórias do usuário
      const { count: wins } = await supabase
        .from('battles')
        .select('*', { count: 'exact', head: true })
        .eq('winner_id', userId)

      // Contar usuários com mais vitórias
      const { data: allWins } = await supabase
        .from('battles')
        .select('winner_id')
        .not('winner_id', 'is', null)

      if (!allWins) {
        return { rank: null, score: wins || 0, totalParticipants: 0 }
      }

      // Contar vitórias por usuário
      const winCounts: Record<string, number> = {}
      for (const battle of allWins as any[]) {
        winCounts[battle.winner_id] = (winCounts[battle.winner_id] || 0) + 1
      }

      const userWins = wins || 0
      const higherCount = Object.values(winCounts).filter(w => w > userWins).length

      return {
        rank: higherCount + 1,
        score: userWins,
        totalParticipants: Object.keys(winCounts).length
      }
    }

    return { rank: null, score: 0, totalParticipants: 0 }
  }

  /**
   * Obter estatísticas completas do usuário
   */
  static async getUserLeaderboardStats(userId: string): Promise<{
    global: { rank: number | null; score: number; totalParticipants: number }
    weekly: { rank: number | null; score: number; totalParticipants: number }
    battleWins: { rank: number | null; score: number; totalParticipants: number }
  }> {
    const [global, weekly, battleWins] = await Promise.all([
      this.getUserRank(userId, 'global'),
      this.getUserRank(userId, 'weekly'),
      this.getUserRank(userId, 'battle_wins')
    ])

    return { global, weekly, battleWins }
  }

  /**
   * Reset de leaderboards periódicos (chamar via cron)
   */
  static async resetPeriodic(period: 'weekly' | 'monthly'): Promise<void> {
    await supabase.from('leaderboard_entries').delete().eq('period', period)

    // Invalidar todos os caches do período
    try {
      const keys = await redis.keys(`leaderboard:${period}:*`)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (err) {
      console.error('Redis error:', err)
    }
  }

  /**
   * Obter badge baseado no rank
   */
  private static getRankBadge(rank: number): string {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    if (rank <= 10) return '🏆'
    if (rank <= 50) return '⭐'
    return ''
  }

  /**
   * Invalidar cache de leaderboard
   */
  private static async invalidateCache(
    leaderboardId: string,
    period: LeaderboardPeriod
  ): Promise<void> {
    try {
      const pattern = `leaderboard:${leaderboardId}:${period}:*`
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (err) {
      console.error('Redis error:', err)
    }
  }
}
