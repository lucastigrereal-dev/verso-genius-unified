import { useState, useEffect, useCallback } from 'react';
import { WebAudioService, RecordingState } from '../../services/webAudioService';

interface UseWebAudioReturn {
  recordingState: RecordingState;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  cancelRecording: () => void;
  isSupported: boolean;
  audioURL?: string;
  error?: string;
}

/**
 * React Hook for Web Audio Recording
 *
 * Usage:
 * ```tsx
 * const { recordingState, startRecording, stopRecording, isSupported } = useWebAudio();
 *
 * if (!isSupported) return <div>Recording not supported</div>;
 *
 * return (
 *   <button onClick={startRecording}>
 *     {recordingState.isRecording ? 'Recording...' : 'Start'}
 *   </button>
 * );
 * ```
 */
export function useWebAudio(): UseWebAudioReturn {
  const [webAudioService] = useState(() => new WebAudioService());
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
  });
  const [audioURL, setAudioURL] = useState<string>();
  const [error, setError] = useState<string>();
  const [isSupported] = useState(() => WebAudioService.isBrowserSupported());

  // Initialize on mount
  useEffect(() => {
    if (isSupported) {
      webAudioService
        .initialize()
        .then(success => {
          if (!success) {
            setError('Failed to initialize audio');
          }
        })
        .catch(err => {
          setError(err.message);
        });
    }

    return () => {
      webAudioService.dispose();
    };
  }, [webAudioService, isSupported]);

  // Update recording state and duration
  useEffect(() => {
    if (!recordingState.isRecording) return;

    const interval = setInterval(() => {
      setRecordingState(prev => ({
        ...prev,
        duration: webAudioService.getDuration(),
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [recordingState.isRecording, webAudioService]);

  const startRecording = useCallback(async () => {
    try {
      setError(undefined);
      setAudioURL(undefined);
      webAudioService.startRecording();
      setRecordingState({
        isRecording: true,
        isPaused: false,
        duration: 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, [webAudioService]);

  const pauseRecording = useCallback(() => {
    try {
      webAudioService.pauseRecording();
      setRecordingState(prev => ({
        ...prev,
        isPaused: true,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause recording');
    }
  }, [webAudioService]);

  const resumeRecording = useCallback(() => {
    try {
      webAudioService.resumeRecording();
      setRecordingState(prev => ({
        ...prev,
        isPaused: false,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume recording');
    }
  }, [webAudioService]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    try {
      const blob = await webAudioService.stopRecording();

      if (blob) {
        const url = webAudioService.createAudioURL(blob);
        setAudioURL(url);
      }

      setRecordingState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        audioBlob: blob || undefined,
      });

      return blob;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      return null;
    }
  }, [webAudioService]);

  const cancelRecording = useCallback(() => {
    try {
      webAudioService.cancelRecording();

      if (audioURL) {
        webAudioService.releaseAudioURL(audioURL);
        setAudioURL(undefined);
      }

      setRecordingState({
        isRecording: false,
        isPaused: false,
        duration: 0,
      });

      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel recording');
    }
  }, [webAudioService, audioURL]);

  return {
    recordingState,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    isSupported,
    audioURL,
    error,
  };
}
