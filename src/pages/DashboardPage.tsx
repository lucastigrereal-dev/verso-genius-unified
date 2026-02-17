import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { XPService } from '../services/xpService';
import { LevelService } from '../services/levelService';
import { StreakService } from '../services/streakService';
import { DailyChallengeService } from '../services/dailyChallengeService';

import { XPBar } from '../ui/components/gamification/XPBar';
import { LevelBadge } from '../ui/components/gamification/LevelBadge';
import { StreakIndicator } from '../ui/components/gamification/StreakIndicator';
import { DailyChallengeCard } from '../ui/components/gamification/DailyChallengeCard';

interface LevelProgress {
  currentLevel: number;
  currentXP: number;
  xpForNextLevel: number;
  xpProgress: number;
  percentToNextLevel: number;
  isLevelUp: boolean;
}

interface StreakStatus {
  currentStreak: number;
  bestStreak: number;
  multiplier: number;
  lastActivityDate: string | null;
  isStreakAtRisk: boolean;
  canContinueToday: boolean;
}

interface DailyChallenge {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'exercise' | 'theme' | 'xp_goal' | 'battle';
  target: any;
  reward_xp: number;
  completed: boolean;
  progress: number;
}

const DashboardPage: React.FC = () => {
  const userId = 'local_user';
  const [totalXP, setTotalXP] = useState(0);
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null);
  const [streak, setStreak] = useState<StreakStatus | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGameData = () => {
      try {
        // Load XP
        const xp = XPService.getTotalXP(userId);
        setTotalXP(xp);

        // Load level progress
        const progress = LevelService.getLevelProgress(xp);
        setLevelProgress(progress);

        // Load streak
        const streakStatus = StreakService.checkStreak(userId);
        setStreak(streakStatus);

        // Load daily challenge
        const challenge = DailyChallengeService.getTodayChallenge(userId);
        setDailyChallenge(challenge);
      } catch (error) {
        console.error('Error loading game data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGameData();
  }, []);

  const handleChallengeClick = () => {
    if (dailyChallenge && !dailyChallenge.completed) {
      DailyChallengeService.completeChallenge(userId, dailyChallenge.id);
      setDailyChallenge({
        ...dailyChallenge,
        completed: true,
        progress: 100
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-dark-500 to-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-4xl"
        >
          ⚡
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-dark-500 to-gray-900 text-white">
      {/* Container */}
      <div className="container mx-auto p-6 space-y-8">
        {/* Header with Level Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Seu progresso em Aprenda Rima</p>
          </div>

          {levelProgress && (
            <LevelBadge
              level={levelProgress.currentLevel}
              size="lg"
              animated={false}
              showRing={levelProgress.currentLevel > 20}
            />
          )}
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: XP & Streak */}
          <div className="lg:col-span-2 space-y-6">
            {/* XP Progress */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-blue-900 to-purple-900 p-6 rounded-xl shadow-lg"
            >
              <h2 className="text-lg font-bold mb-4 text-white">Experiência</h2>
              {levelProgress && (
                <XPBar
                  currentXP={levelProgress.xpProgress}
                  neededXP={levelProgress.xpForNextLevel}
                  level={levelProgress.currentLevel}
                />
              )}
              <p className="text-xs text-gray-300 mt-4">
                XP Total: <span className="font-bold text-yellow-400">{totalXP}</span>
              </p>
            </motion.div>

            {/* Streak Indicator */}
            {streak && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <StreakIndicator
                  currentStreak={streak.currentStreak}
                  bestStreak={streak.bestStreak}
                  isAtRisk={streak.isStreakAtRisk}
                  multiplier={streak.multiplier}
                />
              </motion.div>
            )}

            {/* Daily Challenge */}
            {dailyChallenge && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-lg font-bold mb-3 text-white">Desafio do Dia</h2>
                <DailyChallengeCard
                  title={dailyChallenge.title}
                  description={dailyChallenge.description}
                  reward_xp={dailyChallenge.reward_xp}
                  completed={dailyChallenge.completed}
                  progress={dailyChallenge.progress}
                  onClick={handleChallengeClick}
                />
              </motion.div>
            )}
          </div>

          {/* Right Column: Stats & Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-lg h-fit"
          >
            <h2 className="text-lg font-bold mb-6 text-white">Estatísticas</h2>

            <div className="space-y-4">
              {levelProgress && (
                <>
                  <div className="border-b border-gray-700 pb-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Nível</p>
                    <p className="text-3xl font-bold text-yellow-400">
                      {levelProgress.currentLevel}
                    </p>
                  </div>

                  <div className="border-b border-gray-700 pb-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Progresso para Próximo</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {levelProgress.percentToNextLevel}%
                    </p>
                  </div>
                </>
              )}

              {streak && (
                <div className="border-b border-gray-700 pb-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Streak Atual</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {streak.currentStreak} dias
                  </p>
                </div>
              )}

              {dailyChallenge && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Recompensa Dia</p>
                  <p className="text-2xl font-bold text-green-400">
                    +{dailyChallenge.reward_xp} XP
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-gray-700 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase">Ações</h3>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors">
                Iniciar Exercício
              </button>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors">
                Ver Histórico
              </button>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-lg font-bold mb-4 text-white">Histórico de XP Recente</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {XPService.getXPHistory(userId, 10).map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-700">
                <div>
                  <p className="text-sm font-semibold text-white">{entry.source}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(entry.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-yellow-400">+{entry.amount} XP</p>
                  <p className="text-xs text-gray-400">×{entry.multiplier.toFixed(1)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
