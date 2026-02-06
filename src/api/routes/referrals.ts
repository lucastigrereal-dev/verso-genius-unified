/**
 * Referrals Routes
 */

import { Hono } from 'hono'
import { ReferralService } from '../services/referralService'

const router = new Hono()

/**
 * GET /api/v1/referrals/code
 * Obter código de indicação do usuário
 */
router.get('/code', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    let code = await ReferralService.getUserReferralCode(userId)

    // Se não existe, gerar
    if (!code) {
      code = await ReferralService.generateReferralCode(userId)
    }

    return c.json({
      success: true,
      data: {
        code,
        shareUrl: `${process.env.APP_URL || 'https://versogenius.com'}/signup?ref=${code}`
      }
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
 * POST /api/v1/referrals/validate
 * Validar código de indicação
 */
router.post('/validate', async (c) => {
  try {
    const body = await c.req.json()
    const { code } = body

    if (!code) {
      return c.json(
        {
          success: false,
          error: 'Código é obrigatório'
        },
        400
      )
    }

    const result = await ReferralService.validateReferralCode(code)

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
 * POST /api/v1/referrals/register
 * Registrar indicação (quando novo usuário se cadastra)
 */
router.post('/register', async (c) => {
  try {
    const profile = c.get('profile')
    const referredUserId = profile.id

    const body = await c.req.json()
    const { referral_code } = body

    if (!referral_code) {
      return c.json(
        {
          success: false,
          error: 'Código de indicação é obrigatório'
        },
        400
      )
    }

    // Validar código
    const validation = await ReferralService.validateReferralCode(referral_code)

    if (!validation.valid || !validation.referrerId) {
      return c.json(
        {
          success: false,
          error: 'Código de indicação inválido'
        },
        400
      )
    }

    // Verificar se usuário pode ser indicado
    const canBeReferred = await ReferralService.canBeReferred(referredUserId)

    if (!canBeReferred) {
      return c.json(
        {
          success: false,
          error: 'Você já foi indicado anteriormente'
        },
        400
      )
    }

    // Registrar referral
    const referral = await ReferralService.registerReferral(
      validation.referrerId,
      referredUserId,
      referral_code
    )

    return c.json({
      success: true,
      data: referral,
      message: 'Indicação registrada! Você ganhou 100 coins de bônus.'
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
 * GET /api/v1/referrals/list
 * Listar indicações do usuário
 */
router.get('/list', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const referrals = await ReferralService.getUserReferrals(userId)

    return c.json({
      success: true,
      data: referrals
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
 * GET /api/v1/referrals/stats
 * Obter estatísticas de indicações do usuário
 */
router.get('/stats', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const stats = await ReferralService.getUserReferralStats(userId)

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
 * GET /api/v1/referrals/leaderboard
 * Obter leaderboard de indicações
 */
router.get('/leaderboard', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10')

    const leaderboard = await ReferralService.getReferralLeaderboard(limit)

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
 * POST /api/v1/referrals/milestone
 * Processar milestone de indicação (uso interno/webhooks)
 */
router.post('/milestone', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const body = await c.req.json()
    const { event } = body

    if (!event || !['first_exercise', 'level_5', 'purchase'].includes(event)) {
      return c.json(
        {
          success: false,
          error: 'Event inválido'
        },
        400
      )
    }

    await ReferralService.processReferralMilestone(userId, event)

    return c.json({
      success: true,
      message: 'Milestone processado'
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
