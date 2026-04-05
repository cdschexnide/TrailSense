import type {
  Alert,
  AlertMetadata,
  DetectionType,
  ThreatLevel,
} from '@/types/alert';
import { mockDevices } from './mockDevices';

const generateTimestamp = (
  daysAgo: number,
  hour: number = 12,
  minute: number = 0
): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

const generateFingerprint = (index: number) =>
  `fp-visitor-${index.toString(16).padStart(4, '0')}`;

const generateLocation = (deviceId: string, variance: number = 0.0005) => {
  const device = mockDevices.find(d => d.id === deviceId);
  if (
    !device ||
    device.latitude === undefined ||
    device.longitude === undefined
  ) {
    return undefined;
  }

  return {
    latitude: device.latitude + (Math.random() - 0.5) * variance,
    longitude: device.longitude + (Math.random() - 0.5) * variance,
  };
};

const metadataFor = (
  accuracyMeters: number,
  signalCount: number,
  measurementCount: number
): AlertMetadata => ({
  source: 'positions',
  signalCount,
  windowDuration: signalCount * 30,
  measurementCount,
  distance: accuracyMeters,
  triangulatedPosition: {
    ...(generateLocation('device-001') ?? {
      latitude: 30.396526,
      longitude: -94.317806,
    }),
    accuracyMeters,
    confidence: Math.min(99, 55 + measurementCount * 5),
  },
});

const createAlert = ({
  id,
  deviceId,
  timestamp,
  threatLevel,
  detectionType,
  fingerprintHash,
  confidence,
  accuracyMeters,
  isReviewed,
  isFalsePositive,
  signalCount = 1,
  measurementCount = 3,
}: {
  id: string;
  deviceId: string;
  timestamp: string;
  threatLevel: ThreatLevel;
  detectionType: DetectionType;
  fingerprintHash: string;
  confidence: number;
  accuracyMeters: number;
  isReviewed: boolean;
  isFalsePositive: boolean;
  signalCount?: number;
  measurementCount?: number;
}): Alert => ({
  id,
  deviceId,
  timestamp,
  threatLevel,
  detectionType,
  fingerprintHash,
  confidence,
  accuracyMeters,
  isReviewed,
  isFalsePositive,
  location: generateLocation(deviceId),
  metadata: metadataFor(accuracyMeters, signalCount, measurementCount),
});

const seededAlerts: Alert[] = [
  createAlert({
    id: 'alert-001',
    deviceId: 'device-001',
    timestamp: generateTimestamp(0, 8, 15),
    threatLevel: 'critical',
    detectionType: 'cellular',
    fingerprintHash: 'fp-loiterer-g7h8i9',
    confidence: 94,
    accuracyMeters: 4.2,
    isReviewed: false,
    isFalsePositive: false,
    signalCount: 6,
    measurementCount: 8,
  }),
  createAlert({
    id: 'alert-002',
    deviceId: 'device-003',
    timestamp: generateTimestamp(0, 6, 30),
    threatLevel: 'critical',
    detectionType: 'cellular',
    fingerprintHash: 'fp-night-vehicle-2201',
    confidence: 89,
    accuracyMeters: 7.5,
    isReviewed: false,
    isFalsePositive: false,
    signalCount: 5,
    measurementCount: 6,
  }),
  createAlert({
    id: 'alert-003',
    deviceId: 'device-001',
    timestamp: generateTimestamp(1, 14, 22),
    threatLevel: 'high',
    detectionType: 'wifi',
    fingerprintHash: 'fp-delivery-a1b2c3',
    confidence: 84,
    accuracyMeters: 14.4,
    isReviewed: true,
    isFalsePositive: false,
    signalCount: 4,
    measurementCount: 5,
  }),
  createAlert({
    id: 'alert-004',
    deviceId: 'device-002',
    timestamp: generateTimestamp(1, 16, 45),
    threatLevel: 'high',
    detectionType: 'wifi',
    fingerprintHash: 'fp-visitor-d4e5f6',
    confidence: 78,
    accuracyMeters: 18.2,
    isReviewed: true,
    isFalsePositive: false,
  }),
  createAlert({
    id: 'alert-005',
    deviceId: 'device-003',
    timestamp: generateTimestamp(2, 11, 10),
    threatLevel: 'high',
    detectionType: 'cellular',
    fingerprintHash: 'fp-vehicle-j0k1l2',
    confidence: 82,
    accuracyMeters: 12.8,
    isReviewed: false,
    isFalsePositive: false,
  }),
  createAlert({
    id: 'alert-006',
    deviceId: 'device-001',
    timestamp: generateTimestamp(2, 9, 30),
    threatLevel: 'medium',
    detectionType: 'wifi',
    fingerprintHash: 'fp-neighbor-4421',
    confidence: 71,
    accuracyMeters: 24.6,
    isReviewed: true,
    isFalsePositive: false,
  }),
  createAlert({
    id: 'alert-007',
    deviceId: 'device-002',
    timestamp: generateTimestamp(3, 13, 15),
    threatLevel: 'medium',
    detectionType: 'bluetooth',
    fingerprintHash: 'fp-runner-1188',
    confidence: 67,
    accuracyMeters: 32.1,
    isReviewed: true,
    isFalsePositive: true,
  }),
  createAlert({
    id: 'alert-008',
    deviceId: 'device-001',
    timestamp: generateTimestamp(3, 15, 45),
    threatLevel: 'medium',
    detectionType: 'wifi',
    fingerprintHash: 'fp-service-3310',
    confidence: 74,
    accuracyMeters: 21.4,
    isReviewed: true,
    isFalsePositive: false,
  }),
  createAlert({
    id: 'alert-009',
    deviceId: 'device-003',
    timestamp: generateTimestamp(4, 7, 20),
    threatLevel: 'low',
    detectionType: 'bluetooth',
    fingerprintHash: 'fp-passerby-7720',
    confidence: 58,
    accuracyMeters: 47.2,
    isReviewed: true,
    isFalsePositive: true,
  }),
  createAlert({
    id: 'alert-010',
    deviceId: 'device-002',
    timestamp: generateTimestamp(4, 18, 30),
    threatLevel: 'low',
    detectionType: 'wifi',
    fingerprintHash: 'fp-passing-car-5590',
    confidence: 61,
    accuracyMeters: 55.4,
    isReviewed: true,
    isFalsePositive: false,
  }),
];

