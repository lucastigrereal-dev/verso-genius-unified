/**
 * Web Audio Service - Recording and Audio Processing
 * Suporta gravação de áudio do microfone e processamento básico
 */

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioURL?: string;
  audioBlob?: Blob;
  error?: string;
}

export class WebAudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private pauseTime: number = 0;
  private totalPausedTime: number = 0;
  private timerInterval: NodeJS.Timeout | null = null;
  private stream: MediaStream | null = null;

  /**
   * Initialize audio context and request microphone access
   */
  async initialize(): Promise<boolean> {
    try {
      // Check browser support
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        throw new Error('Web Audio API not supported in this browser');
      }

      this.audioContext = new AudioContext();

      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.getSupportedMimeType(),
      });

      // Setup event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      return true;
    } catch (error) {
      console.error('Failed to initialize Web Audio:', error);
      return false;
    }
  }

  /**
   * Start recording
   */
  startRecording(): void {
    if (!this.mediaRecorder) {
      throw new Error('WebAudioService not initialized');
    }

    this.audioChunks = [];
    this.startTime = Date.now();
    this.totalPausedTime = 0;

    this.mediaRecorder.start();

    // Start timer
    this.timerInterval = setInterval(() => {
      // Timer running in parent component
    }, 100);
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      return;
    }

    this.mediaRecorder.pause();
    this.pauseTime = Date.now();
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'paused') {
      return;
    }

    this.mediaRecorder.resume();
    this.totalPausedTime += Date.now() - this.pauseTime;
  }

  /**
   * Stop recording and return audio blob
   */
  async stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.audioChunks = [];

        // Clear timer
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }

        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Cancel recording without saving
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    this.audioChunks = [];

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Get current recording duration
   */
  getDuration(): number {
    if (!this.mediaRecorder) return 0;

    const elapsed = Date.now() - this.startTime - this.totalPausedTime;
    return Math.floor(elapsed / 1000);
  }

  /**
   * Get recording state
   */
  getRecordingState(): RecordingState {
    if (!this.mediaRecorder) {
      return {
        isRecording: false,
        isPaused: false,
        duration: 0,
      };
    }

    return {
      isRecording: this.mediaRecorder.state === 'recording',
      isPaused: this.mediaRecorder.state === 'paused',
      duration: this.getDuration(),
    };
  }

  /**
   * Create audio URL from blob
   */
  createAudioURL(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  /**
   * Release audio URL
   */
  releaseAudioURL(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Get supported MIME type for MediaRecorder
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav',
      'audio/ogg',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/wav'; // Fallback
  }

  /**
   * Get audio level (for visualization)
   */
  async getAudioLevel(): Promise<number> {
    if (!this.audioContext || !this.stream) return 0;

    try {
      const analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      // Calculate average level
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum / dataArray.length;

      return average / 255; // Normalize to 0-1
    } catch (error) {
      console.error('Error getting audio level:', error);
      return 0;
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    this.mediaRecorder = null;
    this.audioContext = null;
    this.stream = null;
    this.audioChunks = [];
  }

  /**
   * Static method to check browser support
   */
  static isBrowserSupported(): boolean {
    return (
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) &&
      (!!window.AudioContext || !!(window as any).webkitAudioContext)
    );
  }

  /**
   * Static method to get supported features
   */
  static getSupportedFeatures() {
    return {
      recording: !!MediaRecorder,
      webAudio: !!window.AudioContext || !!(window as any).webkitAudioContext,
      getUserMedia:
        !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    };
  }
}
