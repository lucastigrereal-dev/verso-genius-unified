/**
 * Daily Challenges Routes
 */

import { Hono } from 'hono'
import { DailyChallengesService } from '../services/dailyChallengesService'

const router = new Hono()

/**
 * GET /api/v1/challenges/today
 * Desafios de hoje
 */
router.get('/today', async (c) => {
  try {
    const challenges = await DailyChallengesService.getTodaysChallenges()

    return c.json({
      success: true,
      data: challenges
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * GET /api/v1/challenges/progress
 * Progresso do usuário
 */
router.get('/progress', async (c) => {
  try {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Não autorizado' }, 401)
    }

    const progress = await DailyChallengesService.getUserProgress(user.id)

    return c.json({
      success: true,
      data: progress
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * POST /api/v1/challenges/:id/update
 * Atualizar progresso
 */
router.post('/:id/update', async (c) => {
  try {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Não autorizado' }, 401)
    }

    const challengeId = c.req.param('id')
    const { progress } = await c.req.json()

    const result = await DailyChallengesService.updateProgress(
      user.id,
      challengeId,
      progress
    )

    return c.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 400)
  }
})

/**
 * POST /api/v1/challenges/:id/claim
 * Reivindicar recompensa
 */
router.post('/:id/claim', async (c) => {
  try {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Não autorizado' }, 401)
    }

    const challengeId = c.req.param('id')
    const reward = await DailyChallengesService.claimReward(user.id, challengeId)

    return c.json({
      success: true,
      data: reward
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 400)
  }
})

/**
 * POST /api/v1/challenges/claim-bonus
 * Reivindicar bônus por completar todos
 */
router.post('/claim-bonus', async (c) => {
  try {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Não autorizado' }, 401)
    }

    const bonus = await DailyChallengesService.claimDailyBonus(user.id)

    return c.json({
      success: true,
      data: bonus
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 400)
  }
})

/**
 * GET /api/v1/challenges/stats
 * Estatísticas do usuário
 */
router.get('/stats', async (c) => {
  try {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Não autorizado' }, 401)
    }

    const stats = await DailyChallengesService.getUserStats(user.id)

    return c.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default router
