/**
 * Battle Pass Component
 * Interface de Battle Pass com progressão de tiers (free + premium)
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Crown, Lock, CheckCircle, Trophy, Sparkles, Zap } from 'lucide-react'
import type { BattlePass, BattlePassTier, UserBattlePass } from '../../../types/monetization'

interface BattlePassProps {
  onUpgradeToPremium?: () => void
}

export function BattlePass({ onUpgradeToPremium }: BattlePassProps) {
  const [battlePass, setBattlePass] = useState<BattlePass | null>(null)
  const [userProgress, setUserProgress] = useState<UserBattlePass | null>(null)
  const [tiers, setTiers] = useState<BattlePassTier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBattlePassData()
  }, [])

  const fetchBattlePassData = async () => {
    try {
      // TODO: Implementar endpoint real
      const mockBattlePass: BattlePass = {
        id: '1',
        season_number: 1,
        name: 'Temporada Alpha',
        start_date: '2026-01-01',
        end_date: '2026-03-31',
        price_gems: 500,
        is_active: true,
        created_at: '2026-01-01'
      }

      const mockUserProgress: UserBattlePass = {
        id: '1',
        user_id: 'user-1',
        battle_pass_id: '1',
        is_premium: false,
        current_tier: 8,
        xp_earned: 3200,
        purchased_at: '2026-01-15',
        created_at: '2026-01-15'
      }

      const mockTiers: BattlePassTier[] = Array.from({ length: 30 }, (_, i) => ({
        id: `tier-${i + 1}`,
        battle_pass_id: '1',
        tier_number: i + 1,
        xp_required: 500 + (i * 200),
        free_reward_type: i % 3 === 0 ? 'coins' : 'xp',
        free_reward_amount: i % 3 === 0 ? 100 : 50,
        free_reward_cosmetic_id: null,
        premium_reward_type: i % 2 === 0 ? 'cosmetic' : 'gems',
        premium_reward_amount: i % 2 === 0 ? 0 : 10,
        premium_reward_cosmetic_id: i % 2 === 0 ? `cosmetic-${i}` : null,
        created_at: '2026-01-01'
      }))

      setBattlePass(mockBattlePass)
      setUserProgress(mockUserProgress)
      setTiers(mockTiers)
    } catch (error) {
      console.error('Erro ao buscar Battle Pass:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClaimReward = async (tierId: string, isPremium: boolean) => {
    try {
      // TODO: Implementar endpoint
      const res = await fetch(`/api/v1/battle-pass/claim/${tierId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_premium: isPremium })
      })

      const data = await res.json()

      if (data.success) {
        alert('Recompensa reivindicada!')
        fetchBattlePassData()
      } else {
        alert(data.error || 'Erro ao reivindicar recompensa')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao processar reivindicação')
    }
  }

  const calculateProgress = () => {
    if (!userProgress) return 0
    const currentTier = tiers.find(t => t.tier_number === userProgress.current_tier)
    if (!currentTier) return 0

    const xpInCurrentTier = userProgress.xp_earned - (tiers
      .filter(t => t.tier_number < userProgress.current_tier)
      .reduce((sum, t) => sum + t.xp_required, 0))

    return (xpInCurrentTier / currentTier.xp_required) * 100
  }

  const getRewardIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      coins: <span className="text-2xl">💰</span>,
      gems: <span className="text-2xl">💎</span>,
      cosmetic: <Sparkles size={24} className="text-purple-400" />,
      xp: <Zap size={24} className="text-yellow-400" />
    }
    return icons[type] || icons.coins
  }

  const getDaysRemaining = () => {
    if (!battlePass) return 0
    const endDate = new Date(battlePass.end_date)
    const now = new Date()
    const diff = endDate.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  if (loading) {
    return (
      <div className="bg-dark-200 rounded-xl p-6 border-2 border-purple-500/30">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-400 rounded w-1/3"></div>
          <div className="h-32 bg-dark-400 rounded"></div>
          <div className="h-64 bg-dark-400 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dark-200 rounded-xl p-6 border-2 border-purple-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-purple-400 flex items-center gap-2">
            <Trophy size={32} />
            {battlePass?.name || 'Battle Pass'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Temporada {battlePass?.season_number} • {getDaysRemaining()} dias restantes
          </p>
        </div>

        {!userProgress?.is_premium && (
          <button
            onClick={onUpgradeToPremium}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Crown size={20} />
            Upgrade Premium ({battlePass?.price_gems} gems)
          </button>
        )}

        {userProgress?.is_premium && (
          <div className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg font-bold flex items-center gap-2 text-dark-500">
            <Crown size={20} />
            Premium Ativo
          </div>
        )}
      </div>

      {/* Overall Progress */}
      <div className="bg-dark-300 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Tier Atual:</span>
            <span className="text-2xl font-bold text-purple-400">
              {userProgress?.current_tier || 0}
            </span>
            <span className="text-sm text-gray-400">/ {tiers.length}</span>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-400">XP Total</div>
            <div className="text-xl font-bold text-gold-400">
              {userProgress?.xp_earned.toLocaleString() || 0}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-4 bg-dark-400 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${calculateProgress()}%` }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          />
        </div>

        <p className="text-xs text-gray-400 mt-2 text-center">
          {Math.floor(calculateProgress())}% até o próximo tier
        </p>
      </div>

      {/* Tiers Grid */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {tiers.map((tier) => {
          const isUnlocked = userProgress && tier.tier_number <= userProgress.current_tier
          const isCurrent = userProgress && tier.tier_number === userProgress.current_tier

          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: tier.tier_number * 0.02 }}
              className={`bg-dark-300 rounded-lg p-4 border-2 ${
                isCurrent
                  ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                  : isUnlocked
                  ? 'border-green-500/30'
                  : 'border-dark-400'
              }`}
            >
              {/* Tier Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                    isUnlocked ? 'bg-purple-500 text-white' : 'bg-dark-400 text-gray-600'
                  }`}>
                    {tier.tier_number}
                  </div>

                  <div>
                    <div className="text-sm text-gray-400">Tier {tier.tier_number}</div>
                    <div className="text-xs text-gray-500">{tier.xp_required} XP</div>
                  </div>
                </div>

                {isCurrent && (
                  <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    ATUAL
                  </div>
                )}

                {isUnlocked && !isCurrent && (
                  <CheckCircle size={24} className="text-green-400" />
                )}
              </div>

              {/* Rewards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Free Reward */}
                <div className={`bg-dark-400 rounded-lg p-3 border ${
                  isUnlocked ? 'border-green-500/30' : 'border-dark-500'
                }`}>
                  <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <span>🆓</span> Gratuito
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {getRewardIcon(tier.free_reward_type)}
                    <div>
                      <div className="font-bold text-sm">
                        {tier.free_reward_type === 'coins' && `${tier.free_reward_amount} Coins`}
                        {tier.free_reward_type === 'xp' && `${tier.free_reward_amount} XP`}
                        {tier.free_reward_type === 'cosmetic' && 'Cosmético'}
                      </div>
                    </div>
                  </div>

                  {isUnlocked && (
                    <button
                      onClick={() => handleClaimReward(tier.id, false)}
                      className="w-full py-2 bg-green-500 hover:bg-green-600 rounded text-xs font-bold transition-colors"
                    >
                      Reivindicar
                    </button>
                  )}
                </div>

                {/* Premium Reward */}
                <div className={`bg-dark-400 rounded-lg p-3 border ${
                  userProgress?.is_premium
                    ? isUnlocked
                      ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-purple-500/10'
                      : 'border-purple-500/30'
                    : 'border-dark-500 opacity-60'
                }`}>
                  <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <Crown size={12} className="text-yellow-400" /> Premium
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {!userProgress?.is_premium && (
                      <Lock size={20} className="text-gray-600" />
                    )}
                    {userProgress?.is_premium && getRewardIcon(tier.premium_reward_type)}

                    <div>
                      <div className={`font-bold text-sm ${!userProgress?.is_premium ? 'text-gray-600' : ''}`}>
                        {tier.premium_reward_type === 'gems' && `${tier.premium_reward_amount} Gems`}
                        {tier.premium_reward_type === 'cosmetic' && 'Cosmético Exclusivo'}
                        {tier.premium_reward_type === 'coins' && `${tier.premium_reward_amount} Coins`}
                      </div>
                    </div>
                  </div>

                  {userProgress?.is_premium && isUnlocked && (
                    <button
                      onClick={() => handleClaimReward(tier.id, true)}
                      className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 rounded text-xs font-bold transition-opacity"
                    >
                      Reivindicar
                    </button>
                  )}

                  {!userProgress?.is_premium && (
                    <button
                      onClick={onUpgradeToPremium}
                      className="w-full py-2 bg-dark-500 hover:bg-dark-400 rounded text-xs font-bold transition-colors text-gray-400"
                    >
                      Desbloquear
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Premium Upsell Banner */}
      {!userProgress?.is_premium && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-center"
        >
          <Crown size={48} className="text-yellow-300 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">Desbloqueie o Battle Pass Premium!</h3>
          <p className="text-sm opacity-90 mb-4">
            +30 recompensas exclusivas • Cosméticos raros • Mais gems e coins
          </p>
          <button
            onClick={onUpgradeToPremium}
            className="px-8 py-3 bg-yellow-400 text-purple-900 rounded-lg font-bold hover:bg-yellow-300 transition-colors"
          >
            Upgrade por {battlePass?.price_gems} gems
          </button>
        </motion.div>
      )}
    </div>
  )
}
