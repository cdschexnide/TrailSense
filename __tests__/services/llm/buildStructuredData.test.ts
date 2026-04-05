import { FocusedContextBuilder } from '@/services/llm/FocusedContextBuilder';
import type { Alert } from '@/types/alert';
import type { Device } from '@/types/device';
import type {
  AlertBriefingData,
  DeviceStatusData,
  TimelineData,
  SitrepData,
  PatternData,
  TextData,
} from '@/types/cardData';

const makeAlert = (overrides: Partial<Alert> = {}): Alert => ({
  id: 'alert-1',
  deviceId: 'device-001',
  detectionType: 'cellular',
  threatLevel: 'high',
  fingerprintHash: 'c_aabbccddeeff',
  confidence: 85,
  accuracyMeters: 4.2,
  isReviewed: false,
  timestamp: '2026-04-02T02:14:00Z',
  ...overrides,
});

const makeDevice = (overrides: Partial<Device> = {}): Device => ({
  id: 'device-001',
  name: 'North Perimeter',
  online: true,
  batteryPercent: 87,
  signalStrength: 'strong',
  alertCount: 3,
  latitude: 30.3965,
  longitude: -94.3178,
  lastSeen: '2026-04-02T09:45:00Z',
  firmwareVersion: 'v2.1.0',
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2026-04-02T09:45:00Z',
  ...overrides,
});

describe('FocusedContextBuilder.buildStructuredData', () => {
  const alerts: Alert[] = [
    makeAlert({ id: 'a1', threatLevel: 'critical', timestamp: '2026-04-02T06:38:00Z' }),
    makeAlert({ id: 'a2', threatLevel: 'high', timestamp: '2026-04-02T05:50:00Z' }),
    makeAlert({ id: 'a3', threatLevel: 'medium', fingerprintHash: 'c_aabbccddeeff', timestamp: '2026-04-02T03:42:00Z' }),
    makeAlert({ id: 'a4', threatLevel: 'high', fingerprintHash: 'c_aabbccddeeff', timestamp: '2026-04-02T02:14:00Z' }),
  ];

  const devices: Device[] = [
    makeDevice({ id: 'd1', name: 'North', online: true }),
    makeDevice({ id: 'd2', name: 'South', online: true }),
    makeDevice({ id: 'd3', name: 'Gate', online: false, batteryPercent: 12 }),
  ];

  it('returns AlertBriefingData for alert_query', () => {
    const result = FocusedContextBuilder.buildStructuredData(
      'alert_query',
      {},
      alerts,
      devices
    ) as AlertBriefingData;

    expect(result.type).toBe('alert_query');
    expect(result.alerts.length).toBeGreaterThan(0);
    expect(result.devices).toBe(devices);
    // Sorted by recency — most recent first
    expect(result.alerts[0].id).toBe('a1');
  });

  it('returns DeviceStatusData for device_query', () => {
    const result = FocusedContextBuilder.buildStructuredData(
      'device_query',
      {},
      alerts,
      devices
    ) as DeviceStatusData;

    expect(result.type).toBe('device_query');
    expect(result.devices.length).toBe(3);
    // Offline devices sorted first
    expect(result.devices[0].online).toBe(false);
    expect(result.alertCounts).toBeDefined();
  });

  it('returns TimelineData for time_query', () => {
    const result = FocusedContextBuilder.buildStructuredData(
      'time_query',
      {},
      alerts,
      devices
    ) as TimelineData;

    expect(result.type).toBe('time_query');
    expect(result.hourlyBuckets).toHaveLength(24);
    expect(result.busiestHour).toBeDefined();
    expect(result.quietestHour).toBeDefined();
  });

  it('returns SitrepData for status_overview', () => {
    const result = FocusedContextBuilder.buildStructuredData(
      'status_overview',
      {},
      alerts,
      devices
    ) as SitrepData;

    expect(result.type).toBe('status_overview');
    expect(result.threatCounts.critical).toBe(1);
    expect(result.threatCounts.high).toBe(2);
    expect(result.onlineCount).toBe(2);
    expect(result.offlineCount).toBe(1);
    expect(result.alerts.length).toBeLessThanOrEqual(5);
  });

  it('returns PatternData for pattern_query', () => {
    const result = FocusedContextBuilder.buildStructuredData(
      'pattern_query',
      {},
      alerts,
      devices
    ) as PatternData;

    expect(result.type).toBe('pattern_query');
    // c_aabbccddeeff appears twice → repeat visitor
    expect(result.visitors.length).toBeGreaterThan(0);
    expect(result.visitors[0].count).toBeGreaterThanOrEqual(2);
    expect(['ROUTINE', 'SUSPICIOUS', 'UNKNOWN']).toContain(
      result.visitors[0].classification
    );
  });

  it('returns TextData for help', () => {
    const result = FocusedContextBuilder.buildStructuredData(
      'help',
      {},
      alerts,
      devices
    ) as TextData;

    expect(result.type).toBe('help');
  });

  it('returns empty alerts for alert_query with no matching data', () => {
    const result = FocusedContextBuilder.buildStructuredData(
      'alert_query',
      { threatLevel: 'low' },
      alerts,
      devices
    ) as AlertBriefingData;

    expect(result.type).toBe('alert_query');
    expect(result.alerts).toHaveLength(0);
  });

  it('returns empty devices for device_query with filter', () => {
    const result = FocusedContextBuilder.buildStructuredData(
      'device_query',
      { deviceName: 'Nonexistent' },
      alerts,
      devices
    ) as DeviceStatusData;

    expect(result.type).toBe('device_query');
    expect(result.devices).toHaveLength(0);
  });

  it('handles empty alerts array gracefully', () => {
    const result = FocusedContextBuilder.buildStructuredData(
      'status_overview',
      {},
      [],
      devices
    ) as SitrepData;

    expect(result.type).toBe('status_overview');
    expect(result.alerts).toHaveLength(0);
    expect(result.threatCounts.critical).toBe(0);
  });
});