const generatedAlerts: Alert[] = Array.from({ length: 45 }, (_, i) => {
  const index = i + 11;
  const daysAgo = Math.floor(index / 2);
  const hour = index % 24;
  const threatLevels: ThreatLevel[] = ['low', 'medium', 'high', 'critical'];
  const detectionTypes: DetectionType[] = ['cellular', 'wifi', 'bluetooth'];
  const deviceIds = mockDevices.filter(d => d.online).map(d => d.id);

  const threatLevel = threatLevels[index % threatLevels.length];
  const detectionType = detectionTypes[index % detectionTypes.length];
  const deviceId = deviceIds[index % deviceIds.length];
  const confidence = 55 + (index % 40);
  const accuracyMeters = 6 + (index % 55);

  return createAlert({
    id: `alert-${String(index).padStart(3, '0')}`,
    deviceId,
    timestamp: generateTimestamp(daysAgo, hour, index % 60),
    threatLevel,
    detectionType,
    fingerprintHash: generateFingerprint(index),
    confidence: Math.min(99, confidence),
    accuracyMeters,
    isReviewed: index % 5 !== 0,
    isFalsePositive: index % 7 === 0,
    signalCount: 1 + (index % 6),
    measurementCount: 3 + (index % 5),
  });
});

export const mockAlerts: Alert[] = [
  ...seededAlerts,
  ...generatedAlerts,
].sort(
  (left, right) =>
    new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
);

export const mockUnreviewedAlerts = mockAlerts.filter(a => !a.isReviewed);
export const mockCriticalAlerts = mockAlerts.filter(
  a => a.threatLevel === 'critical'
);
export const mockHighAlerts = mockAlerts.filter(a => a.threatLevel === 'high');
export const mockMediumAlerts = mockAlerts.filter(
  a => a.threatLevel === 'medium'
);
export const mockLowAlerts = mockAlerts.filter(a => a.threatLevel === 'low');
export const mockRecentAlerts = mockAlerts.slice(0, 20);
export const mockMultibandAlerts: Alert[] = [];

export const PERSONA_FINGERPRINTS = [
  {
    fingerprintHash: 'fp-delivery-a1b2c3',
    signalType: 'cellular' as const,
  },
  {
    fingerprintHash: 'fp-visitor-d4e5f6',
    signalType: 'wifi' as const,
  },
  {
    fingerprintHash: 'fp-loiterer-g7h8i9',
    signalType: 'bluetooth' as const,
  },
  {
    fingerprintHash: 'fp-vehicle-j0k1l2',
    signalType: 'cellular' as const,
  },
];
