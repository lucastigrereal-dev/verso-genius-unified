/**
 * Battles Routes
 * Rotas do sistema de batalhas
 */

import { Hono } from 'hono'
import { BattleService } from '../services/battleService'

const router = new Hono()

// Entrar na fila de matchmaking
router.post('/queue/join', async (c) => {
  try {
    const userId = c.get('userId')
    const { battle_type, bet_coins, bet_gems } = await c.req.json()

    const result = await BattleService.joinQueue(
      userId,
      battle_type || 'casual',
      bet_coins || 0,
      bet_gems || 0
    )

    return c.json(result)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Sair da fila
router.post('/queue/leave', async (c) => {
  try {
    const userId = c.get('userId')
    const { battle_type, bet_coins, bet_gems } = await c.req.json()

    await BattleService.leaveQueue(userId, battle_type, bet_coins || 0, bet_gems || 0)
    return c.json({ message: 'Saiu da fila' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Criar batalha amigável
router.post('/friendly', async (c) => {
  try {
    const userId = c.get('userId')
    const { opponent_id, theme } = await c.req.json()

    const battleId = await BattleService.createFriendlyBattle(userId, opponent_id, theme)
    return c.json({ battle_id: battleId })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Iniciar batalha
router.post('/:battleId/start', async (c) => {
  try {
    const battleId = c.req.param('battleId')

    await BattleService.startBattle(battleId)
    return c.json({ message: 'Batalha iniciada' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Submeter verso
router.post('/:battleId/verse', async (c) => {
  try {
    const userId = c.get('userId')
    const battleId = c.req.param('battleId')
    const { round_number, verse } = await c.req.json()

    await BattleService.submitVerse(battleId, userId, round_number, verse)
    return c.json({ message: 'Verso enviado' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Votar
router.post('/:battleId/vote', async (c) => {
  try {
    const userId = c.get('userId')
    const battleId = c.req.param('battleId')
    const { round_number, voted_for_player_id } = await c.req.json()

    await BattleService.voteRound(battleId, round_number, userId, voted_for_player_id)
    return c.json({ message: 'Voto registrado' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Finalizar batalha
router.post('/:battleId/finalize', async (c) => {
  try {
    const battleId = c.req.param('battleId')

    await BattleService.finalizeBattle(battleId)
    return c.json({ message: 'Batalha finalizada' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Obter detalhes da batalha
router.get('/:battleId', async (c) => {
  try {
    const battleId = c.req.param('battleId')
    const battle = await BattleService.getBattleDetails(battleId)
    return c.json({ battle })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Obter batalhas ativas (espectadores)
router.get('/active', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20')
    const battles = await BattleService.getActiveBattles(limit)
    return c.json({ battles })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Ranking de batalhas
router.get('/ranking', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100')
    const offset = parseInt(c.req.query('offset') || '0')

    const leaderboard = await BattleService.getLeaderboard(limit, offset)
    return c.json({ leaderboard })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

export default router
