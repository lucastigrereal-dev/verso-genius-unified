/**
 * #B1 Drill: Rima na Batida
 * Usuário deve completar rima sincronizada com o beat
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, SkipForward } from 'lucide-react'
import { MetronomeCompact } from '../audio/Metronome'

interface RimaChallenge {
  id: string
  verso1: string
  verso2Incomplete: string
  palavraCorreta: string
  palavrasOpcoes: string[]
  terminacao: string
  dificuldade: 'facil' | 'medio' | 'dificil'
}

interface RimaNaBatidaProps {
  bpm: number
  isPlaying: boolean
  onComplete?: (score: number) => void
}

// Challenges mockados (virão do banco SQLite)
const CHALLENGES: RimaChallenge[] = [
  {
    id: '1',
    verso1: 'Você diz que é técnico mas seu flow é travado',
    verso2Incomplete: 'Rima fraca e forçada, você tá...',
    palavraCorreta: 'desatualizado',
    palavrasOpcoes: ['desatualizado', 'preparado', 'acelerado', 'atrasado'],
    terminacao: 'ado',
    dificuldade: 'facil',
  },
  {
    id: '2',
    verso1: 'Na favela eu sou rei, minha palavra é lei',
    verso2Incomplete: 'Enquanto você dorme, eu tô no...',
    palavraCorreta: 'corre fiel',
    palavrasOpcoes: ['corre fiel', 'topo papel', 'jogo cruel', 'mundo real'],
    terminacao: 'el',
    dificuldade: 'medio',
  },
  {
    id: '3',
    verso1: 'Meu verso é pesado, flow calibrado',
    verso2Incomplete: 'Na batalha da vida, eu sou o mais...',
    palavraCorreta: 'cotado',
    palavrasOpcoes: ['cotado', 'malvado', 'ligado', 'chegado'],
    terminacao: 'ado',
    dificuldade: 'facil',
  },
  {
    id: '4',
    verso1: 'Palavras cortantes como navalha',
    verso2Incomplete: 'Verdade nua crua que não...',
    palavraCorreta: 'falha',
    palavrasOpcoes: ['falha', 'trabalha', 'batalha', 'racha'],
    terminacao: 'alha',
    dificuldade: 'medio',
  },
  {
    id: '5',
    verso1: 'Do gueto pro mundo, fazendo história',
    verso2Incomplete: 'Rap nacional, eterna...',
    palavraCorreta: 'glória',
    palavrasOpcoes: ['glória', 'vitória', 'memória', 'categoria'],
    terminacao: 'oria',
    dificuldade: 'dificil',
  },
]

export function RimaNaBatida({ bpm, isPlaying, onComplete }: RimaNaBatidaProps) {
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [beat, setBeat] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)

  const currentChallenge = CHALLENGES[currentChallengeIndex]
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

  // Verificar resposta
  const handleAnswer = useCallback(
    (answer: string) => {
      setSelectedAnswer(answer)
      const correct = answer === currentChallenge.palavraCorreta
      setIsCorrect(correct)
      setShowFeedback(true)

      if (correct) {
        setScore((prev) => prev + 10)
      }

      // Auto-avançar após 2s
      setTimeout(() => {
        nextChallenge()
      }, 2000)
    },
    [currentChallenge]
  )

  // Próximo desafio
  const nextChallenge = useCallback(() => {
    if (currentChallengeIndex < CHALLENGES.length - 1) {
      setCurrentChallengeIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setShowFeedback(false)
    } else {
      // Drill completo
      onComplete?.(score)
    }
  }, [currentChallengeIndex, score, onComplete])

  // Pular
  const skipChallenge = useCallback(() => {
    nextChallenge()
  }, [nextChallenge])

  return (
    <div className="bg-dark-200 rounded-xl p-6 border-2 border-gold-400/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gold-400">🎯 Rima na Batida</h3>
          <p className="text-sm text-gray-400 mt-1">
            Complete a rima no tempo certo!
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gold-400">{score}</div>
          <div className="text-xs text-gray-400">pontos</div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>
            Desafio {currentChallengeIndex + 1} / {CHALLENGES.length}
          </span>
          <MetronomeCompact bpm={bpm} isPlaying={isPlaying} />
        </div>
        <div className="h-2 bg-dark-400 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-gold-400 to-gold-600"
            initial={{ width: 0 }}
            animate={{
              width: `${((currentChallengeIndex + 1) / CHALLENGES.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Challenge */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentChallenge.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
        >
          {/* Versos */}
          <div className="space-y-4 p-6 bg-dark-400 rounded-lg">
            <motion.div
              animate={isPlaying && beat === 0 ? { x: [0, 5, 0] } : {}}
              className="text-lg text-gray-300"
            >
              {currentChallenge.verso1}
            </motion.div>

            <motion.div
              animate={isPlaying && beat === 2 ? { x: [0, 5, 0] } : {}}
              className="text-lg text-gold-400 font-bold"
            >
              {currentChallenge.verso2Incomplete}
              <span className="inline-block w-20 h-1 bg-gold-400 ml-2 animate-pulse" />
            </motion.div>

            {/* Dica de terminação */}
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span>💡 Termina com:</span>
              <span className="px-3 py-1 bg-dark-200 rounded-full text-gold-400 font-mono">
                -{currentChallenge.terminacao}
              </span>
            </div>
          </div>

          {/* Opções */}
          <div className="grid grid-cols-2 gap-3">
            {currentChallenge.palavrasOpcoes.map((opcao) => (
              <motion.button
                key={opcao}
                onClick={() => handleAnswer(opcao)}
                disabled={selectedAnswer !== null}
                whileHover={{ scale: selectedAnswer ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 rounded-lg font-bold transition-all ${
                  selectedAnswer === opcao
                    ? isCorrect
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                    : selectedAnswer !== null && opcao === currentChallenge.palavraCorreta
                    ? 'bg-green-500/30 text-green-400 border-2 border-green-500'
                    : 'bg-dark-400 text-gray-300 hover:bg-dark-300 border-2 border-dark-400 hover:border-gold-400/50'
                } ${selectedAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {opcao}
              </motion.button>
            ))}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-4 rounded-lg flex items-center gap-3 ${
                  isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {isCorrect ? <Check size={24} /> : <X size={24} />}
                <div>
                  <div className="font-bold">
                    {isCorrect ? '🔥 Acertou!' : '❌ Errou!'}
                  </div>
                  {!isCorrect && (
                    <div className="text-sm opacity-80">
                      Resposta correta: {currentChallenge.palavraCorreta}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skip Button */}
          {!showFeedback && (
            <button
              onClick={skipChallenge}
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
    </div>
  )
}
