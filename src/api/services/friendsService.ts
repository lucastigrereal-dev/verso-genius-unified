/**
 * Friends Service
 * Sistema de amizades e activity feed
 */

import { supabase } from '../../../config/supabase'
import { CurrencyService } from './currencyService'

export class FriendsService {
  /**
   * Enviar pedido de amizade
   */
  static async sendFriendRequest(userId: string, friendUsername: string): Promise<void> {
    // Buscar usuário pelo username
    const { data: friend, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', friendUsername)
      .single()

    if (userError || !friend) {
      throw new Error('Usuário não encontrado')
    }

    if (friend.id === userId) {
      throw new Error('Você não pode adicionar a si mesmo')
    }

    // Verificar se já existe amizade
    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friend.id}),and(user_id.eq.${friend.id},friend_id.eq.${userId})`)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'accepted') {
        throw new Error('Vocês já são amigos')
      }
      if (existing.status === 'pending') {
        throw new Error('Pedido de amizade já enviado')
      }
      if (existing.status === 'blocked') {
        throw new Error('Não é possível adicionar este usuário')
      }
    }

    // Criar pedido
    await supabase.from('friendships').insert({
      user_id: userId,
      friend_id: friend.id,
      requested_by: userId,
      status: 'pending'
    })
  }

  /**
   * Aceitar pedido de amizade
   */
  static async acceptFriendRequest(userId: string, requestId: string): Promise<void> {
    const { data: request } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', requestId)
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .single()

    if (!request) {
      throw new Error('Pedido não encontrado')
    }

    // Aceitar (trigger cria amizade bidirecional)
    await supabase
      .from('friendships')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', requestId)
  }

  /**
   * Recusar pedido de amizade
   */
  static async declineFriendRequest(userId: string, requestId: string): Promise<void> {
    await supabase
      .from('friendships')
      .update({ status: 'declined' })
      .eq('id', requestId)
      .eq('friend_id', userId)
      .eq('status', 'pending')
  }

  /**
   * Remover amigo
   */
  static async removeFriend(userId: string, friendId: string): Promise<void> {
    // Deletar ambas as direções da amizade
    await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
  }

  /**
   * Listar amigos
   */
  static async getFriends(userId: string) {
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select(`
        id,
        friend_id,
        created_at,
        accepted_at,
        friend:users!friendships_friend_id_fkey(id, username, avatar_url, level, xp)
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .order('accepted_at', { ascending: false })

    if (error) throw new Error(error.message)

    return friendships || []
  }

  /**
   * Listar pedidos pendentes
   */
  static async getPendingRequests(userId: string) {
    const { data: requests, error } = await supabase
      .from('friendships')
      .select(`
        id,
        user_id,
        created_at,
        requester:users!friendships_user_id_fkey(id, username, avatar_url, level)
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    return requests || []
  }

  /**
   * Buscar usuários para adicionar
   */
  static async searchUsers(query: string, currentUserId: string, limit: number = 20) {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, avatar_url, level, xp')
      .ilike('username', `%${query}%`)
      .neq('id', currentUserId)
      .limit(limit)

    if (error) throw new Error(error.message)

    // Para cada usuário, verificar se já é amigo
    const usersWithStatus = await Promise.all(
      (users || []).map(async (user) => {
        const { data: friendship } = await supabase
          .from('friendships')
          .select('status')
          .or(
            `and(user_id.eq.${currentUserId},friend_id.eq.${user.id}),and(user_id.eq.${user.id},friend_id.eq.${currentUserId})`
          )
          .maybeSingle()

        return {
          ...user,
          friendship_status: friendship?.status || 'none'
        }
      })
    )

    return usersWithStatus
  }

  /**
   * Postar atividade no feed
   */
  static async postActivity(
    userId: string,
    activityType: string,
    activityData: Record<string, any>,
    isPublic: boolean = true
  ): Promise<void> {
    await supabase.from('activity_feed').insert({
      user_id: userId,
      activity_type: activityType,
      activity_data: activityData,
      is_public: isPublic
    })
  }

  /**
   * Obter feed de atividades (próprias + amigos)
   */
  static async getActivityFeed(userId: string, limit: number = 50, offset: number = 0) {
    const { data: activities, error } = await supabase
      .from('activity_feed')
      .select(`
        *,
        user:users(id, username, avatar_url, level)
      `)
      .or(
        `user_id.eq.${userId},and(is_public.eq.true,user_id.in.(SELECT friend_id FROM friendships WHERE user_id='${userId}' AND status='accepted'))`
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(error.message)

    return activities || []
  }

  /**
   * Enviar presente para amigo
   */
  static async sendGift(
    senderId: string,
    receiverId: string,
    giftType: 'coins' | 'gems' | 'xp',
    giftValue: number,
    message?: string
  ): Promise<void> {
    // Verificar se são amigos
    const { data: friendship } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${senderId},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${senderId})`)
      .eq('status', 'accepted')
      .maybeSingle()

    if (!friendship) {
      throw new Error('Você só pode enviar presentes para amigos')
    }

    // Verificar saldo do sender
    if (giftType === 'coins') {
      const canAfford = await CurrencyService.canAfford(senderId, 'coins', giftValue)
      if (!canAfford) throw new Error('Coins insuficientes')

      await CurrencyService.spendCurrency(senderId, 'coins', giftValue, `gift_to_${receiverId}`)
    } else if (giftType === 'gems') {
      const canAfford = await CurrencyService.canAfford(senderId, 'gems', giftValue)
      if (!canAfford) throw new Error('Gems insuficientes')

      await CurrencyService.spendCurrency(senderId, 'gems', giftValue, `gift_to_${receiverId}`)
    }

    // Criar gift
    await supabase.from('friend_gifts').insert({
      sender_id: senderId,
      receiver_id: receiverId,
      gift_type: giftType,
      gift_value: giftValue,
      message,
      status: 'pending'
    })

    // Postar atividade
    await this.postActivity(senderId, 'gift_sent', {
      receiver_id: receiverId,
      gift_type: giftType,
      gift_value: giftValue
    })
  }

  /**
   * Clamar presente
   */
  static async claimGift(userId: string, giftId: string): Promise<void> {
    const { data: gift } = await supabase
      .from('friend_gifts')
      .select('*')
      .eq('id', giftId)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .single()

    if (!gift) {
      throw new Error('Presente não encontrado ou já foi reivindicado')
    }

    // Dar recompensa
    if (gift.gift_type === 'coins') {
      await CurrencyService.addCurrency(userId, 'coins', gift.gift_value, `gift_from_${gift.sender_id}`)
    } else if (gift.gift_type === 'gems') {
      await CurrencyService.addCurrency(userId, 'gems', gift.gift_value, `gift_from_${gift.sender_id}`)
    }
    // XP seria através de outro service

    // Marcar como claimed
    await supabase
      .from('friend_gifts')
      .update({ status: 'claimed', claimed_at: new Date().toISOString() })
      .eq('id', giftId)
  }

  /**
   * Listar presentes pendentes
   */
  static async getPendingGifts(userId: string) {
    const { data: gifts, error } = await supabase
      .from('friend_gifts')
      .select(`
        *,
        sender:users!friend_gifts_sender_id_fkey(id, username, avatar_url)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    return gifts || []
  }
}
