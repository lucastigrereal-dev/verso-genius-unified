/**
 * GachaBanner Component
 * Display de banner de gacha com informações de rate-up e pity
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Gift, Clock, Info } from 'lucide-react'

interface GachaBannerProps {
  banner: {
    id: string
    name: string
    description: string
    banner_image_url: string
    start_date: string
    end_date: string
    featured_cosmetic_ids: string[]
    rate_up_multiplier: number
    pity_threshold: number
    cost_gems: number
    multi_pull_discount: number
    banner_type: string
  }
  pityStatus?: {
    pulls_since_last_legendary: number
    total_pulls: number
    spark_tokens: number
  }
  onPull: (type: 'single' | 'multi') => void
  userGems?: number
}

export function GachaBanner({ banner, pityStatus, onPull, userGems = 0 }: GachaBannerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [showInfo, setShowInfo] = useState(false)

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const end = new Date(banner.end_date).getTime()
      const distance = end - now

      if (distance < 0) {
        setTimeLeft('Expirado')
        return
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

      setTimeLeft(`${days}d ${hours}h`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Atualizar a cada minuto

    return () => clearInterval(interval)
  }, [banner.end_date])

  // Calcular custo do multi-pull
  const baseCost = banner.cost_gems * 10
  const discount = Math.floor(baseCost * (banner.multi_pull_discount / 100))
  const multiCost = baseCost - discount

  // Calcular progresso do pity
  const pityProgress = pityStatus ? (pityStatus.pulls_since_last_legendary / banner.pity_threshold) * 100 : 0
  const pullsUntilPity = pityStatus ? banner.pity_threshold - pityStatus.pulls_since_last_legendary : banner.pity_threshold

  // Tipo de banner (cores)
  const bannerTypeColors = {
    standard: 'from-blue-600 to-purple-600',
    limited: 'from-yellow-600 to-orange-600',
    seasonal: 'from-green-600 to-teal-600',
    character: 'from-pink-600 to-rose-600'
  }

  const gradientClass = bannerTypeColors[banner.banner_type as keyof typeof bannerTypeColors] || bannerTypeColors.standard

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl shadow-2xl"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${banner.banner_image_url})` }}
      >
        <div className={`absolute inset-0 bg-gradient-to-t ${gradientClass} opacity-60`} />
      </div>

      {/* Content */}
      <div className="relative p-6 text-white">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">{banner.name}</h2>
            <p className="text-white/80">{banner.description}</p>
          </div>

          {/* Info Button */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition"
          >
            <Info size={20} />
          </button>
        </div>

        {/* Rate-Up Badge */}
        {banner.featured_cosmetic_ids.length > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 backdrop-blur-sm rounded-full mb-4">
            <TrendingUp size={16} />
            <span className="text-sm font-semibold">
              RATE-UP {banner.rate_up_multiplier}x
            </span>
          </div>
        )}

        {/* Timer */}
        <div className="flex items-center gap-2 mb-6">
          <Clock size={16} className="text-white/60" />
          <span className="text-sm text-white/80">Termina em: {timeLeft}</span>
        </div>

        {/* Pity Progress */}
        {pityStatus && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Sparkles size={14} className="text-yellow-400" />
                Pity System
              </span>
              <span className="text-sm">
                {pullsUntilPity} pulls até legendary
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                initial={{ width: 0 }}
                animate={{ width: `${pityProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Spark Tokens */}
            <div className="flex items-center gap-2 mt-3 text-sm">
              <Gift size={14} className="text-purple-400" />
              <span>Sparks: {pityStatus.spark_tokens}</span>
            </div>
          </div>
        )}

        {/* Info Panel (expandível) */}
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mb-6 p-4 bg-black/30 backdrop-blur-sm rounded-lg"
          >
            <h3 className="font-bold mb-2">Taxas de Drop</h3>
            <ul className="text-sm space-y-1 text-white/80">
              <li>⭐ Legendary: 1% (garantido em {banner.pity_threshold} pulls)</li>
              <li>💎 Epic: 5%</li>
              <li>🔷 Rare: 20%</li>
              <li>⚪ Common: 74%</li>
            </ul>

            <h3 className="font-bold mt-3 mb-2">Como Funciona</h3>
            <p className="text-sm text-white/80">
              A cada {banner.pity_threshold} pulls sem legendary, você está GARANTIDO um legendary no próximo pull!
              Cada pull também concede 1 Spark Token, que pode ser trocado por cosméticos específicos.
            </p>
          </motion.div>
        )}

        {/* Pull Buttons */}
        <div className="flex gap-4">
          {/* Single Pull */}
          <button
            onClick={() => onPull('single')}
            disabled={userGems < banner.cost_gems}
            className="flex-1 py-4 bg-white/20 backdrop-blur-sm rounded-xl font-bold hover:bg-white/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles size={18} />
              <span>Pull 1x</span>
            </div>
            <div className="text-sm mt-1">
              {banner.cost_gems} gems
            </div>
          </button>

          {/* Multi Pull */}
          <button
            onClick={() => onPull('multi')}
            disabled={userGems < multiCost}
            className="flex-1 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold hover:from-yellow-600 hover:to-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-2">
              <Gift size={18} />
              <span>Pull 10x</span>
            </div>
            <div className="text-sm mt-1">
              {multiCost} gems
              <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">
                -{banner.multi_pull_discount}%
              </span>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
