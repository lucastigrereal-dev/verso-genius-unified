import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExerciseService } from '../../../services/exerciseService';

interface ExercisePlayerProps {
  exerciseId: string;
  onComplete?: (score: number, xpEarned: number) => void;
  onCancel?: () => void;
}

interface Option {
  id: string;
  text: string;
  correct?: boolean;
}

interface Item {
  id: string;
  text: string;
  group?: string;
}

export const ExercisePlayer: React.FC<ExercisePlayerProps> = ({
  exerciseId,
  onComplete,
  onCancel
}) => {
  const exercise = ExerciseService.getExerciseById(exerciseId);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(exercise?.time_limit_seconds || 30);
  const [isRecording, setIsRecording] = useState(false);
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({});

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  if (!exercise) {
    return (
      <div className="p-8 text-center text-gray-600">
        <p>Exercício não encontrado</p>
      </div>
    );
  }

  const handleSubmit = () => {
    const answer = selectedAnswer || matchingAnswers;
    const validation = ExerciseService.validateAnswer(exerciseId, answer);
    const xpEarned = ExerciseService.calculateXPReward(exercise, validation.score);

    setResult({
      ...validation,
      xpEarned
    });
    setSubmitted(true);

    if (onComplete) {
      onComplete(validation.score, xpEarned);
    }
  };

  // Render different exercise types
  const renderExerciseContent = () => {
    switch (exercise.type) {
      case 'listening':
        return renderListeningExercise();
      case 'fill_blank':
        return renderFillBlankExercise();
      case 'matching':
        return renderMatchingExercise();
      case 'production':
        return renderProductionExercise();
      case 'rhythm':
        return renderRhythmExercise();
      case 'comparison':
        return renderComparisonExercise();
      case 'speed':
        return renderSpeedExercise();
      case 'simulation':
        return renderSimulationExercise();
      case 'freestyle':
        return renderFreestyleExercise();
      default:
        return <p>Tipo de exercício não suportado</p>;
    }
  };

  const renderListeningExercise = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-lg">
        <p className="text-gray-700 mb-4">{exercise.description}</p>
        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold">
          🔊 Tocar Áudio
        </button>
      </div>

      <div className="space-y-3">
        {(exercise.options as Option[])?.map(option => (
          <motion.button
            key={option.id}
            onClick={() => !submitted && setSelectedAnswer(option.id)}
            whileHover={{ scale: 1.02 }}
            className={`
              w-full p-4 rounded-lg font-semibold transition-all border-2
              ${selectedAnswer === option.id
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-white text-gray-800 border-gray-300 hover:border-blue-400'
              }
              ${submitted && option.correct
                ? 'bg-green-500 text-white border-green-600'
                : submitted && selectedAnswer === option.id && !option.correct
                ? 'bg-red-500 text-white border-red-600'
                : ''
              }
            `}
            disabled={submitted}
          >
            {option.text}
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderFillBlankExercise = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-lg">
        <p className="text-lg text-gray-800 mb-6 font-semibold">
          {exercise.question}
        </p>

        <div className="space-y-3">
          {(exercise.options as Option[])?.map(option => (
            <motion.button
              key={option.id}
              onClick={() => !submitted && setSelectedAnswer(option.id)}
              whileHover={{ scale: 1.02 }}
              className={`
                w-full p-4 rounded-lg font-semibold transition-all border-2
                ${selectedAnswer === option.id
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'bg-white text-gray-800 border-gray-300 hover:border-blue-400'
                }
                ${submitted && option.correct
                  ? 'bg-green-500 text-white border-green-600'
                  : submitted && selectedAnswer === option.id && !option.correct
                  ? 'bg-red-500 text-white border-red-600'
                  : ''
                }
              `}
              disabled={submitted}
            >
              {option.text}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMatchingExercise = () => (
    <div className="space-y-6">
      <p className="text-gray-700">{exercise.description}</p>

      <div className="grid grid-cols-2 gap-4">
        {/* Left side - items */}
        <div className="space-y-2">
          <p className="font-semibold text-gray-600 text-sm">PALAVRAS</p>
          {(exercise.items as Item[])?.map(item => (
            <div
              key={item.id}
              className="bg-gray-100 p-3 rounded-lg text-center font-semibold text-gray-800"
            >
              {item.text}
            </div>
          ))}
        </div>

        {/* Right side - groups */}
        <div className="space-y-2">
          <p className="font-semibold text-gray-600 text-sm">GRUPOS</p>
          {exercise.groups?.map((group: any) => (
            <div
              key={group.id}
              className="bg-blue-100 p-3 rounded-lg border-2 border-blue-300 text-center font-semibold text-blue-900"
            >
              {group.title}
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-600">
        (Funcionalidade de drag and drop será implementada com biblioteca React DnD)
      </p>
    </div>
  );

  const renderProductionExercise = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 p-6 rounded-lg">
        <p className="text-gray-700 mb-4">{exercise.description}</p>
        <p className="font-semibold text-gray-900 mb-6">{exercise.prompt}</p>

        {exercise.hint && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Dica:</strong> {exercise.hint}
            </p>
          </div>
        )}

        <motion.button
          onClick={() => setIsRecording(!isRecording)}
          whileHover={{ scale: 1.05 }}
          className={`
            w-full py-4 px-6 rounded-lg font-bold text-white text-lg transition-all
            ${isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-purple-500 hover:bg-purple-600'
            }
          `}
        >
          {isRecording ? '⏹️ Parar Gravação' : '🎤 Iniciar Gravação'}
        </motion.button>
      </div>
    </div>
  );

  const renderRhythmExercise = () => (
    <div className="space-y-6">
      <div className="bg-orange-50 p-6 rounded-lg">
        <p className="text-gray-700 mb-4">{exercise.description}</p>
        <p className="font-semibold mb-4">BPM: {exercise.bpm}</p>

        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold">
          🥁 Tocar Beat
        </button>

        <p className="text-sm text-gray-600 mt-4">
          Toque na tela seguindo o beat. Você será avaliado pela sincronização.
        </p>
      </div>
    </div>
  );

  const renderComparisonExercise = () => (
    <div className="space-y-6">
      <p className="text-gray-700 mb-4">{exercise.description}</p>

      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-semibold text-gray-600 mb-2">Opção A</p>
          <button className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded">
            🔊 Tocar
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-semibold text-gray-600 mb-2">Opção B</p>
          <button className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded">
            🔊 Tocar
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {(exercise.options as Option[])?.map(option => (
          <motion.button
            key={option.id}
            onClick={() => !submitted && setSelectedAnswer(option.id)}
            whileHover={{ scale: 1.02 }}
            className={`
              w-full p-4 rounded-lg font-semibold transition-all border-2
              ${selectedAnswer === option.id
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-white text-gray-800 border-gray-300 hover:border-blue-400'
              }
            `}
            disabled={submitted}
          >
            {option.text}
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderSpeedExercise = () => (
    <div className="space-y-6">
      <p className="text-gray-700">{exercise.description}</p>
      <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded">
        Este é um exercício de velocidade. Você será avaliado pela rapidez e precisão.
      </p>
    </div>
  );

  const renderSimulationExercise = () => (
    <div className="space-y-6">
      <div className="bg-red-50 p-6 rounded-lg">
        <p className="text-gray-700 mb-4">{exercise.description}</p>
        <p className="font-semibold mb-4">Rounds: {exercise.rounds}</p>
        <p className="text-sm text-gray-600">Nível do oponente: {exercise.opponent_level}</p>

        <button className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold mt-4">
          🎮 Iniciar Simulação
        </button>
      </div>
    </div>
  );

  const renderFreestyleExercise = () => (
    <div className="space-y-6">
      <div className="bg-green-50 p-6 rounded-lg">
        <p className="text-gray-700 mb-4">{exercise.description}</p>
        <p className="font-semibold text-gray-900 mb-6">{exercise.prompt}</p>

        {exercise.hint && (
          <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Dica:</strong> {exercise.hint}
            </p>
          </div>
        )}

        <motion.button
          onClick={() => setIsRecording(!isRecording)}
          whileHover={{ scale: 1.05 }}
          className={`
            w-full py-4 px-6 rounded-lg font-bold text-white text-lg transition-all
            ${isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
            }
          `}
        >
          {isRecording ? '⏹️ Parar Gravação' : '🎤 Iniciar Gravação'}
        </motion.button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{exercise.title}</h2>
          <div className={`
            text-2xl font-bold px-4 py-2 rounded-lg
            ${timeLeft > 10 ? 'text-blue-600' : timeLeft > 5 ? 'text-yellow-600' : 'text-red-600'}
          `}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-500 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((exercise.time_limit_seconds - timeLeft) / exercise.time_limit_seconds) * 100}%` }}
          />
        </div>
      </motion.div>

      {/* Exercise Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-6 rounded-lg shadow-lg mb-6"
      >
        {renderExerciseContent()}
      </motion.div>

      {/* Result */}
      {submitted && result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`
            p-6 rounded-lg text-white font-bold text-center
            ${result.correct
              ? 'bg-green-500'
              : 'bg-red-500'
            }
          `}
        >
          <p className="text-xl mb-2">
            {result.correct ? '✅ Correto!' : '❌ Incorreto'}
          </p>
          <p className="text-3xl font-bold mb-2">{result.score}/100</p>
          {result.explanation && (
            <p className="text-sm opacity-90">{result.explanation}</p>
          )}
          <p className="text-2xl font-bold mt-4">+{result.xpEarned} XP</p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        {!submitted ? (
          <>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 px-4 rounded-lg font-semibold"
            >
              ← Voltar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer && Object.keys(matchingAnswers).length === 0}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50"
            >
              Enviar Resposta
            </button>
          </>
        ) : (
          <button
            onClick={onCancel}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold"
          >
            Próximo Exercício
          </button>
        )}
      </div>
    </div>
  );
};
