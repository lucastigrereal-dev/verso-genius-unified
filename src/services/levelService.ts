import Database from 'better-sqlite3';
import path from 'path';

interface LevelProgress {
  currentLevel: number;
  currentXP: number;
  xpForNextLevel: number;
  xpProgress: number;
  percentToNextLevel: number;
  isLevelUp: boolean;
}

const db = new Database(path.join(process.cwd(), 'data', 'rimas.db'));

export class LevelService {
  // Exponential curve: 100 * 1.5^(level-1)
  static getXPForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.floor(100 * Math.pow(1.5, level - 2));
  }

  /**
   * Calcula nível baseado em XP total
   */
  static calculateLevel(totalXP: number): number {
    let level = 1;
    let accumulatedXP = 0;

    for (let i = 2; i <= 50; i++) {
      const xpNeeded = this.getXPForLevel(i);
      if (accumulatedXP + xpNeeded > totalXP) {
        return i - 1;
      }
      accumulatedXP += xpNeeded;
      level = i - 1;
    }

    return Math.min(50, level);
  }

  /**
   * Get total XP acumulado para atingir um nível
   */
  static getTotalXPForLevel(level: number): number {
    let total = 0;
    for (let i = 2; i <= level; i++) {
      total += this.getXPForLevel(i);
    }
    return total;
  }

  /**
   * Get progresso de XP
   */
  static getLevelProgress(totalXP: number): LevelProgress {
    const currentLevel = this.calculateLevel(totalXP);
    const xpForCurrentLevel = this.getTotalXPForLevel(currentLevel);
    const xpForNextLevel = this.getTotalXPForLevel(currentLevel + 1);

    const currentXP = totalXP - xpForCurrentLevel;
    const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
    const percentToNextLevel = Math.floor((currentXP / xpNeededForNext) * 100);

    return {
      currentLevel,
      currentXP,
      xpForNextLevel: xpNeededForNext,
      xpProgress: currentXP,
      percentToNextLevel,
      isLevelUp: currentLevel > 1 && totalXP >= xpForCurrentLevel
    };
  }

  /**
   * Get reward por level (badge, cosmetic, etc)
   */
  static getLevelRewards(level: number): string[] {
    const rewards: Record<number, string[]> = {
      5: ['badge:beginner'],
      10: ['cosmetic:bronze_border'],
      15: ['badge:intermediate'],
      20: ['cosmetic:silver_border', 'emote:fire'],
      25: ['badge:advanced'],
      30: ['cosmetic:gold_border'],
      40: ['cosmetic:platinum_border', 'emote:king'],
      50: ['cosmetic:legendary_border', 'achievement:legend']
    };

    return rewards[level] ?? [];
  }

  /**
   * Update level no banco
   */
  static updateLevel(userId: string, totalXP: number): void {
    const level = this.calculateLevel(totalXP);

    const stmt = db.prepare(`
      UPDATE user_progress
      SET nivel = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);

    stmt.run(level, userId);
  }
}
