import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserProfileService } from '../services/userProfileService';

export function SettingsPage() {
  const profile = UserProfileService.getProfile();
  const [settings, setSettings] = useState({
    theme: profile.theme,
    notificationsEnabled: profile.notificationsEnabled,
    soundEnabled: profile.soundEnabled,
    darkModeEnabled: profile.darkModeEnabled,
  });
  const [saved, setSaved] = useState(false);

  const handleChangeTheme = (theme: 'light' | 'dark' | 'auto') => {
    const newSettings = { ...settings, theme };
    setSettings(newSettings);
    UserProfileService.setTheme(theme);
    setSaved(false);
  };

  const handleChangeNotifications = (enabled: boolean) => {
    setSettings({ ...settings, notificationsEnabled: enabled });
    UserProfileService.setNotificationsEnabled(enabled);
    setSaved(false);
  };

  const handleChangeSound = (enabled: boolean) => {
    setSettings({ ...settings, soundEnabled: enabled });
    UserProfileService.setSoundEnabled(enabled);
    setSaved(false);
  };

  const handleChangeDarkMode = (enabled: boolean) => {
    setSettings({ ...settings, darkModeEnabled: enabled });
    UserProfileService.setDarkModeEnabled(enabled);
    setSaved(false);
  };

  const handleSaveAll = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const themes = [
    { id: 'light', label: '☀️ Claro', description: 'Sempre usar tema claro' },
    { id: 'dark', label: '🌙 Escuro', description: 'Sempre usar tema escuro' },
    { id: 'auto', label: '🔄 Automático', description: 'Seguir preferência do sistema' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 pt-8 pb-6 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">⚙️ Configurações</h1>
          <p className="text-slate-300">Personalize sua experiência no Aprenda Rima</p>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Save Indicator */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-600 text-white px-4 py-3 rounded-lg font-bold text-center"
          >
            ✅ Configurações salvas com sucesso!
          </motion.div>
        )}

        {/* Theme Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-6">🎨 Tema Visual</h2>

          <div className="space-y-4">
            {themes.map((theme) => (
              <motion.button
                key={theme.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChangeTheme(theme.id as any)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  settings.theme === theme.id
                    ? 'border-blue-500 bg-blue-900 bg-opacity-30'
                    : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-lg">{theme.label}</div>
                    <div className="text-sm text-slate-300 mt-1">{theme.description}</div>
                  </div>
                  {settings.theme === theme.id && (
                    <div className="text-3xl">✓</div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Dark Mode Manual Override */}
          <div className="mt-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-white">🌙 Forçar Dark Mode</div>
                <div className="text-sm text-slate-300 mt-1">Ativar dark mode independente do tema</div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleChangeDarkMode(!settings.darkModeEnabled)}
                className={`w-14 h-8 rounded-full transition-all ${
                  settings.darkModeEnabled
                    ? 'bg-blue-600'
                    : 'bg-slate-600'
                }`}
              >
                <motion.div
                  animate={{ x: settings.darkModeEnabled ? 28 : 4 }}
                  className="w-6 h-6 bg-white rounded-full"
                />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-6">🔔 Notificações</h2>

          <div className="space-y-4">
            <div className="p-4 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Notificações Push</div>
                <div className="text-sm text-slate-300 mt-1">Receba alertas de missões e achievements</div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleChangeNotifications(!settings.notificationsEnabled)}
                className={`w-14 h-8 rounded-full transition-all ${
                  settings.notificationsEnabled
                    ? 'bg-green-600'
                    : 'bg-slate-600'
                }`}
              >
                <motion.div
                  animate={{ x: settings.notificationsEnabled ? 28 : 4 }}
                  className="w-6 h-6 bg-white rounded-full"
                />
              </motion.button>
            </div>

            <div className="p-4 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Som</div>
                <div className="text-sm text-slate-300 mt-1">Ativar sons de sucesso e notificação</div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleChangeSound(!settings.soundEnabled)}
                className={`w-14 h-8 rounded-full transition-all ${
                  settings.soundEnabled
                    ? 'bg-green-600'
                    : 'bg-slate-600'
                }`}
              >
                <motion.div
                  animate={{ x: settings.soundEnabled ? 28 : 4 }}
                  className="w-6 h-6 bg-white rounded-full"
                />
              </motion.button>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg">
            <div className="text-sm text-blue-200">
              💡 Dica: Notificações ajudam a manter sua sequência e lembram de missões diárias!
            </div>
          </div>
        </motion.div>

        {/* Sound & Vibration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-6">🔊 Áudio & Vibração</h2>

          <div className="space-y-4">
            <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
              <div className="font-bold text-white mb-3">Volume Geral</div>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="80"
                className="w-full"
              />
              <div className="text-sm text-slate-300 mt-2">80%</div>
            </div>

            <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-white">Vibração ao Acertar</div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-8 rounded-full bg-green-600 transition-all"
                >
                  <motion.div
                    animate={{ x: 28 }}
                    className="w-6 h-6 bg-white rounded-full"
                  />
                </motion.button>
              </div>
              <div className="text-sm text-slate-300">Dispositivo vibrará quando você acertar</div>
            </div>
          </div>
        </motion.div>

        {/* App Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-6">ℹ️ Sobre o App</h2>

          <div className="space-y-3 text-slate-300">
            <div className="flex justify-between items-center">
              <span>Versão</span>
              <span className="font-bold">2.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span>ID do Usuário</span>
              <span className="font-mono text-sm">{profile.id.slice(0, 12)}...</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Membro Desde</span>
              <span className="font-bold">
                {new Date(profile.joinedDate).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Idioma</span>
              <span className="font-bold">Português (BR)</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg">
            <div className="text-sm text-blue-200 mb-2">
              📚 Confira nossos links:
            </div>
            <div className="text-sm space-y-1">
              <div>• GitHub: github.com/lucastigrereal-dev/ia-rimas-brasil</div>
              <div>• Website: ia-rimas-brasil.vercel.app</div>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveAll}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 rounded-lg transition-all"
          >
            💾 Salvar Todas as Alterações
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all"
          >
            ↩️ Restaurar Padrão
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
