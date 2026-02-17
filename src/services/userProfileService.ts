/**
 * User Profile Service
 * Gerencia perfil do usuário com customização
 */

export interface UserProfile {
  id: string;
  username: string;
  bio: string;
  avatarEmoji: string;
  level: number;
  totalXP: number;
  joinedDate: number;
  favoriteGenre: 'rimas' | 'flow' | 'criatividade' | 'batalha' | 'todos';
  theme: 'light' | 'dark' | 'auto';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  darkModeEnabled: boolean;
}

const AVATAR_EMOJIS = [
  '🎤', '🎵', '🎧', '🎙️', '🔥', '⭐', '🚀', '💎', '👑', '🎯', '🏆', '🌟',
  '😎', '🤖', '🧠', '💪', '🎨', '🎭', '🎪', '🎬', '📱', '⚡', '🌊', '🔮'
];

export class UserProfileService {
  private static readonly STORAGE_KEY = 'aprenda_rima_user_profile';
  private static readonly DEFAULT_PROFILE: UserProfile = {
    id: 'user_' + Date.now(),
    username: 'Rapper Iniciante',
    bio: 'Descobrindo o mundo do hip-hop',
    avatarEmoji: '🎤',
    level: 1,
    totalXP: 0,
    joinedDate: Date.now(),
    favoriteGenre: 'todos',
    theme: 'auto',
    notificationsEnabled: true,
    soundEnabled: true,
    darkModeEnabled: false,
  };

  /**
   * Obtém perfil do usuário (ou cria padrão)
   */
  static getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Erro ao carregar perfil:', e);
    }
    return { ...this.DEFAULT_PROFILE };
  }

  /**
   * Atualiza perfil do usuário
   */
  static updateProfile(profile: Partial<UserProfile>): UserProfile {
    const current = this.getProfile();
    const updated = {
      ...current,
      ...profile,
      id: current.id, // Nunca alterar ID
      joinedDate: current.joinedDate, // Nunca alterar data de entrada
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Erro ao salvar perfil:', e);
    }

    return updated;
  }

  /**
   * Atualiza username
   */
  static setUsername(username: string): UserProfile {
    const sanitized = username.trim().slice(0, 50) || 'Rapper Iniciante';
    return this.updateProfile({ username: sanitized });
  }

  /**
   * Atualiza bio
   */
  static setBio(bio: string): UserProfile {
    const sanitized = bio.trim().slice(0, 150) || '';
    return this.updateProfile({ bio: sanitized });
  }

  /**
   * Muda avatar emoji
   */
  static setAvatarEmoji(emoji: string): UserProfile {
    if (!AVATAR_EMOJIS.includes(emoji)) {
      emoji = AVATAR_EMOJIS[0];
    }
    return this.updateProfile({ avatarEmoji: emoji });
  }

  /**
   * Lista todos os avatares disponíveis
   */
  static getAvailableAvatars(): string[] {
    return AVATAR_EMOJIS;
  }

  /**
   * Atualiza gênero favorito
   */
  static setFavoriteGenre(genre: UserProfile['favoriteGenre']): UserProfile {
    return this.updateProfile({ favoriteGenre: genre });
  }

  /**
   * Atualiza tema
   */
  static setTheme(theme: UserProfile['theme']): UserProfile {
    return this.updateProfile({
      theme,
      darkModeEnabled: theme === 'dark' || (theme === 'auto' && this.getSystemPrefersDark())
    });
  }

  /**
   * Verifica se sistema prefere dark mode
   */
  static getSystemPrefersDark(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Ativa/desativa notificações
   */
  static setNotificationsEnabled(enabled: boolean): UserProfile {
    return this.updateProfile({ notificationsEnabled: enabled });
  }

  /**
   * Ativa/desativa som
   */
  static setSoundEnabled(enabled: boolean): UserProfile {
    return this.updateProfile({ soundEnabled: enabled });
  }

  /**
   * Ativa/desativa dark mode manualmente
   */
  static setDarkModeEnabled(enabled: boolean): UserProfile {
    return this.updateProfile({ darkModeEnabled: enabled });
  }

  /**
   * Reseta perfil para padrão
   */
  static resetProfile(): UserProfile {
    const newProfile = { ...this.DEFAULT_PROFILE };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newProfile));
    return newProfile;
  }

  /**
   * Exporw perfil como JSON
   */
  static exportProfile(): string {
    const profile = this.getProfile();
    return JSON.stringify(profile, null, 2);
  }

  /**
   * Importa perfil de JSON
   */
  static importProfile(jsonString: string): boolean {
    try {
      const profile = JSON.parse(jsonString) as Partial<UserProfile>;
      this.updateProfile(profile);
      return true;
    } catch (e) {
      console.error('Erro ao importar perfil:', e);
      return false;
    }
  }

  /**
   * Gera card de perfil para compartilhar
   */
  static generateShareCard(stats: {
    totalXP: number;
    currentLevel: number;
    currentStreak: number;
    totalExercises: number;
    accuracyRate: number;
  }): string {
    const profile = this.getProfile();
    return `
🎤 ${profile.avatarEmoji} APRENDA RIMA PROFILE 🎤

👤 ${profile.username}
${profile.bio ? `💬 "${profile.bio}"` : ''}

📊 STATS:
  ⭐ XP: ${stats.totalXP}
  🎖️ Nível: ${stats.currentLevel}
  🔥 Streak: ${stats.currentStreak} dias
  📚 Exercícios: ${stats.totalExercises}
  🎯 Acurácia: ${stats.accuracyRate}%

Junte-se a mim em Aprenda Rima!
https://ia-rimas-brasil.vercel.app
    `.trim();
  }
}
