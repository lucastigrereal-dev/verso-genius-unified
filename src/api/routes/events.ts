/**
 * Events Routes
 */

import { Hono } from 'hono'
import { EventService } from '../services/eventService'

const router = new Hono()

/**
 * GET /api/v1/events
 * Listar eventos ativos
 */
router.get('/', async (c) => {
  try {
    const events = await EventService.getActiveEvents()

    return c.json({
      success: true,
      data: events
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message
      },
      500
    )
  }
})

/**
 * GET /api/v1/events/:id
 * Obter evento por ID
 */
router.get('/:id', async (c) => {
  try {
    const eventId = c.req.param('id')

    const event = await EventService.getEvent(eventId)

    if (!event) {
      return c.json(
        {
          success: false,
          error: 'Evento não encontrado'
        },
        404
      )
    }

    return c.json({
      success: true,
      data: event
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message
      },
      500
    )
  }
})

/**
 * GET /api/v1/events/:id/objectives
 * Obter objetivos do evento
 */
router.get('/:id/objectives', async (c) => {
  try {
    const eventId = c.req.param('id')

    const objectives = await EventService.getEventObjectives(eventId)

    return c.json({
      success: true,
      data: objectives
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message
      },
      500
    )
  }
})

/**
 * GET /api/v1/events/:id/progress
 * Obter progresso do usuário no evento
 */
router.get('/:id/progress', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id
    const eventId = c.req.param('id')

    const progress = await EventService.getUserProgress(userId, eventId)

    return c.json({
      success: true,
      data: progress
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message
      },
      500
    )
  }
})

/**
 * POST /api/v1/events/:id/join
 * Participar de um evento
 */
router.post('/:id/join', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id
    const eventId = c.req.param('id')

    const progress = await EventService.joinEvent(userId, eventId)

    return c.json({
      success: true,
      data: progress,
      message: 'Você entrou no evento!'
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message
      },
      400
    )
  }
})

/**
 * POST /api/v1/events/:id/update-progress
 * Atualizar progresso (uso interno)
 */
router.post('/:id/update-progress', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id
    const eventId = c.req.param('id')

    const body = await c.req.json()
    const { amount } = body

    if (!amount || amount <= 0) {
      return c.json(
        {
          success: false,
          error: 'Amount deve ser positivo'
        },
        400
      )
    }

    const result = await EventService.updateProgress(userId, eventId, amount)

    return c.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message
      },
      400
    )
  }
})

/**
 * POST /api/v1/events/:id/claim-reward
 * Reivindicar recompensa do evento
 */
router.post('/:id/claim-reward', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id
    const eventId = c.req.param('id')

    const reward = await EventService.claimReward(userId, eventId)

    return c.json({
      success: true,
      data: reward,
      message: `Recompensa reivindicada! +${reward.coins} coins, +${reward.gems} gems, +${reward.xp} XP`
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message
      },
      400
    )
  }
})

/**
 * GET /api/v1/events/:id/leaderboard
 * Obter leaderboard do evento
 */
router.get('/:id/leaderboard', async (c) => {
  try {
    const eventId = c.req.param('id')
    const limit = parseInt(c.req.query('limit') || '100')

    const leaderboard = await EventService.getEventLeaderboard(eventId, limit)

    return c.json({
      success: true,
      data: leaderboard
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message
      },
      500
    )
  }
})

/**
 * POST /api/v1/events/:id/update-score
 * Atualizar score no leaderboard (uso interno)
 */
router.post('/:id/update-score', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id
    const eventId = c.req.param('id')

    const body = await c.req.json()
    const { score } = body

    if (score === undefined || score < 0) {
      return c.json(
        {
          success: false,
          error: 'Score inválido'
        },
        400
      )
    }

    await EventService.updateEventScore(userId, eventId, score)

    return c.json({
      success: true,
      message: 'Score atualizado'
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message
      },
      400
    )
  }
})

/**
 * GET /api/v1/events/user/stats
 * Obter estatísticas do usuário em eventos
 */
router.get('/user/stats', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const stats = await EventService.getUserEventStats(userId)

    return c.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message
      },
      500
    )
  }
})

/**
 * POST /api/v1/events/process-game-event
 * Processar evento do jogo (uso interno/webhooks)
 */
router.post('/process-game-event', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const body = await c.req.json()
    const { event_type, value } = body

    if (!event_type) {
      return c.json(
        {
          success: false,
          error: 'event_type é obrigatório'
        },
        400
      )
    }

    await EventService.processGameEvent(userId, event_type, value || 1)

    return c.json({
      success: true,
      message: 'Evento processado'
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message
      },
      400
    )
  }
})

export default router
