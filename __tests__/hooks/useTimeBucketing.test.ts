import { renderHook } from '@testing-library/react-native';
import { Alert } from '@/types/alert';
import { ReplayPosition } from '@/types/triangulation';
import { useTimeBucketing } from '@hooks/useTimeBucketing';

const PROPERTY_CENTER = { latitude: 31.530757, longitude: -110.287842 };

function makePosition(
  hour: number,
  minute: number,
  hash = 'fp-test'
): ReplayPosition {
  const timestamp = new Date();
  timestamp.setHours(hour, minute, 0, 0);

  return {
    id: `pos-${hour}-${minute}`,
    deviceId: 'device-001',
    fingerprintHash: hash,
    signalType: 'cellular',
    latitude: PROPERTY_CENTER.latitude + 0.001,
    longitude: PROPERTY_CENTER.longitude + 0.001,
    accuracyMeters: 15,
    confidence: 80,
    measurementCount: 4,
    observedAt: timestamp.toISOString(),
  };
}

function makeAlert(
  hour: number,
  minute: number,
  fingerprintHash = 'c_aabbccdd'
): Alert {
  const timestamp = new Date();
  timestamp.setHours(hour, minute, 0, 0);

  return {
    id: `alert-${hour}-${minute}`,
    deviceId: 'device-001',
    timestamp: timestamp.toISOString(),
    threatLevel: 'high',
    detectionType: 'cellular',
    fingerprintHash,
    confidence: 75,
    accuracyMeters: 12.5,
    isReviewed: false,
    isFalsePositive: false,
  };
}

describe('useTimeBucketing', () => {
  it('sorts positions into minute buckets', () => {
    const { result } = renderHook(() =>
      useTimeBucketing({
        positions: [
          makePosition(10, 15),
          makePosition(10, 15),
          makePosition(10, 16),
        ],
        alerts: [makeAlert(10, 15), makeAlert(10, 16)],
        propertyCenter: PROPERTY_CENTER,
        canvasSize: 350,
        maxRange: 244,
      })
    );

    expect(result.current.buckets.get(615)).toHaveLength(2);
    expect(result.current.buckets.get(616)).toHaveLength(1);
  });

  it('pre-computes x and y coordinates', () => {
    const { result } = renderHook(() =>
      useTimeBucketing({
        positions: [makePosition(8, 0)],
        alerts: [makeAlert(8, 0)],
        propertyCenter: PROPERTY_CENTER,
        canvasSize: 350,
        maxRange: 244,
      })
    );

    const bucket = result.current.buckets.get(480);
    expect(bucket).toHaveLength(1);
    expect(bucket?.[0].x).toBeGreaterThan(0);
    expect(bucket?.[0].y).toBeGreaterThan(0);
  });

  it('correlates threat level and fingerprint hash from the closest alert', () => {
    const { result } = renderHook(() =>
      useTimeBucketing({
        positions: [makePosition(8, 0, 'c_ffeeddcc')],
        alerts: [makeAlert(8, 0, 'c_ffeeddcc')],
        propertyCenter: PROPERTY_CENTER,
        canvasSize: 350,
        maxRange: 244,
      })
    );

    const bucket = result.current.buckets.get(480);
    expect(bucket?.[0].threatLevel).toBe('high');
    expect(bucket?.[0].fingerprintHash).toBe('c_ffeeddcc');
  });

  it('falls back to medium threat and empty fingerprint hash', () => {
    const { result } = renderHook(() =>
      useTimeBucketing({
        positions: [makePosition(8, 0)],
        alerts: [],
        propertyCenter: PROPERTY_CENTER,
        canvasSize: 350,
        maxRange: 244,
      })
    );

    const bucket = result.current.buckets.get(480);
    expect(bucket?.[0].threatLevel).toBe('medium');
    expect(bucket?.[0].fingerprintHash).toBe('fp-test');
  });

  it('returns empty map for no positions', () => {
    const { result } = renderHook(() =>
      useTimeBucketing({
        positions: [],
        alerts: [],
        propertyCenter: PROPERTY_CENTER,
        canvasSize: 350,
        maxRange: 244,
      })
    );

    expect(result.current.buckets.size).toBe(0);
  });

  it('handles sparse data (1 detection in 24h)', () => {
    const positions = [makePosition(14, 30)];
    const alerts = [makeAlert(14, 30)];

    const { result } = renderHook(() =>
      useTimeBucketing({
        positions,
        alerts,
        propertyCenter: PROPERTY_CENTER,
        canvasSize: 350,
        maxRange: 244,
      })
    );

    expect(result.current.buckets.size).toBe(1);
    expect(result.current.buckets.get(14 * 60 + 30)).toHaveLength(1);
  });

  it('uses fingerprintHash as primary join key over deviceId+timestamp', () => {
    const posWithHash = makePosition(8, 0, 'c_ffffffff');
    const correctAlert = makeAlert(8, 0, 'c_ffffffff');
    const wrongAlert = {
      ...makeAlert(8, 0, 'c_aaaaaaaa'),
      threatLevel: 'low' as const,
    };

    const { result } = renderHook(() =>
      useTimeBucketing({
        positions: [posWithHash],
        alerts: [wrongAlert, correctAlert],
        propertyCenter: PROPERTY_CENTER,
        canvasSize: 350,
        maxRange: 244,
      })
    );

    const bucket = result.current.buckets.get(480);
    expect(bucket?.[0].fingerprintHash).toBe('c_ffffffff');
    expect(bucket?.[0].threatLevel).toBe('high');
  });
});
