import { useMemo } from 'react';
import { BucketEntry, TimeBucketedPositions } from '@/types/replay';
import { ReplayPosition } from '@/types/triangulation';
import { useRadarProjection } from './useRadarProjection';

interface UseTimeBucketingOptions {
  positions: ReplayPosition[];
  propertyCenter: { latitude: number; longitude: number };
  canvasSize: number;
  maxRange: number;
}

function mapSignalType(signalType: string): BucketEntry['signalType'] {
  if (signalType === 'wifi' || signalType === 'bluetooth') {
    return signalType;
  }

  return 'cellular';
}

export function useTimeBucketing({
  positions,
  propertyCenter,
  canvasSize,
  maxRange,
}: UseTimeBucketingOptions): TimeBucketedPositions {
  const { project } = useRadarProjection({
    propertyCenter,
    canvasSize,
    maxRange,
  });

  return useMemo(() => {
    const buckets = new Map<number, BucketEntry[]>();

    if (positions.length === 0) {
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      return { startTime: midnight.getTime(), buckets };
    }

    const firstDate = new Date(positions[0].observedAt);
    firstDate.setHours(0, 0, 0, 0);

    for (const position of positions) {
      const timestamp = new Date(position.observedAt);
      const minuteIndex = timestamp.getHours() * 60 + timestamp.getMinutes();
      const { x, y } = project(position.latitude, position.longitude);

      const entry: BucketEntry = {
        fingerprintHash: position.fingerprintHash,
        x,
        y,
        latitude: position.latitude,
        longitude: position.longitude,
        threatLevel: position.threatLevel ?? 'low',
        confidence: position.confidence,
        signalType: mapSignalType(position.signalType),
      };

      const existing = buckets.get(minuteIndex);
      if (existing) {
        existing.push(entry);
      } else {
        buckets.set(minuteIndex, [entry]);
      }
    }

    return {
      startTime: firstDate.getTime(),
      buckets,
    };
  }, [positions, project]);
}
