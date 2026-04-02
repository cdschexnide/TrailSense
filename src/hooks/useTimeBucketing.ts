import { useMemo } from 'react';
import { Alert } from '@/types/alert';
import { BucketEntry, TimeBucketedPositions } from '@/types/replay';
import { TriangulatedPosition } from '@/types/triangulation';
import { useRadarProjection } from './useRadarProjection';

interface UseTimeBucketingOptions {
  positions: TriangulatedPosition[];
  alerts: Alert[];
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

function findMatchingAlert(
  position: TriangulatedPosition,
  alerts: Alert[],
  positionTimeMs: number
) {
  const windowMs = 5 * 60 * 1000;
  let best: Alert | undefined;
  let bestDistance = Infinity;

  if (position.macAddress) {
    for (const alert of alerts) {
      if (alert.macAddress !== position.macAddress) {
        continue;
      }

      const distance = Math.abs(new Date(alert.timestamp).getTime() - positionTimeMs);
      if (distance <= windowMs && distance < bestDistance) {
        best = alert;
        bestDistance = distance;
      }
    }
  }

  if (best) {
    return best;
  }

  for (const alert of alerts) {
    if (alert.deviceId !== position.deviceId) {
      continue;
    }

    const distance = Math.abs(new Date(alert.timestamp).getTime() - positionTimeMs);
    if (distance <= windowMs && distance < bestDistance) {
      best = alert;
      bestDistance = distance;
    }
  }

  return best;
}

export function useTimeBucketing({
  positions,
  alerts,
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

    const firstDate = new Date(positions[0].updatedAt);
    firstDate.setHours(0, 0, 0, 0);

    for (const position of positions) {
      const timestamp = new Date(position.updatedAt);
      const minuteIndex = timestamp.getHours() * 60 + timestamp.getMinutes();
      const { x, y } = project(position.latitude, position.longitude);
      const matchingAlert = findMatchingAlert(
        position,
        alerts,
        timestamp.getTime()
      );

      const entry: BucketEntry = {
        fingerprintHash: position.fingerprintHash,
        macAddress: matchingAlert?.macAddress ?? position.macAddress ?? '',
        x,
        y,
        latitude: position.latitude,
        longitude: position.longitude,
        threatLevel: matchingAlert?.threatLevel ?? 'medium',
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
  }, [alerts, positions, project]);
}
