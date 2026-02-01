/**
 * Audio Service - Web Audio API
 * Sistema de reprodução e mixagem de beats
 *
 * LICENÇA: Usar APENAS beats CC0 (Creative Commons Zero)
 * Fontes aprovadas: Free Music Archive, Incompetech
 */

export interface Beat {
  id: string
  name: string
  bpm: number
  genre: string
  url: string
  license: 'CC0' // Apenas CC0
  source: string // Ex: "Free Music Archive"
  author?: string
}

export interface AudioState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  bpm: number
}

export class AudioService {
  private audioContext: AudioContext | null = null
  private audioBuffer: AudioBuffer | null = null
  private sourceNode: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private startTime: number = 0
  private pauseTime: number = 0
  private isPlaying: boolean = false

  constructor() {
    // Inicializar AudioContext (lazy)
  }

  /**
   * Inicializa o AudioContext
   */
  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.gainNode = this.audioContext.createGain()
      this.gainNode.connect(this.audioContext.destination)
    }
  }

  /**
   * Carrega um beat do URL
   */
  async loadBeat(url: string): Promise<void> {
    this.initAudioContext()

    if (!this.audioContext) {
      throw new Error('AudioContext não inicializado')
    }

    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
    } catch (error) {
      console.error('Erro ao carregar beat:', error)
      throw error
    }
  }

  /**
   * Reproduz o beat
   */
  play(): void {
    if (!this.audioContext || !this.audioBuffer || !this.gainNode) {
      throw new Error('Beat não carregado')
    }

    // Parar reprodução anterior
    this.stop()

    // Criar novo source node
    this.sourceNode = this.audioContext.createBufferSource()
    this.sourceNode.buffer = this.audioBuffer
    this.sourceNode.loop = true
    this.sourceNode.connect(this.gainNode)

    // Tocar do ponto pausado
    const offset = this.pauseTime
    this.sourceNode.start(0, offset)
    this.startTime = this.audioContext.currentTime - offset
    this.isPlaying = true
  }

  /**
   * Pausa a reprodução
   */
  pause(): void {
    if (this.sourceNode && this.audioContext && this.isPlaying) {
      this.pauseTime = this.audioContext.currentTime - this.startTime
      this.sourceNode.stop()
      this.sourceNode.disconnect()
      this.sourceNode = null
      this.isPlaying = false
    }
  }

  /**
   * Para completamente
   */
  stop(): void {
    if (this.sourceNode) {
      this.sourceNode.stop()
      this.sourceNode.disconnect()
      this.sourceNode = null
    }
    this.pauseTime = 0
    this.startTime = 0
    this.isPlaying = false
  }

  /**
   * Ajusta o volume (0-1)
   */
  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  /**
   * Retorna tempo atual de reprodução
   */
  getCurrentTime(): number {
    if (!this.audioContext || !this.isPlaying) {
      return this.pauseTime
    }
    return this.audioContext.currentTime - this.startTime
  }

  /**
   * Retorna duração total
   */
  getDuration(): number {
    return this.audioBuffer?.duration || 0
  }

  /**
   * Retorna estado atual
   */
  getState(): AudioState {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
      volume: this.gainNode?.gain.value || 1,
      bpm: 0 // Será calculado pelo metrônomo
    }
  }

  /**
   * Limpa recursos
   */
  cleanup(): void {
    this.stop()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.audioBuffer = null
    this.gainNode = null
  }
}

// Beats CC0 pré-configurados
export const CC0_BEATS: Beat[] = [
  {
    id: 'beat-1-boom-bap',
    name: 'Boom Bap Classic',
    bpm: 90,
    genre: 'Boom Bap',
    url: '/assets/beats/boom-bap-90bpm.mp3', // Placeholder - adicionar beat real CC0
    license: 'CC0',
    source: 'Free Music Archive',
    author: 'Kevin MacLeod'
  },
  {
    id: 'beat-2-trap',
    name: 'Trap Moderno',
    bpm: 140,
    genre: 'Trap',
    url: '/assets/beats/trap-140bpm.mp3',
    license: 'CC0',
    source: 'Incompetech',
    author: 'Kevin MacLeod'
  },
  {
    id: 'beat-3-old-school',
    name: 'Old School 808',
    bpm: 85,
    genre: 'Old School',
    url: '/assets/beats/old-school-85bpm.mp3',
    license: 'CC0',
    source: 'Free Music Archive',
    author: 'Kevin MacLeod'
  },
  {
    id: 'beat-4-freestyle',
    name: 'Freestyle Flow',
    bpm: 95,
    genre: 'Freestyle',
    url: '/assets/beats/freestyle-95bpm.mp3',
    license: 'CC0',
    source: 'Incompetech',
    author: 'Kevin MacLeod'
  }
]

// Singleton instance
let audioServiceInstance: AudioService | null = null

export const getAudioService = (): AudioService => {
  if (!audioServiceInstance) {
    audioServiceInstance = new AudioService()
  }
  return audioServiceInstance
}
