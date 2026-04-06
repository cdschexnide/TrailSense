import type { Device } from '@/types/device';
import { daysAgo, hoursAgo, minutesAgo } from '../helpers/timestamps';

export type MockDevice = Device & { metadata: null };

// Mock devices located in Southeast Texas area
// Center coordinates: 30.396526, -94.317806
export function getMockDevices(): MockDevice[] {
  const device001LastSeen = minutesAgo(1);
  const device002LastSeen = minutesAgo(2);
  const device003LastSeen = minutesAgo(3);
  const device004LastSeen = daysAgo(2);
  const device005LastSeen = daysAgo(5);

  return [
    {
      id: 'device-001',
      name: 'North Gate Sensor',
      online: true,
      batteryPercent: 87,
      signalStrength: 'excellent',
      alertCount: 142,
      latitude: 30.396526,
      longitude: -94.317806,
      lastSeen: device001LastSeen,
      firmwareVersion: 'v2.1.3',
      uptimeSeconds: 88200,
      lastBootAt: hoursAgo(Math.round(88200 / 3600)),
      createdAt: '2025-01-10T08:00:00Z',
      updatedAt: device001LastSeen,
      metadata: null,
    },
    {
      id: 'device-002',
      name: 'South Boundary',
      online: true,
      batteryPercent: 92,
      signalStrength: 'good',
      alertCount: 87,
      latitude: 30.3943,
      longitude: -94.3191,
      lastSeen: device002LastSeen,
      firmwareVersion: 'v2.1.3',
      uptimeSeconds: 259200,
      lastBootAt: hoursAgo(Math.round(259200 / 3600)),
      createdAt: '2025-01-10T08:15:00Z',
      updatedAt: device002LastSeen,
      metadata: null,
    },
    {
      id: 'device-003',
      name: 'East Trail Monitor',
      online: true,
      batteryPercent: 65,
      signalStrength: 'fair',
      alertCount: 213,
      latitude: 30.397,
      longitude: -94.3155,
      lastSeen: device003LastSeen,
      firmwareVersion: 'v2.1.2',
      uptimeSeconds: 43500,
      lastBootAt: hoursAgo(Math.round(43500 / 3600)),
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: device003LastSeen,
      metadata: null,
    },
    {
      id: 'device-004',
      name: 'West Perimeter',
      online: false,
      batteryPercent: 12,
      signalStrength: 'poor',
      alertCount: 45,
      latitude: 30.3958,
      longitude: -94.3205,
      lastSeen: device004LastSeen,
      firmwareVersion: 'v2.0.9',
      createdAt: '2025-02-01T12:00:00Z',
      updatedAt: device004LastSeen,
      metadata: null,
    },
    {
      id: 'device-005',
      name: 'Cabin Approach',
      online: false,
      batteryPercent: 0,
      signalStrength: 'poor',
      alertCount: 156,
      latitude: 30.3988,
      longitude: -94.3162,
      lastSeen: device005LastSeen,
      firmwareVersion: 'v2.1.1',
      createdAt: '2025-01-20T14:00:00Z',
      updatedAt: device005LastSeen,
      metadata: null,
    },
  ];
}

export const mockDevices: Device[] = getMockDevices();

export const mockOnlineDevices = mockDevices.filter(d => d.online);
export const mockOfflineDevices = mockDevices.filter(d => !d.online);
