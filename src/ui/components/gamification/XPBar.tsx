import React from 'react';
import { motion } from 'framer-motion';

interface XPBarProps {
  currentXP: number;
  neededXP: number;
  level: number;
  animatePopup?: boolean;
  popupText?: string;
}

export const XPBar: React.FC<XPBarProps> = ({
  currentXP,
  neededXP,
  level,
  animatePopup,
  popupText
}) => {
  const percentage = Math.min((currentXP / neededXP) * 100, 100);

  return (
    <div className="space-y-1">
      {/* XP Progress Bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-600">Level {level}</span>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-xs font-semibold text-gray-600">
          {currentXP}/{neededXP}
        </span>
      </div>

      {/* XP Popup Animation */}
      {animatePopup && popupText && (
        <motion.div
          className="absolute text-lg font-bold text-yellow-500"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -30 }}
          transition={{ duration: 1 }}
        >
          {popupText}
        </motion.div>
      )}
    </div>
  );
};
