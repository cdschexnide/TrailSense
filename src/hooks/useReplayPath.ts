import { useMemo } from 'react';
import type { DetectionType, ThreatLevel } from '@/types/alert';
import type { BucketEntry } from '@/types/replay';
import {
  catmullRomPoint,
  generateSplinePoints,
  type LatLng,
} from '@/utils/catmullRom';

interface Waypoint extends LatLng {
  minuteIndex: number;
}

interface DevicePath {
  macAddress: string;
  waypoints: Waypoint[];
  threatLevel: ThreatLevel;
  signalType: DetectionType;
  confidence: number;
}

export interface InterpolatedDevice {
  macAddress: string;
  latitude: number;
  longitude: number;
  threatLevel: ThreatLevel;
  signalType: DetectionType;
  confidence: number;
}

export interface TrailLine {
  macAddress: string;
  coordinates: [number, number][];
  threatLevel: ThreatLevel;
}

const TRAIL_WINDOW = 15;
const LOOKAHEAD_MINUTES = 1;
const SAMPLES_PER_SEGMENT = 10;

export const THREAT_COLORS: Record<ThreatLevel, string> = {
  low: '#5A8A5A',
  medium: '#C9A030',
  high: '#C47F30',
  critical: '#B84A42',
};

function buildDevicePaths(
  buckets: Map<number, BucketEntry[]>,
  currentMinute: number
): DevicePath[] {
  const startMinute = Math.max(0, currentMinute - TRAIL_WINDOW + 1);
  const endMinute = Math.min(1439, currentMinute + LOOKAHEAD_MINUTES);
  const deviceMinutes = new Map<
    string,
    Map<number, { waypoint: Waypoint; entry: BucketEntry }>
  >();

  for (let minute = startMinute; minute <= endMinute; minute += 1) {
    const entries = buckets.get(minute);
    if (!entries) {
      continue;
    }

    for (const entry of entries) {
      let minuteMap = deviceMinutes.get(entry.macAddress);
      if (!minuteMap) {
        minuteMap = new Map();
        deviceMinutes.set(entry.macAddress, minuteMap);
      }

      minuteMap.set(minute, {
        waypoint: {
          minuteIndex: minute,
          lat: entry.latitude,
          lng: entry.longitude,
        },
        entry,
      });
    }
  }

  return Array.from(deviceMinutes.entries()).map(([macAddress, minuteMap]) => {
    const sortedEntries = Array.from(minuteMap.entries()).sort(
      ([leftMinute], [rightMinute]) => leftMinute - rightMinute
    );
    const canonicalEntry = sortedEntries[sortedEntries.length - 1]?.[1].entry;

    return {
      macAddress,
      waypoints: sortedEntries.map(([, value]) => value.waypoint),
      threatLevel: canonicalEntry.threatLevel,
      signalType: canonicalEntry.signalType,
      confidence: canonicalEntry.confidence,
    };
  });
}

function interpolatePosition(
  waypoints: Waypoint[],
  effectiveTime: number
): LatLng {
  if (waypoints.length === 0) {
    return { lat: 0, lng: 0 };
  }

  if (waypoints.length === 1 || effectiveTime <= waypoints[0].minuteIndex) {
    return { lat: waypoints[0].lat, lng: waypoints[0].lng };
  }

  const lastWaypoint = waypoints[waypoints.length - 1];
  if (effectiveTime >= lastWaypoint.minuteIndex) {
    return { lat: lastWaypoint.lat, lng: lastWaypoint.lng };
  }

  let segmentIndex = 0;
  for (let i = 0; i < waypoints.length - 1; i += 1) {
    if (
      effectiveTime >= waypoints[i].minuteIndex &&
      effectiveTime <= waypoints[i + 1].minuteIndex
    ) {
      segmentIndex = i;
      break;
    }
  }

  const p0 = waypoints[Math.max(0, segmentIndex - 1)];
  const p1 = waypoints[segmentIndex];
  const p2 = waypoints[Math.min(waypoints.length - 1, segmentIndex + 1)];
  const p3 = waypoints[Math.min(waypoints.length - 1, segmentIndex + 2)];
  const segmentDuration = p2.minuteIndex - p1.minuteIndex;

  if (segmentDuration <= 0) {
    return { lat: p1.lat, lng: p1.lng };
  }

  return catmullRomPoint(
    p0,
    p1,
    p2,
    p3,
    (effectiveTime - p1.minuteIndex) / segmentDuration
  );
}

function buildTrailCoordinates(
  waypoints: Waypoint[],
  effectiveTime: number
): [number, number][] {
  if (waypoints.length < 2) {
    return [];
  }

  const completedWaypoints = waypoints.filter(
    waypoint => waypoint.minuteIndex <= effectiveTime
  );

  if (completedWaypoints.length < 2) {
    return [];
  }

  const splinePoints = generateSplinePoints(
    completedWaypoints.map(({ lat, lng }) => ({ lat, lng })),
    SAMPLES_PER_SEGMENT
  );
  const headPoint = interpolatePosition(waypoints, effectiveTime);

  return [
    ...splinePoints.map(point => [point.lng, point.lat] as [number, number]),
    [headPoint.lng, headPoint.lat],
  ];
}

export function useReplayPath(
  buckets: Map<number, BucketEntry[]>,
  minuteIndex: number,
  progress: number
) {
  const devicePaths = useMemo(
    () => buildDevicePaths(buckets, minuteIndex),
    [buckets, minuteIndex]
  );

  const effectiveTime = minuteIndex + progress;

  const interpolatedDevices = useMemo(
    () =>
      devicePaths
        .filter(path => path.waypoints[0]?.minuteIndex <= effectiveTime)
        .map(path => {
          const point = interpolatePosition(path.waypoints, effectiveTime);

          return {
            macAddress: path.macAddress,
            latitude: point.lat,
            longitude: point.lng,
            threatLevel: path.threatLevel,
            signalType: path.signalType,
            confidence: path.confidence,
          };
        }),
    [devicePaths, effectiveTime]
  );

  const trailLines = useMemo(
    () =>
      devicePaths
        .filter(
          path =>
            path.waypoints.length >= 2 &&
            path.waypoints[0]?.minuteIndex <= effectiveTime
        )
        .map(path => ({
          macAddress: path.macAddress,
          coordinates: buildTrailCoordinates(path.waypoints, effectiveTime),
          threatLevel: path.threatLevel,
        }))
        .filter(trail => trail.coordinates.length >= 2),
    [devicePaths, effectiveTime]
  );

  return {
    interpolatedDevices,
    trailLines,
  };
}
