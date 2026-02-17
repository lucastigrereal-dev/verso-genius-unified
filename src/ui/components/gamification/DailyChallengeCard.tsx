import React from 'react';
import { motion } from 'framer-motion';

interface DailyChallengCardProps {
  title: string;
  description: string;
  reward_xp: number;
  completed: boolean;
  progress: number;
  onClick?: () => void;
}

export const DailyChallengeCard: React.FC<DailyChallengCardProps> = ({
  title,
  description,
  reward_xp,
  completed,
  progress,
  onClick
}) => {
  return (
    <motion.div
      className={`
        p-4 rounded-lg border-2 cursor-pointer transition-all
        ${completed
          ? 'bg-green-50 border-green-300'
          : 'bg-white border-blue-200 hover:border-blue-400'
        }
      `}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-bold text-sm">{title}</h3>
        {completed && <span className="text-xl">✅</span>}
      </div>

      <p className="text-xs text-gray-600 mb-3">{description}</p>

      {/* Progress Bar */}
      {!completed && progress > 0 && (
        <div className="mb-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Reward */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600">
          {progress}% completo
        </span>
        <span className="text-sm font-bold text-yellow-600">+{reward_xp} XP</span>
      </div>
    </motion.div>
  );
};
