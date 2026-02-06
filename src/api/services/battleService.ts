/**
 * Battle Service
 * Sistema de batalhas 1v1 com matchmaking e ELO
 */

import { supabase } from '../../../config/supabase'
import { CurrencyService } from './currencyService'
import { redis } from '../../../config/redis'

const MATCHMAKING_TIMEOUT = 60 // 60 segundos
const ELO_RANGE = 200 // ±200 ELO para matchmaking

export class BattleService {
  /**
   * Entrar na fila de matchmaking
   */
  static async joinQueue(
    userId: string,
    battleType: 'ranked' | 'casual',
    betCoins: number = 0,
    betGems: number = 0
  ): Promise<{ battle_id?: string; in_queue: boolean }> {
    // Verificar saldo se houver bet
    if (betCoins > 0) {
      const canAfford = await CurrencyService.canAfford(userId, 'coins', betCoins)
      if (!canAfford) throw new Error('Coins insuficientes para a aposta')
    }

    if (betGems > 0) {
      const canAfford = await CurrencyService.canAfford(userId, 'gems', betGems)
      if (!canAfford) throw new Error('Gems insuficientes para a aposta')
    }

    // Buscar ELO do usuário (se ranked)
    let userElo = 1200
    if (battleType === 'ranked') {
      const { data: ranking } = await supabase
        .from('battle_rankings')
        .select('elo_rating')
        .eq('user_id', userId)
        .maybeSingle()

      userElo = ranking?.elo_rating || 1200
    }

    // Tentar encontrar oponente na fila (Redis)
    const queueKey = `matchmaking:${battleType}:${betCoins}_${betGems}`
    const waitingPlayers = await redis.zrangebyscore(
      queueKey,
      userElo - ELO_RANGE,
      userElo + ELO_RANGE,
      'LIMIT',
      0,
      1
    )

    if (waitingPlayers.length > 0) {
      const opponentId = waitingPlayers[0]

      // Remover oponente da fila
      await redis.zrem(queueKey, opponentId)

      // Criar batalha
      const { data: battle, error } = await supabase
        .from('battles')
        .insert({
          player1_id: opponentId,
          player2_id: userId,
          status: 'matched',
          battle_type: battleType,
          bet_amount_coins: betCoins,
          bet_amount_gems: betGems,
          matched_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw new Error(error.message)

      // Debitar apostas de ambos
      if (betCoins > 0) {
        await CurrencyService.spendCurrency(userId, 'coins', betCoins, `battle_bet_${battle.id}`)
        await CurrencyService.spendCurrency(opponentId, 'coins', betCoins, `battle_bet_${battle.id}`)
      }

      if (betGems > 0) {
        await CurrencyService.spendCurrency(userId, 'gems', betGems, `battle_bet_${battle.id}`)
        await CurrencyService.spendCurrency(opponentId, 'gems', betGems, `battle_bet_${battle.id}`)
      }

      return {
        battle_id: battle.id,
        in_queue: false
      }
    } else {
      // Adicionar à fila
      await redis.zadd(queueKey, userElo, userId)
      await redis.expire(queueKey, MATCHMAKING_TIMEOUT)

      return {
        in_queue: true
      }
    }
  }

  /**
   * Sair da fila
   */
  static async leaveQueue(userId: string, battleType: string, betCoins: number, betGems: number): Promise<void> {
    const queueKey = `matchmaking:${battleType}:${betCoins}_${betGems}`
    await redis.zrem(queueKey, userId)
  }

  /**
   * Criar batalha amigável (vs amigo específico)
   */
  static async createFriendlyBattle(
    userId: string,
    opponentId: string,
    theme?: string
  ): Promise<string> {
    // Verificar se são amigos
    const { data: friendship } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${opponentId}),and(user_id.eq.${opponentId},friend_id.eq.${userId})`)
      .eq('status', 'accepted')
      .maybeSingle()

    if (!friendship) {
      throw new Error('Você só pode criar batalhas amigáveis com amigos')
    }

    // Criar batalha
    const { data: battle, error } = await supabase
      .from('battles')
      .insert({
        player1_id: userId,
        player2_id: opponentId,
        status: 'matched',
        battle_type: 'friendly',
        theme,
        bet_amount_coins: 0,
        bet_amount_gems: 0,
        matched_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    return battle.id
  }

  /**
   * Iniciar batalha
   */
  static async startBattle(battleId: string): Promise<void> {
    await supabase
      .from('battles')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', battleId)
      .eq('status', 'matched')
  }

  /**
   * Submeter verso de uma rodada
   */
  static async submitVerse(
    battleId: string,
    userId: string,
    roundNumber: number,
    verse: string
  ): Promise<void> {
    // Verificar se é participante
    const { data: battle } = await supabase
      .from('battles')
      .select('player1_id, player2_id')
      .eq('id', battleId)
      .single()

    if (!battle) throw new Error('Batalha não encontrada')

    const isPlayer1 = battle.player1_id === userId
    const isPlayer2 = battle.player2_id === userId

    if (!isPlayer1 && !isPlayer2) {
      throw new Error('Você não é participante desta batalha')
    }

    // Atualizar ou criar rodada
    const columnName = isPlayer1 ? 'player1_verse' : 'player2_verse'

    const { data: existingRound } = await supabase
      .from('battle_rounds')
      .select('*')
      .eq('battle_id', battleId)
      .eq('round_number', roundNumber)
      .maybeSingle()

    if (existingRound) {
      await supabase
        .from('battle_rounds')
        .update({ [columnName]: verse })
        .eq('id', existingRound.id)
    } else {
      await supabase.from('battle_rounds').insert({
        battle_id: battleId,
        round_number: roundNumber,
        [columnName]: verse
      })
    }
  }

  /**
   * Votar em uma rodada (público)
   */
  static async voteRound(
    battleId: string,
    roundNumber: number,
    voterId: string,
    votedForPlayerId: string
  ): Promise<void> {
    // Criar voto (unique constraint previne duplicatas)
    const { error } = await supabase.from('battle_votes').insert({
      battle_id: battleId,
      round_number: roundNumber,
      voter_id: voterId,
      voted_for_player_id: votedForPlayerId
    })

    if (error && error.code === '23505') {
      throw new Error('Você já votou nesta rodada')
    }

    if (error) throw new Error(error.message)

    // Atualizar contadores
    const { data: votes } = await supabase
      .from('battle_votes')
      .select('voted_for_player_id')
      .eq('battle_id', battleId)
      .eq('round_number', roundNumber)

    const { data: battle } = await supabase
      .from('battles')
      .select('player1_id, player2_id')
      .eq('id', battleId)
      .single()

    if (!battle) return

    const player1Votes = votes?.filter((v) => v.voted_for_player_id === battle.player1_id).length || 0
    const player2Votes = votes?.filter((v) => v.voted_for_player_id === battle.player2_id).length || 0

    await supabase
      .from('battle_rounds')
      .update({
        player1_votes: player1Votes,
        player2_votes: player2Votes
      })
      .eq('battle_id', battleId)
      .eq('round_number', roundNumber)
  }

  /**
   * Finalizar batalha e declarar vencedor
   */
  static async finalizeBattle(battleId: string): Promise<void> {
    // Buscar todas as rodadas
    const { data: rounds } = await supabase
      .from('battle_rounds')
      .select('*')
      .eq('battle_id', battleId)
      .order('round_number', { ascending: true })

    if (!rounds || rounds.length === 0) {
      throw new Error('Batalha não tem rodadas')
    }

    const { data: battle } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single()

    if (!battle) throw new Error('Batalha não encontrada')

    // Contar vitórias por rodada
    let player1Wins = 0
    let player2Wins = 0

    rounds.forEach((round) => {
      if (round.player1_votes > round.player2_votes) {
        player1Wins++
      } else if (round.player2_votes > round.player1_votes) {
        player2Wins++
      }
    })

    // Determinar vencedor
    let winnerId, loserId
    if (player1Wins > player2Wins) {
      winnerId = battle.player1_id
      loserId = battle.player2_id
    } else if (player2Wins > player1Wins) {
      winnerId = battle.player2_id
      loserId = battle.player1_id
    } else {
      // Empate - não há vencedor
      await supabase
        .from('battles')
        .update({
          status: 'completed',
          player1_score: player1Wins,
          player2_score: player2Wins,
          completed_at: new Date().toISOString()
        })
        .eq('id', battleId)

      // Reembolsar apostas em caso de empate
      if (battle.bet_amount_coins > 0) {
        await CurrencyService.addCurrency(battle.player1_id, 'coins', battle.bet_amount_coins, `battle_refund_${battleId}`)
        await CurrencyService.addCurrency(battle.player2_id, 'coins', battle.bet_amount_coins, `battle_refund_${battleId}`)
      }

      if (battle.bet_amount_gems > 0) {
        await CurrencyService.addCurrency(battle.player1_id, 'gems', battle.bet_amount_gems, `battle_refund_${battleId}`)
        await CurrencyService.addCurrency(battle.player2_id, 'gems', battle.bet_amount_gems, `battle_refund_${battleId}`)
      }

      return
    }

    // Dar prêmio ao vencedor
    if (battle.bet_amount_coins > 0) {
      await CurrencyService.addCurrency(
        winnerId,
        'coins',
        battle.bet_amount_coins * 2, // Winner leva tudo
        `battle_win_${battleId}`
      )
    }

    if (battle.bet_amount_gems > 0) {
      await CurrencyService.addCurrency(
        winnerId,
        'gems',
        battle.bet_amount_gems * 2,
        `battle_win_${battleId}`
      )
    }

    // Atualizar batalha (trigger atualiza rankings automaticamente)
    await supabase
      .from('battles')
      .update({
        status: 'completed',
        winner_id: winnerId,
        loser_id: loserId,
        player1_score: player1Wins,
        player2_score: player2Wins,
        completed_at: new Date().toISOString()
      })
      .eq('id', battleId)
  }

  /**
   * Obter ranking de batalhas
   */
  static async getLeaderboard(limit: number = 100, offset: number = 0) {
    const { data, error } = await supabase
      .from('battle_rankings')
      .select(`
        *,
        user:users(id, username, avatar_url, level)
      `)
      .order('elo_rating', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(error.message)

    return data || []
  }

  /**
   * Obter detalhes de uma batalha
   */
  static async getBattleDetails(battleId: string) {
    const { data: battle, error } = await supabase
      .from('battles')
      .select(`
        *,
        player1:users!battles_player1_id_fkey(id, username, avatar_url, level),
        player2:users!battles_player2_id_fkey(id, username, avatar_url, level),
        rounds:battle_rounds(*)
      `)
      .eq('id', battleId)
      .single()

    if (error) throw new Error(error.message)

    return battle
  }

  /**
   * Obter batalhas ativas (para espectadores)
   */
  static async getActiveBattles(limit: number = 20) {
    const { data, error } = await supabase
      .from('battles')
      .select(`
        *,
        player1:users!battles_player1_id_fkey(id, username, avatar_url, level),
        player2:users!battles_player2_id_fkey(id, username, avatar_url, level)
      `)
      .in('status', ['matched', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(error.message)

    return data || []
  }
}
