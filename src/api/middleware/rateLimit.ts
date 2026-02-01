import { Context, Next } from 'hono'
import { checkRateLimit } from '../../../config/redis'

/**
 * Rate limiting middleware usando Redis
 */
export function rateLimitMiddleware(options: {
  maxRequests: number
  windowMs: number
  identifier?: (c: Context) => string
}) {
  return async (c: Context, next: Next) => {
    const { maxRequests, windowMs, identifier } = options

    // Identificador padrão: user ID ou IP
    const id = identifier
      ? identifier(c)
      : c.get('profile')?.id || c.req.header('x-forwarded-for') || 'anonymous'

    try {
      const isLimited = await checkRateLimit(id, maxRequests, windowMs)

      if (isLimited) {
        return c.json(
          {
            error: 'Too many requests',
            message: `Rate limit exceeded. Max ${maxRequests} requests per ${windowMs / 1000}s`,
            retryAfter: Math.ceil(windowMs / 1000)
          },
          429
        )
      }

      // Adiciona headers de rate limit
      c.header('X-RateLimit-Limit', maxRequests.toString())
      c.header('X-RateLimit-Window', (windowMs / 1000).toString())

      await next()
    } catch (err) {
      console.error('Rate limit error:', err)
      // Se Redis falhar, permite a requisição (fail-open)
      await next()
    }
  }
}

/**
 * Rate limiters pré-configurados
 */

// Strict: Para endpoints críticos (auth, pagamentos)
export const strictRateLimit = rateLimitMiddleware({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000 // 15 minutos
})

// Moderate: Para endpoints normais
export const moderateRateLimit = rateLimitMiddleware({
  maxRequests: 300,
  windowMs: 15 * 60 * 1000
})

// Generous: Para leitura pública
export const generousRateLimit = rateLimitMiddleware({
  maxRequests: 1000,
  windowMs: 15 * 60 * 1000
})

// AI Generation: Limite especial para geração de rimas
export const aiGenerationRateLimit = rateLimitMiddleware({
  maxRequests: 50,
  windowMs: 60 * 60 * 1000 // 1 hora
})
