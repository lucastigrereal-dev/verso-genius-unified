import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronRight, Heart, Star, X, Menu } from 'lucide-react';
import type { Rima } from '../../types';

interface HistorySidebarProps {
  history: Rima[];
  currentRimaId?: string;
  onSelect: (rima: Rima) => void;
}

interface HistoryItemProps {
  rima: Rima;
  isActive: boolean;
  index: number;
  onClick: () => void;
}

function HistoryItem({ rima, isActive, index, onClick }: HistoryItemProps) {
  const previewText = rima.conteudo.split('\n')[0]?.slice(0, 40) + '...';

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`group w-full rounded-xl p-3 text-left transition-all ${
        isActive
          ? 'bg-gold-400/10 ring-1 ring-gold-400/30'
          : 'bg-dark-300 hover:bg-dark-200'
      }`}
      aria-current={isActive ? 'true' : undefined}
    >
      <div className="mb-1 flex items-center justify-between">
        <span
          className={`text-sm font-medium ${
            isActive ? 'text-gold-400' : 'text-white'
          }`}
        >
          {rima.tema}
        </span>
        <div className="flex items-center gap-1">
          {rima.favorito && (
            <Heart className="h-3 w-3 fill-red-400 text-red-400" />
          )}
          <div className="flex items-center gap-0.5">
            <Star className="h-3 w-3 text-gold-400" />
            <span className="text-xs text-gray-500">{rima.score.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <p className="mb-2 line-clamp-2 text-xs text-gray-500">{previewText}</p>

      <div className="flex items-center justify-between">
        <span className="rounded-md bg-dark-400 px-1.5 py-0.5 text-xs capitalize text-gray-400">
          {rima.estilo}
        </span>
        <ChevronRight
          className={`h-4 w-4 transition-transform ${
            isActive ? 'text-gold-400' : 'text-gray-600 group-hover:translate-x-1'
          }`}
        />
      </div>
    </motion.button>
  );
}

export function HistorySidebar({
  history,
  currentRimaId,
  onSelect,
}: HistorySidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-dark-300">
            <History className="h-4 w-4 text-gold-400" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-white">Historico</h2>
            <p className="text-xs text-gray-500">{history.length} rimas</p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-2 text-gray-400 hover:bg-dark-300 hover:text-white lg:hidden"
          aria-label="Fechar historico"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* History List */}
      <div
        className="flex-1 space-y-2 overflow-y-auto pr-1"
        role="list"
        aria-label="Historico de rimas"
      >
        <AnimatePresence mode="popLayout">
          {history.length > 0 ? (
            history.map((rima, index) => (
              <HistoryItem
                key={rima.id}
                rima={rima}
                isActive={rima.id === currentRimaId}
                index={index}
                onClick={() => {
                  onSelect(rima);
                  setIsOpen(false);
                }}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-dark-300">
                <History className="h-6 w-6 text-gray-600" />
              </div>
              <p className="text-sm text-gray-500">Nenhuma rima ainda</p>
              <p className="text-xs text-gray-600">Gere sua primeira rima!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Footer */}
      {history.length > 0 && (
        <div className="mt-4 rounded-xl bg-dark-300 p-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-gold-400">
                {history.filter((r) => r.favorito).length}
              </p>
              <p className="text-xs text-gray-500">Favoritas</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gold-400">
                {history.length > 0
                  ? (
                      history.reduce((acc, r) => acc + r.score, 0) / history.length
                    ).toFixed(1)
                  : '0'}
              </p>
              <p className="text-xs text-gray-500">Score medio</p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-400 shadow-lg shadow-gold-400/30 lg:hidden"
        aria-label="Abrir historico"
        aria-expanded={isOpen}
      >
        <Menu className="h-6 w-6 text-dark-500" />
        {history.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {history.length}
          </span>
        )}
      </motion.button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-80 flex-col bg-dark-200 p-4 lg:hidden"
              role="complementary"
              aria-label="Historico de rimas"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className="hidden h-full w-80 flex-col rounded-2xl bg-dark-200 p-4 lg:flex"
        role="complementary"
        aria-label="Historico de rimas"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
