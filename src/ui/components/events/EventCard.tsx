/**
 * Event Card Component
 * Display compacto de evento com countdown e progresso
 */

import { motion } from 'framer-motion'
import { Calendar, Trophy, Users, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Event {
  id: string
  name: string
  description: string
  image_url?: string
  type: 'challenge' | 'tournament' | 'seasonal' | 'special'
  start_date: string
  end_date: string
  reward_coins: number
  reward_gems: number
  reward_xp: number
}

interface EventCardProps {
  event: Event
  onView?: () => void
  onJoin?: () => void
  userProgress?: number
  isParticipating?: boolean
}

export function EventCard({
  event,
  onView,
  onJoin,
  userProgress = 0,
  isParticipating = false
}: EventCardProps) {
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const end = new Date(event.end_date).getTime()
      const distance = end - now

      if (distance < 0) {
        setTimeRemaining('Encerrado')
        return
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`)
      } else {
        setTimeRemaining(`${minutes}m`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [event.end_date])

  const getTypeColor = () => {
    const colors = {
      challenge: 'from-blue-500 to-blue-700',
      tournament: 'from-red-500 to-red-700',
      seasonal: 'from-purple-500 to-purple-700',
      special: 'from-gold-500 to-gold-700'
    }
    return colors[event.type] || colors.challenge
  }

  const getTypeLabel = () => {
    const labels = {
      challenge: 'Desafio',
      tournament: 'Torneio',
      seasonal: 'Temporada',
      special: 'Especial'
    }
    return labels[event.type] || 'Evento'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={onView}
      className="bg-dark-300 rounded-lg overflow-hidden border-2 border-dark-400 hover:border-purple-500/50 transition-all cursor-pointer"
    >
      {/* Image */}
      <div className={`h-32 bg-gradient-to-br ${getTypeColor()} relative`}>
        {event.image_url ? (
          <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Trophy size={48} className="text-white/50" />
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-xs font-bold">
          {getTypeLabel()}
        </div>

        {/* Countdown */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-xs font-bold flex items-center gap-1">
          <Clock size={12} />
          {timeRemaining}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-1">{event.name}</h3>
        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{event.description}</p>

        {/* Progress Bar (if participating) */}
        {isParticipating && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-400">Progresso</span>
              <span className="font-bold">{userProgress}%</span>
            </div>
            <div className="h-2 bg-dark-400 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${userProgress}%` }}
                className="h-full bg-gradient-to-r from-green-500 to-green-600"
              />
            </div>
          </div>
        )}

        {/* Rewards */}
        <div className="flex items-center gap-3 text-xs mb-3">
          {event.reward_coins > 0 && (
            <span className="flex items-center gap-1 text-yellow-400">
              💰 {event.reward_coins}
            </span>
          )}
          {event.reward_gems > 0 && (
            <span className="flex items-center gap-1 text-purple-400">
              💎 {event.reward_gems}
            </span>
          )}
          {event.reward_xp > 0 && (
            <span className="flex items-center gap-1 text-blue-400">
              ⭐ {event.reward_xp} XP
            </span>
          )}
        </div>

        {/* Action Button */}
        {onJoin && !isParticipating && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onJoin()
            }}
            className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold hover:opacity-90 transition-opacity"
          >
            Participar
          </button>
        )}

        {isParticipating && (
          <div className="w-full py-2 bg-green-500/20 border border-green-500 rounded-lg font-bold text-center text-green-400 text-sm">
            ✓ Participando
          </div>
        )}
      </div>
    </motion.div>
  )
}
