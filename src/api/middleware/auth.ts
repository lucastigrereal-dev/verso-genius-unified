import { Context, Next } from 'hono'
import { supabase } from '../../../config/supabase'

/**
 * Middleware de autenticação usando Supabase
 * Valida o token JWT do Supabase e injeta o usuário no contexto
 */
export async function supabaseAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    // Valida token com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return c.json({ error: 'Invalid or expired token' }, 401)
    }

    // Busca perfil completo do usuário
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return c.json({ error: 'User profile not found' }, 404)
    }

    // Injeta usuário no contexto
    c.set('user', user)
    c.set('profile', profile)

    await next()
  } catch (err: any) {
    console.error('Auth middleware error:', err)
    return c.json({ error: 'Authentication failed' }, 401)
  }
}

/**
 * Middleware de autenticação opcional
 * Se o token existir, valida e injeta o usuário
 * Se não existir, continua sem autenticação
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    await next()
    return
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (!error && user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        c.set('user', user)
        c.set('profile', profile)
      }
    }
  } catch (err) {
    // Silently fail for optional auth
    console.warn('Optional auth failed:', err)
  }

  await next()
}

/**
 * Middleware de verificação de role
 */
export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const profile = c.get('profile')

    if (!profile) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    if (!roles.includes(profile.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }

    await next()
  }
}
