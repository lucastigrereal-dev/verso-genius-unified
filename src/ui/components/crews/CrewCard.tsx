/**
 * Crew Card Component
 * Display compacto de crew com info e botão de ação
 */

import { motion } from 'framer-motion'
import { Users, TrendingUp, Crown, Shield } from 'lucide-react'

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

interface CrewCardProps {
  crew: Crew
  onJoin?: () => void
  onView?: () => void
  showJoinButton?: boolean
}

export function CrewCard({ crew, onJoin, onView, showJoinButton = true }: CrewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-dark-300 rounded-lg p-4 border-2 border-dark-400 hover:border-purple-500/50 transition-all cursor-pointer"
      onClick={onView}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          {crew.avatar_url ? (
            <img
              src={crew.avatar_url}
              alt={crew.name}
              className="w-full h-full rounded-lg object-cover"
            />
          ) : (
            <Shield size={32} className="text-white" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {crew.tag && (
              <span className="text-xs px-2 py-0.5 bg-purple-500/20 border border-purple-500 rounded text-purple-400 font-bold">
                {crew.tag}
              </span>
            )}
            <h3 className="font-bold text-lg truncate">{crew.name}</h3>
          </div>

          <p className="text-sm text-gray-400 line-clamp-2">{crew.description}</p>
        </div>

        {/* Level Badge */}
        <div className="bg-gold-400 text-dark-500 px-3 py-1 rounded-lg font-bold text-sm">
          Nv. {crew.level}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-dark-400 rounded p-2 flex items-center gap-2">
          <Users size={16} className="text-blue-400" />
          <div className="flex-1">
            <div className="text-xs text-gray-400">Membros</div>
            <div className="font-bold">{crew.total_members}/50</div>
          </div>
        </div>

        <div className="bg-dark-400 rounded p-2 flex items-center gap-2">
          <TrendingUp size={16} className="text-purple-400" />
          <div className="flex-1">
            <div className="text-xs text-gray-400">XP Total</div>
            <div className="font-bold">{crew.total_xp.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {crew.is_public ? (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Público
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-400 rounded-full"></span>
              Privado
            </span>
          )}
          {crew.require_approval && <span>• Requer aprovação</span>}
        </div>

        {showJoinButton && onJoin && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onJoin()
            }}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm font-bold transition-colors"
          >
            Entrar
          </button>
        )}
      </div>
    </motion.div>
  )
}
