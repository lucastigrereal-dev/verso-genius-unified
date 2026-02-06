/**
 * Leaderboard Component
 * Display de rankings com múltiplos tabs (Global, Semanal, Amigos, Batalhas)
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Users, Zap, Medal, Crown } from 'lucide-react'

interface LeaderboardEntry {
  user_id: string
  username: string
  avatar_url?: string
  level: number
  score: number
  rank: number
  badge?: string
}

type LeaderboardTab = 'global' | 'weekly' | 'friends' | 'battle_wins'

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('global')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [userRank, setUserRank] = useState<number | null>(null)
  const [userScore, setUserScore] = useState<number>(0)

  useEffect(() => {
    fetchLeaderboard()
    fetchUserRank()
  }, [activeTab])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)

      const endpoint = {
        global: '/api/v1/leaderboard/global',
        weekly: '/api/v1/leaderboard/weekly',
        friends: '/api/v1/leaderboard/friends',
        battle_wins: '/api/v1/leaderboard/battle-wins'
      }[activeTab]

      const res = await fetch(`${endpoint}?limit=50`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await res.json()

      if (data.success) {
        setEntries(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserRank = async () => {
    try {
      const typeMap = {
        global: 'global',
        weekly: 'weekly',
        friends: 'global',
        battle_wins: 'battle_wins'
      }

      const res = await fetch(`/api/v1/leaderboard/rank?type=${typeMap[activeTab]}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await res.json()

      if (data.success) {
        setUserRank(data.data.rank)
        setUserScore(data.data.score)
      }
    } catch (error) {
      console.error('Erro ao buscar rank:', error)
    }
  }

  const getScoreLabel = () => {
    if (activeTab === 'battle_wins') return 'Vitórias'
    if (activeTab === 'weekly') return 'XP Semanal'
    return 'XP Total'
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400'
    if (rank === 2) return 'text-gray-300'
    if (rank === 3) return 'text-orange-400'
    if (rank <= 10) return 'text-purple-400'
    return 'text-gray-500'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={24} className="text-yellow-400" />
    if (rank === 2) return <Medal size={24} className="text-gray-300" />
    if (rank === 3) return <Medal size={24} className="text-orange-400" />
    return <div className="w-6 h-6 flex items-center justify-center text-sm font-bold">{rank}</div>
  }

  const tabs = [
    { id: 'global' as LeaderboardTab, label: 'Global', icon: <Trophy size={16} /> },
    { id: 'weekly' as LeaderboardTab, label: 'Semanal', icon: <TrendingUp size={16} /> },
    { id: 'friends' as LeaderboardTab, label: 'Amigos', icon: <Users size={16} /> },
    { id: 'battle_wins' as LeaderboardTab, label: 'Batalhas', icon: <Zap size={16} /> }
  ]

  return (
    <div className="bg-dark-200 rounded-xl border-2 border-gold-400/30 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-dark-400">
        <h2 className="text-2xl font-bold text-gold-400 flex items-center gap-2 mb-4">
          <Trophy size={28} />
          Rankings
        </h2>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-gold-400 text-dark-500'
                  : 'bg-dark-400 text-gray-400 hover:bg-dark-300'
              }`}
            >
              {tab.icon}
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* User Rank Card */}
      {userRank && (
        <div className="p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-dark-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">
                #{userRank}
              </div>
              <div>
                <div className="text-sm text-gray-400">Sua Posição</div>
                <div className="font-bold text-lg">#{userRank.toLocaleString()}</div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-400">{getScoreLabel()}</div>
              <div className="font-bold text-lg text-gold-400">
                {userScore.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-dark-300 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trophy size={48} className="mx-auto mb-3 opacity-50" />
            <p>Nenhum dado disponível</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                  entry.rank <= 3
                    ? 'bg-gradient-to-r from-dark-300 to-dark-400 border border-gold-400/30'
                    : 'bg-dark-300 hover:bg-dark-400'
                }`}
              >
                {/* Rank */}
                <div className={`w-12 flex items-center justify-center ${getRankColor(entry.rank)}`}>
                  {getRankIcon(entry.rank)}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm">
                  {entry.avatar_url ? (
                    <img
                      src={entry.avatar_url}
                      alt={entry.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    entry.username.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-bold truncate">{entry.username}</div>
                    {entry.badge && <span className="text-lg">{entry.badge}</span>}
                  </div>
                  <div className="text-xs text-gray-400">Nível {entry.level}</div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="font-bold text-gold-400">{entry.score.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">{getScoreLabel()}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-dark-400 bg-dark-300 text-center">
        <p className="text-xs text-gray-400">
          {activeTab === 'weekly' && 'Ranking resetado toda segunda-feira às 00:00'}
          {activeTab === 'global' && 'Ranking baseado em XP total acumulado'}
          {activeTab === 'battle_wins' && 'Ranking baseado em vitórias em batalhas'}
          {activeTab === 'friends' && 'Ranking entre você e seus amigos'}
        </p>
      </div>
    </div>
  )
}
