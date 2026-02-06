/**
 * NFT Service
 * Sistema de NFTs - mint cosméticos raros como NFTs na blockchain (Polygon)
 */

import { supabase } from '../../../config/supabase'
import { CurrencyService } from './currencyService'
import { ethers } from 'ethers'

// Configuração Polygon (Mumbai testnet)
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY'
const CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || '0x...' // Deploy do smart contract
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY // Wallet para mintar (server-side)

// Custo de mint (em coins/gems)
const MINT_COST_COINS = 1000
const MINT_COST_GEMS = 50

interface NFTCosmetic {
  id: string
  cosmetic_id: string
  blockchain: string
  contract_address: string
  royalty_percentage: number
  is_mintable: boolean
  max_supply: number | null
  current_supply: number
}

interface MintRequest {
  id: string
  user_id: string
  nft_cosmetic_id: string
  wallet_address: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  transaction_hash?: string
}

export class NFTService {
  /**
   * Listar cosméticos mintáveis como NFT
   */
  static async getMintableNFTs(): Promise<NFTCosmetic[]> {
    const { data, error } = await supabase
      .from('nft_cosmetics')
      .select(`
        *,
        cosmetic:cosmetics(*)
      `)
      .eq('is_mintable', true)

    if (error) throw new Error(`Erro ao buscar NFTs mintáveis: ${error.message}`)

    // Filtrar por supply
    return (data || []).filter((nft: any) => {
      if (nft.max_supply === null) return true // Ilimitado
      return nft.current_supply < nft.max_supply
    })
  }

