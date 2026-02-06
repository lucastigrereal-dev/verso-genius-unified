/**
 * Battle Pass Routes
 */

import { Hono } from 'hono'
import { BattlePassService } from '../services/battlePassService'

const router = new Hono()

/**
 * GET /api/v1/battle-pass/active
 * Obter Battle Pass ativo e tiers
 */
router.get('/active', async (c) => {
  try {
    const battlePass = await BattlePassService.getActiveBattlePass()

    if (!battlePass) {
      return c.json({
        success: false,
        error: 'Nenhum Battle Pass ativo no momento'
      })
    }

    const tiers = await BattlePassService.getBattlePassTiers(battlePass.id)

    return c.json({
      success: true,
      data: {
        battlePass,
        tiers
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
 * GET /api/v1/battle-pass/progress
 * Obter progresso do usuário no Battle Pass
 */
router.get('/progress', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const userProgress = await BattlePassService.getUserBattlePass(userId)

    return c.json({
      success: true,
      data: userProgress
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
 * POST /api/v1/battle-pass/purchase-premium
 * Comprar Battle Pass Premium
 */
router.post('/purchase-premium', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const battlePass = await BattlePassService.getActiveBattlePass()

    if (!battlePass) {
      return c.json(
        {
          success: false,
          error: 'Nenhum Battle Pass ativo'
        },
        400
      )
    }

    const userBattlePass = await BattlePassService.purchasePremium(
      userId,
      battlePass.id
    )

    return c.json({
      success: true,
      data: userBattlePass
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
 * POST /api/v1/battle-pass/add-xp
 * Adicionar XP ao Battle Pass (uso interno)
 */
router.post('/add-xp', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const body = await c.req.json()
    const { amount, source } = body

    if (!amount || amount <= 0) {
      return c.json(
        {
          success: false,
          error: 'Amount deve ser positivo'
        },
        400
      )
    }

    const result = await BattlePassService.addXP(userId, amount, source || 'manual')

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
 * POST /api/v1/battle-pass/claim/:tierId
 * Reivindicar recompensa de um tier
 */
router.post('/claim/:tierId', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id
    const tierId = c.req.param('tierId')

    const body = await c.req.json()
    const { is_premium } = body

    const userBattlePass = await BattlePassService.getUserBattlePass(userId)

    if (!userBattlePass) {
      return c.json(
        {
          success: false,
          error: 'Battle Pass não encontrado'
        },
        404
      )
    }

    const reward = await BattlePassService.claimTierReward(
      userBattlePass.id,
      tierId,
      is_premium || false
    )

    if (!reward) {
      return c.json(
        {
          success: false,
          error: 'Recompensa já foi reivindicada ou tier não desbloqueado'
        },
        400
      )
    }

    return c.json({
      success: true,
      data: reward
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
 * GET /api/v1/battle-pass/stats
 * Obter estatísticas do Battle Pass do usuário
 */
router.get('/stats', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const stats = await BattlePassService.getUserStats(userId)

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

export default router
