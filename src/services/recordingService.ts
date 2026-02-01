/**
 * Recording Service - MediaRecorder API
 * Sistema de gravação de freestyle com microfone
 */

export interface Recording {
  id: string
  blob: Blob
  url: string
  duration: number
  timestamp: Date
  beatId?: string
  bpm?: number
}

export class RecordingService {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private startTime: number = 0

  /**
   * Solicita permissão e inicializa microfone
   */
  async requestMicrophoneAccess(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
    } catch (error) {
      console.error('Erro ao acessar microfone:', error)
      throw new Error('Permissão de microfone negada ou dispositivo não disponível')
    }
  }

  /**
   * Inicia gravação
   */
  startRecording(): void {
    if (!this.stream) {
      throw new Error('Microfone não inicializado. Chame requestMicrophoneAccess() primeiro.')
    }

    this.audioChunks = []

    // Criar MediaRecorder
    const options: MediaRecorderOptions = {
      mimeType: this.getSupportedMimeType(),
    }

    this.mediaRecorder = new MediaRecorder(this.stream, options)

    // Event listeners
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data)
      }
    }

    // Iniciar gravação
    this.mediaRecorder.start(100) // Capturar a cada 100ms
    this.startTime = Date.now()
  }

  /**
   * Para gravação e retorna Recording
   */
  async stopRecording(): Promise<Recording> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Nenhuma gravação em andamento'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const duration = (Date.now() - this.startTime) / 1000 // segundos
        const blob = new Blob(this.audioChunks, { type: this.getSupportedMimeType() })
        const url = URL.createObjectURL(blob)

        const recording: Recording = {
          id: `rec-${Date.now()}`,
          blob,
          url,
          duration,
          timestamp: new Date(),
        }

        resolve(recording)
      }

      this.mediaRecorder.stop()
    })
  }

  /**
   * Pausa gravação
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause()
    }
  }

  /**
   * Resume gravação
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume()
    }
  }

  /**
   * Retorna estado atual
   */
  getState(): RecordingState {
    return this.mediaRecorder?.state || 'inactive'
  }

  /**
   * Verifica se está gravando
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording'
  }

  /**
   * Retorna tempo de gravação atual (ms)
   */
  getCurrentDuration(): number {
    if (!this.isRecording()) return 0
    return Date.now() - this.startTime
  }

  /**
   * Para stream do microfone
   */
  stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
  }

  /**
   * Cleanup completo
   */
  cleanup(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }
    this.stopStream()
    this.audioChunks = []
    this.mediaRecorder = null
  }

  /**
   * Retorna MIME type suportado
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    return 'audio/webm' // fallback
  }
}

// Tipos
export type RecordingState = 'inactive' | 'recording' | 'paused'

// Singleton
let recordingServiceInstance: RecordingService | null = null

export const getRecordingService = (): RecordingService => {
  if (!recordingServiceInstance) {
    recordingServiceInstance = new RecordingService()
  }
  return recordingServiceInstance
}

/**
 * Storage local de gravações (LocalStorage)
 */
export class RecordingStorage {
  private static readonly STORAGE_KEY = 'verso-genius-recordings'
  private static readonly MAX_RECORDINGS = 50

  /**
   * Salva gravação (apenas metadata, blob não é persistente)
   */
  static saveRecording(recording: Omit<Recording, 'blob' | 'url'> & { dataUrl?: string }): void {
    const recordings = this.getRecordings()
    recordings.unshift(recording)

    // Limitar quantidade
    if (recordings.length > this.MAX_RECORDINGS) {
      recordings.splice(this.MAX_RECORDINGS)
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recordings))
  }

  /**
   * Recupera todas as gravações
   */
  static getRecordings(): any[] {
    const data = localStorage.getItem(this.STORAGE_KEY)
    return data ? JSON.parse(data) : []
  }

  /**
   * Remove gravação por ID
   */
  static deleteRecording(id: string): void {
    const recordings = this.getRecordings().filter((r) => r.id !== id)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recordings))
  }

  /**
   * Limpa todas as gravações
   */
  static clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }
}
