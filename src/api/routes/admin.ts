/**
 * Admin Routes
 * Rotas administrativas para gerenciar banners, eventos, NFTs, etc.
 */

import { Hono } from 'hono'
import { supabase } from '../../../config/supabase'

const router = new Hono()

// Middleware: Verificar se usuário é admin
const adminMiddleware = async (c: any, next: any) => {
  const userId = c.get('userId')

  // Buscar role do usuário
  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !user || user.role !== 'admin') {
    return c.json({ error: 'Acesso negado. Admin apenas.' }, 403)
  }

  await next()
}

// Aplicar middleware em todas as rotas
router.use('*', adminMiddleware)

// ========================================
// GACHA BANNERS
// ========================================

/**
 * POST /admin/gacha/banners
 * Criar novo banner de gacha
 */
router.post('/gacha/banners', async (c) => {
  try {
    const {
      name,
      description,
      banner_image_url,
      start_date,
      end_date,
      featured_cosmetic_ids,
      rate_up_multiplier,
      pity_threshold,
      guaranteed_rarity,
      cost_gems,
      multi_pull_discount,
      banner_type
    } = await c.req.json()

    const { data: banner, error } = await supabase
      .from('gacha_banners')
      .insert({
        name,
        description,
        banner_image_url,
        start_date,
        end_date,
        featured_cosmetic_ids: featured_cosmetic_ids || [],
        rate_up_multiplier: rate_up_multiplier || 2.0,
        pity_threshold: pity_threshold || 90,
        guaranteed_rarity: guaranteed_rarity || 'legendary',
        cost_gems: cost_gems || 100,
        multi_pull_discount: multi_pull_discount || 10,
        banner_type: banner_type || 'standard',
        is_active: true
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    return c.json({ message: 'Banner criado com sucesso', banner })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * PUT /admin/gacha/banners/:id
 * Atualizar banner existente
 */
router.put('/gacha/banners/:id', async (c) => {
  try {
    const bannerId = c.req.param('id')
    const updates = await c.req.json()

    const { data: banner, error } = await supabase
      .from('gacha_banners')
      .update(updates)
      .eq('id', bannerId)
      .select()
      .single()

    if (error) throw new Error(error.message)

    return c.json({ message: 'Banner atualizado com sucesso', banner })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * DELETE /admin/gacha/banners/:id
 * Desativar banner
 */
router.delete('/gacha/banners/:id', async (c) => {
  try {
    const bannerId = c.req.param('id')

    const { error } = await supabase
      .from('gacha_banners')
      .update({ is_active: false })
      .eq('id', bannerId)

    if (error) throw new Error(error.message)

    return c.json({ message: 'Banner desativado com sucesso' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// NFT COSMETICS
// ========================================

/**
 * POST /admin/nft/cosmetics
 * Marcar cosmético como mintável
 */
router.post('/nft/cosmetics', async (c) => {
  try {
    const {
      cosmetic_id,
      blockchain,
      contract_address,
      royalty_percentage,
      royalty_recipient,
      max_supply,
      min_rarity
    } = await c.req.json()

    const { data: nftCosmetic, error } = await supabase
      .from('nft_cosmetics')
      .insert({
        cosmetic_id,
        blockchain: blockchain || 'polygon',
        contract_address,
        royalty_percentage: royalty_percentage || 5.0,
        royalty_recipient,
        max_supply,
        min_rarity: min_rarity || 'epic',
        is_mintable: true
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    return c.json({ message: 'NFT cosmetic configurado com sucesso', nftCosmetic })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * PUT /admin/nft/cosmetics/:id
 * Atualizar NFT cosmetic
 */
router.put('/nft/cosmetics/:id', async (c) => {
  try {
    const nftCosmeticId = c.req.param('id')
    const updates = await c.req.json()

    const { data: nftCosmetic, error } = await supabase
      .from('nft_cosmetics')
      .update(updates)
      .eq('id', nftCosmeticId)
      .select()
      .single()

    if (error) throw new Error(error.message)

    return c.json({ message: 'NFT cosmetic atualizado com sucesso', nftCosmetic })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// EVENTOS
// ========================================

/**
 * POST /admin/events
 * Criar novo evento
 */
router.post('/events', async (c) => {
  try {
    const {
      name,
      description,
      event_type,
      start_date,
      end_date,
      reward_coins,
      reward_gems,
      reward_xp,
      reward_cosmetic_id,
      is_active
    } = await c.req.json()

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        name,
        description,
        event_type,
        start_date,
        end_date,
        reward_coins,
        reward_gems,
        reward_xp,
        reward_cosmetic_id,
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    return c.json({ message: 'Evento criado com sucesso', event })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * PUT /admin/events/:id
 * Atualizar evento
 */
router.put('/events/:id', async (c) => {
  try {
    const eventId = c.req.param('id')
    const updates = await c.req.json()

    const { data: event, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single()

    if (error) throw new Error(error.message)

    return c.json({ message: 'Evento atualizado com sucesso', event })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * DELETE /admin/events/:id
 * Finalizar evento
 */
router.delete('/events/:id', async (c) => {
  try {
    const eventId = c.req.param('id')

    const { error } = await supabase
      .from('events')
      .update({
        is_active: false,
        end_date: new Date().toISOString()
      })
      .eq('id', eventId)

    if (error) throw new Error(error.message)

    return c.json({ message: 'Evento finalizado com sucesso' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// ESTATÍSTICAS
// ========================================

/**
 * GET /admin/stats/overview
 * Visão geral de estatísticas
 */
router.get('/stats/overview', async (c) => {
  try {
    // Total de usuários
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Usuários ativos (última semana)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const { count: activeUsers } = await supabase
      .from('user_streaks')
      .select('*', { count: 'exact', head: true })
      .gte('last_check_in', oneWeekAgo.toISOString())

    // Total de revenue (Stripe)
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')

    const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0

    // NFTs mintados
    const { count: nftsMinted } = await supabase
      .from('nft_mint_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    // Gacha pulls
    const { count: gachaPulls } = await supabase
      .from('gacha_pull_history')
      .select('*', { count: 'exact', head: true })

    // Crews ativas
    const { count: activeCrews } = await supabase
      .from('crews')
      .select('*', { count: 'exact', head: true })

    // Eventos ativos
    const now = new Date().toISOString()
    const { count: activeEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)

    return c.json({
      stats: {
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        total_revenue: totalRevenue,
        nfts_minted: nftsMinted || 0,
        gacha_pulls: gachaPulls || 0,
        active_crews: activeCrews || 0,
        active_events: activeEvents || 0
      }
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * GET /admin/stats/revenue
 * Estatísticas de receita
 */
router.get('/stats/revenue', async (c) => {
  try {
    // Revenue por dia (últimos 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: payments } = await supabase
      .from('payments')
      .select('amount, created_at')
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // Agrupar por dia
    const revenueByDay: Record<string, number> = {}
    payments?.forEach((payment) => {
      const date = new Date(payment.created_at).toISOString().split('T')[0]
      revenueByDay[date] = (revenueByDay[date] || 0) + payment.amount
    })

    return c.json({ revenue_by_day: revenueByDay })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// MODERAÇÃO
// ========================================

/**
 * GET /admin/crews
 * Listar todas as crews (moderação)
 */
router.get('/crews', async (c) => {
  try {
    const { data: crews, error } = await supabase
      .from('crews')
      .select(`
        *,
        leader:users!crews_leader_id_fkey(id, username, email),
        member_count:crew_members(count)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw new Error(error.message)

    return c.json({ crews: crews || [] })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * DELETE /admin/crews/:id
 * Deletar crew (moderação)
 */
router.delete('/crews/:id', async (c) => {
  try {
    const crewId = c.req.param('id')

    // Deletar crew (cascade deleta membros, invites, mensagens)
    const { error } = await supabase
      .from('crews')
      .delete()
      .eq('id', crewId)

    if (error) throw new Error(error.message)

    return c.json({ message: 'Crew deletada com sucesso' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * GET /admin/users/search
 * Buscar usuários (moderação)
 */
router.get('/users/search', async (c) => {
  try {
    const query = c.req.query('q') || ''
    const limit = parseInt(c.req.query('limit') || '50')

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, created_at, role')
      .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(error.message)

    return c.json({ users: users || [] })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * PUT /admin/users/:id/role
 * Atualizar role do usuário
 */
router.put('/users/:id/role', async (c) => {
  try {
    const userId = c.req.param('id')
    const { role } = await c.req.json()

    if (!['user', 'admin', 'moderator'].includes(role)) {
      return c.json({ error: 'Role inválido' }, 400)
    }

    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)

    if (error) throw new Error(error.message)

    return c.json({ message: 'Role atualizado com sucesso' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

export default router
