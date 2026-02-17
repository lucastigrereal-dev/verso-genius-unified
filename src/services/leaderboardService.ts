/**
 * Leaderboard Service
 * Gerencia rankings com dados simulados + dados do usuário
 */

import { XPService } from './xpService';
import { StreakService } from './streakService';

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  xp: number;
  level: number;
  isCurrentUser?: boolean;
  badge?: string;
}

// Dados simulados de outros usuários (fixtures)
const SIMULATED_USERS = [
  { username: 'MC Python', avatar: '🐍', xp: 15000, level: 42 },
  { username: 'Beat Master J', avatar: '🎧', xp: 12500, level: 38 },
  { username: 'Flow King', avatar: '👑', xp: 11200, level: 36 },
  { username: 'Rima Ninja', avatar: '🥷', xp: 9800, level: 33 },
  { username: 'Lyric Genius', avatar: '🧠', xp: 8900, level: 31 },
  { username: 'Dropout Rapper', avatar: '📚', xp: 7600, level: 29 },
  { username: 'Studio Beast', avatar: '🎙️', xp: 6500, level: 27 },
  { username: 'Freestyle King', avatar: '🎤', xp: 5200, level: 25 },
  { username: 'Beat Seeker', avatar: '🔍', xp: 4100, level: 22 },
  { username: 'Rhythm Master', avatar: '🥁', xp: 3400, level: 20 },
];

const SIMULATED_STREAKS = [
  { username: 'Streak Lord', avatar: '🔥', streak: 89 },
  { username: 'Daily Grinder', avatar: '⚡', streak: 72 },
  { username: 'Consistent King', avatar: '👑', streak: 65 },
  { username: 'No Days Off', avatar: '🚀', streak: 58 },
  { username: 'Fire Beast', avatar: '🌊', streak: 47 },
  { username: 'Always On', avatar: '⏰', streak: 38 },
  { username: 'One Way Up', avatar: '📈', streak: 32 },
  { username: 'Rising Star', avatar: '⭐', streak: 28 },
  { username: 'Comeback Kid', avatar: '🎯', streak: 21 },
  { username: 'New Grinder', avatar: '💪', streak: 14 },
];

const SIMULATED_EXERCISES = [
  { username: 'Exercise Junkie', avatar: '🏋️', count: 892 },
  { username: 'Training Maniac', avatar: '💯', count: 756 },
  { username: 'Lesson Killer', avatar: '⚔️', count: 654 },
  { username: 'Practice Master', avatar: '🎯', count: 589 },
  { username: 'Grind Hard', avatar: '💪', count: 521 },
  { username: 'Consistency King', avatar: '👑', count: 456 },
  { username: 'Improve Daily', avatar: '📈', count: 392 },
  { username: 'Study Buddy', avatar: '📚', count: 328 },
  { username: 'Growth Seeker', avatar: '🌱', count: 267 },
  { username: 'Quest Runner', avatar: '🚀', count: 198 },
];

export class LeaderboardService {
  /**
   * Obtém leaderboard por XP
   */
  static getLeaderboardByXP(currentUserXP: number, currentUsername: string): LeaderboardEntry[] {
    // Combina usuários simulados + usuário atual
    const allUsers = [
      ...SIMULATED_USERS,
      { username: currentUsername, avatar: '😎', xp: currentUserXP, level: 1 }, // Level será calculado depois
    ];

    // Ordena por XP
    const sorted = allUsers.sort((a, b) => b.xp - a.xp);

    // Mapeia para leaderboard
    return sorted.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      avatar: user.avatar,
      xp: user.xp,
      level: this.estimateLevel(user.xp),
      isCurrentUser: user.username === currentUsername,
      badge: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : undefined,
    }));
  }

  /**
   * Obtém leaderboard por Streak
   */
  static getLeaderboardByStreak(
    currentUserStreak: number,
    currentUsername: string,
  ): LeaderboardEntry[] {
    const allUsers = [
      ...SIMULATED_STREAKS,
      { username: currentUsername, avatar: '🔥', streak: currentUserStreak },
    ];

    const sorted = allUsers.sort((a, b) => b.streak - a.streak);

    return sorted.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      avatar: user.avatar,
      xp: user.streak, // Reusa para streak
      level: 0, // Não usado
      isCurrentUser: user.username === currentUsername,
      badge: index === 0 ? '🔥' : index === 1 ? '💥' : index === 2 ? '⚡' : undefined,
    }));
  }

  /**
   * Obtém leaderboard por Exercícios Completados
   */
  static getLeaderboardByExercises(
    currentUserExercises: number,
    currentUsername: string,
  ): LeaderboardEntry[] {
    const allUsers = [
      ...SIMULATED_EXERCISES,
      { username: currentUsername, avatar: '📚', count: currentUserExercises },
    ];

    const sorted = allUsers.sort((a, b) => b.count - a.count);

    return sorted.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      avatar: user.avatar,
      xp: user.count, // Reusa para exercises
      level: 0, // Não usado
      isCurrentUser: user.username === currentUsername,
      badge: index === 0 ? '🏆' : index === 1 ? '🥇' : index === 2 ? '🥈' : undefined,
    }));
  }

  /**
   * Estima nível baseado em XP
   */
  private static estimateLevel(xp: number): number {
    if (xp < 100) return 1;
    if (xp < 300) return 2;
    if (xp < 600) return 3;
    if (xp < 1000) return 5;
    if (xp < 1500) return 8;
    if (xp < 2500) return 12;
    if (xp < 4000) return 18;
    if (xp < 6000) return 25;
    if (xp < 9000) return 32;
    if (xp < 13000) return 40;
    return 50;
  }

  /**
   * Obtém posição do usuário em cada leaderboard
   */
  static getUserRankings(
    userXP: number,
    userStreak: number,
    userExercises: number,
    username: string,
  ): {
    xpRank: number;
    streakRank: number;
    exercisesRank: number;
  } {
    const xpBoard = this.getLeaderboardByXP(userXP, username);
    const streakBoard = this.getLeaderboardByStreak(userStreak, username);
    const exercisesBoard = this.getLeaderboardByExercises(userExercises, username);

    return {
      xpRank: xpBoard.find((e) => e.isCurrentUser)?.rank || 999,
      streakRank: streakBoard.find((e) => e.isCurrentUser)?.rank || 999,
      exercisesRank: exercisesBoard.find((e) => e.isCurrentUser)?.rank || 999,
    };
  }

  /**
   * Gera feedback motivacional baseado em ranking
   */
  static getMotivationalMessage(rank: number): string {
    if (rank === 1) return '🏆 CAMPEÃO! Você é o melhor!';
    if (rank === 2) return '🥈 Muito perto do topo!';
    if (rank === 3) return '🥉 No pódio! Parabéns!';
    if (rank <= 5) return '⭐ Top 5! Você está arrasando!';
    if (rank <= 10) return '🚀 Estou vendo seu potencial!';
    return `📈 Posição #${rank}. Continue evoluindo!`;
  }
}
