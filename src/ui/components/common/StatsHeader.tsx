import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, ScrollText, Star, Trophy } from 'lucide-react';
import type { Stats } from '../types';

interface StatsHeaderProps {
  stats: Stats;
  onRefresh?: () => void;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  delay: number;
}

function StatCard({ icon, value, label, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-3 rounded-xl bg-dark-200 px-4 py-3 md:flex-col md:gap-2 md:px-6 md:py-4"
      role="status"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-300 md:h-12 md:w-12">
        {icon}
      </div>
      <div className="md:text-center">
        <p className="text-xl font-bold text-white md:text-2xl">{value}</p>
        <p className="text-xs text-gray-400 md:text-sm">{label}</p>
      </div>
    </motion.div>
  );
}

export function StatsHeader({ stats, onRefresh }: StatsHeaderProps) {
  useEffect(() => {
    onRefresh?.();
  }, [onRefresh]);

  const statItems = [
    {
      icon: <Music className="h-5 w-5 text-blue-400 md:h-6 md:w-6" />,
      value: stats.totalLetras,
      label: 'Letras',
    },
    {
      icon: <ScrollText className="h-5 w-5 text-green-400 md:h-6 md:w-6" />,
      value: stats.totalVersos,
      label: 'Versos',
    },
    {
      icon: <Star className="h-5 w-5 text-gold-400 md:h-6 md:w-6" />,
      value: stats.totalRimasGeradas,
      label: 'Rimas',
    },
    {
      icon: <Trophy className="h-5 w-5 text-purple-400 md:h-6 md:w-6" />,
      value: stats.mediaScore.toFixed(1),
      label: 'Score',
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-dark-100 bg-dark-500/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 md:py-4">
        {/* Logo */}
        <div className="mb-3 flex items-center justify-between md:mb-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400 md:h-10 md:w-10">
              <Music className="h-4 w-4 text-dark-500 md:h-5 md:w-5" />
            </div>
            <h1 className="font-display text-lg font-bold text-white md:text-xl">
              IA <span className="text-gold-400">RIMAS</span>
            </h1>
          </motion.div>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-full bg-gold-400/10 px-3 py-1 text-xs font-medium text-gold-400"
          >
            Brasil
          </motion.span>
        </div>

        {/* Stats Grid */}
        <div
          className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4"
          role="region"
          aria-label="Estatisticas"
        >
          {statItems.map((item, index) => (
            <StatCard
              key={item.label}
              icon={item.icon}
              value={item.value}
              label={item.label}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </header>
  );
}
