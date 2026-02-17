import React from 'react';
import { motion } from 'framer-motion';

interface LessonHeaderProps {
  pillar: number;
  lesson: number;
}

const PILLAR_INFO = {
  1: {
    name: 'Rimas',
    emoji: '🎵',
    description: 'Aprenda as bases das rimas e sonoridades',
    color: 'from-purple-500 to-pink-500'
  },
  2: {
    name: 'Flow',
    emoji: '🎶',
    description: 'Domine o ritmo e sincronização com beats',
    color: 'from-blue-500 to-cyan-500'
  },
  3: {
    name: 'Criatividade',
    emoji: '✨',
    description: 'Desenvolva criatividade e figuras de linguagem',
    color: 'from-yellow-500 to-orange-500'
  },
  4: {
    name: 'Batalha',
    emoji: '⚔️',
    description: 'Domine a arte do duelo e improviso',
    color: 'from-red-500 to-orange-500'
  }
};

const LESSON_DESCRIPTIONS: Record<string, string> = {
  '1_1': 'Introdução às rimas básicas',
  '1_2': 'Famílias de rima',
  '1_3': 'Assonância',
  '1_4': 'Aliteração',
  '2_1': 'Sincronização com o beat',
  '2_2': 'Padrões de batida',
  '2_3': 'Flow avançado',
  '2_4': 'Freestyle com ritmo',
  '3_1': 'Figuras de linguagem',
  '3_2': 'Estrutura poética',
  '3_3': 'Wordplay e duplos sentidos',
  '3_4': 'Composição criativa',
  '4_1': 'Técnicas de duelo',
  '4_2': 'Batalhas simuladas',
  '4_3': 'Defesa e contra-ataque',
  '4_4': 'Freestyle epico'
};

export const LessonHeader: React.FC<LessonHeaderProps> = ({ pillar, lesson }) => {
  const pillarInfo = PILLAR_INFO[pillar as keyof typeof PILLAR_INFO] || PILLAR_INFO[1];
  const lessonKey = `${pillar}_${lesson}`;
  const lessonDescription = LESSON_DESCRIPTIONS[lessonKey] || 'Aula especial';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${pillarInfo.color} p-8 rounded-xl text-white shadow-lg`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{pillarInfo.emoji}</span>
            <div>
              <h1 className="text-3xl font-bold">
                Pillar {pillar}: {pillarInfo.name}
              </h1>
              <p className="text-sm opacity-90">Lição {lesson}</p>
            </div>
          </div>

          <p className="text-lg opacity-95 mb-4">{pillarInfo.description}</p>

          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg inline-block">
            <p className="font-semibold">{lessonDescription}</p>
            <p className="text-sm opacity-90 mt-1">
              Completa todos os 5 exercícios desta lição
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="text-right">
          <div className="text-4xl font-bold opacity-80">{lesson}/4</div>
          <p className="text-sm opacity-75">Lições</p>
        </div>
      </div>

      {/* Mini progress bars */}
      <div className="mt-6 flex gap-2">
        {[1, 2, 3, 4].map(l => (
          <motion.div
            key={l}
            className={`h-2 flex-1 rounded-full ${
              l <= lesson
                ? 'bg-white'
                : 'bg-white/30'
            }`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: l * 0.1 }}
          />
        ))}
      </div>
    </motion.div>
  );
};
