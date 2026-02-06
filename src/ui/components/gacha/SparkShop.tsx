/**
 * SparkShop Component
 * Loja de troca de spark tokens por cosméticos garantidos
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Gift, Star, Lock, CheckCircle } from 'lucide-react'

interface SparkShopItem {
  id: string
  cosmetic: {
    id: string
    name: string
    description: string
    rarity: string
    image_url: string
    type: string
  }
  spark_cost: number
  max_exchanges: number
  times_exchanged: number
  is_available: boolean
}

interface SparkShopProps {
  items: SparkShopItem[]
  userSparks: number
  onExchange: (cosmeticId: string) => Promise<void>
}

export function SparkShop({ items, userSparks, onExchange }: SparkShopProps) {
  const [exchanging, setExchanging] = useState<string | null>(null)

  const handleExchange = async (item: SparkShopItem) => {
    if (exchanging) return
    if (userSparks < item.spark_cost) return
    if (item.times_exchanged >= item.max_exchanges) return

    setExchanging(item.id)
    try {
      await onExchange(item.cosmetic.id)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setExchanging(null)
    }
  }

  // Cores por raridade
  const rarityColors = {
    legendary: 'from-yellow-400 to-orange-500',
    epic: 'from-purple-400 to-pink-500',
    rare: 'from-blue-400 to-cyan-500',
    common: 'from-gray-400 to-gray-600'
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Gift className="text-purple-400" />
          Spark Shop
        </h2>
        <p className="text-gray-400">
          Troque seus Spark Tokens por cosméticos garantidos!
        </p>

        {/* Saldo de Sparks */}
        <div className="mt-4 inline-flex items-center gap-3 px-6 py-3 bg-purple-500/20 rounded-xl border-2 border-purple-500/30">
          <Star className="text-purple-400" size={24} />
          <div>
            <p className="text-sm text-gray-400">Seus Sparks</p>
            <p className="text-2xl font-bold text-purple-400">{userSparks}</p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-12">
          <Gift size={64} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum item disponível no momento</p>
        </div>
      )}

      {/* Grid de itens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const gradient = rarityColors[item.cosmetic.rarity as keyof typeof rarityColors] || rarityColors.common
          const canAfford = userSparks >= item.spark_cost
          const isAvailable = item.times_exchanged < item.max_exchanges
          const canExchange = canAfford && isAvailable && !exchanging

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className={`relative bg-gray-800 rounded-2xl overflow-hidden border-2 ${
                canAfford ? 'border-purple-500/30' : 'border-gray-700'
              }`}
            >
              {/* Header com raridade */}
              <div className={`h-2 bg-gradient-to-r ${gradient}`} />

              {/* Badge de status */}
              <div className="absolute top-4 right-4 z-10">
                {!isAvailable && (
                  <div className="bg-gray-700 text-gray-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Lock size={12} />
                    ESGOTADO
                  </div>
                )}
                {item.times_exchanged > 0 && isAvailable && (
                  <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">
                    {item.times_exchanged}/{item.max_exchanges} vendidos
                  </div>
                )}
              </div>

              {/* Imagem */}
              <div className="relative p-4">
                <div className="w-full aspect-square bg-gray-900 rounded-xl overflow-hidden">
                  <img
                    src={item.cosmetic.image_url}
                    alt={item.cosmetic.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Glow effect */}
                <div className={`absolute inset-4 rounded-xl bg-gradient-to-br ${gradient} opacity-10 blur-xl`} />
              </div>

              {/* Info */}
              <div className="p-4 pt-0">
                {/* Raridade badge */}
                <div className="mb-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-gradient-to-r ${gradient} text-white`}
                  >
                    {item.cosmetic.rarity}
                  </span>
                </div>

                {/* Nome */}
                <h3 className="text-xl font-bold mb-1">{item.cosmetic.name}</h3>

                {/* Tipo */}
                <p className="text-sm text-gray-400 mb-2">{item.cosmetic.type}</p>

                {/* Descrição */}
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {item.cosmetic.description}
                </p>

                {/* Custo */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="text-purple-400" size={20} />
                    <span className="text-2xl font-bold">{item.spark_cost}</span>
                    <span className="text-sm text-gray-400">sparks</span>
                  </div>
                </div>

                {/* Botão de troca */}
                <button
                  onClick={() => handleExchange(item)}
                  disabled={!canExchange}
                  className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                    canExchange
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {exchanging === item.id ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Star size={16} />
                      </motion.div>
                      Trocando...
                    </>
                  ) : !isAvailable ? (
                    <>
                      <Lock size={16} />
                      Esgotado
                    </>
                  ) : !canAfford ? (
                    <>
                      <Lock size={16} />
                      Sparks Insuficientes
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Trocar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Info Box */}
      <div className="mt-8 p-6 bg-purple-500/10 border-2 border-purple-500/20 rounded-xl">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <Star className="text-purple-400" />
          Como Ganhar Sparks?
        </h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li>• Cada pull no gacha concede 1 Spark Token</li>
          <li>• Sparks são específicos de cada banner</li>
          <li>• Use sparks para garantir seus cosméticos favoritos!</li>
          <li>• Alguns itens têm limite de trocas (check de raridade)</li>
        </ul>
      </div>
    </div>
  )
}
