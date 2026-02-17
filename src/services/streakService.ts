import Database from 'better-sqlite3';
import path from 'path';

interface StreakStatus {
  currentStreak: number;
  bestStreak: number;
  multiplier: number;
  lastActivityDate: string | null;
  isStreakAtRisk: boolean;
  canContinueToday: boolean;
}

const db = new Database(path.join(process.cwd(), 'data', 'rimas.db'));

export class StreakService {
  /**
   * Calcula multiplicador baseado em dias de streak
   */
  static getStreakMultiplier(streakDays: number): number {
    if (streakDays === 0) return 1.0;
    if (streakDays < 7) return 1.0 + (streakDays * 0.1); // 1.0x -> 1.6x
    if (streakDays < 14) return 1.6 + ((streakDays - 7) * 0.05); // 1.6x -> 1.95x
    return Math.min(3.0, 1.95 + ((streakDays - 14) * 0.01)); // até 3.0x
  }

  /**
   * Checa e retorna status do streak
   */
  static checkStreak(userId: string): StreakStatus {
    const stmt = db.prepare(`
      SELECT current_streak, best_streak, last_activity_at
      FROM user_progress
      WHERE user_id = ?
    `);

    const row = stmt.get(userId) as {
      current_streak: number;
      best_streak: number;
      last_activity_at: string | null;
    } | undefined;

    if (!row) {
      return {
        currentStreak: 0,
        bestStreak: 0,
        multiplier: 1.0,
        lastActivityDate: null,
        isStreakAtRisk: false,
        canContinueToday: true
      };
    }

    const lastActivity = row.last_activity_at ? new Date(row.last_activity_at) : null;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let currentStreak = row.current_streak;
    let isStreakAtRisk = false;
    let canContinueToday = true;

    if (lastActivity) {
      const lastDate = new Date(lastActivity);
      const lastDateOnly = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

      if (lastDateOnly.getTime() === todayOnly.getTime()) {
        // Já completou hoje
        canContinueToday = false;
      } else if (lastDateOnly.getTime() !== yesterdayOnly.getTime()) {
        // Quebrou o streak
        currentStreak = 0;
      }

      // Streak em risco se não fez ontem
      const daysSince = Math.floor((todayOnly.getTime() - lastDateOnly.getTime()) / (1000 * 60 * 60 * 24));
      isStreakAtRisk = daysSince === 1 && canContinueToday;
    }

    return {
      currentStreak,
      bestStreak: row.best_streak,
      multiplier: this.getStreakMultiplier(currentStreak),
      lastActivityDate: row.last_activity_at,
      isStreakAtRisk,
      canContinueToday
    };
  }

  /**
   * Atualiza streak quando usuário completa atividade
   */
  static updateStreak(userId: string): StreakStatus {
    const current = this.checkStreak(userId);

    let newStreak = current.currentStreak;
    if (current.canContinueToday) {
      newStreak = current.currentStreak + 1;
    }

    const newBest = Math.max(current.bestStreak, newStreak);

    const stmt = db.prepare(`
      UPDATE user_progress
      SET current_streak = ?,
          best_streak = ?,
          last_activity_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);

    stmt.run(newStreak, newBest, userId);

    return this.checkStreak(userId);
  }

  /**
   * Reseta streak (para debug/admin)
   */
  static resetStreak(userId: string): void {
    const stmt = db.prepare(`
      UPDATE user_progress
      SET current_streak = 0, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);

    stmt.run(userId);
  }
}
