import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ExerciseService } from '../services/exerciseService';
import { XPService } from '../services/xpService';
import { StreakService } from '../services/streakService';
import { LevelService } from '../services/levelService';

import { LessonHeader } from '../ui/components/learning/LessonHeader';
import { ExerciseCard } from '../ui/components/learning/ExerciseCard';
import { ExercisePlayer } from '../ui/components/learning/ExercisePlayer';

interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  base_xp: number;
  bonus_xp: number;
  type: string;
  [key: string]: any;
}

const LessonPage: React.FC = () => {
  const navigate = useNavigate();
  const { pillar, lesson } = useParams<{ pillar: string; lesson: string }>();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [exerciseScores, setExerciseScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const userId = 'local_user';

  useEffect(() => {
    if (pillar && lesson) {
      const exs = ExerciseService.getExercisesByLesson(
        parseInt(pillar),
        parseInt(lesson)
      );
      setExercises(exs);
      setLoading(false);
    }
  }, [pillar, lesson]);

  const handleExerciseSelect = (exerciseId: string) => {
    if (!completedExercises.has(exerciseId)) {
      setSelectedExerciseId(exerciseId);
    }
  };

  const handleExerciseComplete = (exerciseId: string, score: number, xpEarned: number) => {
    // Mark as completed
    const newCompleted = new Set(completedExercises);
    newCompleted.add(exerciseId);
    setCompletedExercises(newCompleted);

    // Save score
    setExerciseScores(prev => ({
      ...prev,
      [exerciseId]: score
    }));

    // Add XP
    const event = {
      type: 'exercise' as const,
      baseXP: xpEarned,
      multiplier: 1.0,
      source: `exercise_${exerciseId}`
    };

    XPService.addXP(userId, event);

    // Update streak
    StreakService.updateStreak(userId);

    // Update level if needed
    const totalXP = XPService.getTotalXP(userId);
    LevelService.updateLevel(userId, totalXP);
  };

  const handleExerciseCancel = () => {
    setSelectedExerciseId(null);
  };

  const handleLessonComplete = () => {
    navigate('/dashboard');
  };

  const allCompleted = exercises.length > 0 && completedExercises.size === exercises.length;
  const completionPercentage = exercises.length > 0
    ? Math.round((completedExercises.size / exercises.length) * 100)
    : 0;

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
      {/* Main container */}
      <div className="container mx-auto p-6">
        <AnimatePresence mode="wait">
          {selectedExerciseId ? (
            // Exercise view
            <motion.div
              key="exercise"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="max-w-2xl mx-auto"
            >
              <ExercisePlayer
                key={selectedExerciseId}
                exerciseId={selectedExerciseId}
                onComplete={(score, xpEarned) => {
                  handleExerciseComplete(selectedExerciseId, score, xpEarned);
                  setSelectedExerciseId(null);
                }}
                onCancel={handleExerciseCancel}
              />
            </motion.div>
          ) : (
            // Lesson list view
            <motion.div
              key="lesson"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6"
            >
              {/* Header */}
              {pillar && lesson && (
                <LessonHeader
                  pillar={parseInt(pillar)}
                  lesson={parseInt(lesson)}
                />
              )}

              {/* Progress Section */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Progresso da Lição</h2>
                  <span className="text-2xl font-bold text-yellow-400">
                    {completionPercentage}%
                  </span>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <p className="text-sm text-gray-400 mt-3">
                  {completedExercises.size} de {exercises.length} exercícios completos
                </p>

                {allCompleted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-4 bg-green-900 border-2 border-green-400 rounded-lg"
                  >
                    <p className="font-bold text-green-300">
                      🎉 Parabéns! Você completou a lição!
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Exercise List */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-lg space-y-4">
                <h2 className="text-2xl font-bold mb-4">Exercícios</h2>

                {exercises.map((exercise, idx) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    index={idx + 1}
                    completed={completedExercises.has(exercise.id)}
                    score={exerciseScores[exercise.id]}
                    onClick={() => handleExerciseSelect(exercise.id)}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  ← Voltar ao Dashboard
                </button>

                {allCompleted && (
                  <button
                    onClick={handleLessonComplete}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                  >
                    Próxima Lição →
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-300">Exercícios</p>
                  <p className="text-3xl font-bold text-blue-300">{exercises.length}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-300">Completos</p>
                  <p className="text-3xl font-bold text-purple-300">{completedExercises.size}</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-300">Pontuação Média</p>
                  <p className="text-3xl font-bold text-yellow-300">
                    {completedExercises.size > 0
                      ? Math.round(
                        Object.values(exerciseScores).reduce((a, b) => a + b, 0) /
                        completedExercises.size
                      )
                      : 0}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LessonPage;
