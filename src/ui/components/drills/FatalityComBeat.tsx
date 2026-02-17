/**
 * #B2 Drill: Fatality com Beat
 * Rimas pesadas/agressivas sincronizadas com o beat
 * Alto impacto visual + sonoro
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Zap, Trophy, SkipForward } from 'lucide-react'
import { MetronomeCompact } from '../Metronome'

interface Fatality {
  id: string
  setup: string // Contexto do oponente
  fatality: string // Rima de finalização
  categoria: string
  impacto: number // 1-10
  tags: string[]
}

// Fatalitys mockadas (virão do banco)
const FATALITYS: Fatality[] = [
  {
    id: 'f1',
    setup: 'Oponente: "Eu sou o melhor dessa batalha"',
    fatality: 'Você se acha o rei mas tá perdendo a batalha / Sua coroa é de plástico, sua glória é uma falha',
    categoria: 'Ego Destroyer',
    impacto: 9,
    tags: ['agressivo', 'autoestima'],
  },
  {
    id: 'f2',
    setup: 'Oponente: "Meu flow é imbatível"',
    fatality: 'Seu flow é travado, parece robô desligado / Enquanto eu improviso, você fica travado',
    categoria: 'Skill Attack',
    impacto: 8,
    tags: ['tecnico', 'flow'],
  },
  {
    id: 'f3',
    setup: 'Oponente: "Você não tem chance"',
    fatality: 'Não tenho chance? Olha quem tá falando / Você tá no chão enquanto eu tô dominando',
    categoria: 'Comeback',
    impacto: 10,
    tags: ['defesa', 'virada'],
  },
  {
    id: 'f4',
    setup: 'Oponente: "Sou campeão de batalhas"',
    fatality: 'Campeão de batalha? Mais parece campeão de desculpa / Sua técnica é fraca, sua rima é uma consulta',
    categoria: 'Title Snatch',
    impacto: 9,
    tags: ['agressivo', 'status'],
  },
  {
    id: 'f5',
    setup: 'Oponente: "Vim do underground"',
    fatality: 'Underground? Você veio do subsolo da mediocridade / Seu rap é enterrado, sem originalidade',
    categoria: 'Origin Roast',
    impacto: 8,
    tags: ['critico', 'origem'],
  },
]

interface FatalityComBeatProps {
  bpm: number
  isPlaying: boolean
  onComplete?: (score: number) => void
}

export function FatalityComBeat({ bpm, isPlaying, onComplete }: FatalityComBeatProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [beat, setBeat] = useState(0)
  const [combo, setCombo] = useState(0)

  const current = FATALITYS[currentIndex]
  const beatInterval = (60 / bpm) * 1000

  // Metrônomo
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

  // Revelar fatality
  const handleReveal = useCallback(() => {
    setIsRevealed(true)

    // Calcular score baseado no impacto
    const points = current.impacto * 10
    setScore((prev) => prev + points)
    setCombo((prev) => prev + 1)

    // Auto-avançar após animação
    setTimeout(() => {
      nextFatality()
    }, 4000)
  }, [current])

  // Próxima fatality
  const nextFatality = useCallback(() => {
    if (currentIndex < FATALITYS.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setIsRevealed(false)
    } else {
      // Drill completo
      onComplete?.(score)
    }
  }, [currentIndex, score, onComplete])

  // Pular
  const skip = useCallback(() => {
    setCombo(0)
    nextFatality()
  }, [nextFatality])

  return (
    <div className="bg-dark-200 rounded-xl p-6 border-2 border-red-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-red-400 flex items-center gap-2">
            <Flame className="animate-pulse" />
            Fatality Training
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Rimas pesadas que finalizam a batalha
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-red-400">{score}</div>
          <div className="text-xs text-gray-400">pontos</div>
        </div>
      </div>

      {/* Combo Counter */}
      {combo > 1 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-4 p-3 bg-red-500/20 border-2 border-red-500 rounded-lg text-center"
        >
          <div className="text-2xl font-bold text-red-400">
            🔥 COMBO x{combo}
          </div>
        </motion.div>
      )}

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>
            Fatality {currentIndex + 1} / {FATALITYS.length}
          </span>
          <MetronomeCompact bpm={bpm} isPlaying={isPlaying} />
        </div>
        <div className="h-2 bg-dark-400 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-red-500 to-red-700"
            animate={{
              width: `${((currentIndex + 1) / FATALITYS.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Fatality Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, rotateY: -90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: 90 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Tags & Impacto */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {current.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <Zap
                  key={i}
                  size={12}
                  className={i < current.impacto ? 'text-red-400 fill-red-400' : 'text-gray-600'}
                />
              ))}
            </div>
          </div>

          {/* Setup (Contexto) */}
          <motion.div
            animate={isPlaying && beat === 0 ? { x: [0, 5, 0] } : {}}
            className="p-6 bg-dark-400 rounded-lg border-2 border-gray-700"
          >
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
              {current.categoria}
            </div>
            <div className="text-lg text-gray-300 italic">
              {current.setup}
            </div>
          </motion.div>

          {/* Fatality (Revelação) */}
          {!isRevealed ? (
            <motion.button
              onClick={handleReveal}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full p-8 bg-gradient-to-r from-red-500 to-red-700 rounded-lg text-white font-bold text-xl flex items-center justify-center gap-3 shadow-xl shadow-red-500/50"
            >
              <Flame size={32} className="animate-pulse" />
              REVELAR FATALITY
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              {/* Fatality Lines */}
              <motion.div
                className="p-6 bg-gradient-to-br from-red-500/20 to-red-700/20 border-2 border-red-500 rounded-lg"
              >
                {current.fatality.split(' / ').map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.3 }}
                    animate={isPlaying && beat === (i * 2) % 4 ? { x: [0, 10, 0] } : {}}
                    className="text-lg text-red-400 font-bold mb-2 last:mb-0"
                  >
                    🔥 {line}
                  </motion.div>
                ))}
              </motion.div>

              {/* Impacto Visual */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: 3, duration: 0.5 }}
                className="flex items-center justify-center gap-2"
              >
                <Trophy className="text-gold-400" size={32} />
                <span className="text-2xl font-bold text-gold-400">
                  +{current.impacto * 10} pontos
                </span>
              </motion.div>
            </motion.div>
          )}

          {/* Skip Button */}
          {!isRevealed && (
            <button
              onClick={skip}
              className="w-full py-3 bg-dark-400 hover:bg-dark-300 text-gray-400 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <SkipForward size={20} />
              Pular
            </button>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Info */}
      {!isPlaying && (
        <div className="mt-6 text-center text-sm text-gray-500 p-3 bg-dark-400 rounded-lg">
          ⚠️ Toque o beat para começar o drill
        </div>
      )}

      {/* Fatality Info */}
      <div className="mt-6 text-xs text-gray-500 p-3 bg-dark-400 rounded-lg">
        💡 <span className="text-gold-400 font-bold">Fatality</span> = Rima de finalização devastadora.
        Use quando o oponente se expõe ou quando precisa garantir a vitória.
      </div>
    </div>
  )
}
