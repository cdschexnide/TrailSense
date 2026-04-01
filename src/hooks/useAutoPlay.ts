import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BucketEntry, PlaybackSpeed } from '@/types/replay';

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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMinuteIndex(initialMinute);
  }, [initialMinute]);

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

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    clearTimer();
  }, [clearTimer]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(current => !current);
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeed(current => SPEEDS[(SPEEDS.indexOf(current) + 1) % SPEEDS.length]);
  }, []);

  const skipForward = useCallback(() => {
    const next = sortedKeys.find(key => key > minuteIndex);
    if (next !== undefined) {
      setMinuteIndex(next);
    }
  }, [minuteIndex, sortedKeys]);

  const skipBack = useCallback(() => {
    let previous: number | undefined;
    for (const key of sortedKeys) {
      if (key >= minuteIndex) {
        break;
      }
      previous = key;
    }

    if (previous !== undefined) {
      setMinuteIndex(previous);
    }
  }, [minuteIndex, sortedKeys]);

  useEffect(() => {
    clearTimer();

    if (!isPlaying) {
      return;
    }

    timerRef.current = setInterval(() => {
      setMinuteIndex(current => {
        const next = current + 1;

        if (next >= 1440) {
          setIsPlaying(false);
          return current;
        }

        let emptyMinutes = 0;
        for (let minute = next; minute < Math.min(1440, next + NO_ACTIVITY_THRESHOLD); minute++) {
          if (buckets.has(minute)) {
            break;
          }
          emptyMinutes += 1;
        }

        if (emptyMinutes >= NO_ACTIVITY_THRESHOLD) {
          const nextCluster = sortedKeys.find(key => key > next);
          if (nextCluster !== undefined) {
            return nextCluster;
          }

          setIsPlaying(false);
          return current;
        }

        return next;
      });
    }, 1000 / speed);

    return clearTimer;
  }, [buckets, clearTimer, isPlaying, sortedKeys, speed]);

  useEffect(() => clearTimer, [clearTimer]);

  return {
    isPlaying,
    speed,
    minuteIndex,
    setMinuteIndex,
    play,
    pause,
    togglePlayPause,
    cycleSpeed,
    skipForward,
    skipBack,
  };
}
