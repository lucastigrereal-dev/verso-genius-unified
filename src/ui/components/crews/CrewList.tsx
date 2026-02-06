/**
 * Crew List Component
 * Lista de crews com filtros e search
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Plus } from 'lucide-react'
import { CrewCard } from './CrewCard'

interface Crew {
  id: string
  name: string
  description: string
  tag?: string
  avatar_url?: string
  leader_id: string
  total_members: number
  total_xp: number
  level: number
  is_public: boolean
  require_approval: boolean
}

interface CrewListProps {
  onCreateCrew?: () => void
  onViewCrew?: (crew: Crew) => void
  onJoinCrew?: (crew: Crew) => void
}

export function CrewList({ onCreateCrew, onViewCrew, onJoinCrew }: CrewListProps) {
  const [crews, setCrews] = useState<Crew[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'level' | 'total_xp' | 'total_members' | 'created_at'>(
    'total_xp'
  )

  useEffect(() => {
    fetchCrews()
  }, [search, sortBy])

  const fetchCrews = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (search) params.append('search', search)
      params.append('sortBy', sortBy)
      params.append('limit', '50')

      const res = await fetch(`/api/v1/crews?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await res.json()

      if (data.success) {
        setCrews(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar crews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (crew: Crew) => {
    if (onJoinCrew) {
      onJoinCrew(crew)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gold-400">Crews Disponíveis</h2>
          <p className="text-sm text-gray-400">Encontre um crew ou crie o seu próprio</p>
        </div>

        {onCreateCrew && (
          <button
            onClick={onCreateCrew}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus size={20} />
            Criar Crew
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-dark-200 rounded-lg p-4 border border-dark-400">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar por nome ou tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-300 border border-dark-400 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-dark-300 border border-dark-400 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="total_xp">Maior XP</option>
              <option value="level">Maior Nível</option>
              <option value="total_members">Mais Membros</option>
              <option value="created_at">Mais Recentes</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-dark-300 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : crews.length === 0 ? (
        <div className="text-center py-12 bg-dark-200 rounded-lg border border-dark-400">
          <div className="text-6xl mb-3">🔍</div>
          <p className="text-gray-400">
            {search ? 'Nenhum crew encontrado' : 'Nenhum crew disponível'}
          </p>
          {onCreateCrew && (
            <button
              onClick={onCreateCrew}
              className="mt-4 px-6 py-2 bg-purple-500 rounded-lg font-bold hover:bg-purple-600 transition-colors"
            >
              Criar o Primeiro Crew
            </button>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {crews.map((crew) => (
            <CrewCard
              key={crew.id}
              crew={crew}
              onView={() => onViewCrew && onViewCrew(crew)}
              onJoin={() => handleJoin(crew)}
              showJoinButton={true}
            />
          ))}
        </motion.div>
      )}

      {/* Stats */}
      {crews.length > 0 && (
        <div className="text-center text-sm text-gray-400">
          Mostrando {crews.length} crew{crews.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
