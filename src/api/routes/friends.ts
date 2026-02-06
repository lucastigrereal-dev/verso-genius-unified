/**
 * Friends Routes
 * Rotas do sistema de amizades
 */

import { Hono } from 'hono'
import { FriendsService } from '../services/friendsService'

const router = new Hono()

// Enviar pedido de amizade
router.post('/request', async (c) => {
  try {
    const userId = c.get('userId')
    const { username } = await c.req.json()

    await FriendsService.sendFriendRequest(userId, username)
    return c.json({ message: 'Pedido de amizade enviado' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Aceitar pedido
router.post('/accept/:requestId', async (c) => {
  try {
    const userId = c.get('userId')
    const requestId = c.req.param('requestId')

    await FriendsService.acceptFriendRequest(userId, requestId)
    return c.json({ message: 'Pedido aceito' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Recusar pedido
router.post('/decline/:requestId', async (c) => {
  try {
    const userId = c.get('userId')
    const requestId = c.req.param('requestId')

    await FriendsService.declineFriendRequest(userId, requestId)
    return c.json({ message: 'Pedido recusado' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Remover amigo
router.delete('/:friendId', async (c) => {
  try {
    const userId = c.get('userId')
    const friendId = c.req.param('friendId')

    await FriendsService.removeFriend(userId, friendId)
    return c.json({ message: 'Amigo removido' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Listar amigos
router.get('/', async (c) => {
  try {
    const userId = c.get('userId')
    const friends = await FriendsService.getFriends(userId)
    return c.json({ friends })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Listar pedidos pendentes
router.get('/requests', async (c) => {
  try {
    const userId = c.get('userId')
    const requests = await FriendsService.getPendingRequests(userId)
    return c.json({ requests })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Buscar usuários
router.get('/search', async (c) => {
  try {
    const userId = c.get('userId')
    const query = c.req.query('q') || ''
    const limit = parseInt(c.req.query('limit') || '20')

    const users = await FriendsService.searchUsers(query, userId, limit)
    return c.json({ users })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Activity feed
router.get('/feed', async (c) => {
  try {
    const userId = c.get('userId')
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')

    const activities = await FriendsService.getActivityFeed(userId, limit, offset)
    return c.json({ activities })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Enviar presente
router.post('/gift', async (c) => {
  try {
    const userId = c.get('userId')
    const { receiver_id, gift_type, gift_value, message } = await c.req.json()

    await FriendsService.sendGift(userId, receiver_id, gift_type, gift_value, message)
    return c.json({ message: 'Presente enviado' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Clamar presente
router.post('/gift/:giftId/claim', async (c) => {
  try {
    const userId = c.get('userId')
    const giftId = c.req.param('giftId')

    await FriendsService.claimGift(userId, giftId)
    return c.json({ message: 'Presente reivindicado' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Listar presentes pendentes
router.get('/gifts', async (c) => {
  try {
    const userId = c.get('userId')
    const gifts = await FriendsService.getPendingGifts(userId)
    return c.json({ gifts })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

export default router
