/**
 * Shop Routes
 * API endpoints for shop (cosmetics, loot boxes, products)
 */

import { Hono } from 'hono'
import { ShopService } from '../services/shopService'

const router = new Hono()

/**
 * GET /api/v1/shop/cosmetics
 * Lista cosméticos disponíveis
 */
router.get('/cosmetics', async (c) => {
  try {
    const type = c.req.query('type')
    const rarity = c.req.query('rarity') as any

    const cosmetics = await ShopService.listCosmetics({ type, rarity })

    return c.json({
      success: true,
      data: cosmetics
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * POST /api/v1/shop/cosmetics/:id/purchase
 * Compra um cosmético
 */
router.post('/cosmetics/:id/purchase', async (c) => {
  try {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Não autorizado' }, 401)
    }

    const cosmeticId = c.req.param('id')
    const result = await ShopService.purchaseCosmetic(user.id, cosmeticId)

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
 * POST /api/v1/shop/cosmetics/:id/equip
 * Equipar/desequipar cosmético
 */
router.post('/cosmetics/:id/equip', async (c) => {
  try {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Não autorizado' }, 401)
    }

    const cosmeticId = c.req.param('id')
    const { equip } = await c.req.json()

    await ShopService.equipCosmetic(user.id, cosmeticId, equip)

    return c.json({
      success: true,
      message: equip ? 'Cosmético equipado' : 'Cosmético desequipado'
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 400)
  }
})

/**
 * GET /api/v1/shop/loot-boxes
 * Lista loot boxes disponíveis
 */
router.get('/loot-boxes', async (c) => {
  try {
    const lootBoxes = await ShopService.listLootBoxes()

    return c.json({
      success: true,
      data: lootBoxes
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * POST /api/v1/shop/loot-boxes/:id/open
 * Abrir loot box
 */
router.post('/loot-boxes/:id/open', async (c) => {
  try {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Não autorizado' }, 401)
    }

    const lootBoxId = c.req.param('id')
    const result = await ShopService.openLootBox(user.id, lootBoxId)

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
 * GET /api/v1/shop/products
 * Lista produtos da loja (gems, assinaturas)
 */
router.get('/products', async (c) => {
  try {
    const products = await ShopService.getShopProducts()

    return c.json({
      success: true,
      data: products
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default router
