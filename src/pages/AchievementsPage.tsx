import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AchievementCard, DailyMissionCard } from '../ui/components/achievements';
import { AchievementService, ACHIEVEMENTS } from '../services/achievementService';
import { XPService } from '../services/xpService';
import { LevelService } from '../services/levelService';
import { StreakService } from '../services/streakService';

type FilterType = 'all' | 'milestone' | 'mission' | 'streak' | 'special';

export function AchievementsPage() {
  const [filter, setFilter] = useState<FilterType>('all');

  // Get current stats
  const totalXP = XPService.getTotalXP();
  const currentLevel = LevelService.getCurrentLevel(totalXP);
  const currentStreak = StreakService.getCurrentStreak();
  const totalExercisesCompleted = XPService.getTotalExercisesCount();
  const totalCorrectAnswers = XPService.getTotalCorrectAnswers();

  const stats = {
    totalXP,
    currentLevel,
    currentStreak,
    totalExercisesCompleted,
    totalCorrectAnswers,
    bestStreak: StreakService.getBestStreak(),
    exercisesByType: {},
    dailyMissionsCompleted: 0,
    achievementsUnlocked: AchievementService.getUnlockedAchievements(),
  };

  // Check new achievements
  const allAchievementsWithStatus = AchievementService.getAllAchievementsWithStatus();
  const progress = AchievementService.getProgress();
  const todayMission = AchievementService.getTodayMission();

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    if (filter === 'all') return allAchievementsWithStatus;
    return allAchievementsWithStatus.filter((a) => a.category === filter);
  }, [filter, allAchievementsWithStatus]);

  const unlockedCount = filteredAchievements.filter((a) => a.unlocked).length;
  const totalCount = filteredAchievements.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white pt-8 pb-6 px-4"
      >
        <h1 className="text-4xl font-bold mb-2">🏆 Achievements</h1>
        <p className="text-purple-100">Desbloqueie badges e complete missões diárias!</p>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500"
        >
          <h2 className="text-2xl font-bold mb-4">📊 Seu Progresso</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{stats.totalXP}</div>
              <div className="text-sm text-gray-600">XP Total</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{stats.currentLevel}</div>
              <div className="text-sm text-gray-600">Nível Atual</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{stats.currentStreak}</div>
              <div className="text-sm text-gray-600">Streak Dias</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{progress.unlocked}</div>
              <div className="text-sm text-gray-600">Achievements</div>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold">Achievements Desbloqueados</span>
              <span className="text-sm font-bold text-purple-600">
                {progress.unlocked} / {progress.total} ({progress.percentage}%)
              </span>
            </div>
            <motion.div
              className="w-full h-4 bg-gray-200 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Daily Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold mb-4">📅 Missão do Dia</h2>
          <DailyMissionCard mission={todayMission} />
          {todayMission.completed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-bold"
            >
              ✨ Missão completada! Você ganhou +{todayMission.xpReward} XP
            </motion.div>
          )}
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'milestone', 'mission', 'streak', 'special'] as const).map((filterType) => (
            <motion.button
              key={filterType}
              onClick={() => setFilter(filterType)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                filter === filterType
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterType === 'all' && '🏆 Todos'}
              {filterType === 'milestone' && '📍 Milestones'}
              {filterType === 'mission' && '📋 Missões'}
              {filterType === 'streak' && '🔥 Streaks'}
              {filterType === 'special' && '⭐ Especiais'}
            </motion.button>
          ))}
        </div>

        {/* Achievements Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {filter === 'all'
                ? '🎖️ Todos os Achievements'
                : `${unlockedCount} / ${totalCount} Desbloqueados`}
            </h2>
          </div>

          {filteredAchievements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Nenhum achievement nesta categoria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements.map((achievement, index) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={achievement.unlocked}
                  index={index}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold mb-4">📈 Estatísticas Gerais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Exercícios Completados</div>
              <div className="text-3xl font-bold text-blue-600">
                {stats.totalExercisesCompleted}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Respostas Corretas</div>
              <div className="text-3xl font-bold text-green-600">{stats.totalCorrectAnswers}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Melhor Streak</div>
              <div className="text-3xl font-bold text-orange-600">{stats.bestStreak} dias</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Taxa de Acerto</div>
              <div className="text-3xl font-bold text-purple-600">
                {stats.totalExercisesCompleted > 0
                  ? Math.round((stats.totalCorrectAnswers / stats.totalExercisesCompleted) * 100)
                  : 0}
                %
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
