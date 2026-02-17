import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { XPService } from '../services/xpService';
import { LevelService } from '../services/levelService';
import { ExerciseService } from '../services/exerciseService';

export function AnalyticsPage() {
  // Dados gerais
  const totalXP = XPService.getTotalXP();
  const currentLevel = LevelService.getCurrentLevel(totalXP);
  const xpHistory = XPService.getHistory();
  const totalExercises = XPService.getTotalExercisesCount();
  const totalCorrect = XPService.getTotalCorrectAnswers();

  // Cálculos
  const accuracyRate = totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 0;
  const totalIncorrect = totalExercises - totalCorrect;

  // XP por dia (últimos 7 dias)
  const xpByDay = useMemo(() => {
    const days: { date: string; xp: number }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayXP = xpHistory
        .filter(
          (entry) =>
            new Date(entry.timestamp).toISOString().split('T')[0] === dateStr,
        )
        .reduce((sum, entry) => sum + entry.xp, 0);

      days.push({
        date: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        xp: dayXP,
      });
    }

    return days;
  }, [xpHistory]);

  // XP por tipo de exercício
  const xpByType = useMemo(() => {
    const typeMap: Record<string, number> = {};

    xpHistory.forEach((entry) => {
      typeMap[entry.source] = (typeMap[entry.source] || 0) + entry.xp;
    });

    return Object.entries(typeMap)
      .map(([type, xp]) => ({ type, xp }))
      .sort((a, b) => b.xp - a.xp);
  }, [xpHistory]);

  // XP por pilar (estimado baseado em exercícios)
  const xpByPillar = useMemo(() => {
    const exercises = ExerciseService.getAllExercises();
    const pillars: Record<string, { count: number; exercises: string[] }> = {};

    exercises.forEach((ex) => {
      const pillar = ex.pillar || 'unknown';
      if (!pillars[pillar]) {
        pillars[pillar] = { count: 0, exercises: [] };
      }
      pillars[pillar].count++;
      pillars[pillar].exercises.push(ex.id);
    });

    return Object.entries(pillars).map(([name, data]) => ({
      name,
      count: data.count,
      percentage: Math.round((data.count / exercises.length) * 100),
    }));
  }, []);

  // Progressão de nível
  const nextLevelXP = LevelService.getXPForLevel(currentLevel + 1);
  const currentLevelXP = LevelService.getXPForLevel(currentLevel);
  const xpToNextLevel = nextLevelXP - totalXP;
  const xpInLevel = totalXP - currentLevelXP;
  const levelProgress = Math.round(((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100);

  const maxXP = Math.max(...xpByDay.map((d) => d.xp), 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-green-600 text-white pt-8 pb-6 px-4"
      >
        <h1 className="text-4xl font-bold mb-2">📊 Analytics Dashboard</h1>
        <p className="text-blue-100">Veja seu progresso em detalhes!</p>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Main Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'XP Total', value: totalXP, icon: '⭐', color: 'from-yellow-400 to-yellow-600' },
            { label: 'Nível', value: currentLevel, icon: '🎖️', color: 'from-purple-400 to-purple-600' },
            { label: 'Exercícios', value: totalExercises, icon: '📚', color: 'from-blue-400 to-blue-600' },
            { label: 'Acurácia', value: `${accuracyRate}%`, icon: '🎯', color: 'from-green-400 to-green-600' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-gradient-to-br ${stat.color} rounded-lg shadow-lg p-6 text-white`}
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm opacity-90">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Level Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold mb-4">📈 Progresso para Nível {currentLevel + 1}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalXP}</div>
                <div className="text-xs text-gray-600">XP Atual</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{xpToNextLevel}</div>
                <div className="text-xs text-gray-600">XP Faltando</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{nextLevelXP}</div>
                <div className="text-xs text-gray-600">Total Necessário</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold">Progresso do Nível</span>
                <span className="text-gray-600">{levelProgress}%</span>
              </div>
              <motion.div
                className="w-full h-6 bg-gray-200 rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* XP por dia (gráfico) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold mb-4">📅 XP nos Últimos 7 Dias</h2>
          <div className="flex items-end justify-around h-40 gap-2">
            {xpByDay.map((day, i) => {
              const height = maxXP > 0 ? (day.xp / maxXP) * 100 : 0;
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="flex-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg relative group cursor-pointer hover:from-blue-600 hover:to-blue-400 transition-all"
                  title={`${day.date}: ${day.xp} XP`}
                >
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.xp} XP
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="flex justify-around mt-4 text-xs text-gray-600">
            {xpByDay.map((day, i) => (
              <div key={i} className="text-center">
                {day.date}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* XP por Tipo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-4">🎯 XP por Tipo de Exercício</h2>
            <div className="space-y-3">
              {xpByType.slice(0, 5).map((item, i) => {
                const total = xpByType.reduce((sum, x) => sum + x.xp, 0);
                const percentage = total > 0 ? Math.round((item.xp / total) * 100) : 0;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm capitalize">{item.type}</span>
                      <span className="text-sm text-gray-600">{item.xp} XP ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-pink-400 to-rose-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Exercícios por Pilar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-4">📚 Exercícios por Pilar</h2>
            <div className="space-y-3">
              {xpByPillar.map((pillar, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm capitalize">{pillar.name}</span>
                    <span className="text-sm text-gray-600">{pillar.count} ({pillar.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${
                        i === 0
                          ? 'from-purple-400 to-purple-600'
                          : i === 1
                            ? 'from-blue-400 to-blue-600'
                            : i === 2
                              ? 'from-green-400 to-green-600'
                              : 'from-yellow-400 to-yellow-600'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pillar.percentage}%` }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Accuracy Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold mb-4">🎯 Estatísticas de Acurácia</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="bg-gradient-to-br from-green-100 to-green-50 p-6 rounded-lg border-2 border-green-300"
            >
              <div className="text-5xl font-bold text-green-600 mb-2">{totalCorrect}</div>
              <div className="text-gray-700 font-bold">Respostas Corretas</div>
              <div className="text-2xl text-green-600 mt-2">{accuracyRate}%</div>
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.55, type: 'spring' }}
              className="bg-gradient-to-br from-red-100 to-red-50 p-6 rounded-lg border-2 border-red-300"
            >
              <div className="text-5xl font-bold text-red-600 mb-2">{totalIncorrect}</div>
              <div className="text-gray-700 font-bold">Respostas Incorretas</div>
              <div className="text-2xl text-red-600 mt-2">{100 - accuracyRate}%</div>
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: 'spring' }}
              className="bg-gradient-to-br from-blue-100 to-blue-50 p-6 rounded-lg border-2 border-blue-300"
            >
              <div className="text-5xl font-bold text-blue-600 mb-2">{totalExercises}</div>
              <div className="text-gray-700 font-bold">Total de Exercícios</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
