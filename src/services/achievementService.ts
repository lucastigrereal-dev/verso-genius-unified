/**
 * Achievement Service
 * Gerencia badges, milestones e missões diárias
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'mission' | 'streak' | 'special';
  condition: (stats: PlayerStats) => boolean;
  unlockedAt?: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
}

export interface PlayerStats {
  totalXP: number;
  currentLevel: number;
  currentStreak: number;
  totalExercisesCompleted: number;
  totalCorrectAnswers: number;
  bestStreak: number;
  exercisesByType: Record<string, number>;
  dailyMissionsCompleted: number;
  achievementsUnlocked: string[];
}

export interface DailyMission {
  id: string;
  date: string;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  xpReward: number;
  type: 'exercises' | 'xp' | 'streak' | 'correct_answers';
}

// Achievements disponíveis
export const ACHIEVEMENTS: Achievement[] = [
  // MILESTONES - XP
  {
    id: 'first_steps',
    name: 'Primeiros Passos',
    description: 'Ganhe seu primeiro XP',
    icon: '👣',
    category: 'milestone',
    condition: (stats) => stats.totalXP >= 1,
    rarity: 'common',
    xpReward: 10,
  },
  {
    id: 'hundred_xp',
    name: 'Centenas de Pontos',
    description: 'Acumule 100 XP',
    icon: '💯',
    category: 'milestone',
    condition: (stats) => stats.totalXP >= 100,
    rarity: 'common',
    xpReward: 25,
  },
  {
    id: 'thousand_xp',
    name: 'Milhar de Pontos',
    description: 'Acumule 1.000 XP',
    icon: '🎯',
    category: 'milestone',
    condition: (stats) => stats.totalXP >= 1000,
    rarity: 'uncommon',
    xpReward: 50,
  },
  {
    id: 'five_thousand_xp',
    name: 'Mestre dos Versos',
    description: 'Acumule 5.000 XP',
    icon: '👑',
    category: 'milestone',
    condition: (stats) => stats.totalXP >= 5000,
    rarity: 'rare',
    xpReward: 100,
  },
  {
    id: 'ten_thousand_xp',
    name: 'Lenda Viva',
    description: 'Acumule 10.000 XP',
    icon: '⭐',
    category: 'milestone',
    condition: (stats) => stats.totalXP >= 10000,
    rarity: 'epic',
    xpReward: 200,
  },

  // MILESTONES - Level
  {
    id: 'level_5',
    name: 'Nível 5',
    description: 'Chegue ao Nível 5',
    icon: '📈',
    category: 'milestone',
    condition: (stats) => stats.currentLevel >= 5,
    rarity: 'common',
    xpReward: 30,
  },
  {
    id: 'level_10',
    name: 'Nível 10',
    description: 'Chegue ao Nível 10',
    icon: '🚀',
    category: 'milestone',
    condition: (stats) => stats.currentLevel >= 10,
    rarity: 'uncommon',
    xpReward: 60,
  },
  {
    id: 'level_25',
    name: 'Veterano',
    description: 'Chegue ao Nível 25',
    icon: '🏅',
    category: 'milestone',
    condition: (stats) => stats.currentLevel >= 25,
    rarity: 'rare',
    xpReward: 150,
  },
  {
    id: 'level_50',
    name: 'Supremo',
    description: 'Chegue ao Nível 50 (Máximo)',
    icon: '👸',
    category: 'milestone',
    condition: (stats) => stats.currentLevel >= 50,
    rarity: 'legendary',
    xpReward: 500,
  },

  // STREAKS
  {
    id: 'streak_3',
    name: 'Começando',
    description: 'Mantenha streak de 3 dias',
    icon: '🔥',
    category: 'streak',
    condition: (stats) => stats.currentStreak >= 3,
    rarity: 'common',
    xpReward: 20,
  },
  {
    id: 'streak_7',
    name: 'Uma Semana Incrível',
    description: 'Mantenha streak de 7 dias',
    icon: '🔥🔥',
    category: 'streak',
    condition: (stats) => stats.currentStreak >= 7,
    rarity: 'uncommon',
    xpReward: 50,
  },
  {
    id: 'streak_30',
    name: 'Mês Perfeito',
    description: 'Mantenha streak de 30 dias',
    icon: '🔥🔥🔥',
    category: 'streak',
    condition: (stats) => stats.currentStreak >= 30,
    rarity: 'rare',
    xpReward: 200,
  },
  {
    id: 'streak_100',
    name: 'Lenda de Fogo',
    description: 'Mantenha streak de 100 dias',
    icon: '🌟🔥',
    category: 'streak',
    condition: (stats) => stats.currentStreak >= 100,
    rarity: 'epic',
    xpReward: 500,
  },

  // EXERCÍCIOS
  {
    id: 'ten_exercises',
    name: 'Aprendiz',
    description: 'Complete 10 exercícios',
    icon: '📚',
    category: 'special',
    condition: (stats) => stats.totalExercisesCompleted >= 10,
    rarity: 'common',
    xpReward: 25,
  },
  {
    id: 'fifty_exercises',
    name: 'Estudioso',
    description: 'Complete 50 exercícios',
    icon: '📖',
    category: 'special',
    condition: (stats) => stats.totalExercisesCompleted >= 50,
    rarity: 'uncommon',
    xpReward: 75,
  },
  {
    id: 'hundred_exercises',
    name: 'Dedicado',
    description: 'Complete 100 exercícios',
    icon: '📕',
    category: 'special',
    condition: (stats) => stats.totalExercisesCompleted >= 100,
    rarity: 'rare',
    xpReward: 150,
  },
  {
    id: 'five_hundred_exercises',
    name: 'Mestre dos Exercícios',
    description: 'Complete 500 exercícios',
    icon: '🧠',
    category: 'special',
    condition: (stats) => stats.totalExercisesCompleted >= 500,
    rarity: 'epic',
    xpReward: 300,
  },

  // ACURÁCIA
  {
    id: 'first_correct',
    name: 'Primeiro Acerto',
    description: 'Acerte sua primeira resposta',
    icon: '✅',
    category: 'special',
    condition: (stats) => stats.totalCorrectAnswers >= 1,
    rarity: 'common',
    xpReward: 10,
  },
  {
    id: 'fifty_correct',
    name: 'Mira Certeira',
    description: 'Acerte 50 respostas',
    icon: '🎯',
    category: 'special',
    condition: (stats) => stats.totalCorrectAnswers >= 50,
    rarity: 'uncommon',
    xpReward: 40,
  },
  {
    id: 'hundred_correct',
    name: 'Perfeccionista',
    description: 'Acerte 100 respostas',
    icon: '🏆',
    category: 'special',
    condition: (stats) => stats.totalCorrectAnswers >= 100,
    rarity: 'rare',
    xpReward: 100,
  },

  // ESPECIAIS - BÔNUS
  {
    id: 'all_levels',
    name: 'Completista',
    description: 'Alcance nível 10 em todos os pilares',
    icon: '🎓',
    category: 'special',
    condition: (stats) => stats.currentLevel >= 10,
    rarity: 'epic',
    xpReward: 200,
  },
  {
    id: 'speed_demon',
    name: 'Demônio da Velocidade',
    description: 'Complete 5 exercícios em um dia',
    icon: '⚡',
    category: 'special',
    condition: (stats) => stats.totalExercisesCompleted >= 5,
    rarity: 'uncommon',
    xpReward: 75,
  },
  {
    id: 'accuracy_master',
    name: 'Mestre da Precisão',
    description: 'Acerte 80% das respostas',
    icon: '🎯',
    category: 'special',
    condition: (stats) => {
      if (stats.totalExercisesCompleted === 0) return false;
      const accuracy = stats.totalCorrectAnswers / stats.totalExercisesCompleted;
      return accuracy >= 0.8;
    },
    rarity: 'rare',
    xpReward: 150,
  },
  {
    id: 'lucky_streak',
    name: 'Sortudo',
    description: 'Mantenha uma sequência de 3 dias',
    icon: '🍀',
    category: 'special',
    condition: (stats) => stats.currentStreak >= 3,
    rarity: 'common',
    xpReward: 20,
  },
  {
    id: 'champion_level',
    name: 'Campeão Absoluto',
    description: 'Alcance nível 50 (máximo)',
    icon: '👑',
    category: 'milestone',
    condition: (stats) => stats.currentLevel >= 50,
    rarity: 'legendary',
    xpReward: 1000,
  },
];

// Missões diárias (rotativas)
const DAILY_MISSIONS_POOL: Omit<DailyMission, 'id' | 'date' | 'current'>[] = [
  {
    title: 'Aquecimento Matinal',
    description: 'Complete 5 exercícios',
    target: 5,
    completed: false,
    xpReward: 50,
    type: 'exercises',
  },
  {
    title: 'Coleta de Pontos',
    description: 'Ganhe 200 XP',
    target: 200,
    completed: false,
    xpReward: 50,
    type: 'xp',
  },
  {
    title: 'Série Consistente',
    description: 'Mantenha streak de 2 dias',
    target: 2,
    completed: false,
    xpReward: 75,
    type: 'streak',
  },
  {
    title: 'Centena de Acertos',
    description: 'Acerte 10 respostas',
    target: 10,
    completed: false,
    xpReward: 60,
    type: 'correct_answers',
  },
  {
    title: 'Maratona XP',
    description: 'Ganhe 500 XP',
    target: 500,
    completed: false,
    xpReward: 100,
    type: 'xp',
  },
  {
    title: 'Dez Exercícios',
    description: 'Complete 10 exercícios',
    target: 10,
    completed: false,
    xpReward: 80,
    type: 'exercises',
  },
];

export class AchievementService {
  private static readonly STORAGE_KEY = 'aprenda_rima_achievements';
  private static readonly MISSIONS_KEY = 'aprenda_rima_daily_missions';

  /**
   * Obtém achievements desbloqueados do usuário
   */
  static getUnlockedAchievements(): string[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Verifica e desbloqueia achievements baseado em stats
   */
  static checkAchievements(stats: PlayerStats): Achievement[] {
    const unlockedIds = this.getUnlockedAchievements();
    const newAchievements: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (!unlockedIds.includes(achievement.id) && achievement.condition(stats)) {
        newAchievements.push(achievement);
        unlockedIds.push(achievement.id);
      }
    }

    // Salva achievements desbloqueados
    if (newAchievements.length > 0) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(unlockedIds));
    }

    return newAchievements;
  }

  /**
   * Obtém todos os achievements com status de desbloqueio
   */
  static getAllAchievementsWithStatus(): (Achievement & { unlocked: boolean })[] {
    const unlockedIds = this.getUnlockedAchievements();
    return ACHIEVEMENTS.map((achievement) => ({
      ...achievement,
      unlocked: unlockedIds.includes(achievement.id),
    }));
  }

  /**
   * Obtém missão diária (rotativa)
   */
  static getTodayMission(): DailyMission {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = localStorage.getItem(this.MISSIONS_KEY);
      const missions = data ? JSON.parse(data) : {};

      if (missions.date === today && missions.mission) {
        return missions.mission;
      }

      // Gera nova missão para o dia
      const dayOfYear = Math.floor(
        (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
      );
      const missionIndex = dayOfYear % DAILY_MISSIONS_POOL.length;
      const missionTemplate = DAILY_MISSIONS_POOL[missionIndex];

      const newMission: DailyMission = {
        id: `mission_${today}`,
        date: today,
        title: missionTemplate.title,
        description: missionTemplate.description,
        target: missionTemplate.target,
        current: 0,
        completed: false,
        xpReward: missionTemplate.xpReward,
        type: missionTemplate.type,
      };

      localStorage.setItem(this.MISSIONS_KEY, JSON.stringify({ date: today, mission: newMission }));
      return newMission;
    } catch {
      // Fallback
      const today = new Date().toISOString().split('T')[0];
      return {
        id: `mission_${today}`,
        date: today,
        title: 'Aquecimento Matinal',
        description: 'Complete 5 exercícios',
        target: 5,
        current: 0,
        completed: false,
        xpReward: 50,
        type: 'exercises',
      };
    }
  }

  /**
   * Atualiza progresso de missão diária
   */
  static updateMissionProgress(
    missionId: string,
    currentValue: number,
  ): { mission: DailyMission; completed: boolean; xpReward: number } {
    try {
      const data = localStorage.getItem(this.MISSIONS_KEY);
      const missions = data ? JSON.parse(data) : {};

      if (missions.mission && missions.mission.id === missionId) {
        const mission = missions.mission;
        mission.current = Math.min(currentValue, mission.target);
        mission.completed = mission.current >= mission.target;

        const xpReward = mission.completed ? mission.xpReward : 0;

        localStorage.setItem(this.MISSIONS_KEY, JSON.stringify(missions));

        return {
          mission,
          completed: mission.completed,
          xpReward,
        };
      }

      return { mission: this.getTodayMission(), completed: false, xpReward: 0 };
    } catch {
      return { mission: this.getTodayMission(), completed: false, xpReward: 0 };
    }
  }

  /**
   * Reseta achievements (para teste)
   */
  static resetAchievements(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.MISSIONS_KEY);
  }

  /**
   * Obtém progresso geral de achievements
   */
  static getProgress(): { total: number; unlocked: number; percentage: number } {
    const unlockedIds = this.getUnlockedAchievements();
    const total = ACHIEVEMENTS.length;
    const unlocked = unlockedIds.length;
    const percentage = Math.round((unlocked / total) * 100);

    return { total, unlocked, percentage };
  }
}
