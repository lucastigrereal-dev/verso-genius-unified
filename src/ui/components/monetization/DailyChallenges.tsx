/**
 * Daily Challenges Component
 * Mostra desafios diários e progresso
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Zap, Flame, CheckCircle, Circle, Gift } from 'lucide-react'
import type { DailyChallenge } from '../../../types/monetization'

interface ChallengeWithProgress extends DailyChallenge {
  progress?: any
  completed?: boolean
}

export function DailyChallenges() {
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([])
  const [totalCompleted, setTotalCompleted] = useState(0)
  const [allCompleted, setAllCompleted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChallenges()
  }, [])

  const fetchChallenges = async () => {
    try {
      const res = await fetch('/api/v1/challenges/progress', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await res.json()

      if (data.success) {
        setChallenges(data.data.challenges)
        setTotalCompleted(data.data.total_completed)
        setAllCompleted(data.data.all_completed)
      }
    } catch (error) {
      console.error('Erro ao buscar desafios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClaimBonus = async () => {
    try {
      const res = await fetch('/api/v1/challenges/claim-bonus', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await res.json()

      if (data.success) {
        alert(`Bônus reivindicado! +${data.data.coins} coins, +${data.data.gems} gems`)
        fetchChallenges()
      } else {
        alert(data.error || 'Erro ao reivindicar bônus')
      }
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'text-green-400 bg-green-500/20 border-green-500',
      medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-500',
      hard: 'text-red-400 bg-red-500/20 border-red-500'
    }
    return colors[difficulty] || colors.easy
  }

  const getDifficultyIcon = (difficulty: string) => {
    const icons: Record<string, any> = {
      easy: <Zap size={16} />,
      medium: <Flame size={16} />,
      hard: <Trophy size={16} />
    }
    return icons[difficulty] || icons.easy
  }

  if (loading) {
    return (
      <div className="bg-dark-200 rounded-xl p-6 border-2 border-gold-400/30">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-dark-400 rounded w-1/3"></div>
          <div className="h-20 bg-dark-400 rounded"></div>
          <div className="h-20 bg-dark-400 rounded"></div>
          <div className="h-20 bg-dark-400 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dark-200 rounded-xl p-6 border-2 border-gold-400/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gold-400 flex items-center gap-2">
            <Trophy size={28} />
            Desafios Diários
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Complete todos para ganhar bônus especial!
          </p>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-gold-400">
            {totalCompleted}/{challenges.length}
          </div>
          <div className="text-xs text-gray-400">Completados</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-3 bg-dark-400 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(totalCompleted / challenges.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-gold-400 to-gold-600"
          />
        </div>
      </div>

      {/* Challenges List */}
      <div className="space-y-3 mb-6">
        {challenges.map((challenge, index) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-dark-300 p-4 rounded-lg border-2 ${
              challenge.completed
                ? 'border-green-500/50 bg-green-500/10'
                : 'border-dark-400 hover:border-gold-400/30'
            } transition-colors`}
          >
            <div className="flex items-start gap-4">
              {/* Status Icon */}
              <div className="mt-1">
                {challenge.completed ? (
                  <CheckCircle size={24} className="text-green-400" />
                ) : (
                  <Circle size={24} className="text-gray-600" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold">{challenge.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 ${getDifficultyColor(challenge.difficulty)}`}>
                    {getDifficultyIcon(challenge.difficulty)}
                    {challenge.difficulty.toUpperCase()}
                  </span>
                </div>

                <p className="text-sm text-gray-400 mb-2">{challenge.description}</p>

                {/* Rewards */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-yellow-400">
                    💰 {challenge.reward_coins} coins
                  </span>
                  <span className="flex items-center gap-1 text-blue-400">
                    ⭐ {challenge.reward_xp} XP
                  </span>
                </div>
              </div>

              {/* Completion Badge */}
              {challenge.completed && (
                <div className="bg-green-500/20 px-3 py-1 rounded-full text-green-400 text-xs font-bold">
                  ✓ COMPLETO
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Daily Bonus */}
      {allCompleted && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-lg text-center"
        >
          <Gift size={48} className="mx-auto mb-3 text-yellow-300" />
          <h4 className="text-xl font-bold mb-2">🎉 Todos Completados!</h4>
          <p className="text-sm mb-4 opacity-90">
            Parabéns! Reivindique seu bônus diário
          </p>

          <button
            onClick={handleClaimBonus}
            className="px-8 py-3 bg-yellow-400 text-purple-900 rounded-lg font-bold hover:bg-yellow-300 transition-colors"
          >
            Reivindicar Bônus (+100 coins, +10 gems)
          </button>
        </motion.div>
      )}

      {/* Empty State */}
      {challenges.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Trophy size={48} className="mx-auto mb-3 opacity-50" />
          <p>Nenhum desafio disponível hoje</p>
        </div>
      )}
    </div>
  )
}
