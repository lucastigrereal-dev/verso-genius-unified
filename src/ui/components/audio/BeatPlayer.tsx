/**
 * #A1 Beat Player Component
 * Player de batidas com controles básicos
 */

import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, Square, Volume2, VolumeX } from 'lucide-react'
import { getAudioService, CC0_BEATS, type Beat } from '../../../services/audioService'

export function BeatPlayer() {
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  const audioService = getAudioService()

  // Atualizar tempo a cada 100ms
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      const state = audioService.getState()
      setCurrentTime(state.currentTime)
      setDuration(state.duration)
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, audioService])

  // Carregar beat selecionado
  const handleSelectBeat = useCallback(async (beat: Beat) => {
    setIsLoading(true)
    try {
      await audioService.loadBeat(beat.url)
      setSelectedBeat(beat)
      setDuration(audioService.getDuration())
    } catch (error) {
      console.error('Erro ao carregar beat:', error)
      alert('Erro ao carregar beat. Verifique se o arquivo existe.')
    } finally {
      setIsLoading(false)
    }
  }, [audioService])

  // Play/Pause
  const handlePlayPause = useCallback(() => {
    if (!selectedBeat) return

    if (isPlaying) {
      audioService.pause()
      setIsPlaying(false)
    } else {
      audioService.play()
      setIsPlaying(true)
    }
  }, [isPlaying, selectedBeat, audioService])

  // Stop
  const handleStop = useCallback(() => {
    audioService.stop()
    setIsPlaying(false)
    setCurrentTime(0)
  }, [audioService])

  // Volume
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
    audioService.setVolume(isMuted ? 0 : newVolume)
  }, [isMuted, audioService])

  // Mute/Unmute
  const handleMuteToggle = useCallback(() => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    audioService.setVolume(newMuted ? 0 : volume)
  }, [isMuted, volume, audioService])

  // Formatar tempo (mm:ss)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-dark-200 rounded-xl p-6 border-2 border-gold-400/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gold-400">🎵 Beat Player</h3>
        {selectedBeat && (
          <span className="text-xs text-gray-400 bg-dark-400 px-3 py-1 rounded-full">
            {selectedBeat.bpm} BPM • {selectedBeat.genre}
          </span>
        )}
      </div>

      {/* Seletor de Beats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {CC0_BEATS.map((beat) => (
          <button
            key={beat.id}
            onClick={() => handleSelectBeat(beat)}
            disabled={isLoading}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedBeat?.id === beat.id
                ? 'bg-gold-400 text-dark-500 border-gold-400'
                : 'bg-dark-300 text-gray-300 border-dark-400 hover:border-gold-400/50'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="font-bold text-sm">{beat.name}</div>
            <div className="text-xs opacity-70 mt-1">{beat.bpm} BPM</div>
          </button>
        ))}
      </div>

      {/* Aviso de Licença */}
      {selectedBeat && (
        <div className="text-xs text-gray-500 mb-4 p-3 bg-dark-400 rounded-lg">
          📄 Licença: <span className="text-green-400 font-bold">CC0</span> (Creative Commons Zero)
          <br />
          Fonte: {selectedBeat.source}
          {selectedBeat.author && ` • Autor: ${selectedBeat.author}`}
        </div>
      )}

      {/* Player Controls */}
      {selectedBeat && (
        <>
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="h-2 bg-dark-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold-400 to-gold-500 transition-all"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={handleStop}
              className="p-3 bg-dark-400 hover:bg-dark-300 text-gray-300 rounded-lg transition-colors"
              title="Parar"
            >
              <Square size={20} />
            </button>

            <button
              onClick={handlePlayPause}
              className="p-4 bg-gold-400 hover:bg-gold-500 text-dark-500 rounded-full transition-all transform hover:scale-105"
              title={isPlaying ? 'Pausar' : 'Tocar'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleMuteToggle}
              className="p-2 text-gray-400 hover:text-gold-400 transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-dark-400 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-gold-400
                [&::-webkit-slider-thumb]:cursor-pointer"
            />

            <span className="text-xs text-gray-400 w-12 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </>
      )}

      {/* Empty State */}
      {!selectedBeat && (
        <div className="text-center py-8 text-gray-500">
          Selecione um beat para começar
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8 text-gold-400">
          Carregando beat...
        </div>
      )}
    </div>
  )
}
