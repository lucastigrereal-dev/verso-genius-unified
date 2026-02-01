/**
 * #A2 Freestyle Recorder
 * Gravação de freestyle com playback
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Mic, Square, Play, Pause, Download, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getRecordingService, RecordingStorage, type Recording } from '../../services/recordingService'
import { MetronomeCompact } from './Metronome'

interface FreestyleRecorderProps {
  beatBpm?: number
  beatIsPlaying?: boolean
  onRecordingComplete?: (recording: Recording) => void
}

export function FreestyleRecorder({
  beatBpm = 90,
  beatIsPlaying = false,
  onRecordingComplete,
}: FreestyleRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const recordingService = getRecordingService()
  const audioRef = useRef<HTMLAudioElement>(null)
  const durationIntervalRef = useRef<number | null>(null)

  // Solicitar permissão de microfone
  const requestPermission = useCallback(async () => {
    try {
      await recordingService.requestMicrophoneAccess()
      setHasPermission(true)
    } catch (error) {
      alert('Erro ao acessar microfone. Verifique as permissões do navegador.')
      console.error(error)
    }
  }, [recordingService])

  // Iniciar gravação
  const startRecording = useCallback(async () => {
    if (!hasPermission) {
      await requestPermission()
      if (!hasPermission) return
    }

    try {
      recordingService.startRecording()
      setIsRecording(true)
      setRecordingDuration(0)

      // Atualizar duração a cada 100ms
      durationIntervalRef.current = window.setInterval(() => {
        setRecordingDuration(recordingService.getCurrentDuration())
      }, 100)
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
      alert('Erro ao iniciar gravação.')
    }
  }, [hasPermission, requestPermission, recordingService])

  // Parar gravação
  const stopRecording = useCallback(async () => {
    try {
      const recording = await recordingService.stopRecording()
      setIsRecording(false)
      setIsPaused(false)
      setCurrentRecording(recording)
      setRecordingDuration(0)

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }

      // Salvar metadata no storage
      RecordingStorage.saveRecording({
        id: recording.id,
        duration: recording.duration,
        timestamp: recording.timestamp,
        bpm: beatBpm,
      })

      onRecordingComplete?.(recording)
    } catch (error) {
      console.error('Erro ao parar gravação:', error)
    }
  }, [recordingService, beatBpm, onRecordingComplete])

  // Play/Pause playback
  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [isPlaying])

  // Download gravação
  const downloadRecording = useCallback(() => {
    if (!currentRecording) return

    const a = document.createElement('a')
    a.href = currentRecording.url
    a.download = `freestyle-${currentRecording.id}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [currentRecording])

  // Deletar gravação
  const deleteRecording = useCallback(() => {
    if (!currentRecording) return

    if (confirm('Deletar esta gravação?')) {
      URL.revokeObjectURL(currentRecording.url)
      setCurrentRecording(null)
      setIsPlaying(false)
    }
  }, [currentRecording])

  // Cleanup
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
      recordingService.cleanup()
    }
  }, [recordingService])

  // Formatar tempo
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-dark-200 rounded-xl p-6 border-2 border-gold-400/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gold-400">🎙️ Gravador Freestyle</h3>
        {beatIsPlaying && <MetronomeCompact bpm={beatBpm} isPlaying={beatIsPlaying} />}
      </div>

      {/* Recording Controls */}
      {!currentRecording && (
        <div className="space-y-6">
          {/* Status */}
          <div className="text-center">
            <AnimatePresence mode="wait">
              {isRecording ? (
                <motion.div
                  key="recording"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-4"
                >
                  <div className="flex justify-center">
                    <div className="relative">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center"
                      >
                        <Mic size={40} className="text-white" />
                      </motion.div>
                      <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 rounded-full bg-red-500"
                      />
                    </div>
                  </div>

                  <div className="text-3xl font-bold text-gold-400">
                    {formatTime(recordingDuration)}
                  </div>

                  <div className="text-sm text-red-400 animate-pulse">
                    ● Gravando...
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="w-24 h-24 mx-auto rounded-full bg-dark-400 flex items-center justify-center border-2 border-dashed border-gray-600">
                    <Mic size={40} className="text-gray-600" />
                  </div>

                  <div className="text-sm text-gray-400">
                    {hasPermission ? 'Pronto para gravar' : 'Permissão necessária'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <Mic size={20} />
                Iniciar Gravação
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-bold transition-all flex items-center gap-2"
              >
                <Square size={20} />
                Parar
              </button>
            )}
          </div>

          {/* Info */}
          {!hasPermission && (
            <div className="text-center text-xs text-gray-500 p-3 bg-dark-400 rounded-lg">
              💡 Clique em "Iniciar Gravação" para permitir acesso ao microfone
            </div>
          )}
        </div>
      )}

      {/* Playback Controls */}
      {currentRecording && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Audio Element */}
          <audio
            ref={audioRef}
            src={currentRecording.url}
            onEnded={() => setIsPlaying(false)}
          />

          {/* Waveform Placeholder */}
          <div className="h-24 bg-dark-400 rounded-lg flex items-center justify-center">
            <div className="flex gap-1 items-center">
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={isPlaying ? { scaleY: [1, 1.5, 1] } : {}}
                  transition={{
                    repeat: Infinity,
                    duration: 0.5,
                    delay: i * 0.05,
                  }}
                  className="w-1 bg-gold-400 rounded-full"
                  style={{ height: `${Math.random() * 60 + 20}px` }}
                />
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="flex justify-between text-sm text-gray-400">
            <span>Duração: {currentRecording.duration.toFixed(1)}s</span>
            <span>{new Date(currentRecording.timestamp).toLocaleTimeString()}</span>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-3">
            <button
              onClick={togglePlayback}
              className="p-4 bg-gold-400 hover:bg-gold-500 text-dark-500 rounded-full transition-all"
              title={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </button>

            <button
              onClick={downloadRecording}
              className="p-4 bg-dark-400 hover:bg-dark-300 text-gray-300 rounded-full transition-all"
              title="Download"
            >
              <Download size={24} />
            </button>

            <button
              onClick={deleteRecording}
              className="p-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full transition-all"
              title="Deletar"
            >
              <Trash2 size={24} />
            </button>
          </div>

          {/* New Recording Button */}
          <button
            onClick={() => setCurrentRecording(null)}
            className="w-full py-3 bg-dark-400 hover:bg-dark-300 text-gray-300 rounded-lg transition-all"
          >
            Nova Gravação
          </button>
        </motion.div>
      )}
    </div>
  )
}
