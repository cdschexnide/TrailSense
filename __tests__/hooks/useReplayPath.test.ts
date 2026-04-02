import { renderHook } from '@testing-library/react-native';
import { useReplayPath } from '@hooks/useReplayPath';
import { BucketEntry } from '@/types/replay';

function makeEntry(overrides: Partial<BucketEntry> = {}): BucketEntry {
  return {
    fingerprintHash: 'fp-test',
    macAddress: 'AA:BB:CC:DD:EE:01',
    x: 100,
    y: 100,
    latitude: 30.396,
    longitude: -94.317,
    threatLevel: 'medium',
    confidence: 0.7,
    signalType: 'cellular',
    ...overrides,
  };
}

describe('useReplayPath', () => {
  it('returns empty arrays when no buckets have data', () => {
    const buckets = new Map<number, BucketEntry[]>();
    const { result } = renderHook(() => useReplayPath(buckets, 100, 0));

    expect(result.current.interpolatedDevices).toEqual([]);
    expect(result.current.trailLines).toEqual([]);
  });

  it('deduplicates multiple entries per device per minute (last wins)', () => {
    const entry1 = makeEntry({ latitude: 30.0, longitude: -94.0 });
    const entry2 = makeEntry({ latitude: 30.5, longitude: -94.5 });

    const buckets = new Map<number, BucketEntry[]>([
      [100, [entry1, entry2]], // two entries same device same minute
      [101, [makeEntry({ latitude: 31.0, longitude: -95.0 })]], // lookahead
    ]);

    const { result } = renderHook(() => useReplayPath(buckets, 100, 0));

    // Should have exactly 1 device
    expect(result.current.interpolatedDevices).toHaveLength(1);
    // At progress=0, position should be at the deduped minute-100 waypoint
    // which is the last entry (entry2: lat 30.5)
    expect(result.current.interpolatedDevices[0].latitude).toBeCloseTo(30.5, 1);
  });

  it('suppresses future-only devices (first waypoint after effectiveTime)', () => {
    const deviceA = makeEntry({
      macAddress: 'AA:AA:AA:AA:AA:AA',
      latitude: 30.0,
      longitude: -94.0,
    });
    const deviceB = makeEntry({
      macAddress: 'BB:BB:BB:BB:BB:BB',
      latitude: 31.0,
      longitude: -95.0,
    });

    // deviceA has data at minute 100, deviceB only at minute 101 (lookahead)
    const buckets = new Map<number, BucketEntry[]>([
      [100, [deviceA]],
      [101, [deviceA, deviceB]],
    ]);

    // At minute 100, progress 0.5 — effectiveTime = 100.5
    const { result } = renderHook(() => useReplayPath(buckets, 100, 0.5));

    // deviceA should appear (first waypoint at 100 <= 100.5)
    // deviceB should NOT appear (first waypoint at 101 > 100.5)
    const macs = result.current.interpolatedDevices.map(d => d.macAddress);
    expect(macs).toContain('AA:AA:AA:AA:AA:AA');
    expect(macs).not.toContain('BB:BB:BB:BB:BB:BB');
  });

  it('includes lookahead so marker moves during current minute', () => {
    const buckets = new Map<number, BucketEntry[]>([
      [100, [makeEntry({ latitude: 30.0, longitude: -94.0 })]],
      [101, [makeEntry({ latitude: 30.1, longitude: -94.1 })]],
    ]);

    // At minute 100, progress 0.5 — marker should be between 30.0 and 30.1
    const { result } = renderHook(() => useReplayPath(buckets, 100, 0.5));

    expect(result.current.interpolatedDevices).toHaveLength(1);
    const lat = result.current.interpolatedDevices[0].latitude;
    expect(lat).toBeGreaterThan(30.0);
    expect(lat).toBeLessThan(30.1);
  });

  it('generates trail lines only for devices with 2+ waypoints', () => {
    const buckets = new Map<number, BucketEntry[]>([
      [100, [makeEntry({ latitude: 30.0, longitude: -94.0 })]],
      // No minute 101 — only 1 waypoint, no trail line possible
    ]);

    const { result } = renderHook(() => useReplayPath(buckets, 100, 0));
    expect(result.current.trailLines).toHaveLength(0);
  });

  it('generates trail lines when device has multiple waypoints', () => {
    const buckets = new Map<number, BucketEntry[]>([
      [98, [makeEntry({ latitude: 30.0, longitude: -94.0 })]],
      [99, [makeEntry({ latitude: 30.05, longitude: -94.05 })]],
      [100, [makeEntry({ latitude: 30.1, longitude: -94.1 })]],
      [101, [makeEntry({ latitude: 30.15, longitude: -94.15 })]],
    ]);

    const { result } = renderHook(() => useReplayPath(buckets, 100, 0.5));

    expect(result.current.trailLines).toHaveLength(1);
    // Trail should have coordinates (spline points + head)
    expect(result.current.trailLines[0].coordinates.length).toBeGreaterThan(2);
    expect(result.current.trailLines[0].threatLevel).toBe('medium');
  });

  it('uses correct types for signalType and threatLevel', () => {
    const buckets = new Map<number, BucketEntry[]>([
      [
        100,
        [
          makeEntry({
            threatLevel: 'critical',
            signalType: 'bluetooth',
          }),
        ],
      ],
      [101, [makeEntry({ threatLevel: 'critical', signalType: 'bluetooth' })]],
    ]);

    const { result } = renderHook(() => useReplayPath(buckets, 100, 0));
    expect(result.current.interpolatedDevices[0].threatLevel).toBe('critical');
    expect(result.current.interpolatedDevices[0].signalType).toBe('bluetooth');
  });
});
