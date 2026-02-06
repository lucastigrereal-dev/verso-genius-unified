/**
 * Gacha Routes
 * Rotas do sistema avançado de gacha
 */

import { Hono } from 'hono'
import { GachaService } from '../services/gachaService'

const router = new Hono()

/**
 * GET /gacha/banners
 * Listar banners ativos
 */
router.get('/banners', async (c) => {
  try {
    const banners = await GachaService.getActiveBanners()
    return c.json({ banners })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * GET /gacha/banners/:id
 * Obter detalhes de um banner
 */
router.get('/banners/:id', async (c) => {
  try {
    const bannerId = c.req.param('id')
    const banner = await GachaService.getBannerById(bannerId)
    return c.json({ banner })
  } catch (error: any) {
    return c.json({ error: error.message }, 404)
  }
})

/**
 * GET /gacha/banners/:id/stats
 * Estatísticas do banner
 */
router.get('/banners/:id/stats', async (c) => {
  try {
    const bannerId = c.req.param('id')
    const stats = await GachaService.getBannerStats(bannerId)
    return c.json({ stats })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * GET /gacha/pity/:bannerId
 * Obter status de pity do usuário
 */
router.get('/pity/:bannerId', async (c) => {
  try {
    const userId = c.get('userId')
    const bannerId = c.req.param('bannerId')

    const pity = await GachaService.getPityStatus(userId, bannerId)
    return c.json({ pity })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * POST /gacha/pull/single
 * Fazer um pull único
 * Body: { banner_id: string }
 */
router.post('/pull/single', async (c) => {
  try {
    const userId = c.get('userId')
    const { banner_id } = await c.req.json()

    if (!banner_id) {
      return c.json({ error: 'banner_id é obrigatório' }, 400)
    }

    const result = await GachaService.pullSingle(userId, banner_id)
    return c.json({ result })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * POST /gacha/pull/multi
 * Fazer um 10-pull
 * Body: { banner_id: string }
 */
router.post('/pull/multi', async (c) => {
  try {
    const userId = c.get('userId')
    const { banner_id } = await c.req.json()

    if (!banner_id) {
      return c.json({ error: 'banner_id é obrigatório' }, 400)
    }

    const results = await GachaService.pullMulti(userId, banner_id)
    return c.json({ results })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * GET /gacha/history
 * Obter histórico de pulls do usuário
 * Query: ?banner_id=xxx&limit=50&offset=0
 */
router.get('/history', async (c) => {
  try {
    const userId = c.get('userId')
    const bannerId = c.req.query('banner_id')
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')

    const history = await GachaService.getPullHistory(userId, bannerId, limit, offset)
    return c.json({ history })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * GET /gacha/spark-shop/:bannerId
 * Listar cosméticos disponíveis para troca por sparks
 */
router.get('/spark-shop/:bannerId', async (c) => {
  try {
    const bannerId = c.req.param('bannerId')
    const items = await GachaService.getSparkShop(bannerId)
    return c.json({ items })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * POST /gacha/spark-exchange
 * Trocar sparks por cosmético garantido
 * Body: { banner_id: string, cosmetic_id: string }
 */
router.post('/spark-exchange', async (c) => {
  try {
    const userId = c.get('userId')
    const { banner_id, cosmetic_id } = await c.req.json()

    if (!banner_id || !cosmetic_id) {
      return c.json({ error: 'banner_id e cosmetic_id são obrigatórios' }, 400)
    }

    await GachaService.exchangeSparkForCosmetic(userId, banner_id, cosmetic_id)
    return c.json({ message: 'Spark exchange realizado com sucesso' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

export default router
