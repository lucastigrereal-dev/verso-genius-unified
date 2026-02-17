import { motion } from 'framer-motion';
import { Sparkles, Flame, Brain, BookOpen, Loader2 } from 'lucide-react';
import { ESTILOS, type RhymeGeneratorState } from '../types';

interface RhymeGeneratorProps {
  tema: string;
  estilo: RhymeGeneratorState['estilo'];
  isLoading: boolean;
  onTemaChange: (tema: string) => void;
  onEstiloChange: (estilo: RhymeGeneratorState['estilo']) => void;
  onGenerate: () => void;
}

const estiloIcons = {
  agressivo: Flame,
  tecnico: Brain,
  filosofico: BookOpen,
};

export function RhymeGenerator({
  tema,
  estilo,
  isLoading,
  onTemaChange,
  onEstiloChange,
  onGenerate,
}: RhymeGeneratorProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading && tema.trim()) {
      onGenerate();
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="rounded-2xl bg-dark-200 p-4 md:p-6"
      role="form"
      aria-label="Gerador de rimas"
    >
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-white md:mb-6 md:text-xl">
        <Sparkles className="h-5 w-5 text-gold-400" />
        Gerar Rima
      </h2>

      {/* Tema Input */}
      <div className="mb-4 md:mb-6">
        <label
          htmlFor="tema-input"
          className="mb-2 block text-sm font-medium text-gray-300"
        >
          Tema da Rima
        </label>
        <input
          id="tema-input"
          type="text"
          value={tema}
          onChange={(e) => onTemaChange(e.target.value)}
          placeholder="Ex: batalha, periferia, superacao..."
          className="w-full rounded-xl border border-dark-100 bg-dark-300 px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
          disabled={isLoading}
          aria-describedby="tema-hint"
          required
        />
        <p id="tema-hint" className="mt-1 text-xs text-gray-500">
          Digite o tema que deseja para sua rima
        </p>
      </div>

      {/* Estilo Selection */}
      <div className="mb-6">
        <label className="mb-3 block text-sm font-medium text-gray-300">
          Estilo
        </label>
        <div
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
          role="radiogroup"
          aria-label="Selecione o estilo"
        >
          {ESTILOS.map((option) => {
            const Icon = estiloIcons[option.value];
            const isSelected = estilo === option.value;

            return (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => onEstiloChange(option.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                  isSelected
                    ? 'border-gold-400 bg-gold-400/10 text-gold-400'
                    : 'border-dark-100 bg-dark-300 text-gray-400 hover:border-gray-600 hover:text-white'
                }`}
                role="radio"
                aria-checked={isSelected}
                disabled={isLoading}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs opacity-70">{option.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Generate Button */}
      <motion.button
        type="submit"
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        disabled={isLoading || !tema.trim()}
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-display text-base font-bold transition-all md:text-lg ${
          isLoading || !tema.trim()
            ? 'cursor-not-allowed bg-dark-100 text-gray-500'
            : 'bg-gold-gradient text-dark-500 shadow-lg shadow-gold-400/20 hover:shadow-gold-400/40'
        }`}
        aria-busy={isLoading}
        aria-disabled={isLoading || !tema.trim()}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Gerar Rima
          </>
        )}
      </motion.button>
    </motion.form>
  );
}
