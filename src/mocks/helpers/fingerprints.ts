import type { DetectionType } from '@/types/alert';

export const FINGERPRINT_PREFIX: Record<DetectionType, string> = {
  wifi: 'w_',
  bluetooth: 'b_',
  cellular: 'c_',
};

export const PERSONA_FINGERPRINTS = {
  delivery: 'c_a1b2c3',
  visitor: 'w_d4e5f6',
  loiterer: 'b_a7b8c9',
  vehicle: 'c_d0e1f2',
} as const;

export const PERSONA_SIGNAL_TYPES: Record<
  keyof typeof PERSONA_FINGERPRINTS,
  DetectionType
> = {
  delivery: 'cellular',
  visitor: 'wifi',
  loiterer: 'bluetooth',
  vehicle: 'cellular',
};

export function wifiFingerprint(hash: string): string {
  return fingerprintForType('wifi', hash);
}

export function bleFingerprint(hash: string): string {
  return fingerprintForType('bluetooth', hash);
}

export function cellularFingerprint(hash: string): string {
  return fingerprintForType('cellular', hash);
}

export function fingerprintForType(
  type: DetectionType,
  hash: string
): string {
  return `${FINGERPRINT_PREFIX[type]}${hash}`;
}

export function randomFingerprint(type: DetectionType): string {
  const hash = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  return fingerprintForType(type, hash);
}
