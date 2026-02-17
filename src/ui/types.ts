// Types for the Rhyme Generator App

export interface Rima {
  id: string;
  tema: string;
  estilo: 'agressivo' | 'tecnico' | 'filosofico';
  conteudo: string;
  score: number;
  data: string;
  favorito: boolean;
}

export interface Stats {
  totalLetras: number;
  totalVersos: number;
  totalRimasGeradas: number;
  mediaScore: number;
}

export interface RhymeGeneratorState {
  tema: string;
  estilo: 'agressivo' | 'tecnico' | 'filosofico';
  isLoading: boolean;
  currentRima: Rima | null;
}

export type EstiloOption = {
  value: 'agressivo' | 'tecnico' | 'filosofico';
  label: string;
  description: string;
};

export const ESTILOS: EstiloOption[] = [
  { value: 'agressivo', label: 'Agressivo', description: 'Estilo Batalha' },
  { value: 'tecnico', label: 'Tecnico', description: 'Flow Complexo' },
  { value: 'filosofico', label: 'Filosofico', description: 'Reflexivo' },
];
