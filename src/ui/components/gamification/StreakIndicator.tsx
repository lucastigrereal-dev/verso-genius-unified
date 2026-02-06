/**
 * Streak Indicator Component
 * Mostra streak atual do usuário com check-in button
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Shield, Gift, TrendingUp, AlertTriangle } from 'lucide-react'

interface StreakStats {
  currentStreak: number
  longestStreak: number
  totalCheckIns: number
  nextReward: {
    day: number
    coins: number
    gems?: number
    multiplier?: number
  } | null
  isProtected: boolean
  protectedUntil: Date | null
  canCheckInToday: boolean
  streakAtRisk: boolean
}

interface StreakIndicatorProps {
  compact?: boolean
  showCheckInButton?: boolean
  onCheckIn?: (result: any) => void
}

export function StreakIndicator({
  compact = false,
  showCheckInButton = true,
  onCheckIn
}: StreakIndicatorProps) {
  const [stats, setStats] = useState<StreakStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/v1/streaks/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await res.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar streak:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true)

      const res = await fetch('/api/v1/streaks/check-in', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await res.json()

      if (data.success) {
        await fetchStats()
        if (onCheckIn) onCheckIn(data.data)

        // Mostrar feedback visual
        alert(`🔥 Check-in realizado! Dia ${data.data.streak.current_streak} de streak!\n\nRecompensa: ${data.data.reward.coins} coins${data.data.reward.gems ? ` + ${data.data.reward.gems} gems` : ''}`)
      } else {
        alert(data.error || 'Erro ao fazer check-in')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao fazer check-in')
    } finally {
      setCheckingIn(false)
    }
  }

  const handleBuyProtection = async (days: number) => {
    try {
      const cost = days * 10
      const confirm = window.confirm(
        `Proteger seu streak por ${days} dia(s)?\n\nCusto: ${cost} gems`
      )

      if (!confirm) return

      const res = await fetch('/api/v1/streaks/buy-protection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ days })
      })

      const data = await res.json()

      if (data.success) {
        await fetchStats()
        alert('🛡️ Streak protegido com sucesso!')
      } else {
        alert(data.error || 'Erro ao comprar proteção')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao processar compra')
    }
  }

  if (loading) {
    return (
      <div className={`bg-dark-200 rounded-lg p-4 border border-dark-400 animate-pulse ${compact ? 'h-20' : 'h-32'}`}></div>
    )
  }

  if (!stats) return null

  // Compact Mode (para header/navbar)
  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-dark-300 px-3 py-2 rounded-lg border border-orange-500/30">
        <Flame size={20} className="text-orange-400" />
        <div className="font-bold text-orange-400">{stats.currentStreak}</div>
        {stats.isProtected && <Shield size={14} className="text-blue-400" />}
        {stats.streakAtRisk && <AlertTriangle size={14} className="text-red-400" />}
      </div>
    )
  }

  // Full Mode
  return (
    <div className="bg-dark-200 rounded-xl p-6 border-2 border-orange-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Flame size={32} className="text-orange-400" />
          </motion.div>

          <div>
            <h3 className="text-2xl font-bold text-orange-400">
              {stats.currentStreak} dia{stats.currentStreak !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-gray-400">Streak Atual</p>
          </div>
        </div>

        {stats.isProtected && (
          <div className="bg-blue-500/20 px-3 py-1 rounded-full flex items-center gap-2 border border-blue-500">
            <Shield size={16} className="text-blue-400" />
            <span className="text-sm text-blue-400 font-bold">Protegido</span>
          </div>
        )}

        {stats.streakAtRisk && !stats.isProtected && (
          <div className="bg-red-500/20 px-3 py-1 rounded-full flex items-center gap-2 border border-red-500">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-sm text-red-400 font-bold">Em Risco</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-dark-300 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">{stats.currentStreak}</div>
          <div className="text-xs text-gray-400">Atual</div>
        </div>

        <div className="bg-dark-300 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.longestStreak}</div>
          <div className="text-xs text-gray-400">Recorde</div>
        </div>

        <div className="bg-dark-300 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.totalCheckIns}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
      </div>

      {/* Next Reward */}
      {stats.nextReward && (
        <div className="bg-gradient-to-r from-gold-500/20 to-gold-600/20 rounded-lg p-3 mb-4 border border-gold-400/30">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={16} className="text-gold-400" />
            <span className="text-sm font-bold text-gold-400">
              Próxima Recompensa (Dia {stats.nextReward.day})
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-yellow-400">💰 {stats.nextReward.coins} coins</span>
            {stats.nextReward.gems && (
              <span className="text-purple-400">💎 {stats.nextReward.gems} gems</span>
            )}
            {stats.nextReward.multiplier && (
              <span className="text-green-400">
                <TrendingUp size={14} className="inline" /> +{((stats.nextReward.multiplier - 1) * 100).toFixed(0)}% XP
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {/* Check-in Button */}
        {showCheckInButton && (
          <AnimatePresence>
            {stats.canCheckInToday ? (
              <motion.button
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkingIn ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Fazendo Check-in...
                  </>
                ) : (
                  <>
                    <Flame size={20} />
                    Fazer Check-in Hoje
                  </>
                )}
              </motion.button>
            ) : (
              <div className="w-full py-3 bg-dark-400 rounded-lg text-center text-gray-400">
                ✓ Check-in feito hoje!
              </div>
            )}
          </AnimatePresence>
        )}

        {/* Streak Protection */}
        {!stats.isProtected && stats.currentStreak >= 7 && (
          <div className="border border-blue-500/30 rounded-lg p-3 bg-blue-500/10">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-blue-400" />
              <span className="text-sm font-bold text-blue-400">Proteger Streak</span>
            </div>

            <p className="text-xs text-gray-400 mb-2">
              Evite perder seu streak se esquecer de fazer check-in
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => handleBuyProtection(1)}
                className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 rounded text-sm font-bold transition-colors"
              >
                1 dia (10 gems)
              </button>
              <button
                onClick={() => handleBuyProtection(3)}
                className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 rounded text-sm font-bold transition-colors"
              >
                3 dias (30 gems)
              </button>
              <button
                onClick={() => handleBuyProtection(7)}
                className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 rounded text-sm font-bold transition-opacity"
              >
                7 dias (70 gems)
              </button>
            </div>
          </div>
        )}

        {/* Protected Status */}
        {stats.isProtected && stats.protectedUntil && (
          <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-500 text-center">
            <Shield size={24} className="text-blue-400 mx-auto mb-1" />
            <p className="text-sm text-blue-400 font-bold">
              Streak Protegido até {new Date(stats.protectedUntil).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Warning */}
      {stats.streakAtRisk && !stats.isProtected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 bg-red-500/20 rounded-lg p-3 border border-red-500 flex items-start gap-2"
        >
          <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-400 font-bold">Atenção!</p>
            <p className="text-xs text-gray-400">
              Você está em risco de perder seu streak. Faça check-in ou proteja seu streak com gems.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
