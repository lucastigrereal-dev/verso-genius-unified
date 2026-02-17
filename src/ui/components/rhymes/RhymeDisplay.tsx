import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Quote } from 'lucide-react';
import type { Rima } from '../types';
import { ScoreBar } from './ScoreBar';
import { ActionButtons } from './ActionButtons';

interface RhymeDisplayProps {
  rima: Rima | null;
  onFavorite: (id: string) => void;
  onRegenerate: () => void;
}

interface VerseLineProps {
  text: string;
  index: number;
  totalLines: number;
}

function VerseLine({ text, index, totalLines }: VerseLineProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{
        duration: 0.4,
        delay: index * 0.15,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="group relative"
    >
      {/* Line number */}
      <span
        className="absolute -left-8 top-1/2 -translate-y-1/2 font-mono text-xs text-gray-600 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Verse text */}
      <p className="font-display text-base leading-relaxed text-white md:text-lg lg:text-xl">
        {text}
      </p>

      {/* Animated underline on last word (rhyme highlight) */}
      {index < totalLines - 1 && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: index * 0.15 + 0.3, duration: 0.3 }}
          className="mt-1 h-px origin-left bg-gradient-to-r from-gold-400/50 to-transparent"
        />
      )}
    </motion.div>
  );
}

export function RhymeDisplay({ rima, onFavorite, onRegenerate }: RhymeDisplayProps) {
  const [displayedVerses, setDisplayedVerses] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (rima) {
      setIsAnimating(true);
      setDisplayedVerses([]);

      const verses = rima.conteudo.split('\n').filter((v) => v.trim());
      let currentIndex = 0;

      const interval = setInterval(() => {
        if (currentIndex < verses.length) {
          setDisplayedVerses((prev) => [...prev, verses[currentIndex]]);
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsAnimating(false);
        }
      }, 150);

      return () => clearInterval(interval);
    }
  }, [rima?.id]);

  if (!rima) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center rounded-2xl bg-dark-200 p-8 text-center md:p-12"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-dark-300">
          <Mic2 className="h-8 w-8 text-gray-600" />
        </div>
        <h3 className="mb-2 font-display text-lg font-bold text-gray-400">
          Nenhuma rima gerada
        </h3>
        <p className="text-sm text-gray-500">
          Use o gerador ao lado para criar sua primeira rima
        </p>
      </motion.div>
    );
  }

  const allVerses = rima.conteudo.split('\n').filter((v) => v.trim());

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col rounded-2xl bg-dark-200 p-4 md:p-6"
      role="article"
      aria-label={`Rima sobre ${rima.tema}`}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between md:mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400/10">
            <Quote className="h-5 w-5 text-gold-400" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white md:text-xl">
              {rima.tema}
            </h3>
            <p className="text-sm text-gray-400">
              Estilo: <span className="capitalize text-gold-400">{rima.estilo}</span>
            </p>
          </div>
        </div>

        {/* Date */}
        <span className="rounded-lg bg-dark-300 px-2 py-1 text-xs text-gray-500">
          {new Date(rima.data).toLocaleDateString('pt-BR')}
        </span>
      </div>

      {/* Verses Display */}
      <div
        className="mb-6 min-h-[150px] space-y-3 rounded-xl bg-dark-300 p-4 pl-12 md:min-h-[200px] md:p-6 md:pl-14"
        role="region"
        aria-label="Versos da rima"
        aria-live="polite"
      >
        <AnimatePresence mode="wait">
          {displayedVerses.map((verse, index) => (
            <VerseLine
              key={`${rima.id}-verse-${index}`}
              text={verse}
              index={index}
              totalLines={allVerses.length}
            />
          ))}
        </AnimatePresence>

        {/* Loading dots while animating */}
        {isAnimating && displayedVerses.length < allVerses.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-1"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                className="h-2 w-2 rounded-full bg-gold-400"
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Score */}
      <div className="mb-4 md:mb-6">
        <ScoreBar score={rima.score} />
      </div>

      {/* Actions */}
      <ActionButtons
        rima={rima}
        onFavorite={() => onFavorite(rima.id)}
        onRegenerate={onRegenerate}
      />
    </motion.div>
  );
}
