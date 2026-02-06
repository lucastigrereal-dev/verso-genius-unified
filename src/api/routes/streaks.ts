/**
 * Streaks Routes
 */

import { Hono } from 'hono'
import { StreakService } from '../services/streakService'

const router = new Hono()

/**
 * GET /api/v1/streaks
 * Obter streak do usuário
 */
router.get('/', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const streak = await StreakService.getUserStreak(userId)

    return c.json({
      success: true,
      data: streak
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
 * POST /api/v1/streaks/check-in
 * Fazer check-in diário
 */
router.post('/check-in', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const result = await StreakService.checkIn(userId)

    return c.json({
      success: true,
      data: result,
      message: `Check-in realizado! Dia ${result.streak.current_streak} de streak 🔥`
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
 * GET /api/v1/streaks/can-check-in
 * Verificar se pode fazer check-in
 */
router.get('/can-check-in', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const result = await StreakService.canCheckIn(userId)

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
      500
    )
  }
})

/**
 * GET /api/v1/streaks/stats
 * Obter estatísticas de streak
 */
router.get('/stats', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const stats = await StreakService.getStreakStats(userId)

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
 * POST /api/v1/streaks/buy-protection
 * Comprar proteção de streak com gems
 */
router.post('/buy-protection', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const body = await c.req.json()
    const { days } = body

    if (!days || days <= 0 || days > 7) {
      return c.json(
        {
          success: false,
          error: 'Days deve estar entre 1 e 7'
        },
        400
      )
    }

    const streak = await StreakService.buyStreakProtection(userId, days)

    return c.json({
      success: true,
      data: streak,
      message: `Streak protegido por ${days} dia(s)! 🛡️`
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
 * POST /api/v1/streaks/recover
 * Recuperar streak perdido (feature premium)
 */
router.post('/recover', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const streak = await StreakService.recoverLostStreak(userId)

    return c.json({
      success: true,
      data: streak,
      message: 'Streak recuperado com sucesso! 🎉'
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
 * GET /api/v1/streaks/leaderboard
 * Obter leaderboard de streaks
 */
router.get('/leaderboard', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100')

    const leaderboard = await StreakService.getStreakLeaderboard(limit)

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

export default router
