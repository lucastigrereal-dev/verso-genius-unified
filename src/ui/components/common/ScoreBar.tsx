import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface ScoreBarProps {
  score: number;
  maxScore?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBar({
  score,
  maxScore = 10,
  showLabel = true,
  size = 'md',
}: ScoreBarProps) {
  const percentage = Math.min((score / maxScore) * 100, 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const getScoreColor = (score: number): string => {
    if (score >= 9) return 'from-gold-400 to-yellow-500';
    if (score >= 7) return 'from-green-400 to-emerald-500';
    if (score >= 5) return 'from-blue-400 to-cyan-500';
    return 'from-gray-400 to-gray-500';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 9) return 'Excelente';
    if (score >= 8) return 'Otimo';
    if (score >= 7) return 'Bom';
    if (score >= 5) return 'Regular';
    return 'Baixo';
  };

  return (
    <div className="w-full" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={maxScore}>
      {showLabel && (
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm font-medium text-gray-400">
            <Star className="h-4 w-4 text-gold-400" />
            Score
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{getScoreLabel(score)}</span>
            <span className="font-display text-lg font-bold text-gold-400">
              {score.toFixed(1)}
              <span className="text-sm text-gray-500">/{maxScore}</span>
            </span>
          </div>
        </div>
      )}

      <div className={`w-full overflow-hidden rounded-full bg-dark-300 ${sizeClasses[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-r ${getScoreColor(score)}`}
          style={{
            boxShadow: score >= 8 ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none',
          }}
        />
      </div>

      {/* Star indicators */}
      <div className="mt-2 flex justify-between" aria-hidden="true">
        {[...Array(5)].map((_, i) => {
          const starThreshold = (i + 1) * 2;
          const isFilled = score >= starThreshold;
          const isPartial = score >= starThreshold - 1 && score < starThreshold;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i + 0.5 }}
            >
              <Star
                className={`h-4 w-4 transition-colors ${
                  isFilled
                    ? 'fill-gold-400 text-gold-400'
                    : isPartial
                    ? 'fill-gold-400/50 text-gold-400'
                    : 'text-dark-100'
                }`}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
