/**
 * Crew Detail Component
 * Detalhes completos do crew com membros, chat e stats
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Users, TrendingUp, Crown, Star, MessageCircle, Settings } from 'lucide-react'
import { CrewChat } from './CrewChat'

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
}

interface CrewMember {
  id: string
  user_id: string
  role: 'leader' | 'officer' | 'member'
  xp_contributed: number
  joined_at: string
  user: {
    id: string
    username: string
    avatar_url?: string
    level: number
  }
}

interface CrewDetailProps {
  crewId: string
  isOpen: boolean
  onClose: () => void
  isMember?: boolean
}

export function CrewDetail({ crewId, isOpen, onClose, isMember = false }: CrewDetailProps) {
  const [crew, setCrew] = useState<Crew | null>(null)
  const [members, setMembers] = useState<CrewMember[]>([])
  const [activeTab, setActiveTab] = useState<'members' | 'chat' | 'stats'>('members')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchCrewData()
    }
  }, [isOpen, crewId])

  const fetchCrewData = async () => {
    try {
      setLoading(true)

      const [crewRes, membersRes] = await Promise.all([
        fetch(`/api/v1/crews/${crewId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`/api/v1/crews/${crewId}/members`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ])

      const [crewData, membersData] = await Promise.all([crewRes.json(), membersRes.json()])

      if (crewData.success) setCrew(crewData.data)
      if (membersData.success) setMembers(membersData.data)
    } catch (error) {
      console.error('Erro ao buscar crew:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    if (role === 'leader') return <Crown size={16} className="text-yellow-400" />
    if (role === 'officer') return <Star size={16} className="text-blue-400" />
    return null
  }

  const getRoleName = (role: string) => {
    if (role === 'leader') return 'Líder'
    if (role === 'officer') return 'Officer'
    return 'Membro'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-dark-200 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-2 border-purple-500/30"
      >
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : crew ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-dark-400">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-dark-400 rounded-lg"
              >
                <X size={24} />
              </button>

              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  {crew.avatar_url ? (
                    <img src={crew.avatar_url} alt={crew.name} className="w-full h-full rounded-lg" />
                  ) : (
                    <Users size={40} className="text-white" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {crew.tag && (
                      <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500 rounded text-purple-400 font-bold text-sm">
                        {crew.tag}
                      </span>
                    )}
                    <h2 className="text-2xl font-bold">{crew.name}</h2>
                    <div className="px-3 py-1 bg-gold-400 text-dark-500 rounded-lg font-bold text-sm">
                      Nv. {crew.level}
                    </div>
                  </div>
                  <p className="text-gray-400 mb-3">{crew.description}</p>

                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users size={16} className="text-blue-400" />
                      <span>
                        {crew.total_members}/50 membros
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp size={16} className="text-purple-400" />
                      <span>{crew.total_xp.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setActiveTab('members')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    activeTab === 'members'
                      ? 'bg-purple-500 text-white'
                      : 'bg-dark-400 text-gray-400 hover:bg-dark-300'
                  }`}
                >
                  Membros
                </button>
                {isMember && (
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                      activeTab === 'chat'
                        ? 'bg-purple-500 text-white'
                        : 'bg-dark-400 text-gray-400 hover:bg-dark-300'
                    }`}
                  >
                    <MessageCircle size={16} />
                    Chat
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    activeTab === 'stats'
                      ? 'bg-purple-500 text-white'
                      : 'bg-dark-400 text-gray-400 hover:bg-dark-300'
                  }`}
                >
                  Estatísticas
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
              {/* Members Tab */}
              {activeTab === 'members' && (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="bg-dark-300 rounded-lg p-3 flex items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">
                        {member.user.avatar_url ? (
                          <img
                            src={member.user.avatar_url}
                            alt={member.user.username}
                            className="w-full h-full rounded-full"
                          />
                        ) : (
                          member.user.username.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{member.user.username}</span>
                          {getRoleIcon(member.role)}
                          <span className="text-xs text-gray-400">{getRoleName(member.role)}</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          Nível {member.user.level} • {member.xp_contributed.toLocaleString()} XP contribuído
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === 'chat' && isMember && <CrewChat crewId={crewId} />}

              {/* Stats Tab */}
              {activeTab === 'stats' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-dark-300 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-purple-400">{crew.total_members}</div>
                      <div className="text-sm text-gray-400">Membros Totais</div>
                    </div>
                    <div className="bg-dark-300 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-gold-400">{crew.level}</div>
                      <div className="text-sm text-gray-400">Nível do Crew</div>
                    </div>
                    <div className="bg-dark-300 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-blue-400">
                        {crew.total_xp.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">XP Total</div>
                    </div>
                    <div className="bg-dark-300 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-green-400">
                        {Math.floor(crew.total_xp / crew.total_members).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">XP Médio/Membro</div>
                    </div>
                  </div>

                  <div className="bg-dark-300 rounded-lg p-4">
                    <h3 className="font-bold mb-3">Top Contribuidores</h3>
                    {members
                      .sort((a, b) => b.xp_contributed - a.xp_contributed)
                      .slice(0, 5)
                      .map((member, index) => (
                        <div key={member.id} className="flex items-center gap-3 py-2">
                          <div className="w-8 text-center font-bold text-gray-400">
                            #{index + 1}
                          </div>
                          <div className="flex-1">{member.user.username}</div>
                          <div className="font-bold text-purple-400">
                            {member.xp_contributed.toLocaleString()} XP
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-gray-400">Crew não encontrado</div>
        )}
      </motion.div>
    </div>
  )
}
