import type {
  Alert,
  AlertMetadata,
  ThreatLevel,
  DetectionType,
} from '@/types/alert';
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

// === Persona-based alerts for realistic fingerprint profiles ===

interface PersonaDefinition {
  macAddress: string;
  detectionType: DetectionType;
  threatLevel: ThreatLevel;
  rssiBase: number;
  /** Days of the week this persona visits (0=Sun, 1=Mon, ..., 6=Sat) */
  visitDays: number[];
  /** Hour and minute of typical arrival */
  arrivalHour: number;
  arrivalMinute: number;
  /** Duration of each visit in seconds */
  durationSeconds: number;
  /** How many days back to generate visits */
  lookbackDays: number;
  metadata?: AlertMetadata;
}

const PERSONAS: PersonaDefinition[] = [
  {
    macAddress: 'E4:A1:30:7B:22:01',
    detectionType: 'cellular',
    threatLevel: 'low',
    rssiBase: -52,
    visitDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
    arrivalHour: 10,
    arrivalMinute: 15,
    durationSeconds: 180,
    lookbackDays: 14,
    metadata: { band: '700MHz', provider: 'USPS Vehicle' },
  },
  {
    macAddress: 'F8:B2:41:8C:33:02',
    detectionType: 'bluetooth',
    threatLevel: 'low',
    rssiBase: -68,
    visitDays: [2, 4, 6], // Tue, Thu, Sat
    arrivalHour: 7,
    arrivalMinute: 0,
    durationSeconds: 420,
    lookbackDays: 14,
    metadata: { deviceName: 'iPhone 15 Pro' },
  },
  {
    macAddress: '1A:C3:52:9D:44:03',
    detectionType: 'cellular',
    threatLevel: 'critical',
    rssiBase: -58,
    visitDays: [], // Manual — see special handling
    arrivalHour: 2,
    arrivalMinute: 30,
    durationSeconds: 600,
    lookbackDays: 5,
    metadata: { band: '850MHz', provider: 'Unknown' },
  },
  {
    macAddress: '2B:D4:63:AE:55:04',
    detectionType: 'wifi',
    threatLevel: 'low',
    rssiBase: -60,
    visitDays: [1, 3, 5], // Mon, Wed, Fri
    arrivalHour: 13,
    arrivalMinute: 30,
    durationSeconds: 300,
    lookbackDays: 14,
    metadata: { ssid: 'FedEx-Van-4417', vendor: 'Intel Corporate' },
  },
  {
    macAddress: '3C:E5:74:BF:66:05',
    detectionType: 'wifi',
    threatLevel: 'medium',
    rssiBase: -65,
    visitDays: [0, 6], // Sat, Sun
    arrivalHour: 17,
    arrivalMinute: 45,
    durationSeconds: 900,
    lookbackDays: 14,
    metadata: { ssid: 'Pixel-8', vendor: 'Google' },
  },
  {
    macAddress: '4D:F6:85:C0:77:06',
    detectionType: 'bluetooth',
    threatLevel: 'high',
    rssiBase: -72,
    visitDays: [], // Single visit — see special handling
    arrivalHour: 23,
    arrivalMinute: 42,
    durationSeconds: 45,
    lookbackDays: 1,
    metadata: { deviceName: 'Unknown BLE' },
  },
];

function generatePersonaAlerts(): Alert[] {
  const alerts: Alert[] = [];
  let alertIndex = 200; // Start after existing mock alert indices

  for (const persona of PERSONAS) {
    // Special handling for irregular visitors
    if (persona.macAddress === '1A:C3:52:9D:44:03') {
      // Suspicious vehicle: exactly 2 visits in last 5 days
      const visit1 = new Date();
      visit1.setDate(visit1.getDate() - 3);
      visit1.setHours(2, 30, 0, 0);

      const visit2 = new Date();
      visit2.setDate(visit2.getDate() - 1);
      visit2.setHours(3, 15, 0, 0);

      for (const ts of [visit1, visit2]) {
        alerts.push({
          id: `alert-persona-${alertIndex++}`,
          deviceId: 'device-001',
          timestamp: ts.toISOString(),
          threatLevel: persona.threatLevel,
          detectionType: persona.detectionType,
          rssi: persona.rssiBase + Math.floor(Math.random() * 6),
          macAddress: persona.macAddress,
          cellularStrength: persona.rssiBase,
          isReviewed: false,
          isFalsePositive: false,
          location: generateLocation('device-001'),
          wifiDetected: false,
          bluetoothDetected: false,
          multiband: false,
          isStationary: true,
          seenCount: 4,
          duration: persona.durationSeconds,
          metadata: persona.metadata,
        });
      }
      continue;
    }

    if (persona.macAddress === '4D:F6:85:C0:77:06') {
      // One-time unknown: single detection yesterday
      const ts = new Date();
      ts.setDate(ts.getDate() - 1);
      ts.setHours(23, 42, 0, 0);

      alerts.push({
        id: `alert-persona-${alertIndex++}`,
        deviceId: 'device-001',
        timestamp: ts.toISOString(),
        threatLevel: persona.threatLevel,
        detectionType: persona.detectionType,
        rssi: persona.rssiBase,
        macAddress: persona.macAddress,
        isReviewed: false,
        isFalsePositive: false,
        location: generateLocation('device-001'),
        wifiDetected: false,
        bluetoothDetected: persona.detectionType === 'bluetooth',
        multiband: false,
        seenCount: 1,
        duration: persona.durationSeconds,
        metadata: persona.metadata,
      });
      continue;
    }

    // Regular visitors: generate visits for each matching day in lookback
    for (let daysAgo = 0; daysAgo < persona.lookbackDays; daysAgo++) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      const dayOfWeek = date.getDay();

      if (!persona.visitDays.includes(dayOfWeek)) continue;

      // Add small time variance (±10 minutes), clamped to [0, 59]
      const rawMinute =
        persona.arrivalMinute + (Math.floor(Math.random() * 20) - 10);
      const safeMinute = Math.max(0, Math.min(59, rawMinute));
      date.setHours(persona.arrivalHour, safeMinute, 0, 0);

      alerts.push({
        id: `alert-persona-${alertIndex++}`,
        deviceId: 'device-001',
        timestamp: date.toISOString(),
        threatLevel: persona.threatLevel,
        detectionType: persona.detectionType,
        rssi: persona.rssiBase + Math.floor(Math.random() * 10 - 5),
        macAddress: persona.macAddress,
        cellularStrength:
          persona.detectionType === 'cellular'
            ? persona.rssiBase + Math.floor(Math.random() * 8 - 4)
            : undefined,
        isReviewed: daysAgo > 1,
        isFalsePositive: false,
        location: generateLocation('device-001'),
        wifiDetected: persona.detectionType === 'wifi',
        bluetoothDetected: persona.detectionType === 'bluetooth',
        multiband: false,
        isStationary: false,
        seenCount: 1 + Math.floor(Math.random() * 4),
        duration: persona.durationSeconds,
        metadata: persona.metadata as any,
      });
    }
  }

  return alerts;
}

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
  ...generatePersonaAlerts(),
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

/** MAC addresses of persona devices — used by seedMockData for live positions */
export const PERSONA_MACS = PERSONAS.map(p => ({
  macAddress: p.macAddress,
  signalType: p.detectionType as 'wifi' | 'bluetooth' | 'cellular',
}));
