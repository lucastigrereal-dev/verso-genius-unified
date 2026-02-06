/**
 * Crews Routes
 */

import { Hono } from 'hono'
import { CrewService } from '../services/crewService'

const router = new Hono()

/**
 * GET /api/v1/crews
 * Listar crews (com filtros)
 */
router.get('/', async (c) => {
  try {
    const search = c.req.query('search')
    const sortBy = c.req.query('sortBy') as any
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')

    const crews = await CrewService.listCrews({
      search,
      sortBy,
      limit,
      offset
    })

    return c.json({
      success: true,
      data: crews
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
 * POST /api/v1/crews
 * Criar novo crew
 */
router.post('/', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const body = await c.req.json()
    const { name, description, tag, avatar_url, is_public, require_approval, min_level_to_join } =
      body

    if (!name || name.trim().length < 3) {
      return c.json(
        {
          success: false,
          error: 'Nome deve ter pelo menos 3 caracteres'
        },
        400
      )
    }

    const crew = await CrewService.createCrew(userId, {
      name,
      description,
      tag,
      avatar_url,
      is_public,
      require_approval,
      min_level_to_join
    })

    return c.json({
      success: true,
      data: crew,
      message: 'Crew criado com sucesso!'
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
 * GET /api/v1/crews/my
 * Obter crew do usuário
 */
router.get('/my', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const crew = await CrewService.getUserCrew(userId)

    return c.json({
      success: true,
      data: crew
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
 * GET /api/v1/crews/leaderboard
 * Obter leaderboard de crews
 */
router.get('/leaderboard', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100')

    const leaderboard = await CrewService.getCrewLeaderboard(limit)

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
 * GET /api/v1/crews/:id
 * Obter crew por ID
 */
router.get('/:id', async (c) => {
  try {
    const crewId = c.req.param('id')

    const crew = await CrewService.getCrew(crewId)

    if (!crew) {
      return c.json(
        {
          success: false,
          error: 'Crew não encontrado'
        },
        404
      )
    }

    return c.json({
      success: true,
      data: crew
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
 * GET /api/v1/crews/:id/members
 * Obter membros do crew
 */
router.get('/:id/members', async (c) => {
  try {
    const crewId = c.req.param('id')

    const members = await CrewService.getCrewMembers(crewId)

    return c.json({
      success: true,
      data: members
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
 * POST /api/v1/crews/:id/invite
 * Convidar usuário para crew
 */
router.post('/:id/invite', async (c) => {
  try {
    const profile = c.get('profile')
    const inviterId = profile.id
    const crewId = c.req.param('id')

    const body = await c.req.json()
    const { user_id } = body

    if (!user_id) {
      return c.json(
        {
          success: false,
          error: 'user_id é obrigatório'
        },
        400
      )
    }

    const invite = await CrewService.inviteUser(crewId, inviterId, user_id)

    return c.json({
      success: true,
      data: invite,
      message: 'Convite enviado!'
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
 * POST /api/v1/crews/invites/:id/accept
 * Aceitar convite
 */
router.post('/invites/:id/accept', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id
    const inviteId = c.req.param('id')

    await CrewService.acceptInvite(inviteId, userId)

    return c.json({
      success: true,
      message: 'Você entrou no crew!'
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
 * POST /api/v1/crews/leave
 * Sair do crew
 */
router.post('/leave', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    await CrewService.leaveCrew(userId)

    return c.json({
      success: true,
      message: 'Você saiu do crew'
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
 * GET /api/v1/crews/:id/chat
 * Obter mensagens do chat
 */
router.get('/:id/chat', async (c) => {
  try {
    const crewId = c.req.param('id')
    const limit = parseInt(c.req.query('limit') || '50')

    const messages = await CrewService.getChatMessages(crewId, limit)

    return c.json({
      success: true,
      data: messages
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
 * POST /api/v1/crews/chat
 * Enviar mensagem no chat
 */
router.post('/chat', async (c) => {
  try {
    const profile = c.get('profile')
    const userId = profile.id

    const body = await c.req.json()
    const { message } = body

    if (!message || message.trim().length === 0) {
      return c.json(
        {
          success: false,
          error: 'Mensagem vazia'
        },
        400
      )
    }

    await CrewService.sendChatMessage(userId, message)

    return c.json({
      success: true,
      message: 'Mensagem enviada'
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
 * POST /api/v1/crews/:id/promote
 * Promover/rebaixar membro
 */
router.post('/:id/promote', async (c) => {
  try {
    const profile = c.get('profile')
    const leaderId = profile.id
    const crewId = c.req.param('id')

    const body = await c.req.json()
    const { user_id, role } = body

    if (!user_id || !role) {
      return c.json(
        {
          success: false,
          error: 'user_id e role são obrigatórios'
        },
        400
      )
    }

    await CrewService.updateMemberRole(crewId, leaderId, user_id, role)

    return c.json({
      success: true,
      message: 'Role atualizado'
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
 * POST /api/v1/crews/:id/transfer-leadership
 * Transferir liderança
 */
router.post('/:id/transfer-leadership', async (c) => {
  try {
    const profile = c.get('profile')
    const currentLeaderId = profile.id
    const crewId = c.req.param('id')

    const body = await c.req.json()
    const { new_leader_id } = body

    if (!new_leader_id) {
      return c.json(
        {
          success: false,
          error: 'new_leader_id é obrigatório'
        },
        400
      )
    }

    await CrewService.transferLeadership(crewId, currentLeaderId, new_leader_id)

    return c.json({
      success: true,
      message: 'Liderança transferida'
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
