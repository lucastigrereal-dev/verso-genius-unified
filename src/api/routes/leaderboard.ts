/**
 * Leaderboard Routes
 */

import { Hono } from 'hono'
import { LeaderboardService } from '../services/leaderboardService'

const router = new Hono()

/**
 * GET /api/v1/leaderboard/global
 * Obter leaderboard global (baseado em XP)
 */
router.get('/global', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100')
    const offset = parseInt(c.req.query('offset') || '0')

    const leaderboard = await LeaderboardService.getGlobalLeaderboard(limit, offset)

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
 * GET /api/v1/leaderboard/weekly
 * Obter leaderboard semanal
 */
router.get('/weekly', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100')
    const offset = parseInt(c.req.query('offset') || '0')

    const leaderboard = await LeaderboardService.getWeeklyLeaderboard(limit, offset)

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
 * GET /api/v1/leaderboard/friends
 * Obter leaderboard de amigos
 */
router.get('/friends', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id
    const limit = parseInt(c.req.query('limit') || '50')

    const leaderboard = await LeaderboardService.getFriendsLeaderboard(userId, limit)

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
 * GET /api/v1/leaderboard/battle-wins
 * Obter leaderboard de vitórias em batalhas
 */
router.get('/battle-wins', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100')
    const offset = parseInt(c.req.query('offset') || '0')

    const leaderboard = await LeaderboardService.getBattleWinsLeaderboard(limit, offset)

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
 * GET /api/v1/leaderboard/rank
 * Obter posição do usuário no ranking
 */
router.get('/rank', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id
    const type = (c.req.query('type') || 'global') as any

    const rank = await LeaderboardService.getUserRank(userId, type)

    return c.json({
      success: true,
      data: rank
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
 * GET /api/v1/leaderboard/stats
 * Obter estatísticas completas do usuário
 */
router.get('/stats', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const stats = await LeaderboardService.getUserLeaderboardStats(userId)

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
 * POST /api/v1/leaderboard/update
 * Atualizar pontuação (uso interno)
 */
router.post('/update', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const body = await c.req.json()
    const { leaderboard_id, score, period } = body

    if (!leaderboard_id || !score) {
      return c.json(
        {
          success: false,
          error: 'leaderboard_id e score são obrigatórios'
        },
        400
      )
    }

    await LeaderboardService.updateScore(userId, leaderboard_id, score, period)

    return c.json({
      success: true,
      message: 'Pontuação atualizada'
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
 * POST /api/v1/leaderboard/reset/:period
 * Reset de leaderboards periódicos (admin/cron)
 */
router.post('/reset/:period', async (c) => {
  try {
    const period = c.req.param('period') as 'weekly' | 'monthly'

    if (!['weekly', 'monthly'].includes(period)) {
      return c.json(
        {
          success: false,
          error: 'Period inválido'
        },
        400
      )
    }

    await LeaderboardService.resetPeriodic(period)

    return c.json({
      success: true,
      message: `Leaderboard ${period} resetado`
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

export default router
