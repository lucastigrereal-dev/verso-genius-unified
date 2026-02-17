import React from 'react';
import { motion } from 'framer-motion';

interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  base_xp: number;
  type: string;
}

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  completed?: boolean;
  score?: number;
  onClick?: () => void;
}

const EXERCISE_ICONS: Record<string, string> = {
  listening: '👂',
  matching: '🎯',
  fill_blank: '✍️',
  production: '🎤',
  speed: '⚡',
  rhythm: '🥁',
  comparison: '⚖️',
  simulation: '🎮',
  freestyle: '🎵'
};

const DIFFICULTY_COLORS = {
  easy: 'from-green-400 to-green-600',
  medium: 'from-yellow-400 to-yellow-600',
  hard: 'from-red-400 to-red-600'
};

const DIFFICULTY_LABELS = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil'
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  index,
  completed = false,
  score = 0,
  onClick
}) => {
  const icon = EXERCISE_ICONS[exercise.type] || '📝';
  const difficultyColor = DIFFICULTY_COLORS[exercise.difficulty];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        p-4 rounded-lg border-2 cursor-pointer transition-all
        ${completed
          ? 'bg-green-50 border-green-300'
          : 'bg-white border-gray-300 hover:border-blue-400'
        }
      `}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="text-3xl flex-shrink-0">{icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900">
                {index}. {exercise.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>
            </div>

            {completed && (
              <span className="text-2xl flex-shrink-0">✅</span>
            )}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center gap-3">
            <span className={`
              px-3 py-1 rounded-full text-xs font-semibold text-white
              bg-gradient-to-r ${difficultyColor}
            `}>
              {DIFFICULTY_LABELS[exercise.difficulty]}
            </span>

            <span className="text-sm font-semibold text-yellow-600">
              +{exercise.base_xp} XP
            </span>

            {completed && score > 0 && (
              <span className="text-sm font-semibold text-green-600">
                Score: {score}/100
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
