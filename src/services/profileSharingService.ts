/**
 * Profile Sharing Service
 * Gera códigos únicos para compartilhar perfil
 */

export interface ShareCode {
  code: string;
  createdAt: number;
  username: string;
  xp: number;
  level: number;
  streak: number;
}

export class ProfileSharingService {
  private static readonly STORAGE_KEY = 'aprenda_rima_profile_shares';

  /**
   * Gera código único para perfil
   */
  static generateShareCode(
    username: string,
    xp: number,
    level: number,
    streak: number,
  ): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${random}-${username.slice(0, 3).toUpperCase()}-${level}`;
    return code;
  }

  /**
   * Salva código compartilhado
   */
  static saveShareCode(
    username: string,
    xp: number,
    level: number,
    streak: number,
  ): { code: string; url: string } {
    const code = this.generateShareCode(username, xp, level, streak);

    const shareData: ShareCode = {
      code,
      createdAt: Date.now(),
      username,
      xp,
      level,
      streak,
    };

    try {
      const existing = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]') as ShareCode[];
      existing.push(shareData);
      // Manter apenas últimos 10 códigos
      if (existing.length > 10) {
        existing.shift();
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error('Erro ao salvar código:', e);
    }

    const url = `${window.location.origin}/?profile=${code}`;
    return { code, url };
  }

  /**
   * Obtém todos os códigos salvos
   */
  static getSavedCodes(): ShareCode[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Formata URL para compartilhamento social
   */
  static generateShareMessage(
    username: string,
    xp: number,
    level: number,
    code: string,
  ): string {
    return `🎤 Confira meu progresso em Aprenda Rima!

${username} - Nível ${level}
📊 ${xp} XP

Código do perfil: ${code}

Junte-se a mim! 🚀
https://ia-rimas-brasil.vercel.app`;
  }

  /**
   * Gera imagem de compartilhamento (texto para copiar)
   */
  static generateShareCard(
    username: string,
    xp: number,
    level: number,
    streak: number,
    accuracy: number,
  ): string {
    return `
╔════════════════════════════════╗
║   APRENDA RIMA PROFILE CARD    ║
╚════════════════════════════════╝

👤 ${username}
🎖️  Nível: ${level}
⭐ XP: ${xp}
🔥 Streak: ${streak} dias
🎯 Acurácia: ${accuracy}%

Vem conhecer meu perfil em:
ia-rimas-brasil.vercel.app

#AprendarRima #HipHop #RapBrasil
    `.trim();
  }

  /**
   * Copia para clipboard
   */
  static copyToClipboard(text: string): Promise<boolean> {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Gera link para Twitter
   */
  static generateTwitterLink(message: string): string {
    const encoded = encodeURIComponent(message);
    return `https://twitter.com/intent/tweet?text=${encoded}`;
  }

  /**
   * Gera link para compartilhamento genérico
   */
  static generateShareLink(message: string, code: string): {
    twitter: string;
    whatsapp: string;
    telegram: string;
    direct: string;
  } {
    const urlSafe = encodeURIComponent(message);
    const url = `https://ia-rimas-brasil.vercel.app/?profile=${code}`;

    return {
      twitter: `https://twitter.com/intent/tweet?text=${urlSafe}&url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${urlSafe} ${url}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${urlSafe}`,
      direct: url,
    };
  }
}