  /**
   * Verificar se usuário possui o cosmético e pode mintar
   */
  static async canMint(userId: string, nftCosmeticId: string): Promise<boolean> {
    // Buscar NFT cosmetic
    const { data: nftCosmetic } = await supabase
      .from('nft_cosmetics')
      .select('*, cosmetic:cosmetics(*)')
      .eq('id', nftCosmeticId)
      .single()

    if (!nftCosmetic) return false
    if (!nftCosmetic.is_mintable) return false

    // Verificar supply
    if (nftCosmetic.max_supply !== null && nftCosmetic.current_supply >= nftCosmetic.max_supply) {
      return false
    }

    // Verificar se usuário possui o cosmético
    const { data: ownership } = await supabase
      .from('user_cosmetics')
      .select('*')
      .eq('user_id', userId)
      .eq('cosmetic_id', nftCosmetic.cosmetic_id)
      .maybeSingle()

    if (!ownership) return false

    // Verificar se já mintou este cosmético
    const { data: existingMint } = await supabase
      .from('nft_mint_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('nft_cosmetic_id', nftCosmeticId)
      .in('status', ['completed', 'processing'])
      .maybeSingle()

    if (existingMint) return false // Já mintou

    return true
  }

  /**
   * Criar requisição de mint
   */
  static async createMintRequest(
    userId: string,
    nftCosmeticId: string,
    walletAddress: string
  ): Promise<MintRequest> {
    // Validar endereço
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new Error('Endereço de wallet inválido')
    }

    // Verificar se pode mintar
    const canMint = await this.canMint(userId, nftCosmeticId)
    if (!canMint) {
      throw new Error('Você não pode mintar este NFT')
    }

    // Buscar NFT cosmetic
    const { data: nftCosmetic } = await supabase
      .from('nft_cosmetics')
      .select('cosmetic_id')
      .eq('id', nftCosmeticId)
      .single()

    if (!nftCosmetic) throw new Error('NFT cosmetic não encontrado')

    // Verificar saldo
    const canAffordCoins = await CurrencyService.canAfford(userId, 'coins', MINT_COST_COINS)
    const canAffordGems = await CurrencyService.canAfford(userId, 'gems', MINT_COST_GEMS)

    if (!canAffordCoins || !canAffordGems) {
      throw new Error(`Saldo insuficiente. Necessário: ${MINT_COST_COINS} coins e ${MINT_COST_GEMS} gems`)
    }

    // Debitar custo
    await CurrencyService.spendCurrency(userId, 'coins', MINT_COST_COINS, `nft_mint_${nftCosmeticId}`)
    await CurrencyService.spendCurrency(userId, 'gems', MINT_COST_GEMS, `nft_mint_${nftCosmeticId}`)

    // Criar mint request
    const { data: mintRequest, error } = await supabase
      .from('nft_mint_requests')
      .insert({
        user_id: userId,
        nft_cosmetic_id: nftCosmeticId,
        cosmetic_id: nftCosmetic.cosmetic_id,
        wallet_address: walletAddress,
        blockchain: 'polygon',
        mint_fee_coins: MINT_COST_COINS,
        mint_fee_gems: MINT_COST_GEMS
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar mint request: ${error.message}`)

    // Processar mint assincronamente (em produção, usar queue)
    this.processMint(mintRequest.id).catch(console.error)

    return mintRequest
  }

  /**
   * Processar mint na blockchain (chamada assíncrona)
   */
  private static async processMint(mintRequestId: string): Promise<void> {
    try {
      // Atualizar status para processing
      await supabase
        .from('nft_mint_requests')
        .update({ status: 'processing' })
        .eq('id', mintRequestId)

      // Buscar mint request
      const { data: mintRequest } = await supabase
        .from('nft_mint_requests')
        .select('*, nft_cosmetic:nft_cosmetics(*)')
        .eq('id', mintRequestId)
        .single()

      if (!mintRequest) throw new Error('Mint request não encontrado')

      // Setup provider e wallet
      const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC_URL)
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider)

      // ABI simplificado do contrato NFT (ERC-721)
      const contractABI = [
        'function mint(address to, string memory tokenURI) public returns (uint256)',
        'function totalSupply() public view returns (uint256)'
      ]

      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet)

      // Upload metadata para IPFS (em produção, usar serviço como Pinata)
      const metadata = {
        name: mintRequest.nft_cosmetic.cosmetic.name,
        description: mintRequest.nft_cosmetic.cosmetic.description,
        image: mintRequest.nft_cosmetic.image_uri,
        attributes: [
          {
            trait_type: 'Rarity',
            value: mintRequest.nft_cosmetic.cosmetic.rarity
          },
          {
            trait_type: 'Type',
            value: mintRequest.nft_cosmetic.cosmetic.type
          }
        ]
      }

      // Em produção: fazer upload do metadata para IPFS
      const metadataURI = 'ipfs://...' // Placeholder

      // Fazer mint na blockchain
      const tx = await contract.mint(mintRequest.wallet_address, metadataURI)
      const receipt = await tx.wait()

      // Extrair token ID do evento
      const tokenId = receipt.events?.[0]?.args?.tokenId?.toString()

      // Atualizar mint request
      await supabase
        .from('nft_mint_requests')
        .update({
          status: 'completed',
          transaction_hash: receipt.transactionHash,
          block_number: receipt.blockNumber,
          gas_used: receipt.gasUsed.toString(),
          gas_price: tx.gasPrice.toString(),
          completed_at: new Date().toISOString()
        })
        .eq('id', mintRequestId)

      // Criar ownership record
      await supabase.from('nft_ownership').insert({
        nft_cosmetic_id: mintRequest.nft_cosmetic_id,
        user_id: mintRequest.user_id,
        wallet_address: mintRequest.wallet_address,
        blockchain: 'polygon',
        token_id: tokenId
      })

      // Registrar transação
      await supabase.from('nft_transactions').insert({
        nft_cosmetic_id: mintRequest.nft_cosmetic_id,
        transaction_type: 'mint',
        from_address: ethers.constants.AddressZero,
        to_address: mintRequest.wallet_address,
        transaction_hash: receipt.transactionHash,
        block_number: receipt.blockNumber,
        blockchain: 'polygon'
      })

    } catch (error: any) {
      console.error('Erro ao processar mint:', error)

      // Atualizar status para failed
      await supabase
        .from('nft_mint_requests')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', mintRequestId)

      // Reembolsar usuário
      const { data: mintRequest } = await supabase
        .from('nft_mint_requests')
        .select('user_id, mint_fee_coins, mint_fee_gems')
        .eq('id', mintRequestId)
        .single()

      if (mintRequest) {
        await CurrencyService.addCurrency(
          mintRequest.user_id,
          'coins',
          mintRequest.mint_fee_coins,
          `nft_mint_refund_${mintRequestId}`
        )
        await CurrencyService.addCurrency(
          mintRequest.user_id,
          'gems',
          mintRequest.mint_fee_gems,
          `nft_mint_refund_${mintRequestId}`
        )
      }
    }
  }

  /**
   * Obter mint requests do usuário
   */
  static async getUserMintRequests(userId: string, limit: number = 50, offset: number = 0) {
    const { data, error } = await supabase
      .from('nft_mint_requests')
      .select(`
        *,
        nft_cosmetic:nft_cosmetics(*),
        cosmetic:cosmetics(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(`Erro ao buscar mint requests: ${error.message}`)

    return data || []
  }

  /**
   * Obter NFTs owned pelo usuário
   */
  static async getUserNFTs(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('nft_ownership')
      .select(`
        *,
        nft_cosmetic:nft_cosmetics(*),
        cosmetic:cosmetics(*)
      `)
      .eq('user_id', userId)

    if (error) throw new Error(`Erro ao buscar NFTs: ${error.message}`)

    return data || []
  }

  /**
   * Verificar ownership on-chain (para sincronizar com blockchain)
   */
  static async verifyOwnership(
    walletAddress: string,
    tokenId: string
  ): Promise<{ owner: string; verified: boolean }> {
    try {
      const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC_URL)

      const contractABI = [
        'function ownerOf(uint256 tokenId) public view returns (address)'
      ]

      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider)

      const owner = await contract.ownerOf(tokenId)

      return {
        owner,
        verified: owner.toLowerCase() === walletAddress.toLowerCase()
      }
    } catch (error: any) {
      return {
        owner: '',
        verified: false
      }
    }
  }

  /**
   * Obter transações de um NFT
   */
  static async getNFTTransactions(nftCosmeticId: string) {
    const { data, error } = await supabase
      .from('nft_transactions')
      .select('*')
      .eq('nft_cosmetic_id', nftCosmeticId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Erro ao buscar transações: ${error.message}`)

    return data || []
  }

  /**
   * Obter royalties ganhos pelo usuário
   */
  static async getUserRoyalties(userId: string) {
    const { data, error } = await supabase
      .from('nft_royalties_earned')
      .select(`
        *,
        nft_cosmetic:nft_cosmetics(*),
        transaction:nft_transactions(*)
      `)
      .eq('recipient_user_id', userId)
      .order('earned_at', { ascending: false })

    if (error) throw new Error(`Erro ao buscar royalties: ${error.message}`)

    // Calcular total
    const totalUSD = data?.reduce((sum, r) => sum + parseFloat(r.amount_usd), 0) || 0

    return {
      royalties: data || [],
      total_usd: totalUSD
    }
  }

  /**
   * Registrar venda externa (de marketplace como OpenSea)
   */
  static async recordExternalSale(
    nftCosmeticId: string,
    transactionHash: string,
    fromAddress: string,
    toAddress: string,
    salePrice: number,
    blockchain: string = 'polygon'
  ): Promise<void> {
    // Buscar NFT para calcular royalties
    const { data: nftCosmetic } = await supabase
      .from('nft_cosmetics')
      .select('royalty_percentage, royalty_recipient')
      .eq('id', nftCosmeticId)
      .single()

    if (!nftCosmetic) throw new Error('NFT cosmetic não encontrado')

    // Calcular royalty
    const royaltyAmount = salePrice * (nftCosmetic.royalty_percentage / 100)

    // Registrar transação
    const { data: transaction, error: txError } = await supabase
      .from('nft_transactions')
      .insert({
        nft_cosmetic_id: nftCosmeticId,
        transaction_type: 'sale',
        from_address: fromAddress,
        to_address: toAddress,
        transaction_hash: transactionHash,
        blockchain: blockchain,
        sale_price: salePrice,
        royalty_amount: royaltyAmount,
        royalty_recipient: nftCosmetic.royalty_recipient
      })
      .select()
      .single()

    if (txError) throw new Error(`Erro ao registrar transação: ${txError.message}`)

    // Registrar royalty earned
    if (royaltyAmount > 0) {
      await supabase.from('nft_royalties_earned').insert({
        nft_cosmetic_id: nftCosmeticId,
        transaction_id: transaction.id,
        amount_crypto: royaltyAmount,
        recipient_address: nftCosmetic.royalty_recipient,
        blockchain: blockchain
      })
    }

    // Atualizar ownership
    await supabase
      .from('nft_ownership')
      .update({
        wallet_address: toAddress,
        last_verified_at: new Date().toISOString()
      })
      .eq('nft_cosmetic_id', nftCosmeticId)
  }

  /**
   * Obter estatísticas gerais de NFT
   */
  static async getStats() {
    // Total minted
    const { count: totalMinted } = await supabase
      .from('nft_mint_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    // Total em processamento
    const { count: processing } = await supabase
      .from('nft_mint_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'processing'])

    // Total de vendas
    const { count: totalSales } = await supabase
      .from('nft_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('transaction_type', 'sale')

    // Volume de vendas
    const { data: sales } = await supabase
      .from('nft_transactions')
      .select('sale_price_usd')
      .eq('transaction_type', 'sale')

    const volumeUSD = sales?.reduce((sum, s) => sum + (parseFloat(s.sale_price_usd) || 0), 0) || 0

    return {
      total_minted: totalMinted || 0,
      processing: processing || 0,
      total_sales: totalSales || 0,
      volume_usd: volumeUSD
    }
  }
}
