/**
 * #A3 Metrônomo Visual
 * Feedback visual do BPM com animação sincronizada
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MetronomeProps {
  bpm: number
  isPlaying: boolean
  showVisual?: boolean
}

export function Metronome({ bpm, isPlaying, showVisual = true }: MetronomeProps) {
  const [beat, setBeat] = useState(0)
  const [isActive, setIsActive] = useState(false)

  // Calcular intervalo entre batidas (ms)
  const beatInterval = (60 / bpm) * 1000

  useEffect(() => {
    if (!isPlaying) {
      setIsActive(false)
      setBeat(0)
      return
    }

    setIsActive(true)
    let beatCount = 0

    const interval = setInterval(() => {
      beatCount = (beatCount + 1) % 4 // 4/4 time signature
      setBeat(beatCount)
    }, beatInterval)

    return () => clearInterval(interval)
  }, [isPlaying, beatInterval])

  // Pulso visual
  const pulseAnimation = {
    scale: [1, 1.3, 1],
    opacity: [0.7, 1, 0.7],
  }

  return (
    <div className="bg-dark-200 rounded-xl p-6 border-2 border-gold-400/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gold-400">🎯 Metrônomo</h3>
        <div className="text-2xl font-bold text-gold-400">
          {bpm} <span className="text-sm text-gray-400">BPM</span>
        </div>
      </div>

      {/* Visual Beats */}
      {showVisual && (
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((index) => (
            <motion.div
              key={index}
              animate={isActive && beat === index ? pulseAnimation : {}}
              transition={{ duration: 0.15 }}
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                beat === index && isActive
                  ? 'bg-gold-400 text-dark-500 shadow-lg shadow-gold-400/50'
                  : 'bg-dark-400 text-gray-600'
              }`}
            >
              {index + 1}
            </motion.div>
          ))}
        </div>
      )}

      {/* Central Pulse */}
      <div className="flex justify-center mb-6">
        <AnimatePresence>
          {isActive && (
            <motion.div
              key={beat}
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: beatInterval / 2000 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-2xl shadow-gold-400/50"
            >
              <span className="text-3xl font-bold text-dark-500">
                {beat + 1}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {!isActive && (
          <div className="w-24 h-24 rounded-full bg-dark-400 flex items-center justify-center border-2 border-dashed border-gray-600">
            <span className="text-2xl text-gray-600">●</span>
          </div>
        )}
      </div>

      {/* BPM Info */}
      <div className="text-center">
        <div className="text-sm text-gray-400">
          {isActive ? (
            <>
              <span className="text-gold-400 font-bold">Tocando</span> • {beat + 1}/4
            </>
          ) : (
            'Aguardando...'
          )}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          Tempo: {beatInterval.toFixed(0)}ms por batida
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex justify-center mt-4">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
      </div>
    </div>
  )
}

/**
 * Metrônomo Compacto (para usar em drills)
 */
export function MetronomeCompact({ bpm, isPlaying }: Omit<MetronomeProps, 'showVisual'>) {
  const [beat, setBeat] = useState(0)

  const beatInterval = (60 / bpm) * 1000

  useEffect(() => {
    if (!isPlaying) {
      setBeat(0)
      return
    }

    let beatCount = 0
    const interval = setInterval(() => {
      beatCount = (beatCount + 1) % 4
      setBeat(beatCount)
    }, beatInterval)

    return () => clearInterval(interval)
  }, [isPlaying, beatInterval])

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            animate={isPlaying && beat === index ? { scale: [1, 1.5, 1] } : {}}
            transition={{ duration: 0.1 }}
            className={`w-2 h-2 rounded-full ${
              beat === index && isPlaying ? 'bg-gold-400' : 'bg-dark-400'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400">{bpm} BPM</span>
    </div>
  )
}
