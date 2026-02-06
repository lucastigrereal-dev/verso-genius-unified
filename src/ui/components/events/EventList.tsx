/**
 * Event List Component
 * Lista de eventos ativos com filtros
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Filter } from 'lucide-react'
import { EventCard } from './EventCard'

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

interface EventListProps {
  onViewEvent?: (event: Event) => void
  onJoinEvent?: (event: Event) => void
}

export function EventList({ onViewEvent, onJoinEvent }: EventListProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)

      const res = await fetch('/api/v1/events', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await res.json()

      if (data.success) {
        setEvents(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar eventos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter(
    (event) => filterType === 'all' || event.type === filterType
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gold-400 flex items-center gap-2">
            <Calendar size={28} />
            Eventos Ativos
          </h2>
          <p className="text-sm text-gray-400">Participe e ganhe recompensas exclusivas</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-dark-200 rounded-lg p-4 border border-dark-400">
        <div className="flex items-center gap-3">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-dark-300 border border-dark-400 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="all">Todos os Eventos</option>
            <option value="challenge">Desafios</option>
            <option value="tournament">Torneios</option>
            <option value="seasonal">Sazonais</option>
            <option value="special">Especiais</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-dark-300 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-dark-200 rounded-lg border border-dark-400">
          <div className="text-6xl mb-3">📅</div>
          <p className="text-gray-400">
            {filterType === 'all'
              ? 'Nenhum evento ativo no momento'
              : 'Nenhum evento deste tipo disponível'}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onView={() => onViewEvent && onViewEvent(event)}
              onJoin={() => onJoinEvent && onJoinEvent(event)}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}
