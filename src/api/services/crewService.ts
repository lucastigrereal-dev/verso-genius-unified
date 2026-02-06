/**
 * Crew Service
 * Sistema de grupos/equipes para competição colaborativa
 */

import { supabase } from '../../../config/supabase'
import { redis } from '../../../config/redis'

interface Crew {
  id: string
  name: string
  description: string
  tag: string
  avatar_url?: string
  leader_id: string
  total_members: number
  total_xp: number
  level: number
  is_public: boolean
  require_approval: boolean
  min_level_to_join: number
  created_at: string
  updated_at: string
}

interface CrewMember {
  id: string
  crew_id: string
  user_id: string
  role: 'leader' | 'officer' | 'member'
  xp_contributed: number
  joined_at: string
}

interface CrewInvite {
  id: string
  crew_id: string
  user_id: string
  invited_by: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expires_at: string
  created_at: string
}

export class CrewService {
  private static CACHE_TTL = 300 // 5 minutos

  /**
   * Criar novo crew
   */
  static async createCrew(
    userId: string,
    data: {
      name: string
      description?: string
      tag?: string
      avatar_url?: string
      is_public?: boolean
      require_approval?: boolean
      min_level_to_join?: number
    }
  ): Promise<Crew> {
    // Verificar se usuário já está em um crew
    const { data: existingMembership } = await supabase
      .from('crew_members')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingMembership) {
      throw new Error('Você já está em um crew. Saia do crew atual primeiro.')
    }

    // Criar crew
    const { data: crew, error: crewError } = await supabase
      .from('crews')
      .insert({
        name: data.name,
        description: data.description,
        tag: data.tag,
        avatar_url: data.avatar_url,
        leader_id: userId,
        is_public: data.is_public !== undefined ? data.is_public : true,
        require_approval: data.require_approval || false,
        min_level_to_join: data.min_level_to_join || 1
      })
      .select()
      .single()

    if (crewError) throw new Error(`Erro ao criar crew: ${crewError.message}`)

    // Adicionar criador como membro (leader)
    await supabase.from('crew_members').insert({
      crew_id: crew.id,
      user_id: userId,
      role: 'leader'
    })

