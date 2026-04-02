import { renderHook } from '@testing-library/react-native';
import { Alert } from '@/types/alert';
import { TriangulatedPosition } from '@/types/triangulation';
import { useTimeBucketing } from '@hooks/useTimeBucketing';

const PROPERTY_CENTER = { latitude: 31.530757, longitude: -110.287842 };

function makePosition(
  hour: number,
  minute: number,
  hash = 'fp-test'
): TriangulatedPosition {
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
    confidence: 0.8,
    measurementCount: 4,
    updatedAt: timestamp.toISOString(),
  };
}

function makeAlert(
  hour: number,
  minute: number,
  macAddress = 'AA:BB:CC:DD:EE:01'
): Alert {
  const timestamp = new Date();
  timestamp.setHours(hour, minute, 0, 0);

  return {
    id: `alert-${hour}-${minute}`,
    deviceId: 'device-001',
    timestamp: timestamp.toISOString(),
    threatLevel: 'high',
    detectionType: 'cellular',
    rssi: -65,
    macAddress,
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

  it('correlates threat level and mac address from the closest alert', () => {
    const { result } = renderHook(() =>
      useTimeBucketing({
        positions: [makePosition(8, 0)],
        alerts: [makeAlert(8, 0, 'FF:EE:DD:CC:BB:AA')],
        propertyCenter: PROPERTY_CENTER,
        canvasSize: 350,
        maxRange: 244,
      })
    );

    const bucket = result.current.buckets.get(480);
    expect(bucket?.[0].threatLevel).toBe('high');
    expect(bucket?.[0].macAddress).toBe('FF:EE:DD:CC:BB:AA');
  });

  it('falls back to medium threat and empty mac address', () => {
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
    expect(bucket?.[0].macAddress).toBe('');
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

  it('uses macAddress as primary join key over deviceId+timestamp', () => {
    const posWithMac = {
      ...makePosition(8, 0),
      macAddress: 'FF:FF:FF:FF:FF:FF',
    };
    const correctAlert = makeAlert(8, 0, 'FF:FF:FF:FF:FF:FF');
    const wrongAlert = {
      ...makeAlert(8, 0, 'AA:AA:AA:AA:AA:AA'),
      threatLevel: 'low' as const,
    };

    const { result } = renderHook(() =>
      useTimeBucketing({
        positions: [posWithMac],
        alerts: [wrongAlert, correctAlert],
        propertyCenter: PROPERTY_CENTER,
        canvasSize: 350,
        maxRange: 244,
      })
    );

    const bucket = result.current.buckets.get(480);
    expect(bucket?.[0].macAddress).toBe('FF:FF:FF:FF:FF:FF');
    expect(bucket?.[0].threatLevel).toBe('high');
  });
});
