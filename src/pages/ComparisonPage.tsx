import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { UserComparisonService } from '../services/userComparisonService';
import { UserProfileService } from '../services/userProfileService';
import { XPService } from '../services/xpService';
import { LevelService } from '../services/levelService';
import { StreakService } from '../services/streakService';

export function ComparisonPage() {
  const profile = UserProfileService.getProfile();
  const userXP = XPService.getTotalXP();
  const userLevel = LevelService.getCurrentLevel(userXP);
  const userStreak = StreakService.getCurrentStreak();
  const userExercises = XPService.getTotalExercisesCount();
  const userCorrect = XPService.getTotalCorrectAnswers();
  const userAccuracy = userExercises > 0 ? Math.round((userCorrect / userExercises) * 100) : 0;
  const userAchievements = UserProfileService.getProfile().username ? 12 : 0; // Placeholder

  const comparisons = useMemo(
    () =>
      UserComparisonService.compareWithOthers(
        {
          xp: userXP,
          level: userLevel,
          streak: userStreak,
          exercises: userExercises,
          accuracy: userAccuracy,
          achievements: userAchievements,
        },
        profile.username,
        profile.avatarEmoji,
      ),
    [userXP, userLevel, userStreak, userExercises, userAccuracy, userAchievements, profile],
  );

  const ranking = UserComparisonService.findUserRank(comparisons);
  const nextTarget = UserComparisonService.calculateXPToNext(comparisons);
  const insight = UserComparisonService.generateComparativeInsight(comparisons);

  const currentUser = comparisons.find((c) => c.isCurrentUser);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white pt-8 pb-6 px-4"
      >
        <h1 className="text-4xl font-bold mb-2">📈 Comparação de Progresso</h1>
        <p className="text-indigo-100">Veja como você se posiciona contra outros jogadores!</p>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Your Stats */}
        {currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-xl p-6 text-white"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div>
                <div className="text-sm opacity-90">Sua Posição</div>
                <div className="text-4xl font-bold">#{ranking.rank}</div>
              </div>
              <div>
                <div className="text-sm opacity-90">Total de Jogadores</div>
                <div className="text-4xl font-bold">{ranking.total}</div>
              </div>
              <div className="col-span-2 md:col-span-1">
                <div className="text-sm opacity-90">Mensagem</div>
                <div className="text-2xl font-bold">{ranking.message}</div>
              </div>
            </div>

            {nextTarget.nextPlayer && (
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <div className="mb-3">
                  <p className="text-sm">
                    Faltam{' '}
                    <span className="font-bold text-lg text-yellow-300">{nextTarget.xpNeeded} XP</span>{' '}
                    para ultrapassar {nextTarget.nextPlayer.username}!
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso para próximo</span>
                    <span className="font-bold">
                      {Math.round(
                        ((nextTarget.nextPlayer.xp - currentUser.xp) /
                          (nextTarget.nextPlayer.xp - currentUser.xp + nextTarget.xpNeeded)) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                  <motion.div
                    className="w-full h-3 bg-white bg-opacity-20 rounded-full overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          ((nextTarget.nextPlayer.xp - currentUser.xp) /
                            (nextTarget.nextPlayer.xp - currentUser.xp + nextTarget.xpNeeded)) *
                          100
                        }%`
                      }}
                      transition={{ duration: 0.8 }}
                    />
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-600"
        >
          <p className="text-lg font-bold text-gray-900">💡 {insight}</p>
        </motion.div>

        {/* Comparison Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Comparação Detalhada</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'XP Total', key: 'xp', icon: '⭐' },
              { label: 'Nível', key: 'level', icon: '🎖️' },
              { label: 'Streak', key: 'streak', icon: '🔥' },
              { label: 'Exercícios', key: 'exercises', icon: '📚' },
              { label: 'Acurácia', key: 'accuracy', icon: '🎯', suffix: '%' },
              { label: 'Achievements', key: 'achievements', icon: '🏆' },
            ].map((stat, i) => {
              const currentValue = currentUser ? (currentUser as any)[stat.key] : 0;
              const maxValue = Math.max(...comparisons.map((c) => (c as any)[stat.key]));
              const percentage = (currentValue / maxValue) * 100;

              return (
                <motion.div
                  key={stat.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-700 flex items-center gap-2">
                      <span className="text-2xl">{stat.icon}</span>
                      {stat.label}
                    </span>
                    <span className="font-bold text-gray-900 text-lg">
                      {currentValue}
                      {stat.suffix}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    {Math.round(percentage)}% vs melhor jogador
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4">
            <h2 className="text-2xl font-bold">🏅 Ranking</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-3 text-left font-bold">Pos.</th>
                  <th className="px-4 py-3 text-left font-bold">Jogador</th>
                  <th className="px-4 py-3 text-right font-bold">XP</th>
                  <th className="px-4 py-3 text-right font-bold">Nível</th>
                  <th className="px-4 py-3 text-right font-bold">Streak</th>
                  <th className="px-4 py-3 text-right font-bold">Acurácia</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((player, i) => (
                  <motion.tr
                    key={player.username}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.02 }}
                    className={`border-b transition-all ${
                      player.isCurrentUser ? 'bg-indigo-100 font-bold' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-lg">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <span className="text-2xl">{player.avatar}</span>
                      <span>
                        {player.username}
                        {player.isCurrentUser && ' (VOCÊ)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{player.xp}</td>
                    <td className="px-4 py-3 text-right">{player.level}</td>
                    <td className="px-4 py-3 text-right">{player.streak}d</td>
                    <td className="px-4 py-3 text-right">{player.accuracy}%</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
