import React from 'react';
import { motion } from 'framer-motion';
import type { Achievement } from '../../../services/achievementService';

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
  index?: number;
}

const rarityColors: Record<Achievement['rarity'], { bg: string; border: string; text: string }> = {
  common: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' },
  uncommon: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' },
  rare: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
  epic: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700' },
  legendary: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700' },
};

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  unlocked,
  index = 0,
}) => {
  const colors = rarityColors[achievement.rarity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative p-4 rounded-lg border-2 transition-all ${
        unlocked
          ? `${colors.bg} ${colors.border} shadow-md hover:shadow-lg`
          : 'bg-gray-50 border-gray-200 opacity-60'
      }`}
    >
      {/* Badge Rarity */}
      {unlocked && (
        <div className="absolute top-2 right-2">
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${colors.text} ${colors.bg}`}>
            {achievement.rarity.toUpperCase()}
          </span>
        </div>
      )}

      {/* Icon */}
      <div className={`text-4xl mb-3 ${!unlocked ? 'opacity-40' : ''}`}>{achievement.icon}</div>

      {/* Content */}
      <h3 className="font-bold text-lg mb-1">{achievement.name}</h3>
      <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>

      {/* XP Reward */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-blue-600">+{achievement.xpReward} XP</span>
        {unlocked ? (
          <span className="text-xs font-bold text-green-600">✓ Desbloqueado</span>
        ) : (
          <span className="text-xs text-gray-500">Bloqueado</span>
        )}
      </div>

      {/* Unlock Animation */}
      {unlocked && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-green-400"
          initial={{ scale: 1.1, opacity: 1 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{ pointerEvents: 'none' }}
        />
      )}
    </motion.div>
  );
};
