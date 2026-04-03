import type { Device } from '@/types/device';

// Mock devices located in Southeast Texas area
// Center coordinates: 30.396526, -94.317806
export const mockDevices: Device[] = [
  {
    id: 'device-001',
    name: 'North Gate Sensor',
    online: true,
    batteryPercent: 87,
    signalStrength: 'excellent',
    detectionCount: 142,
    latitude: 30.396526,
    longitude: -94.317806,
    lastSeen: '2025-12-16T09:45:00Z',
    firmwareVersion: 'v2.1.3',
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-12-16T09:45:00Z',
  },
  {
    id: 'device-002',
    name: 'South Boundary',
    online: true,
    batteryPercent: 92,
    signalStrength: 'good',
    detectionCount: 87,
    latitude: 30.3943,
    longitude: -94.3191,
    lastSeen: '2025-12-16T09:47:00Z',
    firmwareVersion: 'v2.1.3',
    createdAt: '2025-01-10T08:15:00Z',
    updatedAt: '2025-12-16T09:47:00Z',
  },
  {
    id: 'device-003',
    name: 'East Trail Monitor',
    online: true,
    batteryPercent: 65,
    signalStrength: 'fair',
    detectionCount: 213,
    latitude: 30.397,
    longitude: -94.3155,
    lastSeen: '2025-12-16T09:44:00Z',
    firmwareVersion: 'v2.1.2',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-12-16T09:44:00Z',
  },
  {
    id: 'device-004',
    name: 'West Perimeter',
    online: false,
    batteryPercent: 12,
    signalStrength: 'poor',
    detectionCount: 45,
    latitude: 30.3958,
    longitude: -94.3205,
    lastSeen: '2025-12-14T16:22:00Z',
    firmwareVersion: 'v2.0.9',
    createdAt: '2025-02-01T12:00:00Z',
    updatedAt: '2025-12-14T16:22:00Z',
  },
  {
    id: 'device-005',
    name: 'Cabin Approach',
    online: false,
    batteryPercent: 0,
    signalStrength: 'offline',
    detectionCount: 156,
    latitude: 30.3988,  // NE perimeter position
    longitude: -94.3162,
    lastSeen: '2025-12-12T08:15:00Z',
    firmwareVersion: 'v2.1.1',
    createdAt: '2025-01-20T14:00:00Z',
    updatedAt: '2025-12-12T08:15:00Z',
  },
];

export const mockOnlineDevices = mockDevices.filter(d => d.online);
export const mockOfflineDevices = mockDevices.filter(d => !d.online);
