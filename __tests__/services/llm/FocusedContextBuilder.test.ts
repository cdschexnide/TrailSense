import { FocusedContextBuilder } from '@/services/llm/FocusedContextBuilder';
import type { Alert } from '@/types/alert';
import type { Device } from '@/types/device';

const devices: Device[] = [
  {
    id: 'device-1',
    name: 'North Gate Sensor',
    online: true,
    batteryPercent: 87,
    signalStrength: 'excellent',
    alertCount: 142,
    lastSeen: '2026-04-02T11:00:00Z',
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2026-04-02T11:00:00Z',
  },
  {
    id: 'device-2',
    name: 'Cabin Approach',
    online: false,
    batteryPercent: 12,
    signalStrength: 'weak',
    alertCount: 156,
    lastSeen: '2026-03-31T02:30:00Z',
    createdAt: '2025-01-10T08:15:00Z',
    updatedAt: '2026-03-31T02:30:00Z',
  },
];

const alerts: Alert[] = [
  {
    id: 'alert-1',
    deviceId: 'device-1',
    timestamp: '2026-04-02T10:00:00Z',
    threatLevel: 'critical',
    detectionType: 'cellular',
    fingerprintHash: 'c_aabbcc112233',
    confidence: 85,
    accuracyMeters: 4.2,
    isReviewed: false,
    isFalsePositive: false,
  },
  {
    id: 'alert-2',
    deviceId: 'device-2',
    timestamp: '2026-04-01T03:15:00Z',
    threatLevel: 'high',
    detectionType: 'wifi',
    fingerprintHash: 'w_ddeeff445566',
    confidence: 72,
    accuracyMeters: 8.5,
    isReviewed: true,
    isFalsePositive: false,
  },
  {
    id: 'alert-3',
    deviceId: 'device-1',
    timestamp: '2026-03-20T03:15:00Z',
    threatLevel: 'low',
    detectionType: 'bluetooth',
    fingerprintHash: 'c_aabbcc112233',
    confidence: 60,
    accuracyMeters: 22.0,
    isReviewed: false,
    isFalsePositive: false,
  },
];

describe('FocusedContextBuilder', () => {
  it('builds alert context with filters applied', () => {
    const result = FocusedContextBuilder.build(
      'alert_query',
      { threatLevel: 'critical' },
      alerts,
      devices
    );

    expect(result).toContain('1 critical alerts');
    expect(result).toContain('North Gate Sensor');
    expect(result).not.toContain('Cabin Approach');
  });

  it('builds device context with offline devices first', () => {
    const result = FocusedContextBuilder.build(
      'device_query',
      {},
      alerts,
      devices
    );

    expect(result).toContain('2 TrailSense sensors');
    expect(result.indexOf('Cabin Approach')).toBeLessThan(
      result.indexOf('North Gate Sensor')
    );
    expect(result).toContain('Battery: 12% (CRITICAL)');
  });

  it('builds status overview with top concerns', () => {
    const result = FocusedContextBuilder.build(
      'status_overview',
      {},
      alerts,
      devices
    );

    expect(result).toContain('TOP CONCERNS');
    expect(result).toContain('1 sensors offline');
    expect(result).toContain('1 critical and 1 high alerts');
  });

  it('builds pattern context with repeat visitors', () => {
    const result = FocusedContextBuilder.build(
      'pattern_query',
      {},
      alerts,
      devices
    );

    expect(result).toContain('REPEAT VISITORS');
    expect(result).toContain('c_aabbcc112233');
  });

  it('builds time context with hourly breakdown', () => {
    const result = FocusedContextBuilder.build(
      'time_query',
      {},
      alerts,
      devices
    );

    expect(result).toContain('HOURLY BREAKDOWN');
    expect(result).toContain('BUSIEST');
    expect(result).toContain('QUIETEST');
  });
});
