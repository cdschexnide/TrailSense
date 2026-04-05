import { ResponseProcessor } from '@/services/llm/ResponseProcessor';
import type { Alert } from '@/types/alert';
import type { Device } from '@/types/device';

const devices: Device[] = [
  {
    id: 'device-1',
    name: 'North Gate Sensor',
    online: false,
    batteryPercent: 14,
    signalStrength: 'fair',
    lastSeen: '2026-04-02T10:00:00Z',
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2026-04-02T10:00:00Z',
  },
];

const alerts: Alert[] = [
  {
    id: 'alert-1',
    deviceId: 'device-1',
    timestamp: '2026-04-02T09:30:00Z',
    threatLevel: 'critical',
    detectionType: 'cellular',
    fingerprintHash: 'c_aabbcc112233',
    confidence: 85,
    accuracyMeters: 4.2,
    isReviewed: false,
    isFalsePositive: false,
  },
];

describe('ResponseProcessor', () => {
  it('strips preamble and filler text', () => {
    const result = ResponseProcessor.process(
      "Based on the provided information, North Gate Sensor is offline. Feel free to ask if you have more questions.",
      'device_query',
      {},
      alerts,
      devices
    );

    expect(result).toBe('North Gate Sensor is offline.');
  });

  it('replaces hallucinated no-device response with deterministic fallback', () => {
    const result = ResponseProcessor.process(
      'There are no devices in the system.',
      'device_query',
      {},
      alerts,
      devices
    );

    expect(result).toContain('North Gate Sensor');
    expect(result).toContain('offline');
  });

  it('replaces hallucinated no-alert response with deterministic fallback', () => {
    const result = ResponseProcessor.process(
      'No alerts found.',
      'alert_query',
      { threatLevel: 'critical' },
      alerts,
      devices
    );

    expect(result).toContain('1 matching alerts');
    expect(result).toContain('cellular detection');
  });

  it('replaces false normal status claims when high priority alerts exist', () => {
    const result = ResponseProcessor.process(
      'Everything looks normal right now.',
      'status_overview',
      {},
      alerts,
      devices
    );

    expect(result).toContain('1 offline sensors');
    expect(result).toContain('1 critical alerts');
  });

  it('enforces a 150 word limit', () => {
    const longSentence = Array.from({ length: 180 }, (_, index) => `word${index}`).join(' ');
    const result = ResponseProcessor.process(
      `${longSentence}.`,
      'help',
      {},
      alerts,
      devices
    );

    expect(result.split(/\s+/)).toHaveLength(150);
  });
});
