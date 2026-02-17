/**
 * User Comparison Service
 * Compara seu progresso com outros usuários simulados
 */

export interface ComparisonData {
  username: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
  exercises: number;
  accuracy: number;
  achievements: number;
  isCurrentUser: boolean;
}

const SIMULATED_PLAYERS: Omit<ComparisonData, 'isCurrentUser'>[] = [
  {
    username: 'MC Python',
    avatar: '🐍',
    xp: 15000,
    level: 42,
    streak: 45,
    exercises: 850,
    accuracy: 82,
    achievements: 18,
  },
  {
    username: 'Beat Master J',
    avatar: '🎧',
    xp: 12500,
    level: 38,
    streak: 38,
    exercises: 720,
    accuracy: 79,
    achievements: 16,
  },
  {
    username: 'Flow King',
    avatar: '👑',
    xp: 11200,
    level: 36,
    streak: 34,
    exercises: 680,
    accuracy: 81,
    achievements: 15,
  },
  {
    username: 'Rima Ninja',
    avatar: '🥷',
    xp: 9800,
    level: 33,
    streak: 28,
    exercises: 620,
    accuracy: 77,
    achievements: 13,
  },
  {
    username: 'Lyric Genius',
    avatar: '🧠',
    xp: 8900,
    level: 31,
    streak: 25,
    exercises: 580,
    accuracy: 80,
    achievements: 12,
  },
];

export class UserComparisonService {
  /**
   * Compara usuário com outros
   */
  static compareWithOthers(
    currentUserData: Omit<ComparisonData, 'username' | 'avatar' | 'isCurrentUser'>,
    username: string,
    avatar: string,
  ): ComparisonData[] {
    const all: ComparisonData[] = [
      ...SIMULATED_PLAYERS,
      {
        username,
        avatar,
        ...currentUserData,
        isCurrentUser: true,
      },
    ];

    return all.sort((a, b) => b.xp - a.xp).map((player, index) => ({
      ...player,
      isCurrentUser: player.isCurrentUser || false,
    }));
  }

  /**
   * Calcula diferença percentual com próximo jogador
   */
  static calculateDifference(
    yourXP: number,
    otherXP: number,
  ): { difference: number; percentage: number } {
    const difference = yourXP - otherXP;
    const percentage = otherXP > 0 ? Math.round((difference / otherXP) * 100) : 0;
    return { difference, percentage };
  }

  /**
   * Encontra em qual posição você está
   */
  static findUserRank(
    comparisons: ComparisonData[],
  ): { rank: number; total: number; message: string } {
    const rank = comparisons.findIndex((c) => c.isCurrentUser) + 1;
    const total = comparisons.length;

    let message = '';
    if (rank === 1) message = '🥇 Você é o melhor!';
    else if (rank <= 3) message = '🏆 Você está no pódio!';
    else if (rank <= 5) message = '⭐ Você está no top 5!';
    else if (rank <= 10) message = '📈 Continue evoluindo!';
    else message = `🚀 Posição #${rank}. Você pode chegar no topo!`;

    return { rank, total, message };
  }

  /**
   * Calcula quanto você precisa para alcançar o próximo jogador
   */
  static calculateXPToNext(comparisons: ComparisonData[]): {
    nextPlayer: ComparisonData | null;
    xpNeeded: number;
  } {
    const currentIndex = comparisons.findIndex((c) => c.isCurrentUser);
    if (currentIndex <= 0) return { nextPlayer: null, xpNeeded: 0 };

    const nextPlayer = comparisons[currentIndex - 1];
    const currentPlayer = comparisons[currentIndex];
    const xpNeeded = nextPlayer.xp - currentPlayer.xp;

    return { nextPlayer, xpNeeded: Math.max(0, xpNeeded) };
  }

  /**
   * Gera insight comparativo
   */
  static generateComparativeInsight(comparisons: ComparisonData[]): string {
    const current = comparisons.find((c) => c.isCurrentUser);
    if (!current) return '';

    const average = comparisons.reduce((sum, p) => sum + p.xp, 0) / comparisons.length;
    const avgAccuracy =
      comparisons.reduce((sum, p) => sum + p.accuracy, 0) / comparisons.length;

    if (current.xp > average) {
      return `💪 Você tem ${Math.round(((current.xp - average) / average) * 100)}% mais XP que a média!`;
    } else if (current.accuracy > avgAccuracy) {
      return `🎯 Sua acurácia é ${Math.round(current.accuracy - avgAccuracy)}% melhor que a média!`;
    } else {
      return `📈 Você está próximo de ultrapassar alguém, continue assim!`;
    }
  }
}
