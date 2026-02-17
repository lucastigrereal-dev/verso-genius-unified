import React from 'react';
import { motion } from 'framer-motion';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showRing?: boolean;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  size = 'md',
  animated = false,
  showRing = false
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-24 h-24 text-4xl'
  };

  const colors = {
    1: 'from-gray-400 to-gray-600',       // Bronze
    10: 'from-gray-300 to-gray-500',      // Silver
    20: 'from-yellow-400 to-yellow-600',  // Gold
    30: 'from-cyan-400 to-cyan-600',      // Platinum
    50: 'from-purple-500 to-pink-600'     // Legendary
  };

  let colorClass = colors[1];
  if (level >= 30) colorClass = colors[50];
  else if (level >= 20) colorClass = colors[20];
  else if (level >= 10) colorClass = colors[10];

  return (
    <motion.div
      className={`
        relative flex items-center justify-center rounded-full
        bg-gradient-to-br ${colorClass} font-bold text-white
        shadow-lg ${sizeClasses[size]}
      `}
      animate={animated ? { scale: [1, 1.05, 1] } : undefined}
      transition={animated ? { duration: 2, repeat: Infinity } : undefined}
    >
      {level}

      {/* Anel brilhante para nivel > 20 */}
      {showRing && level > 20 && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-yellow-300"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};
