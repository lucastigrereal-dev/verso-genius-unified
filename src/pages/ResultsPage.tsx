import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExerciseService } from '../services/exerciseService';
import { LevelService } from '../services/levelService';
import { XPService } from '../services/xpService';

interface ResultsState {
  exerciseId: string;
  score: number;
  xpEarned: number;
  feedback: string;
  explanation?: string;
  pillar: number;
  lesson: number;
}

const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultsState | null;

  const [exercise, setExercise] = useState<any>(null);
  const [levelInfo, setLevelInfo] = useState<any>(null);

  const userId = 'local_user';

  useEffect(() => {
    if (!state || !state.exerciseId) {
      navigate('/dashboard');
      return;
    }

    // Get exercise details
    const ex = ExerciseService.getExerciseById(state.exerciseId);
    setExercise(ex);

    // Get level info
    const totalXP = XPService.getTotalXP(userId);
    const levelProgress = LevelService.getLevelProgress(totalXP);
    setLevelInfo(levelProgress);
  }, [state, navigate]);

  if (!state || !exercise) {
    return null;
  }

  const { score, xpEarned, feedback, explanation, pillar, lesson } = state;
  const isPass = score >= 70;

  const handleNextExercise = () => {
    // Navigate to same lesson but next exercise would be selected
    navigate(`/lesson/${pillar}/${lesson}`);
  };

  const handleNewLesson = () => {
    // Navigate to next lesson
    const nextLesson = lesson < 4 ? lesson + 1 : 4;
    navigate(`/lesson/${pillar}/${nextLesson}`);
  };

  const handleDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-dark-500 to-gray-900 text-white">
      <div className="container mx-auto p-6 max-w-2xl">
        {/* Celebration or Feedback */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            p-8 rounded-2xl text-center mb-8 shadow-2xl
            ${isPass
              ? 'bg-gradient-to-r from-green-600 to-emerald-600'
              : 'bg-gradient-to-r from-orange-600 to-red-600'
            }
          `}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5 }}
            className="text-6xl mb-4"
          >
            {isPass ? '🎉' : '💪'}
          </motion.div>

          <h1 className="text-4xl font-bold mb-2">
            {isPass ? 'Excelente!' : 'Bom Esforço!'}
          </h1>

          <p className="text-lg opacity-90">
            {feedback}
          </p>
        </motion.div>

        {/* Score and XP Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          {/* Score */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-6 rounded-xl text-center shadow-lg">
            <p className="text-sm text-gray-300 uppercase tracking-wide mb-2">Pontuação</p>
            <motion.div
              animate={{ scale: [0, 1] }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-5xl font-bold text-blue-300"
            >
              {score}
            </motion.div>
            <p className="text-xs text-gray-400 mt-2">/100</p>
          </div>

          {/* XP Earned */}
          <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 p-6 rounded-xl text-center shadow-lg">
            <p className="text-sm text-gray-300 uppercase tracking-wide mb-2">XP Ganho</p>
            <motion.div
              animate={{ scale: [0, 1] }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-5xl font-bold text-yellow-300"
            >
              +{xpEarned}
            </motion.div>
            <p className="text-xs text-gray-400 mt-2">Experiência</p>
          </div>
        </motion.div>

        {/* Exercise Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-lg mb-8"
        >
          <h2 className="text-xl font-bold mb-4">Detalhes do Exercício</h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
              <span className="text-gray-400">Exercício</span>
              <span className="font-semibold">{exercise.title}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
              <span className="text-gray-400">Tipo</span>
              <span className="font-semibold">{exercise.type}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
              <span className="text-gray-400">Dificuldade</span>
              <span className={`
                px-3 py-1 rounded-full text-sm font-semibold
                ${exercise.difficulty === 'easy'
                  ? 'bg-green-600'
                  : exercise.difficulty === 'medium'
                  ? 'bg-yellow-600'
                  : 'bg-red-600'
                }
              `}>
                {exercise.difficulty === 'easy' ? 'Fácil' : exercise.difficulty === 'medium' ? 'Médio' : 'Difícil'}
              </span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
              <span className="text-gray-400">XP Base</span>
              <span className="font-semibold">{exercise.base_xp}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">XP Bônus</span>
              <span className="font-semibold text-green-400">
                {isPass ? `+${exercise.bonus_xp}` : '0'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Feedback and Explanation */}
        {explanation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-purple-900 to-purple-800 p-6 rounded-xl shadow-lg mb-8"
          >
            <h3 className="text-lg font-bold mb-3">Análise Detalhada</h3>
            <p className="text-gray-200 leading-relaxed">{explanation}</p>
          </motion.div>
        )}

        {/* Level Up Indicator */}
        {levelInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-6 rounded-xl shadow-lg mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 uppercase tracking-wide mb-1">Nível Atual</p>
                <p className="text-3xl font-bold text-indigo-300">{levelInfo.currentLevel}</p>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-300 uppercase tracking-wide mb-1">Progresso</p>
                <div className="flex items-center gap-2">
                  <div className="w-40 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${levelInfo.percentToNextLevel}%` }}
                      transition={{ duration: 1, delay: 0.8 }}
                    />
                  </div>
                  <span className="text-indigo-300 font-semibold">{levelInfo.percentToNextLevel}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tips and Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-lg mb-8"
        >
          <h3 className="text-lg font-bold mb-4">Dicas para Melhorar</h3>

          <ul className="space-y-2 text-gray-300">
            {isPass ? (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Parabéns! Você dominou este exercício.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Continue praticando para melhorar ainda mais.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Próxima lição pode ser mais desafiadora.</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">→</span>
                  <span>Tente novamente para melhorar seu score.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">→</span>
                  <span>Revise a lição anterior se necessário.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">→</span>
                  <span>Pratique regularmente para consolidar o aprendizado.</span>
                </li>
              </>
            )}
          </ul>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 gap-4"
        >
          <button
            onClick={handleNextExercise}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            ← Voltar
          </button>

          {isPass ? (
            <button
              onClick={handleNewLesson}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              Próxima Lição →
            </button>
          ) : (
            <button
              onClick={handleNextExercise}
              className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              Tentar Novamente
            </button>
          )}
        </motion.div>

        <div className="mt-4">
          <button
            onClick={handleDashboard}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            Ir para Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
