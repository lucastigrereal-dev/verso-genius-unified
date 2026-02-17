/**
 * Daily Rewards Service
 * Sistema de recompensas diárias com streaks e bônus
 */

export interface DailyReward {
  day: number;
  xpReward: number;
  description: string;
  claimed: boolean;
  claimedAt?: number;
}

export interface RewardTrack {
  streak: number;
  lastClaimDate: string;
  rewards: DailyReward[];
  totalXPClaimed: number;
}

const REWARD_TIERS = [
  { day: 1, xp: 50, description: 'Primeiro acesso' },
  { day: 2, xp: 60, description: 'Segundo dia' },
  { day: 3, xp: 75, description: 'Terceiro dia' },
  { day: 4, xp: 90, description: 'Quarto dia' },
  { day: 5, xp: 125, description: '⭐ Semana começando!' },
  { day: 6, xp: 150, description: 'Sexto dia' },
  { day: 7, xp: 250, description: '🎊 Semana completa!' },
];

export class DailyRewardsService {
  private static readonly STORAGE_KEY = 'aprenda_rima_daily_rewards';

  /**
   * Obtém rastreamento de recompensas
   */
  static getRewardTrack(): RewardTrack {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Erro ao carregar recompensas:', e);
    }

    return {
      streak: 0,
      lastClaimDate: '',
      rewards: REWARD_TIERS.map((tier, i) => ({
        day: tier.day,
        xpReward: tier.xp,
        description: tier.description,
        claimed: false,
      })),
      totalXPClaimed: 0,
    };
  }

  /**
   * Reivindica recompensa diária
   */
  static claimDailyReward(): { claimed: boolean; xpReward: number; message: string } {
    const track = this.getRewardTrack();
    const today = new Date().toISOString().split('T')[0];

    // Se já foi reclamado hoje, retorna 0
    if (track.lastClaimDate === today) {
      return { claimed: false, xpReward: 0, message: 'Você já reivindicou a recompensa de hoje!' };
    }

    // Verifica se a sequência continua
    let newStreak = track.streak;
    if (track.lastClaimDate) {
      const lastDate = new Date(track.lastClaimDate);
      const today_date = new Date(today);
      const diffDays = Math.floor((today_date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak = Math.min(track.streak + 1, REWARD_TIERS.length);
      } else if (diffDays > 1) {
        newStreak = 1; // Reset streak
      }
    } else {
      newStreak = 1; // Primeiro dia
    }

    const reward = REWARD_TIERS[newStreak - 1];
    const xpReward = reward.xp;

    // Atualiza track
    const updatedRewards = REWARD_TIERS.map((tier, i) => ({
      day: tier.day,
      xpReward: tier.xp,
      description: tier.description,
      claimed: i < newStreak,
      claimedAt: i < newStreak ? Date.now() : undefined,
    }));

    const updatedTrack: RewardTrack = {
      streak: newStreak,
      lastClaimDate: today,
      rewards: updatedRewards,
      totalXPClaimed: track.totalXPClaimed + xpReward,
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedTrack));

    const message =
      newStreak === REWARD_TIERS.length ? '🎉 Você completou a semana!' : `Dia ${newStreak} reclamado!`;

    return { claimed: true, xpReward, message };
  }

  /**
   * Reseta recompensas (para teste)
   */
  static resetRewards(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Obtém progresso visual para UI
   */
  static getRewardProgress(): {
    currentDay: number;
    totalDays: number;
    percentage: number;
    nextReward: DailyReward | null;
  } {
    const track = this.getRewardTrack();
    const today = new Date().toISOString().split('T')[0];
    const alreadyClaimed = track.lastClaimDate === today;

    const currentDay = alreadyClaimed ? track.streak : track.streak + 1;
    const totalDays = REWARD_TIERS.length;
    const percentage = Math.min((currentDay / totalDays) * 100, 100);

    const nextReward = REWARD_TIERS[currentDay - 1] || null;

    return { currentDay, totalDays, percentage, nextReward };
  }
}
