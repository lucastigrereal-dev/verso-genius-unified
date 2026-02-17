import React from 'react';
import { motion } from 'framer-motion';
import type { DailyMission } from '../../../services/achievementService';

interface DailyMissionCardProps {
  mission: DailyMission;
}

const missionIcons: Record<string, string> = {
  exercises: '📚',
  xp: '⭐',
  streak: '🔥',
  correct_answers: '✅',
};

export const DailyMissionCard: React.FC<DailyMissionCardProps> = ({ mission }) => {
  const progress = Math.round((mission.current / mission.target) * 100);
  const icon = missionIcons[mission.type] || '🎯';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-lg border-2 transition-all ${
        mission.completed
          ? 'bg-green-50 border-green-400 shadow-md'
          : 'bg-white border-orange-300 shadow'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{icon}</span>
            <h3 className="font-bold text-lg">{mission.title}</h3>
          </div>
          <p className="text-sm text-gray-600">{mission.description}</p>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg text-blue-600">+{mission.xpReward} XP</div>
          {mission.completed && <span className="text-xs text-green-600 font-bold">✓ COMPLETO</span>}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600">
            {mission.current} / {mission.target}
          </span>
          <span className="font-bold text-gray-700">{progress}%</span>
        </div>
        <motion.div
          className="w-full h-3 bg-gray-200 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className={`h-full rounded-full ${
              mission.completed ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-orange-400 to-yellow-400'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};
