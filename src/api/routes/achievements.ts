/**
 * Achievements Routes
 */

import { Hono } from 'hono'
import { AchievementService } from '../services/achievementService'

const router = new Hono()

/**
 * GET /api/v1/achievements
 * Listar todas as conquistas disponíveis
 */
router.get('/', async (c) => {
  try {
    const category = c.req.query('category')

    let achievements

    if (category) {
      achievements = await AchievementService.getAchievementsByCategory(
        category as any
      )
    } else {
      achievements = await AchievementService.getAllAchievements()
    }

    return c.json({
      success: true,
      data: achievements
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
 * GET /api/v1/achievements/user
 * Obter conquistas do usuário
 */
router.get('/user', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const userAchievements = await AchievementService.getUserAchievements(userId)

    return c.json({
      success: true,
      data: userAchievements
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
 * GET /api/v1/achievements/:id/progress
 * Verificar progresso de uma conquista específica
 */
router.get('/:id/progress', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id
    const achievementId = c.req.param('id')

    const progress = await AchievementService.checkProgress(userId, achievementId)

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
 * POST /api/v1/achievements/:id/update
 * Atualizar progresso de uma conquista (uso interno)
 */
router.post('/:id/update', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id
    const achievementId = c.req.param('id')

    const body = await c.req.json()
    const { progress } = body

    if (progress === undefined || progress < 0) {
      return c.json(
        {
          success: false,
          error: 'Progress inválido'
        },
        400
      )
    }

    const result = await AchievementService.updateProgress(
      userId,
      achievementId,
      progress
    )

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
 * POST /api/v1/achievements/:id/unlock
 * Desbloquear conquista manualmente (admin/debug)
 */
router.post('/:id/unlock', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id
    const achievementId = c.req.param('id')

    const body = await c.req.json()
    const { progress } = body

    const result = await AchievementService.unlockAchievement(
      userId,
      achievementId,
      progress || 100
    )

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
 * GET /api/v1/achievements/stats
 * Obter estatísticas de conquistas do usuário
 */
router.get('/user/stats', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const stats = await AchievementService.getUserStats(userId)

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
 * POST /api/v1/achievements/check-event
 * Verificar conquistas baseadas em evento (uso interno)
 */
router.post('/check-event', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const body = await c.req.json()
    const { type, data } = body

    if (!type) {
      return c.json(
        {
          success: false,
          error: 'Event type é obrigatório'
        },
        400
      )
    }

    const unlockedAchievements = await AchievementService.checkEventAchievements(
      userId,
      { type, data }
    )

    return c.json({
      success: true,
      data: {
        unlockedCount: unlockedAchievements.length,
        achievements: unlockedAchievements
      }
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
