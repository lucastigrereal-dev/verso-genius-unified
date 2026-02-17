/**
 * App With Router - Versão completa com React Router
 * Integra navegação entre:
 * - Home (Rima Generator)
 * - Dashboard (Gamification)
 * - Lesson (Exercise Player)
 * - Results (Analysis)
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Zap, BookOpen } from 'lucide-react';

// Pages - Original App
import { App as RimaGenerator } from './App';

// Pages - New Sprint 2/3 Pages
import DashboardPage from '../pages/DashboardPage';
import LessonPage from '../pages/LessonPage';
import ResultsPage from '../pages/ResultsPage';
import { AchievementsPage } from '../pages/AchievementsPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { UserProfilePage } from '../pages/UserProfilePage';
import { LeaderboardPage } from '../pages/LeaderboardPage';
import { SettingsPage } from '../pages/SettingsPage';
import { BadgeShowcasePage } from '../pages/BadgeShowcasePage';
import { ComparisonPage } from '../pages/ComparisonPage';

/**
 * Navigation Bar Component
 */
const NavigationBar: React.FC<{ currentPath: string }> = ({ currentPath }) => {
  const navItems = [
    { path: '/', label: 'Gerador', icon: '🎵' },
    { path: '/dashboard', label: 'Dashboard', icon: '🎮' },
    { path: '/lesson/1/1', label: 'Aprender', icon: '📚' },
    { path: '/achievements', label: 'Achievements', icon: '🏆' },
    { path: '/analytics', label: 'Analytics', icon: '📊' },
    { path: '/profile', label: 'Perfil', icon: '👤' },
    { path: '/badges', label: 'Badges', icon: '🎖️' },
    { path: '/comparison', label: 'Comparação', icon: '📈' },
    { path: '/leaderboard', label: 'Ranking', icon: '🏅' },
    { path: '/settings', label: 'Config', icon: '⚙️' },
  ];

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          🎤 Aprenda Rima
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all
                ${currentPath === item.path
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }
              `}
            >
              <span>{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Version Badge */}
        <div className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full">
          v2.0
        </div>
      </div>
    </nav>
  );
};

/**
 * Home Page - Entry Point
 */
const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-dark-500 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Bem-vindo ao Aprenda Rima
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Domine a arte do hip-hop: rimas, flow, criatividade e batalha
          </p>
        </motion.div>

        {/* Main Content - Original App */}
        <RimaGenerator />

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Link
            to="/dashboard"
            className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-lg hover:shadow-lg transition-all"
          >
            <div className="text-3xl mb-2">🎮</div>
            <h3 className="font-bold text-lg mb-2">Dashboard</h3>
            <p className="text-sm text-gray-200">
              Veja seu progresso, XP, nível e desafios diários
            </p>
          </Link>

          <Link
            to="/lesson/1/1"
            className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-lg hover:shadow-lg transition-all"
          >
            <div className="text-3xl mb-2">📚</div>
            <h3 className="font-bold text-lg mb-2">Aprender</h3>
            <p className="text-sm text-gray-200">
              Comece os exercícios estruturados e melhore suas habilidades
            </p>
          </Link>

          <Link
            to="/achievements"
            className="bg-gradient-to-br from-yellow-600 to-orange-800 p-6 rounded-lg hover:shadow-lg transition-all"
          >
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="font-bold text-lg mb-2">Achievements</h3>
            <p className="text-sm text-gray-200">
              Desbloqueie badges, complete missões e veja seu progresso
            </p>
          </Link>

          <Link
            to="/analytics"
            className="bg-gradient-to-br from-blue-600 to-cyan-800 p-6 rounded-lg hover:shadow-lg transition-all"
          >
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-bold text-lg mb-2">Analytics</h3>
            <p className="text-sm text-gray-200">
              Gráficos, estatísticas e análise detalhada do seu desempenho
            </p>
          </Link>

          <Link
            to="/profile"
            className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-lg hover:shadow-lg transition-all"
          >
            <div className="text-3xl mb-2">👤</div>
            <h3 className="font-bold text-lg mb-2">Meu Perfil</h3>
            <p className="text-sm text-gray-200">
              Personalize seu perfil e veja suas estatísticas
            </p>
          </Link>

          <Link
            to="/leaderboard"
            className="bg-gradient-to-br from-amber-600 to-amber-800 p-6 rounded-lg hover:shadow-lg transition-all"
          >
            <div className="text-3xl mb-2">🏅</div>
            <h3 className="font-bold text-lg mb-2">Ranking</h3>
            <p className="text-sm text-gray-200">
              Veja como você se posiciona no ranking global
            </p>
          </Link>

          <Link
            to="/settings"
            className="bg-gradient-to-br from-rose-600 to-rose-800 p-6 rounded-lg hover:shadow-lg transition-all"
          >
            <div className="text-3xl mb-2">⚙️</div>
            <h3 className="font-bold text-lg mb-2">Configurações</h3>
            <p className="text-sm text-gray-200">
              Personalize tema, notificações e preferências
            </p>
          </Link>

          <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-lg cursor-not-allowed opacity-50">
            <div className="text-3xl mb-2">⚔️</div>
            <h3 className="font-bold text-lg mb-2">Batalha</h3>
            <p className="text-sm text-gray-200">
              Em breve: Duelos em tempo real contra IA
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/**
 * Main Router Component
 */
export function AppWithRouter() {
  const [currentPath, setCurrentPath] = React.useState('/');

  return (
    <BrowserRouter>
      <NavigationBar currentPath={currentPath} />

      <AnimatePresence mode="wait">
        <Routes>
          {/* Home - Original App + Entry Point */}
          <Route
            path="/"
            element={
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onAnimationComplete={() => setCurrentPath('/')}
              >
                <HomePage />
              </motion.div>
            }
          />

          {/* Dashboard - Gamification Hub */}
          <Route
            path="/dashboard"
            element={
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onAnimationComplete={() => setCurrentPath('/dashboard')}
              >
                <DashboardPage />
              </motion.div>
            }
          />

          {/* Lesson - Exercise Player */}
          <Route
            path="/lesson/:pillar/:lesson"
            element={
              <motion.div
                key="lesson"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onAnimationComplete={() => setCurrentPath('/lesson')}
              >
                <LessonPage />
              </motion.div>
            }
          />

          {/* Results - Analysis and Feedback */}
          <Route
            path="/results"
            element={
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onAnimationComplete={() => setCurrentPath('/results')}
              >
                <ResultsPage />
              </motion.div>
            }
          />

          {/* Achievements - Badges and Missions */}
          <Route
            path="/achievements"
            element={
              <motion.div
                key="achievements"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onAnimationComplete={() => setCurrentPath('/achievements')}
              >
                <AchievementsPage />
              </motion.div>
            }
          />

          {/* Analytics - Statistics Dashboard */}
          <Route
            path="/analytics"
            element={
              <motion.div
                key="analytics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onAnimationComplete={() => setCurrentPath('/analytics')}
              >
                <AnalyticsPage />
              </motion.div>
            }
          />

          {/* User Profile */}
          <Route
            path="/profile"
            element={
              <motion.div
                key="profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onAnimationComplete={() => setCurrentPath('/profile')}
              >
                <UserProfilePage />
              </motion.div>
            }
          />

          {/* Leaderboard */}
          <Route
            path="/leaderboard"
            element={
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onAnimationComplete={() => setCurrentPath('/leaderboard')}
              >
                <LeaderboardPage />
              </motion.div>
            }
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onAnimationComplete={() => setCurrentPath('/settings')}
              >
                <SettingsPage />
              </motion.div>
            }
          />

          {/* Badge Showcase */}
          <Route
            path="/badges"
            element={
              <motion.div
                key="badges"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onAnimationComplete={() => setCurrentPath('/badges')}
              >
                <BadgeShowcasePage />
              </motion.div>
            }
          />

          {/* User Comparison */}
          <Route
            path="/comparison"
            element={
              <motion.div
                key="comparison"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onAnimationComplete={() => setCurrentPath('/comparison')}
              >
                <ComparisonPage />
              </motion.div>
            }
          />

          {/* Fallback - Redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}
