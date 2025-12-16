import type { Alert, ThreatLevel, DetectionType } from '@/types/alert';
import { mockDevices } from './mockDevices';

// Helper to generate timestamps over the last 30 days
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

// Helper to generate random MAC address
const generateMac = (index: number): string => {
  const prefix = ['AA', 'BB', 'CC', 'DD', 'EE', 'FF'];
  return `${prefix[index % 6]}:${(index + 10).toString(16).toUpperCase()}:${(index + 20).toString(16).toUpperCase()}:${(index + 30).toString(16).toUpperCase()}:${(index + 40).toString(16).toUpperCase()}:${(index + 50).toString(16).toUpperCase()}`;
};

// Helper to generate location with slight variations
const generateLocation = (deviceId: string, variance: number = 0.0005) => {
  const device = mockDevices.find(d => d.id === deviceId);
  if (!device || device.latitude === undefined || device.longitude === undefined) {
    return undefined;
  }

  return {
    latitude: device.latitude + (Math.random() - 0.5) * variance,
    longitude: device.longitude + (Math.random() - 0.5) * variance,
  };
};

export const mockAlerts: Alert[] = [
  // Critical alerts - cellular only (stealth mode detection)
  {
    id: 'alert-001',
    deviceId: 'device-001',
    timestamp: generateTimestamp(0, 8, 15),
    threatLevel: 'critical',
    detectionType: 'cellular',
    rssi: -55,
    macAddress: generateMac(1),
    cellularStrength: -55,
    isReviewed: false,
    isFalsePositive: false,
    location: generateLocation('device-001'),
    wifiDetected: false,
    bluetoothDetected: false,
    multiband: false,
    isStationary: false,
    seenCount: 3,
    duration: 180,
    metadata: { band: '850MHz', provider: 'Verizon' },
  },
  {
    id: 'alert-002',
    deviceId: 'device-003',
    timestamp: generateTimestamp(0, 6, 30),
    threatLevel: 'critical',
    detectionType: 'cellular',
    rssi: -62,
    macAddress: generateMac(2),
    cellularStrength: -62,
    isReviewed: false,
    isFalsePositive: false,
    location: generateLocation('device-003'),
    wifiDetected: false,
    bluetoothDetected: false,
    multiband: false,
    isStationary: true,
    seenCount: 12,
    duration: 540,
    metadata: { band: '850MHz', provider: 'AT&T' },
  },

  // High threat - multi-band detections
  {
    id: 'alert-003',
    deviceId: 'device-001',
    timestamp: generateTimestamp(1, 14, 22),
    threatLevel: 'high',
    detectionType: 'wifi',
    rssi: -68,
    macAddress: generateMac(3),
    cellularStrength: -58,
    isReviewed: true,
    isFalsePositive: false,
    location: generateLocation('device-001'),
    wifiDetected: true,
    bluetoothDetected: true,
    multiband: true,
    isStationary: false,
    seenCount: 5,
    duration: 240,
    metadata: { ssid: 'iPhone', vendor: 'Apple Inc.' },
  },
  {
    id: 'alert-004',
    deviceId: 'device-002',
    timestamp: generateTimestamp(1, 16, 45),
    threatLevel: 'high',
    detectionType: 'wifi',
    rssi: -72,
    macAddress: generateMac(4),
    cellularStrength: -60,
    isReviewed: true,
    isFalsePositive: false,
    location: generateLocation('device-002'),
    wifiDetected: true,
    bluetoothDetected: true,
    multiband: true,
    isStationary: false,
    seenCount: 8,
    duration: 360,
    metadata: { ssid: 'Samsung-Galaxy', vendor: 'Samsung' },
  },
  {
    id: 'alert-005',
    deviceId: 'device-003',
    timestamp: generateTimestamp(2, 11, 10),
    threatLevel: 'high',
    detectionType: 'cellular',
    rssi: -65,
    macAddress: generateMac(5),
    cellularStrength: -65,
    isReviewed: false,
    isFalsePositive: false,
    location: generateLocation('device-003'),
    wifiDetected: false,
    bluetoothDetected: true,
    multiband: true,
    isStationary: true,
    seenCount: 15,
    duration: 720,
  },

  // Medium threat - WiFi/Bluetooth only
  {
    id: 'alert-006',
    deviceId: 'device-001',
    timestamp: generateTimestamp(2, 9, 30),
    threatLevel: 'medium',
    detectionType: 'wifi',
    rssi: -75,
    macAddress: generateMac(6),
    isReviewed: true,
    isFalsePositive: false,
    location: generateLocation('device-001'),
    wifiDetected: true,
    bluetoothDetected: false,
    multiband: false,
    isStationary: false,
    seenCount: 2,
    duration: 120,
    metadata: { ssid: 'AndroidAP', vendor: 'Google' },
  },
  {
    id: 'alert-007',
    deviceId: 'device-002',
    timestamp: generateTimestamp(3, 13, 15),
    threatLevel: 'medium',
    detectionType: 'bluetooth',
    rssi: -78,
    macAddress: generateMac(7),
    isReviewed: true,
    isFalsePositive: true,
    location: generateLocation('device-002'),
    wifiDetected: false,
    bluetoothDetected: true,
    multiband: false,
    isStationary: false,
    seenCount: 1,
    duration: 45,
    metadata: { deviceName: 'AirPods Pro' },
  },
  {
    id: 'alert-008',
    deviceId: 'device-001',
    timestamp: generateTimestamp(3, 15, 45),
    threatLevel: 'medium',
    detectionType: 'wifi',
    rssi: -70,
    macAddress: generateMac(8),
    isReviewed: true,
    isFalsePositive: false,
    location: generateLocation('device-001'),
    wifiDetected: true,
    bluetoothDetected: false,
    multiband: false,
    seenCount: 4,
    duration: 180,
  },

  // Low threat - brief detections
  {
    id: 'alert-009',
    deviceId: 'device-003',
    timestamp: generateTimestamp(4, 7, 20),
    threatLevel: 'low',
    detectionType: 'bluetooth',
    rssi: -82,
    macAddress: generateMac(9),
    isReviewed: true,
    isFalsePositive: true,
    location: generateLocation('device-003'),
    wifiDetected: false,
    bluetoothDetected: true,
    multiband: false,
    seenCount: 1,
    duration: 30,
    metadata: { deviceName: 'Fitbit' },
  },
  {
    id: 'alert-010',
    deviceId: 'device-002',
    timestamp: generateTimestamp(4, 18, 30),
    threatLevel: 'low',
    detectionType: 'wifi',
    rssi: -85,
    macAddress: generateMac(10),
    isReviewed: true,
    isFalsePositive: false,
    location: generateLocation('device-002'),
    wifiDetected: true,
    bluetoothDetected: false,
    multiband: false,
    seenCount: 1,
    duration: 60,
  },

  // Generate more alerts for the past 30 days
  ...Array.from({ length: 45 }, (_, i) => {
    const index = i + 11;
    const daysAgo = Math.floor(index / 2);
    const hour = index % 24;
    const threatLevels: ThreatLevel[] = ['low', 'medium', 'high', 'critical'];
    const detectionTypes: DetectionType[] = ['cellular', 'wifi', 'bluetooth'];
    const deviceIds = mockDevices.filter(d => d.online).map(d => d.id);

    const threatLevel = threatLevels[index % 4];
    const detectionType = detectionTypes[index % 3];
    const deviceId = deviceIds[index % deviceIds.length];
    const isMultiband = index % 3 === 0;
    const isReviewed = index % 5 !== 0; // 80% reviewed
    const isFalsePositive = isReviewed && index % 7 === 0; // Some false positives

    return {
      id: `alert-${String(index).padStart(3, '0')}`,
      deviceId,
      timestamp: generateTimestamp(daysAgo, hour, index % 60),
      threatLevel,
      detectionType,
      rssi: -60 - (index % 30),
      macAddress: generateMac(index),
      cellularStrength:
        detectionType === 'cellular' ? -55 - (index % 25) : undefined,
      isReviewed,
      isFalsePositive,
      location: generateLocation(deviceId),
      wifiDetected: isMultiband || detectionType === 'wifi',
      bluetoothDetected: isMultiband || detectionType === 'bluetooth',
      multiband: isMultiband,
      isStationary: index % 4 === 0,
      seenCount: 1 + (index % 10),
      duration: 30 + (index % 600),
      metadata:
        detectionType === 'wifi' ? { ssid: `Device-${index}` } : undefined,
    } as Alert;
  }),
];

// Filtered alert collections
export const mockUnreviewedAlerts = mockAlerts.filter(a => !a.isReviewed);
export const mockCriticalAlerts = mockAlerts.filter(
  a => a.threatLevel === 'critical'
);
export const mockHighAlerts = mockAlerts.filter(a => a.threatLevel === 'high');
export const mockMediumAlerts = mockAlerts.filter(
  a => a.threatLevel === 'medium'
);
export const mockLowAlerts = mockAlerts.filter(a => a.threatLevel === 'low');
export const mockMultibandAlerts = mockAlerts.filter(a => a.multiband);
export const mockRecentAlerts = mockAlerts.slice(0, 20);
