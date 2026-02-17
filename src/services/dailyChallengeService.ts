import Database from 'better-sqlite3';
import path from 'path';

interface DailyChallenge {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'exercise' | 'theme' | 'xp_goal' | 'battle';
  target: any;
  reward_xp: number;
  completed: boolean;
  progress: number;
}

const db = new Database(path.join(process.cwd(), 'data', 'rimas.db'));

// Challenges data - pode ser hardcoded ou em arquivo JSON
const CHALLENGES_POOL: Omit<DailyChallenge, 'id' | 'date' | 'completed' | 'progress'>[] = [
  {
    title: 'Prática Matinal',
    description: 'Complete 1 exercício antes das 12h',
    type: 'exercise',
    target: { count: 1, deadline_hour: 12 },
    reward_xp: 50
  },
  {
    title: 'Desafio Battle',
    description: 'Vença 1 duelo contra a IA',
    type: 'battle',
    target: { difficulty: 'easy', wins: 1 },
    reward_xp: 100
  },
  {
    title: 'Mestre de Rimas',
    description: 'Complete 2 exercícios de Pillar 1',
    type: 'theme',
    target: { pillar: 1, count: 2 },
    reward_xp: 75
  },
  {
    title: 'Ganhe 200 XP',
    description: 'Acumule 200 XP em qualquer atividade',
    type: 'xp_goal',
    target: { amount: 200 },
    reward_xp: 200
  },
  {
    title: 'Speed Master',
    description: 'Complete 1 Speed Challenge',
    type: 'exercise',
    target: { type: 'speed', count: 1 },
    reward_xp: 80
  },
  {
    title: 'Rhythm Sync',
    description: 'Sincronize perfeitamente com o beat (>90%)',
    type: 'exercise',
    target: { type: 'rhythm', score: 90 },
    reward_xp: 120
  },
  {
    title: 'Gravador de Ouro',
    description: 'Grave um verso com score > 85/100',
    type: 'exercise',
    target: { type: 'production', score: 85 },
    reward_xp: 150
  },
  {
    title: 'Semana de Fogo',
    description: 'Acumule 7 dias de streak',
    type: 'theme',
    target: { streak: 7 },
    reward_xp: 500
  }
];

export class DailyChallengeService {
  /**
   * Gera challenge para o dia baseado em seed
   */
  static getTodayChallenge(userId: string): DailyChallenge {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Seed baseado na data (mesmo desafio para todos usuários no mesmo dia)
    const dateNum = parseInt(today.replace(/-/g, ''));
    const index = dateNum % CHALLENGES_POOL.length;
    const challenge = CHALLENGES_POOL[index];

    // Verifica se já completou hoje
    const stmt = db.prepare(`
      SELECT 1 FROM daily_challenge_completions
      WHERE user_id = ? AND DATE(challenge_date) = DATE('now')
    `);

    const completed = !!stmt.get(userId);

    return {
      id: `challenge_${today}`,
      date: today,
      completed,
      progress: completed ? 100 : 0,
      ...challenge
    };
  }

  /**
   * Marca challenge como completo
   */
  static completeChallenge(userId: string, challengeId: string): void {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO daily_challenge_completions
      (user_id, challenge_date)
      VALUES (?, DATE('now'))
    `);

    stmt.run(userId);
  }

  /**
   * Get desafios próximos (próximos 7 dias)
   */
  static getUpcomingChallenges(days = 7): DailyChallenge[] {
    const upcoming: DailyChallenge[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const dateNum = parseInt(dateStr.replace(/-/g, ''));
      const index = dateNum % CHALLENGES_POOL.length;
      const challenge = CHALLENGES_POOL[index];

      upcoming.push({
        id: `challenge_${dateStr}`,
        date: dateStr,
        completed: false,
        progress: 0,
        ...challenge
      });
    }

    return upcoming;
  }
}
