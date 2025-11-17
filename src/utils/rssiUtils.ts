/**
 * Estimates distance from RSSI (Received Signal Strength Indicator)
 * Using the log-distance path loss model
 *
 * @param rssi - Received Signal Strength Indicator in dBm
 * @param txPower - Transmit power at 1 meter (default: -59 dBm)
 * @param pathLossExponent - Environment factor (2-4, default: 2.5)
 * @returns Estimated distance in feet
 */
export const estimateDistance = (
  rssi: number,
  txPower: number = -59,
  pathLossExponent: number = 2.5
): number => {
  if (rssi === 0) {
    return -1; // Invalid RSSI
  }

  // Path loss formula: RSSI = TxPower - 10 * n * log10(d)
  // Solving for d: d = 10^((TxPower - RSSI) / (10 * n))
  const ratio = (txPower - rssi) / (10 * pathLossExponent);
  const distanceMeters = Math.pow(10, ratio);

  // Convert meters to feet
  const distanceFeet = distanceMeters * 3.28084;

  return Math.round(distanceFeet);
};

/**
 * Calculates a pseudo-random but deterministic angle for a device
 * based on its MAC address. This provides consistent positioning
 * until actual triangulation is implemented.
 *
 * @param macAddress - Device MAC address
 * @returns Angle in degrees (0-360)
 */
export const calculateAngleFromMAC = (macAddress: string): number => {
  // Simple hash function to convert MAC to angle
  let hash = 0;
  for (let i = 0; i < macAddress.length; i++) {
    hash = (hash << 5) - hash + macAddress.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert to positive angle between 0-360
  return Math.abs(hash % 360);
};

/**
 * Categorizes signal strength
 *
 * @param rssi - Received Signal Strength Indicator in dBm
 * @returns Signal strength category
 */
export const getSignalStrength = (
  rssi: number
): 'excellent' | 'good' | 'fair' | 'poor' | 'weak' => {
  if (rssi >= -50) return 'excellent';
  if (rssi >= -60) return 'good';
  if (rssi >= -70) return 'fair';
  if (rssi >= -80) return 'poor';
  return 'weak';
};
