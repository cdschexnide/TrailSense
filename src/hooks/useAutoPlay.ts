import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BucketEntry, PlaybackSpeed } from '@/types/replay';
import { isDemoOrMockMode } from '@/config/demoModeRuntime';

const SPEEDS: PlaybackSpeed[] = [1, 10, 60, 360];
const NO_ACTIVITY_THRESHOLD = 15;

interface UseAutoPlayOptions {
  buckets: Map<number, BucketEntry[]>;
  initialMinute?: number;
}

export function useAutoPlay({
  buckets,
  initialMinute = 0,
}: UseAutoPlayOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(10);
  const [minuteIndex, setMinuteIndex] = useState(initialMinute);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const rafLoopIdRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const minuteRef = useRef(initialMinute);
  const progressRef = useRef(0);
  const speedRef = useRef<PlaybackSpeed>(10);
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    minuteRef.current = initialMinute;
    progressRef.current = 0;
    setMinuteIndex(initialMinute);
    setProgress(0);
  }, [initialMinute]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const sortedKeys = useMemo(
    () => Array.from(buckets.keys()).sort((a, b) => a - b),
    [buckets]
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    clearTimer();
    clearRaf();
  }, [clearRaf, clearTimer]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(current => !current);
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeed(current => SPEEDS[(SPEEDS.indexOf(current) + 1) % SPEEDS.length]);
  }, []);

  const setMinuteAndResetProgress = useCallback((minute: number) => {
    minuteRef.current = minute;
    progressRef.current = 0;
    setMinuteIndex(minute);
    setProgress(0);
  }, []);

  const skipForward = useCallback(() => {
    const next = sortedKeys.find(key => key > minuteIndex);
    if (next !== undefined) {
      setMinuteAndResetProgress(next);
    }
  }, [minuteIndex, setMinuteAndResetProgress, sortedKeys]);

  const skipBack = useCallback(() => {
    let previous: number | undefined;
    for (const key of sortedKeys) {
      if (key >= minuteIndex) {
        break;
      }
      previous = key;
    }

    if (previous !== undefined) {
      setMinuteAndResetProgress(previous);
    }
  }, [minuteIndex, setMinuteAndResetProgress, sortedKeys]);

  const advanceMinute = useCallback(
    (current: number) => {
      const next = current + 1;

      if (next >= 1440) {
        return -1;
      }

      let emptyMinutes = 0;
      for (
        let minute = next;
        minute < Math.min(1440, next + NO_ACTIVITY_THRESHOLD);
        minute += 1
      ) {
        if (buckets.has(minute)) {
          break;
        }
        emptyMinutes += 1;
      }

      if (emptyMinutes >= NO_ACTIVITY_THRESHOLD) {
        const nextCluster = sortedKeys.find(key => key > next);
        return nextCluster ?? -1;
      }

      return next;
    },
    [buckets, sortedKeys]
  );

  const smoothMode = isDemoOrMockMode();

  useEffect(() => {
    if (!isPlaying || !smoothMode) {
      clearRaf();
      lastFrameRef.current = null;
      wasPlayingRef.current = false;
      return;
    }

    const isStartingPlayback = !wasPlayingRef.current;
    wasPlayingRef.current = true;

    if (isStartingPlayback) {
      lastFrameRef.current = null;
    }

    rafLoopIdRef.current += 1;
    const loopId = rafLoopIdRef.current;

    const tick = (now: number) => {
      if (loopId !== rafLoopIdRef.current) {
        return;
      }

      if (lastFrameRef.current === null) {
        lastFrameRef.current = now;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const deltaMs = Math.max(0, now - lastFrameRef.current);
      lastFrameRef.current = now;

      let remainingMinutes = (deltaMs * speedRef.current) / 1000;
      let currentMinute = minuteRef.current;
      let currentProgress = progressRef.current;
      let stopped = false;

      while (remainingMinutes > 0) {
        const remainingInCurrentMinute = 1 - currentProgress;

        if (remainingMinutes < remainingInCurrentMinute) {
          currentProgress += remainingMinutes;
          remainingMinutes = 0;
          continue;
        }

        remainingMinutes -= remainingInCurrentMinute;
        currentProgress = 0;

        const nextMinute = advanceMinute(currentMinute);
        if (nextMinute === -1) {
          stopped = true;
          remainingMinutes = 0;
          break;
        }

        currentMinute = nextMinute;
      }

      minuteRef.current = currentMinute;
      progressRef.current = currentProgress;
      setMinuteIndex(currentMinute);
      setProgress(currentProgress);

      if (stopped) {
        setIsPlaying(false);
        wasPlayingRef.current = false;
        rafRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return clearRaf;
  }, [advanceMinute, clearRaf, isPlaying, smoothMode]);

  useEffect(() => {
    if (!isPlaying || smoothMode) {
      clearTimer();
      return;
    }

    timerRef.current = setInterval(() => {
      setMinuteIndex(current => {
        const next = advanceMinute(current);
        if (next === -1) {
          setIsPlaying(false);
          return current;
        }
        return next;
      });
    }, 1000 / speed);

    return clearTimer;
  }, [advanceMinute, clearTimer, isPlaying, smoothMode, speed]);

  useEffect(() => {
    return () => {
      clearTimer();
      clearRaf();
    };
  }, [clearRaf, clearTimer]);

  return {
    isPlaying,
    speed,
    minuteIndex,
    progress,
    setMinuteIndex: setMinuteAndResetProgress,
    play,
    pause,
    togglePlayPause,
    cycleSpeed,
    skipForward,
    skipBack,
  };
}
