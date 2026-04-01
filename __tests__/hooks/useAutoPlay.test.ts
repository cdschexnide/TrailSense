import { act, renderHook } from '@testing-library/react-native';
import { useAutoPlay } from '@hooks/useAutoPlay';
import { BucketEntry } from '@/types/replay';

function makeBuckets() {
  const entry: BucketEntry = {
    fingerprintHash: 'fp-test',
    macAddress: 'AA:BB:CC:DD:EE:01',
    x: 100,
    y: 100,
    threatLevel: 'medium',
    confidence: 0.7,
    signalType: 'cellular',
  };

  return new Map<number, BucketEntry[]>([
    [60, [entry]],
    [120, [entry]],
    [600, [entry]],
  ]);
}

describe('useAutoPlay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts paused at 10x speed', () => {
    const { result } = renderHook(() => useAutoPlay({ buckets: makeBuckets() }));
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.speed).toBe(10);
  });

  it('cycles speed through the expected sequence', () => {
    const { result } = renderHook(() => useAutoPlay({ buckets: makeBuckets() }));
    act(() => result.current.cycleSpeed());
    expect(result.current.speed).toBe(60);
    act(() => result.current.cycleSpeed());
    expect(result.current.speed).toBe(360);
    act(() => result.current.cycleSpeed());
    expect(result.current.speed).toBe(1);
    act(() => result.current.cycleSpeed());
    expect(result.current.speed).toBe(10);
  });

  it('skips forward and backward across populated buckets', () => {
    const { result } = renderHook(() => useAutoPlay({ buckets: makeBuckets() }));
    act(() => result.current.setMinuteIndex(0));
    act(() => result.current.skipForward());
    expect(result.current.minuteIndex).toBe(60);
    act(() => result.current.skipForward());
    expect(result.current.minuteIndex).toBe(120);
    act(() => result.current.skipBack());
    expect(result.current.minuteIndex).toBe(60);
  });
});
