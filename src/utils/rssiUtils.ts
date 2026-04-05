/**
 * Calculates a pseudo-random but deterministic angle for a device
 * based on its fingerprint hash. Provides consistent positioning
 * for radar display.
 *
 * @param fingerprintHash - Device fingerprint hash (e.g., w_3a7fb2e1)
 * @returns Angle in degrees (0-360)
 */
export const calculateAngleFromFingerprint = (
  fingerprintHash: string
): number => {
  let hash = 0;
  for (let i = 0; i < fingerprintHash.length; i++) {
    hash = (hash << 5) - hash + fingerprintHash.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash % 360);
};
