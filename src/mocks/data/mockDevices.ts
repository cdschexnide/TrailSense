import type { Device } from '@/types/device';

export const mockDevices: Device[] = [
  {
    id: 'device-001',
    name: 'North Gate Sensor',
    online: true,
    battery: 87,
    signalStrength: 'excellent',
    detectionCount: 142,
    location: {
      latitude: 29.7604,
      longitude: -95.3698,
    },
    lastSeen: '2025-11-16T09:45:00Z',
    firmware: 'v2.1.3',
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-11-16T09:45:00Z',
  },
  {
    id: 'device-002',
    name: 'South Boundary',
    online: true,
    battery: 92,
    signalStrength: 'good',
    detectionCount: 87,
    location: {
      latitude: 29.7589,
      longitude: -95.3710,
    },
    lastSeen: '2025-11-16T09:47:00Z',
    firmware: 'v2.1.3',
    createdAt: '2025-01-10T08:15:00Z',
    updatedAt: '2025-11-16T09:47:00Z',
  },
  {
    id: 'device-003',
    name: 'East Trail Monitor',
    online: true,
    battery: 65,
    signalStrength: 'fair',
    detectionCount: 213,
    location: {
      latitude: 29.7615,
      longitude: -95.3685,
    },
    lastSeen: '2025-11-16T09:44:00Z',
    firmware: 'v2.1.2',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-11-16T09:44:00Z',
  },
  {
    id: 'device-004',
    name: 'West Perimeter',
    online: false,
    battery: 12,
    signalStrength: 'poor',
    detectionCount: 45,
    location: {
      latitude: 29.7595,
      longitude: -95.3715,
    },
    lastSeen: '2025-11-14T16:22:00Z',
    firmware: 'v2.0.9',
    createdAt: '2025-02-01T12:00:00Z',
    updatedAt: '2025-11-14T16:22:00Z',
  },
  {
    id: 'device-005',
    name: 'Cabin Approach',
    online: false,
    battery: 0,
    signalStrength: 'offline',
    detectionCount: 156,
    location: {
      latitude: 29.7620,
      longitude: -95.3695,
    },
    lastSeen: '2025-11-12T08:15:00Z',
    firmware: 'v2.1.1',
    createdAt: '2025-01-20T14:00:00Z',
    updatedAt: '2025-11-12T08:15:00Z',
  },
];

export const mockOnlineDevices = mockDevices.filter((d) => d.online);
export const mockOfflineDevices = mockDevices.filter((d) => !d.online);
