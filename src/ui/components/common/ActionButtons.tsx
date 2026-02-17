import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, RefreshCw, Check, Copy } from 'lucide-react';
import type { Rima } from '../types';

interface ActionButtonsProps {
  rima: Rima;
  onFavorite: () => void;
  onRegenerate: () => void;
}

interface TooltipProps {
  text: string;
  show: boolean;
}

function Tooltip({ text, show }: TooltipProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-dark-100 px-2 py-1 text-xs text-white"
        >
          {text}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export function ActionButtons({ rima, onFavorite, onRegenerate }: ActionButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleCopy = async () => {
    try {
      const text = `${rima.tema.toUpperCase()}\n\n${rima.conteudo}\n\n- Estilo: ${rima.estilo}\n- Score: ${rima.score.toFixed(1)}/10\n\nGerado por IA Rimas Brasil`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Rima: ${rima.tema}`,
      text: rima.conteudo,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setShowShareMenu(true);
        }
      }
    } else {
      setShowShareMenu(true);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Favorite Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onFavorite}
        className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
          rima.favorito
            ? 'bg-red-500/20 text-red-400'
            : 'bg-dark-300 text-gray-400 hover:bg-dark-100 hover:text-white'
        }`}
        aria-label={rima.favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        aria-pressed={rima.favorito}
      >
        <Heart
          className={`h-4 w-4 transition-all ${rima.favorito ? 'fill-red-400' : ''}`}
        />
        <span className="hidden sm:inline">
          {rima.favorito ? 'Favoritado' : 'Favoritar'}
        </span>
      </motion.button>

      {/* Share Button */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          className="flex items-center gap-2 rounded-xl bg-dark-300 px-4 py-2.5 text-sm font-medium text-gray-400 transition-all hover:bg-dark-100 hover:text-white"
          aria-label="Compartilhar rima"
          aria-expanded={showShareMenu}
          aria-haspopup="menu"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Compartilhar</span>
        </motion.button>

        {/* Share Dropdown */}
        <AnimatePresence>
          {showShareMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setShowShareMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute bottom-full left-0 z-50 mb-2 w-48 rounded-xl bg-dark-100 p-2 shadow-xl"
                role="menu"
              >
                <button
                  onClick={() => {
                    handleCopy();
                    setShowShareMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-300 transition-colors hover:bg-dark-200"
                  role="menuitem"
                >
                  <Copy className="h-4 w-4" />
                  Copiar texto
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Copy Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCopy}
        className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
          copied
            ? 'bg-green-500/20 text-green-400'
            : 'bg-dark-300 text-gray-400 hover:bg-dark-100 hover:text-white'
        }`}
        aria-label="Copiar rima"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            <span className="hidden sm:inline">Copiado!</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">Copiar</span>
          </>
        )}
        <Tooltip text="Copiado!" show={copied} />
      </motion.button>

      {/* Regenerate Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRegenerate}
        className="flex items-center gap-2 rounded-xl bg-gold-400/10 px-4 py-2.5 text-sm font-medium text-gold-400 transition-all hover:bg-gold-400/20"
        aria-label="Regenerar rima"
      >
        <RefreshCw className="h-4 w-4" />
        <span className="hidden sm:inline">Regenerar</span>
      </motion.button>
    </div>
  );
}
