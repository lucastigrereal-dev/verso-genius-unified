/**
 * Services Barrel Export
 */

// Audio Services (from ia-rimas-brasil)
export { AudioService, getAudioService, CC0_BEATS } from './audioService'
export type { Beat, AudioState } from './audioService'

export { RecordingService, getRecordingService, RecordingStorage } from './recordingService'
export type { Recording, RecordingState } from './recordingService'
