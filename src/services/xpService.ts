import Database from 'better-sqlite3';
import path from 'path';

interface XPEvent {
  type: 'exercise' | 'streak' | 'daily' | 'achievement' | 'battle';
  baseXP: number;
  multiplier: number;
  source: string;
  metadata?: Record<string, any>;
}

interface XPHistory {
  id: number;
  user_id: string;
  amount: number;
  source: string;
  multiplier: number;
  created_at: string;
}

const db = new Database(path.join(process.cwd(), 'data', 'rimas.db'));

export class XPService {
  /**
   * Calcula XP final baseado em multiplicadores
   */
  static calculateXP(event: XPEvent): number {
    const baseXP = event.baseXP;
    const multipliedXP = Math.floor(baseXP * event.multiplier);
    return Math.max(10, multipliedXP); // Mínimo 10 XP
  }

  /**
   * Adiciona XP ao usuário
   */
  static addXP(userId: string, event: XPEvent): number {
    const totalXP = this.calculateXP(event);

    // Insert na história
    const stmt = db.prepare(`
      INSERT INTO xp_history (user_id, amount, source, multiplier)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(userId, totalXP, event.source, event.multiplier);

    // Update no progresso
    const updateStmt = db.prepare(`
      UPDATE user_progress
      SET xp_total = xp_total + ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);

    updateStmt.run(totalXP, userId);

    return totalXP;
  }

  /**
   * Get total XP do usuário
   */
  static getTotalXP(userId: string): number {
    const stmt = db.prepare(`
      SELECT xp_total FROM user_progress WHERE user_id = ?
    `);

    const result = stmt.get(userId) as { xp_total: number } | undefined;
    return result?.xp_total ?? 0;
  }

  /**
   * Get XP history
   */
  static getXPHistory(userId: string, limit = 20): XPHistory[] {
    const stmt = db.prepare(`
      SELECT * FROM xp_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    return stmt.all(userId, limit) as XPHistory[];
  }

  /**
   * Get XP earned today
   */
  static getXPToday(userId: string): number {
    const stmt = db.prepare(`
      SELECT SUM(amount) as total FROM xp_history
      WHERE user_id = ?
      AND DATE(created_at) = DATE('now')
    `);

    const result = stmt.get(userId) as { total: number } | undefined;
    return result?.total ?? 0;
  }
}
