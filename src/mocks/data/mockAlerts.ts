import type {
  Alert,
  AlertMetadata,
  DetectionType,
  ThreatLevel,
} from '@/types/alert';
import {
  PERSONA_FINGERPRINTS as PERSONAS,
  fingerprintForType,
} from '../helpers/fingerprints';
import { hoursAgo } from '../helpers/timestamps';
import { getMockDevices } from './mockDevices';

type MockAlert = Alert & { createdAt: string };

function metricsForThreat(threatLevel: ThreatLevel): {
  presenceCertainty: number;
  proximity: number;
} {
  const ranges: Record<ThreatLevel, [number, number]> = {
    critical: [70, 95],
    high: [50, 80],
    medium: [30, 60],
    low: [10, 35],
  };
  const [min, max] = ranges[threatLevel];
  const rand = (lo: number, hi: number) =>
    Math.floor(Math.random() * (hi - lo + 1)) + lo;

  return {
    presenceCertainty: rand(min, max),
    proximity: rand(min, max),
  };
}

function buildHexHash(index: number): string {
  return index.toString(16).padStart(8, '0');
}

export function getMockAlerts(): MockAlert[] {
  const devices = getMockDevices();
  const onlineDeviceIds = devices.filter(d => d.online).map(d => d.id);

  const generateLocation = (deviceId: string, variance: number = 0.0005) => {
    const device = devices.find(d => d.id === deviceId);
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
    deviceId: string,
    threatLevel: ThreatLevel,
    accuracyMeters: number,
    signalCount: number,
    measurementCount: number
  ): AlertMetadata => {
    const metrics = metricsForThreat(threatLevel);
    const triangulatedPosition = generateLocation(deviceId) ?? {
      latitude: 30.396526,
      longitude: -94.317806,
    };

    return {
      source: 'positions',
      signalCount,
      windowDuration: signalCount * 30,
      measurementCount,
      distance: accuracyMeters,
      presenceCertainty: metrics.presenceCertainty,
      proximity: metrics.proximity,
      triangulatedPosition: {
        ...triangulatedPosition,
        accuracyMeters,
        confidence: Math.min(99, 55 + measurementCount * 5),
      },
    };
  };

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
  }): MockAlert => ({
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
    metadata: metadataFor(
      deviceId,
      threatLevel,
      accuracyMeters,
      signalCount,
      measurementCount
    ),
    createdAt: timestamp,
  });

  const seededAlerts: MockAlert[] = [
    createAlert({
      id: 'alert-001',
      deviceId: 'device-001',
      timestamp: hoursAgo(1),
      threatLevel: 'critical',
      detectionType: 'bluetooth',
      fingerprintHash: PERSONAS.loiterer,
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
      timestamp: hoursAgo(3),
      threatLevel: 'critical',
      detectionType: 'cellular',
      fingerprintHash: fingerprintForType('cellular', '2201a4f8'),
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
      timestamp: hoursAgo(6),
      threatLevel: 'high',
      detectionType: 'cellular',
      fingerprintHash: PERSONAS.delivery,
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
      timestamp: hoursAgo(24),
      threatLevel: 'high',
      detectionType: 'wifi',
      fingerprintHash: PERSONAS.visitor,
      confidence: 78,
      accuracyMeters: 18.2,
      isReviewed: true,
      isFalsePositive: false,
    }),
    createAlert({
      id: 'alert-005',
      deviceId: 'device-003',
      timestamp: hoursAgo(36),
      threatLevel: 'high',
      detectionType: 'cellular',
      fingerprintHash: PERSONAS.vehicle,
      confidence: 82,
      accuracyMeters: 12.8,
      isReviewed: false,
      isFalsePositive: false,
    }),
    createAlert({
      id: 'alert-006',
      deviceId: 'device-001',
      timestamp: hoursAgo(40),
      threatLevel: 'medium',
      detectionType: 'wifi',
      fingerprintHash: fingerprintForType('wifi', '44210bee'),
      confidence: 71,
      accuracyMeters: 24.6,
      isReviewed: true,
      isFalsePositive: false,
    }),
    createAlert({
      id: 'alert-007',
      deviceId: 'device-002',
      timestamp: hoursAgo(48),
      threatLevel: 'medium',
      detectionType: 'bluetooth',
      fingerprintHash: fingerprintForType('bluetooth', '1188cd3a'),
      confidence: 67,
      accuracyMeters: 32.1,
      isReviewed: true,
      isFalsePositive: true,
    }),
    createAlert({
      id: 'alert-008',
      deviceId: 'device-001',
      timestamp: hoursAgo(52),
      threatLevel: 'medium',
      detectionType: 'wifi',
      fingerprintHash: fingerprintForType('wifi', '3310ef92'),
      confidence: 74,
      accuracyMeters: 21.4,
      isReviewed: true,
      isFalsePositive: false,
    }),
    createAlert({
      id: 'alert-009',
      deviceId: 'device-003',
      timestamp: hoursAgo(72),
      threatLevel: 'low',
      detectionType: 'bluetooth',
      fingerprintHash: fingerprintForType('bluetooth', '7720ab5f'),
      confidence: 58,
      accuracyMeters: 47.2,
      isReviewed: true,
      isFalsePositive: true,
    }),
    createAlert({
      id: 'alert-010',
      deviceId: 'device-002',
      timestamp: hoursAgo(84),
      threatLevel: 'low',
      detectionType: 'wifi',
      fingerprintHash: fingerprintForType('wifi', '5590dde1'),
      confidence: 61,
      accuracyMeters: 55.4,
      isReviewed: true,
      isFalsePositive: false,
    }),
  ];

  const threatLevels: ThreatLevel[] = ['low', 'medium', 'high', 'critical'];
  const detectionTypes: DetectionType[] = ['cellular', 'wifi', 'bluetooth'];
  const generatedAlerts: MockAlert[] = Array.from({ length: 45 }, (_, i) => {
    const index = i + 11;
    const threatLevel = threatLevels[index % threatLevels.length];
    const detectionType = detectionTypes[index % detectionTypes.length];
    const deviceId = onlineDeviceIds[index % onlineDeviceIds.length];
    const confidence = Math.min(99, 55 + (index % 40));
    const accuracyMeters = 6 + (index % 55);

    return createAlert({
      id: `alert-${String(index).padStart(3, '0')}`,
      deviceId,
      timestamp: hoursAgo(6 + i * 3),
      threatLevel,
      detectionType,
      fingerprintHash: fingerprintForType(
        detectionType,
        buildHexHash(index)
      ),
      confidence,
      accuracyMeters,
      isReviewed: index % 5 !== 0,
      isFalsePositive: index % 7 === 0,
      signalCount: 1 + (index % 6),
      measurementCount: 3 + (index % 5),
    });
  });

  return [...seededAlerts, ...generatedAlerts].sort(
    (left, right) =>
      new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
  );
}

export const mockAlerts: MockAlert[] = getMockAlerts();

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
    fingerprintHash: PERSONAS.delivery,
    signalType: 'cellular' as const,
  },
  {
    fingerprintHash: PERSONAS.visitor,
    signalType: 'wifi' as const,
  },
  {
    fingerprintHash: PERSONAS.loiterer,
    signalType: 'bluetooth' as const,
  },
  {
    fingerprintHash: PERSONAS.vehicle,
    signalType: 'cellular' as const,
  },
];
