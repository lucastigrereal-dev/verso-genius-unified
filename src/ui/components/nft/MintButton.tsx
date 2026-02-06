/**
 * MintButton Component
 * Botão para mintar cosmético como NFT + modal de confirmação
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Wallet, AlertCircle, CheckCircle, Loader, X } from 'lucide-react'

interface MintButtonProps {
  nftCosmetic: {
    id: string
    cosmetic: {
      name: string
      description: string
      rarity: string
      image_url: string
    }
    blockchain: string
    royalty_percentage: number
    max_supply: number | null
    current_supply: number
  }
  canMint: boolean
  userGems: number
  userCoins: number
  onMint: (nftCosmeticId: string, walletAddress: string) => Promise<void>
}

const MINT_COST_COINS = 1000
const MINT_COST_GEMS = 50

export function MintButton({ nftCosmetic, canMint, userGems, userCoins, onMint }: MintButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [minting, setMinting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const canAfford = userCoins >= MINT_COST_COINS && userGems >= MINT_COST_GEMS

  const handleMint = async () => {
    if (!walletAddress) {
      setError('Digite seu endereço de wallet')
      return
    }

    // Validação básica de endereço Ethereum
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      setError('Endereço de wallet inválido')
      return
    }

    setMinting(true)
    setError('')

    try {
      await onMint(nftCosmetic.id, walletAddress)
      setSuccess(true)
      setTimeout(() => {
        setShowModal(false)
        setSuccess(false)
        setWalletAddress('')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Erro ao mintar NFT')
    } finally {
      setMinting(false)
    }
  }

  // Cores por raridade
  const rarityColors = {
    legendary: 'from-yellow-400 to-orange-500',
    epic: 'from-purple-400 to-pink-500',
    rare: 'from-blue-400 to-cyan-500',
    common: 'from-gray-400 to-gray-600'
  }

  const gradient = rarityColors[nftCosmetic.cosmetic.rarity as keyof typeof rarityColors] || rarityColors.common

  // Supply info
  const supplyText = nftCosmetic.max_supply
    ? `${nftCosmetic.current_supply}/${nftCosmetic.max_supply} mintados`
    : `${nftCosmetic.current_supply} mintados`

  const isSoldOut = nftCosmetic.max_supply && nftCosmetic.current_supply >= nftCosmetic.max_supply

  return (
    <>
      {/* Mint Button */}
      <button
        onClick={() => setShowModal(true)}
        disabled={!canMint || !canAfford || isSoldOut}
        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
          canMint && canAfford && !isSoldOut
            ? `bg-gradient-to-r ${gradient} hover:opacity-90`
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        <Sparkles size={18} />
        {isSoldOut ? 'ESGOTADO' : canMint && canAfford ? 'MINTAR NFT' : 'INDISPONÍVEL'}
      </button>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Header */}
              <div className={`relative p-6 bg-gradient-to-br ${gradient}`}>
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-lg transition"
                >
                  <X size={20} />
                </button>

                <h2 className="text-2xl font-bold mb-2">Mintar como NFT</h2>
                <p className="text-white/80 text-sm">
                  Transforme seu cosmético em um NFT único na blockchain
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Success State */}
                {success && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-center py-8"
                  >
                    <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">NFT Mintado!</h3>
                    <p className="text-gray-400">
                      Seu NFT está sendo processado na blockchain.
                      <br />
                      Você será notificado quando estiver completo.
                    </p>
                  </motion.div>
                )}

                {/* Form State */}
                {!success && (
                  <>
                    {/* Preview */}
                    <div className="mb-6 flex gap-4">
                      <img
                        src={nftCosmetic.cosmetic.image_url}
                        alt={nftCosmetic.cosmetic.name}
                        className="w-24 h-24 object-cover rounded-xl"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{nftCosmetic.cosmetic.name}</h3>
                        <p className="text-sm text-gray-400 mb-2">{nftCosmetic.cosmetic.description}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={`px-2 py-1 rounded bg-gradient-to-r ${gradient} text-white font-bold uppercase`}
                          >
                            {nftCosmetic.cosmetic.rarity}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400">{supplyText}</span>
                        </div>
                      </div>
                    </div>

                    {/* Blockchain Info */}
                    <div className="mb-6 p-4 bg-gray-800 rounded-xl">
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-400" />
                        Detalhes do NFT
                      </h4>
                      <ul className="text-sm space-y-2 text-gray-400">
                        <li className="flex justify-between">
                          <span>Blockchain:</span>
                          <span className="font-mono text-white capitalize">{nftCosmetic.blockchain}</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Royalty:</span>
                          <span className="text-white">{nftCosmetic.royalty_percentage}%</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Padrão:</span>
                          <span className="text-white">ERC-721</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Metadata:</span>
                          <span className="text-white">IPFS</span>
                        </li>
                      </ul>
                    </div>

                    {/* Wallet Address Input */}
                    <div className="mb-6">
                      <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                        <Wallet size={16} />
                        Seu Endereço de Wallet
                      </label>
                      <input
                        type="text"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl focus:border-purple-500 outline-none transition font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        O NFT será enviado para este endereço (Polygon)
                      </p>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="mb-6 p-4 bg-red-500/20 border-2 border-red-500/50 rounded-xl flex items-start gap-3">
                        <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-300">{error}</p>
                      </div>
                    )}

                    {/* Cost */}
                    <div className="mb-6 p-4 bg-yellow-500/10 border-2 border-yellow-500/20 rounded-xl">
                      <h4 className="font-bold mb-3">Custo de Mint</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Coins:</span>
                          <span className={`font-bold ${userCoins >= MINT_COST_COINS ? 'text-white' : 'text-red-500'}`}>
                            {MINT_COST_COINS} / {userCoins}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Gems:</span>
                          <span className={`font-bold ${userGems >= MINT_COST_GEMS ? 'text-white' : 'text-red-500'}`}>
                            {MINT_COST_GEMS} / {userGems}
                          </span>
                        </div>
                      </div>

                      {!canAfford && (
                        <p className="text-xs text-red-400 mt-3">
                          Saldo insuficiente para mintar
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowModal(false)}
                        className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold transition"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleMint}
                        disabled={minting || !canAfford}
                        className={`flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                          canAfford
                            ? `bg-gradient-to-r ${gradient} hover:opacity-90`
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {minting ? (
                          <>
                            <Loader size={18} className="animate-spin" />
                            Mintando...
                          </>
                        ) : (
                          <>
                            <Sparkles size={18} />
                            Confirmar Mint
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
