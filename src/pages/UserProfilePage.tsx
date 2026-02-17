import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserProfileService } from '../services/userProfileService';
import { XPService } from '../services/xpService';
import { LevelService } from '../services/levelService';
import { StreakService } from '../services/streakService';

export function UserProfilePage() {
  const profile = UserProfileService.getProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatarEmoji);
  const [selectedGenre, setSelectedGenre] = useState(profile.favoriteGenre);
  const [copied, setCopied] = useState(false);

  // Stats
  const totalXP = XPService.getTotalXP();
  const currentLevel = LevelService.getCurrentLevel(totalXP);
  const currentStreak = StreakService.getCurrentStreak();
  const totalExercises = XPService.getTotalExercisesCount();
  const totalCorrect = XPService.getTotalCorrectAnswers();
  const accuracyRate = totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 0;

  const handleSave = () => {
    UserProfileService.setUsername(username);
    UserProfileService.setBio(bio);
    UserProfileService.setAvatarEmoji(selectedAvatar);
    UserProfileService.setFavoriteGenre(selectedGenre);
    setIsEditing(false);
  };

  const handleShareCard = () => {
    const card = UserProfileService.generateShareCard({
      totalXP,
      currentLevel,
      currentStreak,
      totalExercises,
      accuracyRate,
    });
    navigator.clipboard.writeText(card);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const genres = [
    { id: 'rimas', label: '🎵 Rimas', color: 'from-blue-400 to-blue-600' },
    { id: 'flow', label: '🎤 Flow', color: 'from-purple-400 to-purple-600' },
    { id: 'criatividade', label: '🎨 Criatividade', color: 'from-pink-400 to-pink-600' },
    { id: 'batalha', label: '⚔️ Batalha', color: 'from-red-400 to-red-600' },
    { id: 'todos', label: '⭐ Todos', color: 'from-yellow-400 to-yellow-600' },
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
          <h1 className="text-4xl font-bold text-white mb-2">👤 Meu Perfil</h1>
          <p className="text-slate-300">Customize seu perfil e veja suas estatísticas</p>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg shadow-xl border border-slate-600 p-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
            {/* Avatar */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="text-8xl cursor-pointer"
            >
              {selectedAvatar || profile.avatarEmoji}
            </motion.div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Seu nome de usuário"
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 outline-none"
                    maxLength={50}
                  />
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Sua bio (opcional)"
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 outline-none resize-none h-20"
                    maxLength={150}
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-white mb-2">{profile.username}</h2>
                  {profile.bio && <p className="text-slate-300 text-lg">{profile.bio}</p>}
                </>
              )}

              <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  Membro desde {new Date(profile.joinedDate).toLocaleDateString('pt-BR')}
                </span>
                {profile.favoriteGenre !== 'todos' && (
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    Favorito: {genres.find((g) => g.id === profile.favoriteGenre)?.label}
                  </span>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(!isEditing)}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                isEditing
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isEditing ? '✓ Pronto' : '✏️ Editar'}
            </motion.button>
          </div>

          {/* Edit Mode - Avatar & Genre Selection */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-6 pt-6 border-t border-slate-600"
            >
              {/* Avatar Selection */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Escolha seu avatar</h3>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                  {UserProfileService.getAvailableAvatars().map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedAvatar(emoji)}
                      className={`text-4xl p-2 rounded-lg transition-all ${
                        selectedAvatar === emoji
                          ? 'bg-blue-600 ring-2 ring-blue-300'
                          : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Genre Selection */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Seu gênero favorito</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {genres.map((genre) => (
                    <motion.button
                      key={genre.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedGenre(genre.id as any)}
                      className={`px-4 py-2 rounded-lg font-bold transition-all ${
                        selectedGenre === genre.id
                          ? `bg-gradient-to-r ${genre.color} text-white ring-2 ring-white`
                          : 'bg-slate-600 text-white hover:bg-slate-500'
                      }`}
                    >
                      {genre.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all"
              >
                💾 Salvar Mudanças
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {[
            { label: 'XP Total', value: totalXP, icon: '⭐', color: 'from-yellow-400 to-yellow-600' },
            { label: 'Nível', value: currentLevel, icon: '🎖️', color: 'from-purple-400 to-purple-600' },
            { label: 'Streak', value: `${currentStreak}d`, icon: '🔥', color: 'from-orange-400 to-orange-600' },
            { label: 'Exercícios', value: totalExercises, icon: '📚', color: 'from-blue-400 to-blue-600' },
            { label: 'Acertos', value: totalCorrect, icon: '✅', color: 'from-green-400 to-green-600' },
            { label: 'Acurácia', value: `${accuracyRate}%`, icon: '🎯', color: 'from-pink-400 to-pink-600' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className={`bg-gradient-to-br ${stat.color} rounded-lg p-4 text-white shadow-lg`}
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm opacity-90">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Share Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg shadow-xl border border-slate-600 p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4">📤 Compartilhe seu Perfil</h2>
          <p className="text-slate-300 mb-4">Copie seu card de perfil para compartilhar:</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShareCard}
            className={`w-full py-3 rounded-lg font-bold transition-all ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {copied ? '✅ Copiado!' : '📋 Copiar Card de Perfil'}
          </motion.button>
        </motion.div>

        {/* Reset Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-700 rounded-lg p-6 border border-red-600"
        >
          <h3 className="text-lg font-bold text-red-400 mb-2">⚠️ Zona de Perigo</h3>
          <p className="text-slate-300 mb-4">Remonta todas as configurações de perfil para o padrão.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (window.confirm('Tem certeza? Isso vai resetar seu perfil.')) {
                UserProfileService.resetProfile();
                window.location.reload();
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-lg transition-all"
          >
            🔄 Resetar Perfil
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
