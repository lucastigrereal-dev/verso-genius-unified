/**
 * Shop Modal Component
 * Loja principal de itens (cosmetics, gems, loot boxes)
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Package, Crown, Coins, Gem } from 'lucide-react'
import type { Cosmetic, LootBox, ShopProduct } from '../../../types/monetization'

interface ShopModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'cosmetics' | 'loot-boxes' | 'gems' | 'premium'
}

type TabType = 'cosmetics' | 'loot-boxes' | 'gems' | 'premium'

export function ShopModal({ isOpen, onClose, initialTab = 'cosmetics' }: ShopModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([])
  const [lootBoxes, setLootBoxes] = useState<LootBox[]>([])
  const [gemsProducts, setGemsProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [userBalance, setUserBalance] = useState({ coins: 0, gems: 0 })

  useEffect(() => {
    if (isOpen) {
      fetchShopData()
      fetchBalance()
    }
  }, [isOpen])

  const fetchShopData = async () => {
    try {
      setLoading(true)

      // Fetch em paralelo
      const [cosmeticsRes, lootBoxesRes, productsRes] = await Promise.all([
        fetch('/api/v1/shop/cosmetics', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/v1/shop/loot-boxes', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/v1/shop/products', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ])

      const [cosmeticsData, lootBoxesData, productsData] = await Promise.all([
        cosmeticsRes.json(),
        lootBoxesRes.json(),
        productsRes.json()
      ])

      if (cosmeticsData.success) setCosmetics(cosmeticsData.data)
      if (lootBoxesData.success) setLootBoxes(lootBoxesData.data)
      if (productsData.success) {
        setGemsProducts(productsData.data.filter((p: ShopProduct) => p.type === 'gems'))
      }
    } catch (error) {
      console.error('Erro ao carregar loja:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/v1/currency/balance', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })

      const data = await res.json()
      if (data.success) {
        setUserBalance({ coins: data.data.coins, gems: data.data.gems })
      }
    } catch (error) {
      console.error('Erro ao buscar saldo:', error)
    }
  }

  const handlePurchaseCosmetic = async (cosmeticId: string) => {
    try {
      const res = await fetch(`/api/v1/shop/cosmetics/${cosmeticId}/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await res.json()

      if (data.success) {
        alert('Cosmético comprado com sucesso!')
        fetchBalance()
        fetchShopData()
      } else {
        alert(data.error || 'Erro ao comprar cosmético')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao processar compra')
    }
  }

  const handleOpenLootBox = async (lootBoxId: string) => {
    try {
      const res = await fetch(`/api/v1/shop/loot-boxes/${lootBoxId}/open`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await res.json()

      if (data.success) {
        // TODO: Mostrar animação de abertura
        alert(`Recompensas: ${JSON.stringify(data.data.rewards)}`)
        fetchBalance()
      } else {
        alert(data.error || 'Erro ao abrir loot box')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao abrir loot box')
    }
  }

  const handleBuyGems = async (productId: string) => {
    try {
      const res = await fetch('/api/v1/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          successUrl: window.location.origin + '/shop/success',
          cancelUrl: window.location.origin + '/shop'
        })
      })

      const data = await res.json()

      if (data.success) {
        // Redirecionar para Stripe Checkout
        window.location.href = data.data.url
      } else {
        alert(data.error || 'Erro ao criar checkout')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao processar pagamento')
    }
  }

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'text-gray-400 border-gray-500',
      rare: 'text-blue-400 border-blue-500',
      epic: 'text-purple-400 border-purple-500',
      legendary: 'text-yellow-400 border-yellow-500'
    }
    return colors[rarity] || colors.common
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-dark-200 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-2 border-gold-400/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-dark-400">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gold-400">🏪 Loja Verso Genius</h2>

              <div className="flex items-center gap-4">
                {/* Balance */}
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 bg-dark-400 px-3 py-1 rounded-lg">
                    <Coins size={16} className="text-yellow-400" />
                    <span className="text-sm font-bold">{userBalance.coins}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-dark-400 px-3 py-1 rounded-lg">
                    <Gem size={16} className="text-purple-400" />
                    <span className="text-sm font-bold">{userBalance.gems}</span>
                  </div>
                </div>

                <button onClick={onClose} className="p-2 hover:bg-dark-400 rounded-lg">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              {(['cosmetics', 'loot-boxes', 'gems', 'premium'] as TabType[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    activeTab === tab
                      ? 'bg-gold-400 text-dark-500'
                      : 'bg-dark-400 text-gray-400 hover:bg-dark-300'
                  }`}
                >
                  {tab === 'cosmetics' && '✨ Cosméticos'}
                  {tab === 'loot-boxes' && '📦 Loot Boxes'}
                  {tab === 'gems' && '💎 Gems'}
                  {tab === 'premium' && '👑 Premium'}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gold-400 border-t-transparent"></div>
                <p className="mt-4 text-gray-400">Carregando loja...</p>
              </div>
            ) : (
              <>
                {/* Cosmetics Tab */}
                {activeTab === 'cosmetics' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {cosmetics.map(cosmetic => (
                      <div
                        key={cosmetic.id}
                        className={`bg-dark-300 p-4 rounded-lg border-2 ${getRarityColor(cosmetic.rarity)}`}
                      >
                        <div className="aspect-square bg-dark-400 rounded-lg mb-3 flex items-center justify-center">
                          <Sparkles size={48} className={getRarityColor(cosmetic.rarity).split(' ')[0]} />
                        </div>

                        <h3 className="font-bold mb-1">{cosmetic.name}</h3>
                        <p className="text-xs text-gray-400 mb-3">{cosmetic.description}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {cosmetic.cost_coins && (
                              <span className="text-sm flex items-center gap-1">
                                <Coins size={14} className="text-yellow-400" />
                                {cosmetic.cost_coins}
                              </span>
                            )}
                            {cosmetic.cost_gems && (
                              <span className="text-sm flex items-center gap-1">
                                <Gem size={14} className="text-purple-400" />
                                {cosmetic.cost_gems}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handlePurchaseCosmetic(cosmetic.id)}
                            className="px-3 py-1 bg-gold-400 text-dark-500 rounded-lg text-sm font-bold hover:bg-gold-500"
                          >
                            Comprar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Loot Boxes Tab */}
                {activeTab === 'loot-boxes' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lootBoxes.map(box => (
                      <div key={box.id} className="bg-dark-300 p-6 rounded-lg border-2 border-purple-500/30">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Package size={40} className="text-white" />
                          </div>

                          <div>
                            <h3 className="text-xl font-bold">{box.name}</h3>
                            <p className="text-sm text-gray-400">{box.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {box.cost_coins && (
                              <span className="flex items-center gap-1 bg-dark-400 px-3 py-1 rounded-lg">
                                <Coins size={16} className="text-yellow-400" />
                                {box.cost_coins}
                              </span>
                            )}
                            {box.cost_gems && (
                              <span className="flex items-center gap-1 bg-dark-400 px-3 py-1 rounded-lg">
                                <Gem size={16} className="text-purple-400" />
                                {box.cost_gems}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleOpenLootBox(box.id)}
                            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold hover:opacity-90"
                          >
                            Abrir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gems Tab */}
                {activeTab === 'gems' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {gemsProducts.map(product => (
                      <div
                        key={product.id}
                        className={`bg-dark-300 p-6 rounded-lg border-2 ${
                          product.is_featured ? 'border-purple-500' : 'border-dark-400'
                        } relative`}
                      >
                        {product.is_featured && (
                          <div className="absolute -top-3 right-4 bg-purple-500 px-3 py-1 rounded-full text-xs font-bold">
                            🔥 POPULAR
                          </div>
                        )}

                        <div className="text-center mb-4">
                          <Gem size={48} className="text-purple-400 mx-auto mb-2" />
                          <h3 className="text-2xl font-bold">{product.name}</h3>
                          {product.discount_percent && (
                            <span className="text-green-400 text-sm">
                              {product.discount_percent}% OFF
                            </span>
                          )}
                        </div>

                        <div className="text-center mb-6">
                          <div className="text-3xl font-bold text-purple-400 mb-1">
                            R$ {product.price_brl.toFixed(2)}
                          </div>
                          <p className="text-sm text-gray-400">{product.description}</p>
                        </div>

                        <button
                          onClick={() => handleBuyGems(product.id)}
                          className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold hover:opacity-90"
                        >
                          Comprar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Premium Tab */}
                {activeTab === 'premium' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-lg">
                      <Crown size={48} className="text-yellow-300 mb-4" />
                      <h3 className="text-2xl font-bold mb-2">Pro</h3>
                      <div className="text-3xl font-bold mb-4">R$ 19,90/mês</div>

                      <ul className="space-y-2 mb-6 text-sm">
                        <li>✅ Exercícios ilimitados</li>
                        <li>✅ 20 beats disponíveis</li>
                        <li>✅ Sem anúncios</li>
                        <li>✅ Gravações ilimitadas</li>
                      </ul>

                      <button className="w-full py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-gray-100">
                        Assinar Pro
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-6 rounded-lg border-4 border-yellow-400">
                      <div className="flex items-center gap-2 mb-4">
                        <Crown size={48} className="text-yellow-300" />
                        <span className="bg-yellow-400 text-purple-900 px-2 py-1 rounded text-xs font-bold">
                          MELHOR VALOR
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold mb-2">Elite</h3>
                      <div className="text-3xl font-bold mb-4">R$ 39,90/mês</div>

                      <ul className="space-y-2 mb-6 text-sm">
                        <li>✅ Tudo do Pro</li>
                        <li>✅ Feedback IA ilimitado</li>
                        <li>✅ Batalhas ao vivo</li>
                        <li>✅ Análise avançada</li>
                        <li>✅ Acesso antecipado</li>
                      </ul>

                      <button className="w-full py-3 bg-yellow-400 text-purple-900 rounded-lg font-bold hover:bg-yellow-300">
                        Assinar Elite
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
