/**
 * Currency Display Component
 * Mostra saldo de coins e gems do usuário
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins, Gem, Plus } from 'lucide-react'

interface CurrencyDisplayProps {
  onBuyGemsClick?: () => void
  showAddButton?: boolean
  size?: 'small' | 'medium' | 'large'
}

export function CurrencyDisplay({
  onBuyGemsClick,
  showAddButton = true,
  size = 'medium'
}: CurrencyDisplayProps) {
  const [coins, setCoins] = useState(0)
  const [gems, setGems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [coinsIncrement, setCoinsIncrement] = useState(0)
  const [gemsIncrement, setGemsIncrement] = useState(0)

  // Fetch balance
  useEffect(() => {
    fetchBalance()
  }, [])

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/v1/currency/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setCoins(data.data.coins)
        setGems(data.data.gems)
      }
    } catch (error) {
      console.error('Erro ao buscar saldo:', error)
    } finally {
      setLoading(false)
    }
  }

  // Animação de incremento
  const showIncrement = (type: 'coins' | 'gems', amount: number) => {
    if (type === 'coins') {
      setCoinsIncrement(amount)
      setTimeout(() => setCoinsIncrement(0), 2000)
    } else {
      setGemsIncrement(amount)
      setTimeout(() => setGemsIncrement(0), 2000)
    }
  }

  // Atualizar saldo (função exposta)
  const updateBalance = (newCoins?: number, newGems?: number) => {
    if (newCoins !== undefined && newCoins !== coins) {
      const diff = newCoins - coins
      if (diff > 0) showIncrement('coins', diff)
      setCoins(newCoins)
    }

    if (newGems !== undefined && newGems !== gems) {
      const diff = newGems - gems
      if (diff > 0) showIncrement('gems', diff)
      setGems(newGems)
    }
  }

  const sizeClasses = {
    small: 'text-sm gap-2',
    medium: 'text-base gap-3',
    large: 'text-lg gap-4'
  }

  const iconSizes = {
    small: 16,
    medium: 20,
    large: 24
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 animate-pulse">
        <div className="h-8 w-20 bg-dark-400 rounded-lg"></div>
        <div className="h-8 w-20 bg-dark-400 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className={`flex items-center ${sizeClasses[size]}`}>
      {/* Coins */}
      <div className="relative flex items-center gap-2 bg-dark-300 px-3 py-2 rounded-lg border border-yellow-500/30">
        <Coins size={iconSizes[size]} className="text-yellow-400" />
        <span className="font-bold text-yellow-400">
          {coins.toLocaleString()}
        </span>

        {/* Incremento animado */}
        <AnimatePresence>
          {coinsIncrement > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -20 }}
              exit={{ opacity: 0, y: -40 }}
              className="absolute -top-6 right-0 text-green-400 font-bold text-sm"
            >
              +{coinsIncrement}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Gems */}
      <div className="relative flex items-center gap-2 bg-dark-300 px-3 py-2 rounded-lg border border-purple-500/30">
        <Gem size={iconSizes[size]} className="text-purple-400" />
        <span className="font-bold text-purple-400">
          {gems.toLocaleString()}
        </span>

        {/* Botão adicionar */}
        {showAddButton && (
          <button
            onClick={onBuyGemsClick}
            className="ml-1 p-1 hover:bg-purple-500/20 rounded transition-colors"
            title="Comprar Gems"
          >
            <Plus size={14} className="text-purple-400" />
          </button>
        )}

        {/* Incremento animado */}
        <AnimatePresence>
          {gemsIncrement > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -20 }}
              exit={{ opacity: 0, y: -40 }}
              className="absolute -top-6 right-0 text-green-400 font-bold text-sm"
            >
              +{gemsIncrement}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
