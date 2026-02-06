/**
 * Loot Box Opener Component
 * Animação de abertura de loot box com revelação de recompensas
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, X, Sparkles, Coins, Gem } from 'lucide-react'
import type { LootBox, LootBoxReward } from '../../../types/monetization'

interface LootBoxOpenerProps {
  lootBox: LootBox | null
  isOpen: boolean
  onClose: () => void
  onOpen: (lootBoxId: string) => Promise<{ rewards: LootBoxReward[] }>
}

type AnimationState = 'idle' | 'shaking' | 'opening' | 'revealing' | 'complete'

export function LootBoxOpener({ lootBox, isOpen, onClose, onOpen }: LootBoxOpenerProps) {
  const [animationState, setAnimationState] = useState<AnimationState>('idle')
  const [rewards, setRewards] = useState<LootBoxReward[]>([])
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !lootBox) return null

  const handleOpenBox = async () => {
    setError(null)
    setAnimationState('shaking')

    // Shake animation
    setTimeout(() => setAnimationState('opening'), 1500)

    try {
      const result = await onOpen(lootBox.id)

      // Opening animation
      setTimeout(() => {
        setRewards(result.rewards)
        setAnimationState('revealing')
      }, 2500)

      // Reveal animation
      setTimeout(() => {
        setAnimationState('complete')
      }, 4000)
    } catch (err: any) {
      setError(err.message || 'Erro ao abrir loot box')
      setAnimationState('idle')
    }
  }

  const handleClose = () => {
    setAnimationState('idle')
    setRewards([])
    setError(null)
    onClose()
  }

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'from-gray-500 to-gray-700',
      rare: 'from-blue-500 to-blue-700',
      epic: 'from-purple-500 to-purple-700',
      legendary: 'from-yellow-400 to-yellow-600'
    }
    return colors[rarity] || colors.common
  }

  const getRarityGlow = (rarity: string) => {
    const glows: Record<string, string> = {
      common: 'shadow-gray-500/50',
      rare: 'shadow-blue-500/50',
      epic: 'shadow-purple-500/50',
      legendary: 'shadow-yellow-500/50'
    }
    return glows[rarity] || glows.common
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        onClick={animationState === 'complete' ? handleClose : undefined}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-2xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button (only when idle or complete) */}
          {(animationState === 'idle' || animationState === 'complete') && (
            <button
              onClick={handleClose}
              className="absolute -top-4 -right-4 p-2 bg-dark-300 rounded-full hover:bg-dark-400 transition-colors z-10"
            >
              <X size={24} />
            </button>
          )}

          {/* Idle State - Show box and open button */}
          {animationState === 'idle' && (
            <div className="bg-dark-200 rounded-xl p-8 text-center border-2 border-purple-500/30">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mb-6"
              >
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-2xl">
                  <Package size={64} className="text-white" />
                </div>
              </motion.div>

              <h2 className="text-3xl font-bold mb-2">{lootBox.name}</h2>
              <p className="text-gray-400 mb-6">{lootBox.description}</p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
                  {error}
                </div>
              )}

              <button
                onClick={handleOpenBox}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity"
              >
                🎁 Abrir Loot Box
              </button>
            </div>
          )}

          {/* Shaking Animation */}
          {animationState === 'shaking' && (
            <motion.div
              animate={{
                rotate: [0, -5, 5, -5, 5, 0],
                scale: [1, 1.05, 1, 1.05, 1]
              }}
              transition={{ repeat: 3, duration: 0.5 }}
              className="bg-dark-200 rounded-xl p-8 text-center"
            >
              <div className="w-40 h-40 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-2xl">
                <Package size={80} className="text-white" />
              </div>
              <p className="mt-6 text-xl font-bold text-purple-400">Preparando abertura...</p>
            </motion.div>
          )}

          {/* Opening Animation */}
          {animationState === 'opening' && (
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 0.8] }}
              transition={{ duration: 1 }}
              className="bg-dark-200 rounded-xl p-8 text-center"
            >
              <motion.div
                animate={{
                  rotateY: [0, 180, 360],
                  scale: [1, 1.3, 1.5]
                }}
                transition={{ duration: 1 }}
                className="w-40 h-40 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-2xl"
              >
                <Package size={80} className="text-white" />
              </motion.div>
              <p className="mt-6 text-xl font-bold text-gold-400">Abrindo...</p>
            </motion.div>
          )}

          {/* Revealing Animation */}
          {(animationState === 'revealing' || animationState === 'complete') && (
            <div className="bg-dark-200 rounded-xl p-8">
              <h2 className="text-3xl font-bold text-center mb-2 text-gold-400">
                ✨ Recompensas! ✨
              </h2>
              <p className="text-center text-gray-400 mb-6">
                Você recebeu {rewards.length} {rewards.length === 1 ? 'item' : 'itens'}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {rewards.map((reward, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0, rotate: -180, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ delay: index * 0.3, type: 'spring' }}
                    className={`bg-gradient-to-br ${getRarityColor(reward.rarity)} p-6 rounded-lg text-center shadow-2xl ${getRarityGlow(reward.rarity)}`}
                  >
                    {/* Particle effect */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Sparkles size={48} className="text-white/30" />
                    </motion.div>

                    {/* Reward Content */}
                    <div className="relative z-10">
                      <div className="text-4xl mb-2">
                        {reward.reward_type === 'coins' && '💰'}
                        {reward.reward_type === 'gems' && '💎'}
                        {reward.reward_type === 'cosmetic' && '✨'}
                        {reward.reward_type === 'xp' && '⭐'}
                      </div>

                      <h3 className="font-bold text-lg mb-1 text-white">
                        {reward.reward_type === 'coins' && `${reward.amount} Coins`}
                        {reward.reward_type === 'gems' && `${reward.amount} Gems`}
                        {reward.reward_type === 'cosmetic' && reward.cosmetic?.name}
                        {reward.reward_type === 'xp' && `${reward.amount} XP`}
                      </h3>

                      <div className="text-xs uppercase tracking-wider font-bold text-white/80">
                        {reward.rarity}
                      </div>

                      {reward.cosmetic && (
                        <p className="text-xs mt-2 text-white/70">
                          {reward.cosmetic.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-dark-300 rounded-lg p-4 border border-gold-400/30">
                <h4 className="font-bold mb-3 text-center">Resumo</h4>
                <div className="flex justify-center gap-6">
                  {rewards.some(r => r.reward_type === 'coins') && (
                    <div className="flex items-center gap-2">
                      <Coins size={20} className="text-yellow-400" />
                      <span className="font-bold text-yellow-400">
                        +{rewards.filter(r => r.reward_type === 'coins').reduce((sum, r) => sum + r.amount, 0)}
                      </span>
                    </div>
                  )}
                  {rewards.some(r => r.reward_type === 'gems') && (
                    <div className="flex items-center gap-2">
                      <Gem size={20} className="text-purple-400" />
                      <span className="font-bold text-purple-400">
                        +{rewards.filter(r => r.reward_type === 'gems').reduce((sum, r) => sum + r.amount, 0)}
                      </span>
                    </div>
                  )}
                  {rewards.some(r => r.reward_type === 'cosmetic') && (
                    <div className="flex items-center gap-2">
                      <Sparkles size={20} className="text-pink-400" />
                      <span className="font-bold text-pink-400">
                        {rewards.filter(r => r.reward_type === 'cosmetic').length} Cosméticos
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {animationState === 'complete' && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleClose}
                  className="w-full mt-6 px-6 py-3 bg-gold-400 text-dark-500 rounded-lg font-bold hover:bg-gold-500 transition-colors"
                >
                  Continuar
                </motion.button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
