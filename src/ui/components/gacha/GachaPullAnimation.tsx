/**
 * GachaPullAnimation Component
 * Animação dramática de pull de gacha
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Star, Award } from 'lucide-react'

interface GachaPullResult {
  cosmetic: {
    id: string
    name: string
    description: string
    rarity: string
    image_url: string
    type: string
  }
  was_pity: boolean
  was_rate_up: boolean
}

interface GachaPullAnimationProps {
  results: GachaPullResult[]
  isMultiPull: boolean
  onComplete: () => void
}

export function GachaPullAnimation({ results, isMultiPull, onComplete }: GachaPullAnimationProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [showAllResults, setShowAllResults] = useState(false)

  const currentResult = results[currentIndex]

  // Cores por raridade
  const rarityColors = {
    legendary: {
      gradient: 'from-yellow-400 via-orange-500 to-red-500',
      glow: 'shadow-[0_0_40px_rgba(251,191,36,0.6)]',
      text: 'text-yellow-400',
      particle: 'bg-yellow-400'
    },
    epic: {
      gradient: 'from-purple-400 via-purple-500 to-pink-500',
      glow: 'shadow-[0_0_30px_rgba(168,85,247,0.6)]',
      text: 'text-purple-400',
      particle: 'bg-purple-400'
    },
    rare: {
      gradient: 'from-blue-400 via-blue-500 to-cyan-500',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.6)]',
      text: 'text-blue-400',
      particle: 'bg-blue-400'
    },
    common: {
      gradient: 'from-gray-400 via-gray-500 to-gray-600',
      glow: 'shadow-[0_0_10px_rgba(156,163,175,0.4)]',
      text: 'text-gray-400',
      particle: 'bg-gray-400'
    }
  }

  const colors = rarityColors[currentResult?.cosmetic.rarity as keyof typeof rarityColors] || rarityColors.common

  // Auto-advance para próximo resultado (se multi-pull)
  useEffect(() => {
    if (!showResult) {
      // Mostrar loading por 2 segundos
      const timer = setTimeout(() => {
        setShowResult(true)
      }, 2000)
      return () => clearTimeout(timer)
    } else if (isMultiPull && currentIndex < results.length - 1) {
      // Avançar para próximo após 1.5s
      const timer = setTimeout(() => {
        setShowResult(false)
        setCurrentIndex(currentIndex + 1)
      }, 1500)
      return () => clearTimeout(timer)
    } else if (currentIndex === results.length - 1) {
      // Último resultado
      const timer = setTimeout(() => {
        if (isMultiPull) {
          setShowAllResults(true)
        } else {
          onComplete()
        }
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [showResult, currentIndex, results.length, isMultiPull, onComplete])

  // Mostrar sumário de todos os resultados (multi-pull)
  if (showAllResults) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-6">
            Resultados do 10-Pull
          </h2>

          {/* Grid de resultados */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {results.map((result, index) => {
              const itemColors = rarityColors[result.cosmetic.rarity as keyof typeof rarityColors]
              return (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-3 rounded-lg bg-gradient-to-br ${itemColors.gradient} ${itemColors.glow}`}
                >
                  <img
                    src={result.cosmetic.image_url}
                    alt={result.cosmetic.name}
                    className="w-full aspect-square object-cover rounded"
                  />
                  <div className="mt-2 text-center">
                    <p className="text-xs font-bold truncate">{result.cosmetic.name}</p>
                    {result.was_pity && (
                      <span className="text-[10px] bg-yellow-500 text-black px-1 rounded">PITY</span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {(['legendary', 'epic', 'rare', 'common'] as const).map((rarity) => {
              const count = results.filter(r => r.cosmetic.rarity === rarity).length
              return (
                <div key={rarity} className="text-center p-3 bg-gray-800 rounded-lg">
                  <div className={`text-2xl font-bold ${rarityColors[rarity].text}`}>
                    {count}
                  </div>
                  <div className="text-sm text-gray-400 capitalize">{rarity}</div>
                </div>
              )
            })}
          </div>

          {/* Botão fechar */}
          <button
            onClick={onComplete}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition"
          >
            Continuar
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {!showResult ? (
          // Loading animation
          <motion.div
            key="loading"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="text-center"
          >
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-32 h-32 mx-auto mb-6"
            >
              <Sparkles size={128} className="text-yellow-400" />
            </motion.div>

            <h2 className="text-3xl font-bold mb-2">
              {isMultiPull ? `Pull ${currentIndex + 1} de ${results.length}` : 'Puxando...'}
            </h2>
            <p className="text-gray-400">Revelando seu cosmético...</p>

            {/* Partículas flutuantes */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-2 h-2 ${colors.particle} rounded-full`}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 0
                }}
                animate={{
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 400 - 200,
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </motion.div>
        ) : (
          // Result reveal
          <motion.div
            key="result"
            initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
            className={`relative bg-gradient-to-br ${colors.gradient} p-8 rounded-2xl ${colors.glow} max-w-md w-full`}
          >
            {/* Badges */}
            <div className="absolute top-4 right-4 flex gap-2">
              {currentResult.was_pity && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                >
                  <Award size={12} />
                  PITY
                </motion.div>
              )}
              {currentResult.was_rate_up && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                >
                  <Star size={12} />
                  RATE-UP
                </motion.div>
              )}
            </div>

            {/* Raridade */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-4"
            >
              <p className="text-sm font-bold uppercase tracking-wider opacity-80">
                {currentResult.cosmetic.rarity}
              </p>
            </motion.div>

            {/* Imagem do cosmético */}
            <motion.div
              initial={{ scale: 0, rotateY: -180 }}
              animate={{ scale: 1, rotateY: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.3
              }}
              className="w-64 h-64 mx-auto mb-6 relative"
            >
              <img
                src={currentResult.cosmetic.image_url}
                alt={currentResult.cosmetic.name}
                className="w-full h-full object-cover rounded-xl"
              />

              {/* Glow effect */}
              <div className={`absolute inset-0 rounded-xl ${colors.glow} opacity-50`} />
            </motion.div>

            {/* Nome */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-3xl font-bold text-center mb-2"
            >
              {currentResult.cosmetic.name}
            </motion.h2>

            {/* Descrição */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-white/80 mb-4"
            >
              {currentResult.cosmetic.description}
            </motion.p>

            {/* Tipo */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center"
            >
              <span className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
                {currentResult.cosmetic.type}
              </span>
            </motion.div>

            {/* Skip button (apenas no single pull) */}
            {!isMultiPull && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={onComplete}
                className="mt-6 w-full py-3 bg-white/20 backdrop-blur-sm rounded-xl font-bold hover:bg-white/30 transition"
              >
                Continuar
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
