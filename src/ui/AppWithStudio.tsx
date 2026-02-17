/**
 * App With Studio - Versão com navegação para Freestyle Studio
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music2, Mic2, Home } from 'lucide-react'
import {
  StatsHeader,
  RhymeGenerator,
  RhymeDisplay,
  HistorySidebar,
} from './components'
import { FreestyleStudio } from './components/FreestyleStudio'
import { useRhymeGenerator } from './hooks/useRhymeGenerator'
import type { Rima } from './types'

type View = 'home' | 'studio'

export function AppWithStudio() {
  const [currentView, setCurrentView] = useState<View>('home')
  const [selectedRima, setSelectedRima] = useState<Rima | null>(null)

  const {
    state,
    history,
    stats,
    setTema,
    setEstilo,
    generateRhyme,
    toggleFavorite,
    regenerate,
    fetchStats,
    fetchHistory,
  } = useRhymeGenerator()

  // Initial data fetch
  useEffect(() => {
    fetchStats()
    fetchHistory()
  }, [fetchStats, fetchHistory])

  // Update selected rima when current changes
  useEffect(() => {
    if (state.currentRima) {
      setSelectedRima(state.currentRima)
    }
  }, [state.currentRima])

  const handleSelectFromHistory = (rima: Rima) => {
    setSelectedRima(rima)
  }

  const displayRima = selectedRima || state.currentRima

  return (
    <div className="min-h-screen bg-dark-500">
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-gold-400 focus:px-4 focus:py-2 focus:text-dark-500"
      >
        Pular para conteudo principal
      </a>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-dark-400 border-b border-gold-400/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="text-2xl font-bold text-gold-400">
              🎤 IA Rimas Brasil
            </div>

            {/* Nav Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView('home')}
                className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  currentView === 'home'
                    ? 'bg-gold-400 text-dark-500'
                    : 'bg-dark-300 text-gray-400 hover:bg-dark-200'
                }`}
              >
                <Home size={20} />
                <span className="hidden md:inline">Home</span>
              </button>

              <button
                onClick={() => setCurrentView('studio')}
                className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  currentView === 'studio'
                    ? 'bg-gold-400 text-dark-500'
                    : 'bg-dark-300 text-gray-400 hover:bg-dark-200'
                }`}
              >
                <Mic2 size={20} />
                <span className="hidden md:inline">Freestyle Studio</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content">
        <AnimatePresence mode="wait">
          {currentView === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Stats Header */}
              <StatsHeader stats={stats} onRefresh={fetchStats} />

              {/* Original Home Content */}
              <div className="mx-auto max-w-7xl px-4 py-4 md:py-6 lg:py-8">
                <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:gap-8">
                  {/* Left Column: Generator + Display */}
                  <div className="flex flex-1 flex-col gap-4 md:gap-6">
                    {/* Generator Form */}
                    <RhymeGenerator
                      tema={state.tema}
                      estilo={state.estilo}
                      isLoading={state.isLoading}
                      onTemaChange={setTema}
                      onEstiloChange={setEstilo}
                      onGenerate={generateRhyme}
                    />

                    {/* Rhyme Display */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={displayRima?.id || 'empty'}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <RhymeDisplay
                          rima={displayRima}
                          onFavorite={toggleFavorite}
                          onRegenerate={regenerate}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Right Column: History Sidebar */}
                  <HistorySidebar
                    history={history}
                    currentRimaId={displayRima?.id}
                    onSelect={handleSelectFromHistory}
                  />
                </div>

                {/* CTA to Studio */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 p-6 bg-gradient-to-r from-gold-400/10 to-gold-600/10 border-2 border-gold-400 rounded-xl"
                >
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gold-400 mb-2">
                        🎙️ Novo: Freestyle Studio
                      </h3>
                      <p className="text-gray-400">
                        Treine com beats, gravação e drills interativos. Sistema completo de áudio!
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentView('studio')}
                      className="px-6 py-3 bg-gold-400 hover:bg-gold-500 text-dark-500 rounded-lg font-bold transition-all transform hover:scale-105 flex items-center gap-2 whitespace-nowrap"
                    >
                      <Music2 size={20} />
                      Abrir Studio
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="studio"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <FreestyleStudio />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm mt-12">
        <p>IA Rimas Brasil © 2026 | 90k+ rimas • 215 gírias regionais • Beats CC0</p>
        <p className="mt-2">Desenvolvido com 🔥 por Tigrão | Parceiro: Cláudio</p>
      </footer>
    </div>
  )
}
