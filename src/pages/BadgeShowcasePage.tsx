import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AchievementService, ACHIEVEMENTS } from '../services/achievementService';

type FilterType = 'all' | 'unlocked' | 'locked';

export function BadgeShowcasePage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const allAchievements = AchievementService.getAllAchievementsWithStatus();
  const progress = AchievementService.getProgress();

  const filtered = allAchievements.filter((a) => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  });

  const groupedByCategory = filtered.reduce(
    (acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    },
    {} as Record<string, typeof filtered>,
  );

  const categoryLabels = {
    milestone: '📍 Milestones',
    mission: '📋 Missões',
    streak: '🔥 Streaks',
    special: '⭐ Especiais',
  };

  const rarityGradients = {
    common: 'from-gray-400 to-gray-600',
    uncommon: 'from-green-400 to-green-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white pt-8 pb-6 px-4"
      >
        <h1 className="text-4xl font-bold mb-2">🎖️ Vitrine de Badges</h1>
        <p className="text-purple-100">Exiba seus achievements e mostre seu progresso!</p>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-700 to-pink-700 rounded-lg shadow-xl p-6 text-white"
        >
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-2">Seu Progresso</h2>
            <p className="text-purple-100">
              {progress.unlocked} de {progress.total} achievements desbloqueados ({progress.percentage}%)
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso Geral</span>
              <span className="font-bold">{progress.percentage}%</span>
            </div>
            <motion.div
              className="w-full h-4 bg-white bg-opacity-20 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-green-400 to-green-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.8 }}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'unlocked', 'locked'] as const).map((filterType) => (
            <motion.button
              key={filterType}
              onClick={() => setFilter(filterType)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                filter === filterType
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {filterType === 'all' && '🏆 Todos'}
              {filterType === 'unlocked' && '✅ Desbloqueados'}
              {filterType === 'locked' && '🔒 Bloqueados'}
            </motion.button>
          ))}
        </div>

        {/* Categories */}
        {Object.entries(groupedByCategory).map(([category, achievements], categoryIndex) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-white">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {achievements.map((achievement, i) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: categoryIndex * 0.1 + i * 0.02 }}
                  whileHover={{ scale: 1.1 }}
                  className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    achievement.unlocked
                      ? `bg-gradient-to-br ${rarityGradients[achievement.rarity]} border-yellow-300 shadow-lg`
                      : 'bg-slate-700 border-slate-600 opacity-40'
                  }`}
                >
                  {/* Icon */}
                  <div className="text-4xl mb-2 text-center">{achievement.icon}</div>

                  {/* Name */}
                  <div className="text-xs font-bold text-center truncate text-white mb-1">
                    {achievement.name}
                  </div>

                  {/* Rarity Badge */}
                  {achievement.unlocked && (
                    <div className="absolute top-1 right-1 bg-yellow-300 text-xs font-bold px-2 py-1 rounded-full">
                      {achievement.rarity.toUpperCase().slice(0, 3)}
                    </div>
                  )}

                  {/* Unlock Check */}
                  {achievement.unlocked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="text-2xl">✓</div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Empty State */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-slate-400 text-lg">Nenhum achievement nesta categoria</p>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800 rounded-lg p-6 border border-slate-700"
        >
          <h2 className="text-2xl font-bold text-white mb-4">📊 Estatísticas de Raridade</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['common', 'uncommon', 'rare', 'epic', 'legendary'].map((rarity) => {
              const count = allAchievements.filter(
                (a) => a.rarity === rarity && a.unlocked,
              ).length;
              const total = allAchievements.filter((a) => a.rarity === rarity).length;
              return (
                <div key={rarity} className={`bg-gradient-to-br ${rarityGradients[rarity as keyof typeof rarityGradients]} rounded-lg p-4 text-white`}>
                  <div className="text-sm opacity-90 capitalize">{rarity}</div>
                  <div className="text-2xl font-bold">
                    {count}/{total}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
