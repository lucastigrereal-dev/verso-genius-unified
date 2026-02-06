/**
 * Currency Routes
 * API endpoints for virtual currency management
 */

import { Hono } from 'hono'
import { CurrencyService } from '../services/currencyService'

const router = new Hono()

/**
 * GET /api/v1/currency/balance
 * Obtém saldo atual do usuário
 */
router.get('/balance', async (c) => {
  try {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Não autorizado' }, 401)
    }

    const balance = await CurrencyService.getBalance(user.id)

    return c.json({
      success: true,
      data: balance
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * GET /api/v1/currency/transactions
 * Histórico de transações
 */
router.get('/transactions', async (c) => {
  try {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Não autorizado' }, 401)
    }

    const limit = parseInt(c.req.query('limit') || '50')
    const transactions = await CurrencyService.getTransactionHistory(user.id, limit)

    return c.json({
      success: true,
      data: transactions
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * POST /api/v1/currency/daily-reward
 * Reivindicar recompensa diária
 */
router.post('/daily-reward', async (c) => {
  try {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Não autorizado' }, 401)
    }

    const reward = await CurrencyService.claimDailyReward(user.id)

    return c.json({
      success: true,
      data: reward
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * POST /api/v1/currency/watch-ad
 * Recompensa por assistir anúncio
 */
router.post('/watch-ad', async (c) => {
  try {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Não autorizado' }, 401)
    }

    const { adType } = await c.req.json()

    const newBalance = await CurrencyService.rewardAd(user.id, adType)

    return c.json({
      success: true,
      data: {
        balance: newBalance,
        reward: adType === 'rewarded' ? 10 : 5
      }
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * POST /api/v1/currency/convert
 * Converter gems para coins
 */
router.post('/convert', async (c) => {
  try {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Não autorizado' }, 401)
    }

    const { gemsAmount } = await c.req.json()

    if (!gemsAmount || gemsAmount <= 0) {
      return c.json({
        success: false,
        error: 'Quantidade de gems inválida'
      }, 400)
    }

    const newBalance = await CurrencyService.convertGemsToCoin(user.id, gemsAmount)

    return c.json({
      success: true,
      data: {
        balance: newBalance,
        converted: {
          gems: gemsAmount,
          coins: gemsAmount * 10
        }
      }
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * GET /api/v1/currency/stats
 * Estatísticas de economia do usuário
 */
router.get('/stats', async (c) => {
  try {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Não autorizado' }, 401)
    }

    const stats = await CurrencyService.getUserEconomyStats(user.id)

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
