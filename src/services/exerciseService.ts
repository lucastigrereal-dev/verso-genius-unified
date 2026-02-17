import exercisesData from '../data/exercises.json';

interface Option {
  id: string;
  text: string;
  correct: boolean;
}

interface Exercise {
  id: string;
  pillar: number;
  lesson: number;
  exercise_num: number;
  type: 'listening' | 'matching' | 'fill_blank' | 'production' | 'speed' | 'sequencing' | 'rhythm' | 'comparison' | 'simulation' | 'freestyle';
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  base_xp: number;
  bonus_xp: number;
  [key: string]: any;
}

interface ValidationResult {
  correct: boolean;
  score: number;
  explanation?: string;
}

export class ExerciseService {
  static exercises: Exercise[] = (exercisesData as any).exercises;

  /**
   * Get exercício por ID
   */
  static getExerciseById(id: string): Exercise | null {
    return this.exercises.find(ex => ex.id === id) || null;
  }

  /**
   * Get exercícios por pillar
   */
  static getExercisesByPillar(pillar: number): Exercise[] {
    return this.exercises.filter(ex => ex.pillar === pillar);
  }

  /**
   * Get exercícios por lesson
   */
  static getExercisesByLesson(pillar: number, lesson: number): Exercise[] {
    return this.exercises.filter(ex => ex.pillar === pillar && ex.lesson === lesson);
  }

  /**
   * Get próximo exercício para user (simulado)
   */
  static getNextExercise(userId: string, pillar: number): Exercise | null {
    return this.exercises.find(
      ex => ex.pillar === pillar && ex.difficulty === 'easy'
    ) || null;
  }

  /**
   * Get exercícios por dificuldade
   */
  static getExercisesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Exercise[] {
    return this.exercises.filter(ex => ex.difficulty === difficulty);
  }

  /**
   * Get all pillars
   */
  static getPillars(): number[] {
    return Array.from(new Set(this.exercises.map(ex => ex.pillar))).sort();
  }

  /**
   * Get lessons for a pillar
   */
  static getLessonsForPillar(pillar: number): number[] {
    return Array.from(new Set(
      this.exercises.filter(ex => ex.pillar === pillar).map(ex => ex.lesson)
    )).sort();
  }

  /**
   * Valida resposta baseado no tipo de exercício
   */
  static validateAnswer(exerciseId: string, userAnswer: any): ValidationResult {
    const exercise = this.getExerciseById(exerciseId);
    if (!exercise) return { correct: false, score: 0 };

    switch (exercise.type) {
      case 'listening':
      case 'fill_blank':
        return this.validateMultipleChoice(exercise, userAnswer);

      case 'matching':
        return this.validateMatching(exercise, userAnswer);

      case 'rhythm':
        return this.validateRhythm(exercise, userAnswer);

      case 'comparison':
        return this.validateComparison(exercise, userAnswer);

      case 'speed':
        // Speed exercises validation (may come from AI)
        return { correct: true, score: Math.round(userAnswer.score || 0) };

      case 'production':
      case 'freestyle':
      case 'simulation':
        // These need AI evaluation
        return { correct: true, score: 0 }; // Placeholder

      default:
        return { correct: false, score: 0 };
    }
  }

  /**
   * Valida respostas de múltipla escolha
   */
  private static validateMultipleChoice(exercise: Exercise, userAnswerId: string): ValidationResult {
    const correctOption = (exercise.options as Option[])?.find(opt => opt.correct);
    if (!correctOption) return { correct: false, score: 0 };

    const isCorrect = userAnswerId === correctOption.id;

    return {
      correct: isCorrect,
      score: isCorrect ? 100 : 0,
      explanation: exercise.explanation
    };
  }

  /**
   * Valida matching exercises
   */
  private static validateMatching(exercise: Exercise, userAnswer: Record<string, string>): ValidationResult {
    const items = exercise.items || [];
    let matchedCount = 0;

    for (const item of items) {
      if (userAnswer[item.id] === item.group) {
        matchedCount++;
      }
    }

    const score = Math.round((matchedCount / items.length) * 100);
    const correct = matchedCount === items.length;

    return {
      correct,
      score,
      explanation: correct ? 'Perfeito! Todas as palavras foram agrupadas corretamente.' : `Você acertou ${matchedCount} de ${items.length}`
    };
  }

  /**
   * Valida rhythm exercises (simulated)
   */
  private static validateRhythm(exercise: Exercise, userAnswer: any): ValidationResult {
    const accuracy = userAnswer.accuracy || 0; // 0-100
    const score = Math.round(accuracy);
    const correct = accuracy >= 80;

    return {
      correct,
      score,
      explanation: correct
        ? 'Excelente sincronização!'
        : `Sincronização: ${accuracy.toFixed(1)}%. Tente melhorar o timing.`
    };
  }

  /**
   * Valida comparison exercises
   */
  private static validateComparison(exercise: Exercise, selectedOption: string): ValidationResult {
    const correctOption = (exercise.options as Option[])?.find(opt => opt.correct)?.id;
    const isCorrect = selectedOption === correctOption;

    return {
      correct: isCorrect,
      score: isCorrect ? 100 : 0,
      explanation: exercise.explanation
    };
  }

  /**
   * Calculate XP reward for exercise
   */
  static calculateXPReward(exercise: Exercise, score: number, streakMultiplier: number = 1.0): number {
    const baseXP = exercise.base_xp || 0;
    const bonusXP = score >= 80 ? (exercise.bonus_xp || 0) : 0;
    const totalXP = baseXP + bonusXP;

    return Math.floor(totalXP * streakMultiplier);
  }

  /**
   * Get exercise statistics
   */
  static getStatistics() {
    return {
      total: this.exercises.length,
      byPillar: {
        1: this.getExercisesByPillar(1).length,
        2: this.getExercisesByPillar(2).length,
        3: this.getExercisesByPillar(3).length,
        4: this.getExercisesByPillar(4).length
      },
      byDifficulty: {
        easy: this.getExercisesByDifficulty('easy').length,
        medium: this.getExercisesByDifficulty('medium').length,
        hard: this.getExercisesByDifficulty('hard').length
      },
      byType: {
        listening: this.exercises.filter(e => e.type === 'listening').length,
        matching: this.exercises.filter(e => e.type === 'matching').length,
        fill_blank: this.exercises.filter(e => e.type === 'fill_blank').length,
        production: this.exercises.filter(e => e.type === 'production').length,
        speed: this.exercises.filter(e => e.type === 'speed').length,
        rhythm: this.exercises.filter(e => e.type === 'rhythm').length,
        comparison: this.exercises.filter(e => e.type === 'comparison').length,
        simulation: this.exercises.filter(e => e.type === 'simulation').length,
        freestyle: this.exercises.filter(e => e.type === 'freestyle').length
      }
    };
  }
}
