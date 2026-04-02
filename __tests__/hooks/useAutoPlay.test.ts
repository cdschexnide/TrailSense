import { act, renderHook } from '@testing-library/react-native';
import { useAutoPlay } from '@hooks/useAutoPlay';
import { BucketEntry } from '@/types/replay';

const mockIsDemoOrMockMode = jest.fn(() => false);
jest.mock('@/config/demoModeRuntime', () => ({
  isDemoOrMockMode: (...args: unknown[]) => mockIsDemoOrMockMode(...args),
}));

function makeBuckets() {
  const entry: BucketEntry = {
    fingerprintHash: 'fp-test',
    macAddress: 'AA:BB:CC:DD:EE:01',
    x: 100,
    y: 100,
    latitude: 30.396,
    longitude: -94.317,
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
    mockIsDemoOrMockMode.mockReturnValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts paused at 10x speed', () => {
    const { result } = renderHook(() =>
      useAutoPlay({ buckets: makeBuckets() })
    );
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.speed).toBe(10);
  });

  it('cycles speed through the expected sequence', () => {
    const { result } = renderHook(() =>
      useAutoPlay({ buckets: makeBuckets() })
    );
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
    const { result } = renderHook(() =>
      useAutoPlay({ buckets: makeBuckets() })
    );
    act(() => result.current.setMinuteIndex(0));
    act(() => result.current.skipForward());
    expect(result.current.minuteIndex).toBe(60);
    act(() => result.current.skipForward());
    expect(result.current.minuteIndex).toBe(120);
    act(() => result.current.skipBack());
    expect(result.current.minuteIndex).toBe(60);
  });
});

describe('useAutoPlay (smooth mode)', () => {
  let rafCallbacks: ((time: number) => void)[] = [];
  let rafId = 0;

  beforeEach(() => {
    mockIsDemoOrMockMode.mockReturnValue(true);
    rafCallbacks = [];
    rafId = 0;

    jest
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((cb: (time: number) => void) => {
        rafCallbacks.push(cb);
        rafId += 1;
        return rafId;
      });
    jest.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function flushRaf(time: number) {
    const cbs = [...rafCallbacks];
    rafCallbacks = [];
    cbs.forEach(cb => cb(time));
  }

  it('exposes progress starting at 0', () => {
    const { result } = renderHook(() =>
      useAutoPlay({ buckets: makeBuckets(), initialMinute: 60 })
    );
    expect(result.current.progress).toBe(0);
  });

  it('advances progress on RAF ticks at 1x speed', () => {
    const { result } = renderHook(() =>
      useAutoPlay({ buckets: makeBuckets(), initialMinute: 60 })
    );

    act(() => result.current.play());

    // First RAF schedules — fires at time 0 (delta=0, no movement)
    act(() => flushRaf(0));
    expect(result.current.progress).toBe(0);
    expect(result.current.minuteIndex).toBe(60);

    // 500ms at 1x speed = 0.5 minutes of progress
    act(() => {
      result.current.cycleSpeed(); // 10 -> 60
      result.current.cycleSpeed(); // 60 -> 360
      result.current.cycleSpeed(); // 360 -> 1
    });

    act(() => flushRaf(500));
    expect(result.current.progress).toBeCloseTo(0.5, 1);
    expect(result.current.minuteIndex).toBe(60);
  });

  it('advances multiple minutes at 360x speed (overflow-safe)', () => {
    const buckets = new Map<number, BucketEntry[]>();
    const entry: BucketEntry = {
      fingerprintHash: 'fp-test',
      macAddress: 'AA:BB:CC:DD:EE:01',
      x: 100,
      y: 100,
      latitude: 30.396,
      longitude: -94.317,
      threatLevel: 'medium',
      confidence: 0.7,
      signalType: 'cellular',
    };
    // Fill minutes 0 through 20 so no auto-skip triggers
    for (let i = 0; i <= 20; i++) {
      buckets.set(i, [entry]);
    }

    const { result } = renderHook(() =>
      useAutoPlay({ buckets, initialMinute: 0 })
    );

    // Set to 360x: cycle 10->60->360
    act(() => {
      result.current.cycleSpeed();
      result.current.cycleSpeed();
    });
    expect(result.current.speed).toBe(360);

    act(() => result.current.play());

    // First RAF at t=0
    act(() => flushRaf(0));

    // 16ms at 360x = 16 * 360 / 1000 = 5.76 minutes
    act(() => flushRaf(16));

    // Should have advanced ~5 full minutes + 0.76 fractional
    expect(result.current.minuteIndex).toBe(5);
    expect(result.current.progress).toBeCloseTo(0.76, 1);
  });

  it('stops at minute 1440', () => {
    const entry: BucketEntry = {
      fingerprintHash: 'fp-test',
      macAddress: 'AA:BB:CC:DD:EE:01',
      x: 100,
      y: 100,
      latitude: 30.396,
      longitude: -94.317,
      threatLevel: 'medium',
      confidence: 0.7,
      signalType: 'cellular',
    };
    const buckets = new Map<number, BucketEntry[]>();
    for (let i = 1435; i < 1440; i++) {
      buckets.set(i, [entry]);
    }

    const { result } = renderHook(() =>
      useAutoPlay({ buckets, initialMinute: 1438 })
    );

    act(() => result.current.play());
    act(() => flushRaf(0));
    // 2000ms at 10x = 20 minutes — way past 1440
    act(() => flushRaf(2000));

    expect(result.current.minuteIndex).toBe(1439);
    expect(result.current.isPlaying).toBe(false);
  });
});
