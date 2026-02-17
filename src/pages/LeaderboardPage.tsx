import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LeaderboardService } from '../services/leaderboardService';
import { UserProfileService } from '../services/userProfileService';
import { XPService } from '../services/xpService';
import { StreakService } from '../services/streakService';

type LeaderboardType = 'xp' | 'streak' | 'exercises';

export function LeaderboardPage() {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('xp');

  // User data
  const profile = UserProfileService.getProfile();
  const userXP = XPService.getTotalXP();
  const userStreak = StreakService.getCurrentStreak();
  const userExercises = XPService.getTotalExercisesCount();
  const rankings = LeaderboardService.getUserRankings(userXP, userStreak, userExercises, profile.username);

  // Get leaderboard
  const leaderboard = useMemo(() => {
    switch (leaderboardType) {
      case 'streak':
        return LeaderboardService.getLeaderboardByStreak(userStreak, profile.username);
      case 'exercises':
        return LeaderboardService.getLeaderboardByExercises(userExercises, profile.username);
      default:
        return LeaderboardService.getLeaderboardByXP(userXP, profile.username);
    }
  }, [leaderboardType, userXP, userStreak, userExercises, profile.username]);

  // Get user position
  const userPosition = leaderboard.find((entry) => entry.isCurrentUser);
  const topThree = leaderboard.slice(0, 3);

  const getMedalIcon = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getLeaderboardLabel = (): string => {
    switch (leaderboardType) {
      case 'streak':
        return 'Maior Sequência de Dias';
      case 'exercises':
        return 'Mais Exercícios Completados';
      default:
        return 'Mais XP Acumulado';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-600 to-orange-600 text-white pt-8 pb-6 px-4"
      >
        <h1 className="text-4xl font-bold mb-2">🏆 Leaderboard Global</h1>
        <p className="text-amber-100">Compete com jogadores do mundo todo!</p>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Your Stats */}
        {userPosition && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Seu Ranking</h2>
              <span className="text-5xl">{getMedalIcon(userPosition.rank)}</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <div className="text-sm opacity-90">Posição</div>
                <div className="text-3xl font-bold">#{userPosition.rank}</div>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <div className="text-sm opacity-90">
                  {leaderboardType === 'xp' ? 'XP' : leaderboardType === 'streak' ? 'Dias' : 'Exercícios'}
                </div>
                <div className="text-3xl font-bold">{userPosition.xp}</div>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <div className="text-sm opacity-90">Mensagem</div>
                <div className="text-lg font-bold">
                  {LeaderboardService.getMotivationalMessage(userPosition.rank)}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'xp', label: '⭐ XP Total', icon: '💰' },
            { id: 'streak', label: '🔥 Maior Streak', icon: '🔥' },
            { id: 'exercises', label: '📚 Exercícios', icon: '📚' },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setLeaderboardType(tab.id as LeaderboardType)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                leaderboardType === tab.id
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {topThree.map((entry, index) => {
            const heights = ['md:h-32', 'md:h-40', 'md:h-36'];
            const colors = [
              'from-yellow-400 to-yellow-600',
              'from-gray-300 to-gray-400',
              'from-orange-300 to-orange-400',
            ];

            return (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex flex-col items-center justify-end ${heights[index]} bg-gradient-to-t ${colors[index]} rounded-t-3xl shadow-xl p-4`}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="text-6xl mb-2"
                >
                  {entry.avatar}
                </motion.div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${index === 0 ? 'text-yellow-900' : 'text-gray-900'}`}>
                    {entry.username}
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      index === 0 ? 'text-yellow-800' : 'text-gray-800'
                    }`}
                  >
                    {leaderboardType === 'xp'
                      ? `${entry.xp} XP`
                      : leaderboardType === 'streak'
                        ? `${entry.xp} dias`
                        : `${entry.xp} exercícios`}
                  </div>
                </div>
                <div
                  className={`mt-2 text-4xl font-black ${
                    index === 0 ? 'text-yellow-900' : 'text-gray-900'
                  }`}
                >
                  {getMedalIcon(entry.rank)}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Full Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-4">
            <h2 className="text-2xl font-bold">{getLeaderboardLabel()}</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-6 py-3 text-left font-bold text-gray-700">Pos.</th>
                  <th className="px-6 py-3 text-left font-bold text-gray-700">Jogador</th>
                  <th className="px-6 py-3 text-right font-bold text-gray-700">
                    {leaderboardType === 'xp' ? 'XP' : leaderboardType === 'streak' ? 'Dias' : 'Exercícios'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`border-b transition-all hover:bg-gray-50 ${
                      entry.isCurrentUser
                        ? 'bg-amber-100 font-bold'
                        : index < 3
                          ? 'bg-yellow-50'
                          : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-bold">
                      <span className="text-2xl">{getMedalIcon(entry.rank)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{entry.avatar}</span>
                        <div>
                          <div className="font-bold text-gray-900">{entry.username}</div>
                          {entry.level > 0 && (
                            <div className="text-sm text-gray-600">Nível {entry.level}</div>
                          )}
                        </div>
                        {entry.isCurrentUser && (
                          <span className="ml-2 bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            VOCÊ
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      {leaderboardType === 'xp' ? `${entry.xp} XP` : `${entry.xp}`}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-xl p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Seu Desempenho Geral</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-6 rounded-lg border-l-4 border-blue-600">
              <div className="text-sm text-gray-600 mb-2">Ranking XP</div>
              <div className="text-4xl font-bold text-blue-600">#{rankings.xpRank}</div>
              <div className="text-sm text-gray-600 mt-2">
                {LeaderboardService.getMotivationalMessage(rankings.xpRank)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-100 to-orange-50 p-6 rounded-lg border-l-4 border-orange-600">
              <div className="text-sm text-gray-600 mb-2">Ranking Streak</div>
              <div className="text-4xl font-bold text-orange-600">#{rankings.streakRank}</div>
              <div className="text-sm text-gray-600 mt-2">
                {LeaderboardService.getMotivationalMessage(rankings.streakRank)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-100 to-green-50 p-6 rounded-lg border-l-4 border-green-600">
              <div className="text-sm text-gray-600 mb-2">Ranking Exercícios</div>
              <div className="text-4xl font-bold text-green-600">#{rankings.exercisesRank}</div>
              <div className="text-sm text-gray-600 mt-2">
                {LeaderboardService.getMotivationalMessage(rankings.exercisesRank)}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
