import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StatsHeader,
  RhymeGenerator,
  RhymeDisplay,
  HistorySidebar,
} from './components';
import { useRhymeGenerator } from './hooks/useRhymeGenerator';
import type { Rima } from './types';

export function App() {
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
  } = useRhymeGenerator();

  const [selectedRima, setSelectedRima] = useState<Rima | null>(null);

  // Initial data fetch
  useEffect(() => {
    fetchStats();
    fetchHistory();
  }, [fetchStats, fetchHistory]);

  // Update selected rima when current changes
  useEffect(() => {
    if (state.currentRima) {
      setSelectedRima(state.currentRima);
    }
  }, [state.currentRima]);

  const handleSelectFromHistory = (rima: Rima) => {
    setSelectedRima(rima);
  };

  const displayRima = selectedRima || state.currentRima;

  return (
    <div className="min-h-screen bg-dark-500">
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-gold-400 focus:px-4 focus:py-2 focus:text-dark-500"
      >
        Pular para conteudo principal
      </a>

      {/* Stats Header */}
      <StatsHeader stats={stats} onRefresh={fetchStats} />

      {/* Main Content */}
      <main
        id="main-content"
        className="mx-auto max-w-7xl px-4 py-4 md:py-6 lg:py-8"
      >
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
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-200 py-4 text-center">
        <p className="text-xs text-gray-600">
          IA Rimas Brasil - Sistema de Geracao de Rimas
        </p>
      </footer>
    </div>
  );
}
