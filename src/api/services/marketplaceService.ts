/**
 * Marketplace Service
 * Sistema de mercado P2P para compra/venda de cosméticos entre players
 */

import { supabase } from '../../../config/supabase'
import { CurrencyService } from './currencyService'

const MARKETPLACE_FEE = 0.05 // 5% taxa

interface MarketplaceListing {
  id: string
  seller_id: string
  cosmetic_id: string
  price_coins: number
  price_gems: number
  status: 'active' | 'sold' | 'cancelled' | 'expired'
  buyer_id?: string
  sold_at?: string
  expires_at: string
  created_at: string
}

export class MarketplaceService {
  /**
   * Criar listing (vender cosmético)
   */
  static async createListing(
    userId: string,
    cosmeticId: string,
    priceCoins?: number,
    priceGems?: number
  ): Promise<MarketplaceListing> {
    // Validar preço
    if (!priceCoins && !priceGems) {
      throw new Error('Defina um preço em coins ou gems')
    }

    if ((priceCoins && priceCoins < 0) || (priceGems && priceGems < 0)) {
      throw new Error('Preço deve ser positivo')
    }

    // Verificar se usuário possui o cosmético
    const { data: ownership } = await supabase
      .from('user_cosmetics')
      .select('*')
      .eq('user_id', userId)
      .eq('cosmetic_id', cosmeticId)
      .maybeSingle()

    if (!ownership) {
      throw new Error('Você não possui este cosmético')
    }

    // Verificar se já existe listing ativo
    const { data: existingListing } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('seller_id', userId)
      .eq('cosmetic_id', cosmeticId)
      .eq('status', 'active')
      .maybeSingle()

    if (existingListing) {
      throw new Error('Você já tem um anúncio ativo para este cosmético')
    }

    // Criar listing
    const { data: listing, error } = await supabase
      .from('marketplace_listings')
      .insert({
        seller_id: userId,
        cosmetic_id: cosmeticId,
        price_coins: priceCoins || 0,
        price_gems: priceGems || 0
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar anúncio: ${error.message}`)

    return listing
  }

  /**
   * Listar anúncios ativos
   */
  static async getActiveListings(options: {
    cosmeticRarity?: string
    minPrice?: number
    maxPrice?: number
    sortBy?: 'price_asc' | 'price_desc' | 'created_at'
    limit?: number
    offset?: number
  }): Promise<Array<MarketplaceListing & { cosmetic: any; seller: any }>> {
    let query = supabase
      .from('marketplace_listings')
      .select(`
        *,
        cosmetic:cosmetics(*),
        seller:users!marketplace_listings_seller_id_fkey(id, username, avatar_url)
      `)
      .eq('status', 'active')

    // Filtros
    if (options.minPrice) {
      query = query.or(`price_coins.gte.${options.minPrice},price_gems.gte.${options.minPrice}`)
    }

    if (options.maxPrice) {
      query = query.or(`price_coins.lte.${options.maxPrice},price_gems.lte.${options.maxPrice}`)
    }

    // Sort
    if (options.sortBy === 'price_asc') {
      query = query.order('price_coins', { ascending: true })
    } else if (options.sortBy === 'price_desc') {
      query = query.order('price_coins', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    if (options.limit) {
      query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1)
    }

    const { data, error } = await query

    if (error) throw new Error(`Erro ao buscar anúncios: ${error.message}`)

    return data as any || []
  }

  /**
   * Comprar cosmético do marketplace
   */
  static async purchaseListing(userId: string, listingId: string): Promise<void> {
    // Buscar listing
    const { data: listing } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('id', listingId)
      .eq('status', 'active')
      .single()

    if (!listing) {
      throw new Error('Anúncio não encontrado ou já vendido')
    }

    if (listing.seller_id === userId) {
      throw new Error('Você não pode comprar seu próprio anúncio')
    }

    // Verificar saldo
    if (listing.price_coins > 0) {
      const canAfford = await CurrencyService.canAfford(userId, 'coins', listing.price_coins)
      if (!canAfford) throw new Error('Coins insuficientes')
    }

    if (listing.price_gems > 0) {
      const canAfford = await CurrencyService.canAfford(userId, 'gems', listing.price_gems)
      if (!canAfford) throw new Error('Gems insuficientes')
    }

    // Calcular taxas (5%)
    const feeCoins = Math.floor(listing.price_coins * MARKETPLACE_FEE)
    const feeGems = Math.floor(listing.price_gems * MARKETPLACE_FEE)

    const sellerReceivesCoins = listing.price_coins - feeCoins
    const sellerReceivesGems = listing.price_gems - feeGems

    // Debitar do comprador
    if (listing.price_coins > 0) {
      await CurrencyService.spendCurrency(
        userId,
        'coins',
        listing.price_coins,
        `marketplace_purchase_${listingId}`
      )
    }

    if (listing.price_gems > 0) {
      await CurrencyService.spendCurrency(
        userId,
        'gems',
        listing.price_gems,
        `marketplace_purchase_${listingId}`
      )
    }

    // Creditar ao vendedor (com taxa deduzida)
    if (sellerReceivesCoins > 0) {
      await CurrencyService.addCurrency(
        listing.seller_id,
        'coins',
        sellerReceivesCoins,
        `marketplace_sale_${listingId}`
      )
    }

    if (sellerReceivesGems > 0) {
      await CurrencyService.addCurrency(
        listing.seller_id,
        'gems',
        sellerReceivesGems,
        `marketplace_sale_${listingId}`
      )
    }

    // Transferir cosmético
    await supabase
      .from('user_cosmetics')
      .delete()
      .eq('user_id', listing.seller_id)
      .eq('cosmetic_id', listing.cosmetic_id)

    await supabase.from('user_cosmetics').insert({
      user_id: userId,
      cosmetic_id: listing.cosmetic_id,
      acquired_from: 'marketplace',
      acquired_at: new Date().toISOString()
    })

    // Atualizar listing
    await supabase
      .from('marketplace_listings')
      .update({
        status: 'sold',
        buyer_id: userId,
        sold_at: new Date().toISOString()
      })
      .eq('id', listingId)

    // Registrar transação
    await supabase.from('marketplace_transactions').insert({
      listing_id: listingId,
      seller_id: listing.seller_id,
      buyer_id: userId,
      cosmetic_id: listing.cosmetic_id,
      price_coins: listing.price_coins,
      price_gems: listing.price_gems,
      fee_coins: feeCoins,
      fee_gems: feeGems,
      seller_receives_coins: sellerReceivesCoins,
      seller_receives_gems: sellerReceivesGems
    })
  }

  /**
   * Cancelar listing
   */
  static async cancelListing(userId: string, listingId: string): Promise<void> {
    const { data: listing } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('id', listingId)
      .eq('seller_id', userId)
      .single()

    if (!listing) {
      throw new Error('Anúncio não encontrado')
    }

    if (listing.status !== 'active') {
      throw new Error('Apenas anúncios ativos podem ser cancelados')
    }

    await supabase
      .from('marketplace_listings')
      .update({ status: 'cancelled' })
      .eq('id', listingId)
  }

  /**
   * Fazer oferta em um listing
   */
  static async makeOffer(
    userId: string,
    listingId: string,
    offerCoins?: number,
    offerGems?: number,
    message?: string
  ): Promise<void> {
    if (!offerCoins && !offerGems) {
      throw new Error('Defina um valor para a oferta')
    }

    // Verificar listing
    const { data: listing } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('id', listingId)
      .eq('status', 'active')
      .single()

    if (!listing) throw new Error('Anúncio não encontrado')
    if (listing.seller_id === userId) throw new Error('Você não pode fazer oferta em seu próprio anúncio')

    // Criar oferta
    await supabase.from('marketplace_offers').insert({
      listing_id: listingId,
      buyer_id: userId,
      offer_coins: offerCoins || 0,
      offer_gems: offerGems || 0,
      message
    })
  }

  /**
   * Aceitar oferta
   */
  static async acceptOffer(sellerId: string, offerId: string): Promise<void> {
    // Buscar oferta
    const { data: offer } = await supabase
      .from('marketplace_offers')
      .select(`
        *,
        listing:marketplace_listings(*)
      `)
      .eq('id', offerId)
      .eq('status', 'pending')
      .single()

    if (!offer) throw new Error('Oferta não encontrada')

    const listing = (offer as any).listing

    if (listing.seller_id !== sellerId) {
      throw new Error('Você não é o vendedor deste anúncio')
    }

    // Processar como compra normal mas com valores da oferta
    await this.purchaseListingWithCustomPrice(
      offer.buyer_id,
      listing.id,
      offer.offer_coins,
      offer.offer_gems
    )

    // Marcar oferta como aceita
    await supabase
      .from('marketplace_offers')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString()
      })
      .eq('id', offerId)
  }

  /**
   * Compra com preço customizado (para ofertas)
   */
  private static async purchaseListingWithCustomPrice(
    buyerId: string,
    listingId: string,
    priceCoins: number,
    priceGems: number
  ): Promise<void> {
    // Similar a purchaseListing mas com preço da oferta
    const { data: listing } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('id', listingId)
      .single()

    if (!listing) throw new Error('Listing não encontrado')

    // Verificar saldo
    if (priceCoins > 0) {
      const canAfford = await CurrencyService.canAfford(buyerId, 'coins', priceCoins)
      if (!canAfford) throw new Error('Comprador não tem coins suficientes')
    }

    if (priceGems > 0) {
      const canAfford = await CurrencyService.canAfford(buyerId, 'gems', priceGems)
      if (!canAfford) throw new Error('Comprador não tem gems suficientes')
    }

    const feeCoins = Math.floor(priceCoins * MARKETPLACE_FEE)
    const feeGems = Math.floor(priceGems * MARKETPLACE_FEE)

    // Processar pagamento
    if (priceCoins > 0) {
      await CurrencyService.spendCurrency(buyerId, 'coins', priceCoins, `marketplace_offer_${listingId}`)
      await CurrencyService.addCurrency(listing.seller_id, 'coins', priceCoins - feeCoins, `marketplace_sale_${listingId}`)
    }

    if (priceGems > 0) {
      await CurrencyService.spendCurrency(buyerId, 'gems', priceGems, `marketplace_offer_${listingId}`)
      await CurrencyService.addCurrency(listing.seller_id, 'gems', priceGems - feeGems, `marketplace_sale_${listingId}`)
    }

    // Transferir cosmético
    await supabase.from('user_cosmetics').delete().eq('user_id', listing.seller_id).eq('cosmetic_id', listing.cosmetic_id)
    await supabase.from('user_cosmetics').insert({
      user_id: buyerId,
      cosmetic_id: listing.cosmetic_id,
      acquired_from: 'marketplace'
    })

    // Atualizar listing
    await supabase.from('marketplace_listings').update({
      status: 'sold',
      buyer_id: buyerId,
      sold_at: new Date().toISOString()
    }).eq('id', listingId)

    // Registrar transação
    await supabase.from('marketplace_transactions').insert({
      listing_id: listingId,
      seller_id: listing.seller_id,
      buyer_id: buyerId,
      cosmetic_id: listing.cosmetic_id,
      price_coins: priceCoins,
      price_gems: priceGems,
      fee_coins: feeCoins,
      fee_gems: feeGems,
      seller_receives_coins: priceCoins - feeCoins,
      seller_receives_gems: priceGems - feeGems
    })
  }

  /**
   * Obter estatísticas do marketplace
   */
  static async getStats(): Promise<{
    totalListings: number
    totalSales: number
    totalVolume: { coins: number; gems: number }
  }> {
    const { count: totalListings } = await supabase
      .from('marketplace_listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    const { data: transactions } = await supabase
      .from('marketplace_transactions')
      .select('price_coins, price_gems')

    const totalSales = transactions?.length || 0
    const totalVolume = transactions?.reduce(
      (acc, t) => ({
        coins: acc.coins + t.price_coins,
        gems: acc.gems + t.price_gems
      }),
      { coins: 0, gems: 0 }
    ) || { coins: 0, gems: 0 }

    return {
      totalListings: totalListings || 0,
      totalSales,
      totalVolume
    }
  }
}
