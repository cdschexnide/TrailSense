import { DetectionType, ThreatLevel } from './alert';

export type PlaybackSpeed = 1 | 10 | 60 | 360;

export interface BucketEntry {
  fingerprintHash: string;
  macAddress: string;
  x: number;
  y: number;
  latitude: number;
  longitude: number;
  threatLevel: ThreatLevel;
  confidence: number;
  signalType: DetectionType;
}

export interface TimeBucketedPositions {
  startTime: number;
  buckets: Map<number, BucketEntry[]>;
}

export interface TimelineScrubberProps {
  minuteIndex: number;
  buckets: Map<number, BucketEntry[]>;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  onPlayPause: () => void;
  onSpeedChange: () => void;
  onSkipForward: () => void;
  onSkipBack: () => void;
  onScrub: (minuteIndex: number) => void;
}

export interface FingerprintPeekProps {
  macAddress: string;
  fingerprintHash: string;
  scrubTimestamp: number;
  onViewProfile: (macAddress: string) => void;
  onDismiss: () => void;
}

export type RadarMode = 'live' | 'replay';
