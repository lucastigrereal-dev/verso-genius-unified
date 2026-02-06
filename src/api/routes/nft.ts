/**
 * NFT Routes
 * Rotas do sistema de NFTs
 */

import { Hono } from 'hono'
import { NFTService } from '../services/nftService'

const router = new Hono()

/**
 * GET /nft/mintable
 * Listar cosméticos mintáveis como NFT
 */
router.get('/mintable', async (c) => {
  try {
    const nfts = await NFTService.getMintableNFTs()
    return c.json({ nfts })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * GET /nft/can-mint/:nftCosmeticId
 * Verificar se usuário pode mintar um NFT
 */
router.get('/can-mint/:nftCosmeticId', async (c) => {
  try {
    const userId = c.get('userId')
    const nftCosmeticId = c.req.param('nftCosmeticId')

    const canMint = await NFTService.canMint(userId, nftCosmeticId)
    return c.json({ can_mint: canMint })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * POST /nft/mint
 * Criar requisição de mint
 * Body: { nft_cosmetic_id: string, wallet_address: string }
 */
router.post('/mint', async (c) => {
  try {
    const userId = c.get('userId')
    const { nft_cosmetic_id, wallet_address } = await c.req.json()

    if (!nft_cosmetic_id || !wallet_address) {
      return c.json({ error: 'nft_cosmetic_id e wallet_address são obrigatórios' }, 400)
    }

    const mintRequest = await NFTService.createMintRequest(
      userId,
      nft_cosmetic_id,
      wallet_address
    )

    return c.json({
      message: 'Mint request criado com sucesso',
      mint_request: mintRequest
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * GET /nft/my-requests
 * Obter mint requests do usuário
 * Query: ?limit=50&offset=0
 */
router.get('/my-requests', async (c) => {
  try {
    const userId = c.get('userId')
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')

    const requests = await NFTService.getUserMintRequests(userId, limit, offset)
    return c.json({ requests })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * GET /nft/my-nfts
 * Obter NFTs owned pelo usuário
 */
router.get('/my-nfts', async (c) => {
  try {
    const userId = c.get('userId')
    const nfts = await NFTService.getUserNFTs(userId)
    return c.json({ nfts })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * GET /nft/transactions/:nftCosmeticId
 * Obter transações de um NFT
 */
router.get('/transactions/:nftCosmeticId', async (c) => {
  try {
    const nftCosmeticId = c.req.param('nftCosmeticId')
    const transactions = await NFTService.getNFTTransactions(nftCosmeticId)
    return c.json({ transactions })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * GET /nft/royalties
 * Obter royalties ganhos pelo usuário
 */
router.get('/royalties', async (c) => {
  try {
    const userId = c.get('userId')
    const result = await NFTService.getUserRoyalties(userId)
    return c.json(result)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * POST /nft/verify-ownership
 * Verificar ownership on-chain
 * Body: { wallet_address: string, token_id: string }
 */
router.post('/verify-ownership', async (c) => {
  try {
    const { wallet_address, token_id } = await c.req.json()

    if (!wallet_address || !token_id) {
      return c.json({ error: 'wallet_address e token_id são obrigatórios' }, 400)
    }

    const result = await NFTService.verifyOwnership(wallet_address, token_id)
    return c.json(result)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * POST /nft/record-external-sale
 * Registrar venda externa (webhook de marketplace como OpenSea)
 * Body: { nft_cosmetic_id, transaction_hash, from_address, to_address, sale_price, blockchain }
 */
router.post('/record-external-sale', async (c) => {
  try {
    const {
      nft_cosmetic_id,
      transaction_hash,
      from_address,
      to_address,
      sale_price,
      blockchain
    } = await c.req.json()

    if (!nft_cosmetic_id || !transaction_hash || !from_address || !to_address || !sale_price) {
      return c.json({ error: 'Campos obrigatórios faltando' }, 400)
    }

    await NFTService.recordExternalSale(
      nft_cosmetic_id,
      transaction_hash,
      from_address,
      to_address,
      parseFloat(sale_price),
      blockchain || 'polygon'
    )

    return c.json({ message: 'Venda registrada com sucesso' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

/**
 * GET /nft/stats
 * Estatísticas gerais de NFT
 */
router.get('/stats', async (c) => {
  try {
    const stats = await NFTService.getStats()
    return c.json({ stats })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

export default router