    return crew
  }

  /**
   * Obter crew por ID
   */
  static async getCrew(crewId: string): Promise<Crew | null> {
    const { data, error } = await supabase
      .from('crews')
      .select('*')
      .eq('id', crewId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Erro ao buscar crew: ${error.message}`)
    }

    return data
  }

  /**
   * Listar crews (com filtros)
   */
  static async listCrews(options: {
    search?: string
    sortBy?: 'level' | 'total_xp' | 'total_members' | 'created_at'
    limit?: number
    offset?: number
  }): Promise<Crew[]> {
    let query = supabase
      .from('crews')
      .select('*')
      .eq('is_public', true)

    if (options.search) {
      query = query.or(`name.ilike.%${options.search}%,tag.ilike.%${options.search}%`)
    }

    const sortColumn = options.sortBy || 'total_xp'
    query = query.order(sortColumn, { ascending: false })

    if (options.limit) {
      query = query.range(
        options.offset || 0,
        (options.offset || 0) + options.limit - 1
      )
    }

    const { data, error } = await query

    if (error) throw new Error(`Erro ao listar crews: ${error.message}`)

    return data || []
  }

  /**
   * Obter membros do crew
   */
  static async getCrewMembers(crewId: string): Promise<
    Array<CrewMember & { user: any }>
  > {
    const { data, error } = await supabase
      .from('crew_members')
      .select(`
        *,
        user:users!crew_members_user_id_fkey(id, username, avatar_url, level, xp)
      `)
      .eq('crew_id', crewId)
      .order('xp_contributed', { ascending: false })

    if (error) throw new Error(`Erro ao buscar membros: ${error.message}`)

    return data as any || []
  }

  /**
   * Convidar usuário para crew
   */
  static async inviteUser(
    crewId: string,
    inviterId: string,
    targetUserId: string
  ): Promise<CrewInvite> {
    // Verificar permissão (leader ou officer)
    const { data: inviterMembership } = await supabase
      .from('crew_members')
      .select('role')
      .eq('crew_id', crewId)
      .eq('user_id', inviterId)
      .single()

    if (!inviterMembership || inviterMembership.role === 'member') {
      throw new Error('Apenas leaders e officers podem convidar membros')
    }

    // Verificar se usuário já está em um crew
    const { data: targetMembership } = await supabase
      .from('crew_members')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (targetMembership) {
      throw new Error('Usuário já está em outro crew')
    }

    // Verificar se já existe convite pendente
    const { data: existingInvite } = await supabase
      .from('crew_invites')
      .select('*')
      .eq('crew_id', crewId)
      .eq('user_id', targetUserId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingInvite) {
      throw new Error('Convite já enviado para este usuário')
    }

    // Criar convite
    const { data: invite, error } = await supabase
      .from('crew_invites')
      .insert({
        crew_id: crewId,
        user_id: targetUserId,
        invited_by: inviterId
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar convite: ${error.message}`)

    return invite
  }

  /**
   * Aceitar convite
   */
  static async acceptInvite(inviteId: string, userId: string): Promise<void> {
    // Buscar convite
    const { data: invite } = await supabase
      .from('crew_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single()

    if (!invite) {
      throw new Error('Convite não encontrado ou expirado')
    }

    // Verificar se usuário já está em crew
    const { data: existingMembership } = await supabase
      .from('crew_members')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingMembership) {
      throw new Error('Você já está em um crew')
    }

    // Verificar se crew não está cheio
    const crew = await this.getCrew(invite.crew_id)
    if (crew && crew.total_members >= 50) {
      throw new Error('Crew está cheio (máximo 50 membros)')
    }

    // Adicionar como membro
    await supabase.from('crew_members').insert({
      crew_id: invite.crew_id,
      user_id: userId,
      role: 'member'
    })

    // Atualizar convite
    await supabase
      .from('crew_invites')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString()
      })
      .eq('id', inviteId)

    // Atualizar contagem de membros
    await supabase
      .from('crews')
      .update({
        total_members: (crew?.total_members || 0) + 1
      })
      .eq('id', invite.crew_id)
  }

  /**
   * Sair do crew
   */
  static async leaveCrew(userId: string): Promise<void> {
    // Buscar membership
    const { data: membership } = await supabase
      .from('crew_members')
      .select('*, crew:crews(*)')
      .eq('user_id', userId)
      .single()

    if (!membership) {
      throw new Error('Você não está em um crew')
    }

    const crew = (membership as any).crew

    if (membership.role === 'leader') {
      // Leader não pode sair se houver outros membros
      if (crew.total_members > 1) {
        throw new Error('Transfira a liderança antes de sair')
      }

      // Se é o único membro, deletar o crew
      await supabase.from('crews').delete().eq('id', membership.crew_id)
    } else {
      // Remover membro
      await supabase
        .from('crew_members')
        .delete()
        .eq('id', membership.id)

      // Atualizar contagem
      await supabase
        .from('crews')
        .update({
          total_members: Math.max(0, crew.total_members - 1)
        })
        .eq('id', membership.crew_id)
    }
  }

  /**
   * Contribuir XP para o crew
   */
  static async contributeXP(userId: string, amount: number): Promise<void> {
    if (amount <= 0) throw new Error('Amount deve ser positivo')

    const { data: membership } = await supabase
      .from('crew_members')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (!membership) return // Usuário não está em crew

    // Atualizar XP contribuído
    await supabase
      .from('crew_members')
      .update({
        xp_contributed: membership.xp_contributed + amount
      })
      .eq('id', membership.id)

    // Trigger automático atualizará total_xp do crew
  }

  /**
   * Obter crew do usuário
   */
  static async getUserCrew(userId: string): Promise<
    | (Crew & {
        membership: CrewMember
        members: Array<CrewMember & { user: any }>
      })
    | null
  > {
    const { data: membership } = await supabase
      .from('crew_members')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (!membership) return null

    const crew = await this.getCrew(membership.crew_id)
    if (!crew) return null

    const members = await this.getCrewMembers(crew.id)

    return {
      ...crew,
      membership,
      members
    }
  }

  /**
   * Obter leaderboard de crews
   */
  static async getCrewLeaderboard(limit: number = 100): Promise<Crew[]> {
    const cacheKey = `crew_leaderboard:${limit}`

    // Tentar cache
    try {
      const cached = await redis.get(cacheKey)
      if (cached) return JSON.parse(cached)
    } catch (err) {
      console.error('Redis error:', err)
    }

    const crews = await this.listCrews({
      sortBy: 'total_xp',
      limit
    })

    // Salvar em cache
    try {
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(crews))
    } catch (err) {
      console.error('Redis error:', err)
    }

    return crews
  }

  /**
   * Enviar mensagem no chat do crew
   */
  static async sendChatMessage(
    userId: string,
    message: string
  ): Promise<void> {
    // Verificar se está em um crew
    const { data: membership } = await supabase
      .from('crew_members')
      .select('crew_id')
      .eq('user_id', userId)
      .single()

    if (!membership) {
      throw new Error('Você não está em um crew')
    }

    await supabase.from('crew_chat_messages').insert({
      crew_id: membership.crew_id,
      user_id: userId,
      message
    })
  }

  /**
   * Obter mensagens do chat
   */
  static async getChatMessages(
    crewId: string,
    limit: number = 50
  ): Promise<any[]> {
    const { data, error } = await supabase
      .from('crew_chat_messages')
      .select(`
        *,
        user:users!crew_chat_messages_user_id_fkey(id, username, avatar_url)
      `)
      .eq('crew_id', crewId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`Erro ao buscar mensagens: ${error.message}`)

    return (data || []).reverse()
  }

  /**
   * Promover/rebaixar membro
   */
  static async updateMemberRole(
    crewId: string,
    leaderId: string,
    targetUserId: string,
    newRole: 'officer' | 'member'
  ): Promise<void> {
    // Verificar se quem está promovendo é o leader
    const { data: leaderMembership } = await supabase
      .from('crew_members')
      .select('role')
      .eq('crew_id', crewId)
      .eq('user_id', leaderId)
      .single()

    if (!leaderMembership || leaderMembership.role !== 'leader') {
      throw new Error('Apenas o leader pode promover/rebaixar membros')
    }

    // Atualizar role
    await supabase
      .from('crew_members')
      .update({ role: newRole })
      .eq('crew_id', crewId)
      .eq('user_id', targetUserId)
  }

  /**
   * Transferir liderança
   */
  static async transferLeadership(
    crewId: string,
    currentLeaderId: string,
    newLeaderId: string
  ): Promise<void> {
    // Verificar se quem está transferindo é o leader atual
    const crew = await this.getCrew(crewId)
    if (!crew || crew.leader_id !== currentLeaderId) {
      throw new Error('Apenas o leader atual pode transferir liderança')
    }

    // Verificar se novo leader é membro
    const { data: newLeaderMembership } = await supabase
      .from('crew_members')
      .select('*')
      .eq('crew_id', crewId)
      .eq('user_id', newLeaderId)
      .single()

    if (!newLeaderMembership) {
      throw new Error('Usuário não é membro do crew')
    }

    // Atualizar crew
    await supabase
      .from('crews')
      .update({ leader_id: newLeaderId })
      .eq('id', crewId)

    // Atualizar roles
    await supabase
      .from('crew_members')
      .update({ role: 'member' })
      .eq('id', (await supabase.from('crew_members').select('id').eq('user_id', currentLeaderId).eq('crew_id', crewId).single()).data?.id)

    await supabase
      .from('crew_members')
      .update({ role: 'leader' })
      .eq('id', newLeaderMembership.id)
  }
}
