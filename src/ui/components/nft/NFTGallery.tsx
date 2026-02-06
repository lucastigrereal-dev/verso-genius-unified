/**
 * NFTGallery Component
 * Galeria de NFTs owned pelo usuário + transações on-chain
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Image, ExternalLink, TrendingUp, DollarSign, Clock, Copy, CheckCircle } from 'lucide-react'

interface NFT {
  id: string
  nft_cosmetic: {
    blockchain: string
    contract_address: string
    metadata_uri: string
    royalty_percentage: number
  }
  cosmetic: {
    id: string
    name: string
    description: string
    rarity: string
    image_url: string
    type: string
  }
  wallet_address: string
  token_id: string
  acquired_at: string
  is_listed_external: boolean
  external_listing_url?: string
}

interface NFTGalleryProps {
  nfts: NFT[]
  onViewDetails: (nft: NFT) => void
}

export function NFTGallery({ nfts, onViewDetails }: NFTGalleryProps) {
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null)

  const copyToClipboard = (text: string, tokenId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedTokenId(tokenId)
    setTimeout(() => setCopiedTokenId(null), 2000)
  }

  // Cores por raridade
  const rarityColors = {
    legendary: {
      gradient: 'from-yellow-400 to-orange-500',
      border: 'border-yellow-500/50',
      text: 'text-yellow-400'
    },
    epic: {
      gradient: 'from-purple-400 to-pink-500',
      border: 'border-purple-500/50',
      text: 'text-purple-400'
    },
    rare: {
      gradient: 'from-blue-400 to-cyan-500',
      border: 'border-blue-500/50',
      text: 'text-blue-400'
    },
    common: {
      gradient: 'from-gray-400 to-gray-600',
      border: 'border-gray-500/50',
      text: 'text-gray-400'
    }
  }

  // Blockchain logos
  const blockchainLogos = {
    polygon: '⬡',
    ethereum: 'Ξ',
    solana: '◎',
    base: '🔵'
  }

  // Empty state
  if (nfts.length === 0) {
    return (
      <div className="text-center py-16">
        <Image size={64} className="text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Nenhum NFT Encontrado</h3>
        <p className="text-gray-400">Você ainda não possui NFTs mintados.</p>
        <p className="text-sm text-gray-500 mt-2">
          Visite a loja para mintar seus cosméticos raros como NFTs!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Minha Coleção NFT</h2>
          <p className="text-gray-400 mt-1">
            {nfts.length} {nfts.length === 1 ? 'NFT' : 'NFTs'} na sua wallet
          </p>
        </div>
      </div>

      {/* Grid de NFTs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nfts.map((nft) => {
          const colors = rarityColors[nft.cosmetic.rarity as keyof typeof rarityColors] || rarityColors.common
          const blockchain = nft.nft_cosmetic.blockchain as keyof typeof blockchainLogos
          const blockchainLogo = blockchainLogos[blockchain] || '⬢'

          return (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className={`relative bg-gray-800 rounded-2xl overflow-hidden border-2 ${colors.border} cursor-pointer`}
              onClick={() => onViewDetails(nft)}
            >
              {/* Blockchain Badge */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full">
                <span className="text-lg">{blockchainLogo}</span>
                <span className="text-xs font-bold uppercase">{nft.nft_cosmetic.blockchain}</span>
              </div>

              {/* Listed Badge */}
              {nft.is_listed_external && (
                <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-green-500/80 backdrop-blur-sm rounded-full">
                  <span className="text-xs font-bold flex items-center gap-1">
                    <TrendingUp size={12} />
                    LISTADO
                  </span>
                </div>
              )}

              {/* Imagem */}
              <div className="relative aspect-square bg-gray-900 overflow-hidden">
                <img
                  src={nft.cosmetic.image_url}
                  alt={nft.cosmetic.name}
                  className="w-full h-full object-cover"
                />

                {/* Glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-10`} />
              </div>

              {/* Info */}
              <div className="p-4">
                {/* Raridade */}
                <div className="mb-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-gradient-to-r ${colors.gradient} text-white`}
                  >
                    {nft.cosmetic.rarity}
                  </span>
                </div>

                {/* Nome */}
                <h3 className="text-xl font-bold mb-1">{nft.cosmetic.name}</h3>

                {/* Tipo */}
                <p className="text-sm text-gray-400 mb-3">{nft.cosmetic.type}</p>

                {/* Token ID */}
                <div className="flex items-center justify-between mb-3 p-2 bg-gray-900 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Token ID</p>
                    <p className="text-sm font-mono truncate">
                      #{nft.token_id}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(nft.token_id, nft.id)
                    }}
                    className="ml-2 p-2 hover:bg-gray-800 rounded transition"
                  >
                    {copiedTokenId === nft.id ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} className="text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Royalty Info */}
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                  <DollarSign size={14} />
                  <span>Royalty: {nft.nft_cosmetic.royalty_percentage}%</span>
                </div>

                {/* Data de aquisição */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock size={12} />
                  <span>
                    Mintado em {new Date(nft.acquired_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {/* View on Explorer */}
                  <a
                    href={`https://polygonscan.com/token/${nft.nft_cosmetic.contract_address}?a=${nft.token_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
                  >
                    <ExternalLink size={14} />
                    Explorer
                  </a>

                  {/* View on OpenSea (se listado) */}
                  {nft.is_listed_external && nft.external_listing_url && (
                    <a
                      href={nft.external_listing_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
                    >
                      OpenSea
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Info Box */}
      <div className="mt-8 p-6 bg-blue-500/10 border-2 border-blue-500/20 rounded-xl">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <Image className="text-blue-400" />
          Sobre os NFTs
        </h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li>• Seus NFTs estão mintados na blockchain {nfts[0]?.nft_cosmetic.blockchain || 'Polygon'}</li>
          <li>• Você pode visualizar, transferir ou vender em marketplaces externos</li>
          <li>• Royalties de {nfts[0]?.nft_cosmetic.royalty_percentage || 5}% são pagos em vendas secundárias</li>
          <li>• Clique em um NFT para ver o histórico completo de transações</li>
        </ul>
      </div>
    </div>
  )
}
