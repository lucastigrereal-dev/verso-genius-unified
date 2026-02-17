import { useState, useCallback } from 'react';
import type { Rima, Stats, RhymeGeneratorState } from '../types';

const API_BASE = '/api';

export function useRhymeGenerator() {
  const [state, setState] = useState<RhymeGeneratorState>({
    tema: '',
    estilo: 'agressivo',
    isLoading: false,
    currentRima: null,
  });

  const [history, setHistory] = useState<Rima[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalLetras: 0,
    totalVersos: 0,
    totalRimasGeradas: 0,
    mediaScore: 0,
  });

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/rimas-geradas`);
      const data = await response.json();
      setHistory(
        data.rimas.map((r: Omit<Rima, 'id' | 'favorito'>, i: number) => ({
          ...r,
          id: `rima-${i}-${Date.now()}`,
          favorito: false,
        }))
      );
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }, []);

  const generateRhyme = useCallback(async () => {
    if (!state.tema.trim()) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`${API_BASE}/gerar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: state.tema, estilo: state.estilo }),
      });

      const data = await response.json();
      const newRima: Rima = {
        id: `rima-${Date.now()}`,
        tema: data.tema,
        estilo: data.estilo,
        conteudo: data.conteudo,
        score: data.score,
        data: data.data,
        favorito: false,
      };

      setState((prev) => ({ ...prev, currentRima: newRima, isLoading: false }));
      setHistory((prev) => [newRima, ...prev].slice(0, 10));
      await fetchStats();
    } catch (error) {
      console.error('Error generating rhyme:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [state.tema, state.estilo, fetchStats]);

  const setTema = useCallback((tema: string) => {
    setState((prev) => ({ ...prev, tema }));
  }, []);

  const setEstilo = useCallback((estilo: RhymeGeneratorState['estilo']) => {
    setState((prev) => ({ ...prev, estilo }));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setHistory((prev) =>
      prev.map((r) => (r.id === id ? { ...r, favorito: !r.favorito } : r))
    );
    setState((prev) => {
      if (prev.currentRima?.id === id) {
        return {
          ...prev,
          currentRima: { ...prev.currentRima, favorito: !prev.currentRima.favorito },
        };
      }
      return prev;
    });
  }, []);

  const regenerate = useCallback(() => {
    generateRhyme();
  }, [generateRhyme]);

  return {
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
  };
}
