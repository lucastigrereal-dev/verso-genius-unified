/**
 * Freestyle Studio - Página principal dos drills com áudio
 * Integra todos os componentes de áudio e treinamento
 */

import { useState, useEffect } from 'react'
import { BeatPlayer } from './BeatPlayer'
import { Metronome } from './Metronome'
import { FreestyleRecorder } from './FreestyleRecorder'
import { RimaNaBatida } from './drills/RimaNaBatida'
import { FatalityComBeat } from './drills/FatalityComBeat'
import { getAudioService } from '../../services/audioService'

type DrillType = 'rima-batida' | 'fatality' | null

export function FreestyleStudio() {
  const [selectedDrill, setSelectedDrill] = useState<DrillType>(null)
  const [beatBpm, setBeatBpm] = useState(90)
  const [isBeatPlaying, setIsBeatPlaying] = useState(false)

  const audioService = getAudioService()

  // Sincronizar estado do beat
  useEffect(() => {
    const interval = setInterval(() => {
      const state = audioService.getState()
      setIsBeatPlaying(state.isPlaying)
    }, 500)

    return () => clearInterval(interval)
  }, [audioService])

  return (
    <div className="min-h-screen bg-dark-500 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gold-400 mb-2">
            🎤 Freestyle Studio
          </h1>
          <p className="text-gray-400">
            Sistema completo de treino com beats, gravação e drills interativos
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda: Audio Controls */}
          <div className="space-y-6">
            {/* Beat Player */}
            <BeatPlayer />

            {/* Metrônomo */}
            <Metronome bpm={beatBpm} isPlaying={isBeatPlaying} />

            {/* Gravador */}
            <FreestyleRecorder beatBpm={beatBpm} beatIsPlaying={isBeatPlaying} />
          </div>

          {/* Coluna Direita: Drills */}
          <div className="space-y-6">
            {/* Drill Selector */}
            {selectedDrill === null && (
              <div className="bg-dark-200 rounded-xl p-6 border-2 border-gold-400/30">
                <h3 className="text-xl font-bold text-gold-400 mb-4">
                  Selecione um Drill
                </h3>

                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedDrill('rima-batida')}
                    className="w-full p-6 bg-dark-400 hover:bg-dark-300 rounded-lg text-left transition-all border-2 border-transparent hover:border-gold-400 group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-gold-400 group-hover:text-gold-300">
                        🎯 Rima na Batida
                      </span>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        P0
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Complete rimas sincronizadas com o beat. Desenvolve timing e precisão.
                    </p>
                    <div className="mt-3 text-xs text-gray-500">
                      Dificuldade: Fácil → Médio | Duração: ~5 min
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedDrill('fatality')}
                    className="w-full p-6 bg-dark-400 hover:bg-dark-300 rounded-lg text-left transition-all border-2 border-transparent hover:border-red-500 group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-red-400 group-hover:text-red-300">
                        🔥 Fatality Training
                      </span>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        P0
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Aprenda rimas de alto impacto para finalizar batalhas. Desenvolve agressividade e presença.
                    </p>
                    <div className="mt-3 text-xs text-gray-500">
                      Dificuldade: Médio → Difícil | Duração: ~5 min
                    </div>
                  </button>

                  {/* Coming Soon */}
                  <div className="p-6 bg-dark-400/50 rounded-lg border-2 border-dashed border-gray-700 opacity-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-gray-600">
                        ⏱️ Freestyle Cronometrado
                      </span>
                      <span className="px-2 py-1 bg-gray-700 text-gray-500 text-xs rounded-full">
                        Em breve
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Freestyle por tempo limitado com análise de performance.
                    </p>
                  </div>

                  <div className="p-6 bg-dark-400/50 rounded-lg border-2 border-dashed border-gray-700 opacity-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-gray-600">
                        🗣️ Sotaque Regional + Áudio
                      </span>
                      <span className="px-2 py-1 bg-gray-700 text-gray-500 text-xs rounded-full">
                        Em breve
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Pratique gírias e sotaques regionais com exemplos de áudio.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Drill: Rima na Batida */}
            {selectedDrill === 'rima-batida' && (
              <div>
                <button
                  onClick={() => setSelectedDrill(null)}
                  className="mb-4 px-4 py-2 bg-dark-400 hover:bg-dark-300 text-gray-400 rounded-lg text-sm"
                >
                  ← Voltar aos Drills
                </button>
                <RimaNaBatida
                  bpm={beatBpm}
                  isPlaying={isBeatPlaying}
                  onComplete={(score) => {
                    alert(`Drill completo! Score: ${score}`)
                    setSelectedDrill(null)
                  }}
                />
              </div>
            )}

            {/* Drill: Fatality */}
            {selectedDrill === 'fatality' && (
              <div>
                <button
                  onClick={() => setSelectedDrill(null)}
                  className="mb-4 px-4 py-2 bg-dark-400 hover:bg-dark-300 text-gray-400 rounded-lg text-sm"
                >
                  ← Voltar aos Drills
                </button>
                <FatalityComBeat
                  bpm={beatBpm}
                  isPlaying={isBeatPlaying}
                  onComplete={(score) => {
                    alert(`Drill completo! Score: ${score}`)
                    setSelectedDrill(null)
                  }}
                />
              </div>
            )}

            {/* Info Card */}
            {selectedDrill === null && (
              <div className="bg-dark-200 rounded-xl p-6 border-2 border-gold-400/30">
                <h4 className="text-lg font-bold text-gold-400 mb-3">
                  💡 Como usar o Studio
                </h4>
                <ol className="space-y-2 text-sm text-gray-400">
                  <li className="flex gap-2">
                    <span className="text-gold-400">1.</span>
                    <span>Selecione um beat no Player acima</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gold-400">2.</span>
                    <span>Clique em Play para iniciar o beat</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gold-400">3.</span>
                    <span>Escolha um drill ou grave seu freestyle</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gold-400">4.</span>
                    <span>Acompanhe o metrônomo para manter o timing</span>
                  </li>
                </ol>

                <div className="mt-4 p-3 bg-gold-400/10 rounded-lg text-xs text-gray-500">
                  📄 Todos os beats são <span className="text-green-400 font-bold">CC0</span> (Creative Commons Zero)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-200 p-4 rounded-lg border border-gold-400/30 text-center">
            <div className="text-2xl font-bold text-gold-400">90k+</div>
            <div className="text-xs text-gray-400">Rimas no Banco</div>
          </div>
          <div className="bg-dark-200 p-4 rounded-lg border border-gold-400/30 text-center">
            <div className="text-2xl font-bold text-gold-400">215</div>
            <div className="text-xs text-gray-400">Gírias Regionais</div>
          </div>
          <div className="bg-dark-200 p-4 rounded-lg border border-gold-400/30 text-center">
            <div className="text-2xl font-bold text-gold-400">4</div>
            <div className="text-xs text-gray-400">Beats CC0</div>
          </div>
          <div className="bg-dark-200 p-4 rounded-lg border border-gold-400/30 text-center">
            <div className="text-2xl font-bold text-gold-400">2</div>
            <div className="text-xs text-gray-400">Drills Ativos</div>
          </div>
        </div>
      </div>
    </div>
  )
}
