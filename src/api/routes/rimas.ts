/**
 * Rimas Routes
 *
 * Endpoints públicos para busca e acesso a rimas:
 * - GET/POST /api/public/rimas/search - Busca rimas
 * - GET /api/public/rimas/random - Rimas aleatórias
 * - GET /api/public/rimas/stats - Estatísticas
 * - GET /api/public/rimas/temas - Lista de temas
 * - GET /api/public/rimas/categorias - Lista de categorias
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { RimasService } from '../services/rimasService'

const router = new Hono()

// Validator para busca
const searchValidator = z.object({
  query: z.string().optional(),
  tema: z.string().optional(),
  categoria: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0)
})

/**
 * POST /api/public/rimas/search
 * Buscar rimas com filtros
 *
 * Body:
 * {
 *   "query": "amor",          // Busca full-text (opcional)
 *   "tema": "Historia",       // Filtrar por tema (opcional)
 *   "categoria": "Slam",      // Filtrar por categoria (opcional)
 *   "limit": 20,              // Max resultados (default 20, max 100)
 *   "offset": 0               // Paginação (default 0)
 * }
 */
router.post('/search', zValidator('json', searchValidator), async (c) => {
  try {
    const params = c.req.valid('json')

    const result = await RimasService.searchRimas({
      query: params.query,
      tema: params.tema,
      categoria: params.categoria,
      limit: params.limit,
      offset: params.offset
    })

    return c.json(result)
  } catch (error: any) {
    console.error('❌ Search error:', error)
    return c.json(
      {
        success: false,
        data: [],
        total: 0,
        error: error.message
      },
      500
    )
  }
})

/**
 * GET /api/public/rimas/search?query=amor&tema=Historia&limit=20&offset=0
 * Buscar rimas via GET
 */
router.get('/search', zValidator('query', searchValidator), async (c) => {
  try {
    const params = c.req.valid('query')

    const result = await RimasService.searchRimas({
      query: params.query,
      tema: params.tema,
      categoria: params.categoria,
      limit: params.limit,
      offset: params.offset
    })

    return c.json(result)
  } catch (error: any) {
    console.error('❌ Search error:', error)
    return c.json(
      {
        success: false,
        data: [],
        total: 0,
        error: error.message
      },
      500
    )
  }
})

/**
 * GET /api/public/rimas/:id
 * Obter rima específica por ID
 */
router.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    if (!id || id.length < 10) {
      return c.json(
        {
          success: false,
          data: null,
          error: 'Invalid ID'
        },
        400
      )
    }

    const rima = await RimasService.getRimaById(id)

    if (!rima) {
      return c.json(
        {
          success: false,
          data: null,
          error: 'Rima not found'
        },
        404
      )
    }

    return c.json({
      success: true,
      data: rima
    })
  } catch (error: any) {
    console.error('❌ Get rima error:', error)
    return c.json(
      {
        success: false,
        data: null,
        error: error.message
      },
      500
    )
  }
})

/**
 * GET /api/public/rimas/random?limit=10
 * Obter rimas aleatórias
 */
router.get('/random/:limit', async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.param('limit') || '10'), 100)

    const rimas = await RimasService.getRandomRimas(limit)

    return c.json({
      success: true,
      data: rimas,
      total: rimas.length
    })
  } catch (error: any) {
    console.error('❌ Random rimas error:', error)
    return c.json(
      {
        success: false,
        data: [],
        total: 0,
        error: error.message
      },
      500
    )
  }
})

/**
 * GET /api/public/rimas/stats
 * Obter estatísticas de rimas
 */
router.get('/stats', async (c) => {
  try {
    const stats = await RimasService.getStats()

    return c.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    console.error('❌ Stats error:', error)
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
 * GET /api/public/rimas/filters/temas
 * Obter lista de temas únicos
 */
router.get('/filters/temas', async (c) => {
  try {
    const temas = await RimasService.getTemas()

    return c.json({
      success: true,
      data: temas
    })
  } catch (error: any) {
    console.error('❌ Temas error:', error)
    return c.json(
      {
        success: false,
        data: [],
        error: error.message
      },
      500
    )
  }
})

/**
 * GET /api/public/rimas/filters/categorias
 * Obter lista de categorias únicas
 */
router.get('/filters/categorias', async (c) => {
  try {
    const categorias = await RimasService.getCategorias()

    return c.json({
      success: true,
      data: categorias
    })
  } catch (error: any) {
    console.error('❌ Categorias error:', error)
    return c.json(
      {
        success: false,
        data: [],
        error: error.message
      },
      500
    )
  }
})

export default router
