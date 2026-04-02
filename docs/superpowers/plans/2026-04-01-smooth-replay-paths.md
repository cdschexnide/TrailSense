# Smooth Replay Paths Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Smooth the jerky position jumps in the Replay screen by interpolating device positions between minute-level waypoints using Catmull-Rom splines and rendering visible trail lines on the Mapbox map.

**Architecture:** A pure Catmull-Rom interpolation utility generates smooth curves through known waypoints. A `useReplayPath` hook builds per-device waypoint lists from the bucketed data (with one lookahead minute and one-per-minute deduplication) and computes interpolated marker positions each frame. The `useAutoPlay` hook gains fractional `progress` tracking (0.0-1.0) with an overflow-safe RAF loop that correctly handles multi-minute frame deltas at high speeds. Trail lines render as Mapbox `ShapeSource` (with `lineMetrics`) + `LineLayer` (with `lineGradient`) for proper tail fading. All interpolation is demo/mock mode only.

**Tech Stack:** React Native, Mapbox (@rnmapbox/maps), requestAnimationFrame

**Verification baseline:** `npx tsc --noEmit` has pre-existing errors in unrelated files. Verification steps use `npx tsc --noEmit 2>&1 | grep <filename> || echo "PASS"` — grep exits 1 on no matches (success), and the `|| echo` makes it exit 0 with a visible pass message for agentic workers.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/utils/catmullRom.ts` | Create | Pure Catmull-Rom spline interpolation function |
| `src/hooks/useAutoPlay.ts` | Modify | Add `progress` (0.0-1.0) with overflow-safe RAF loop |
| `src/hooks/useReplayPath.ts` | Create | Per-device waypoint extraction (with lookahead + dedup) + interpolated position + trail lines |
| `src/screens/radar/ProximityHeatmapScreen.tsx` | Modify | Use interpolated positions for replay markers, add trail line rendering with lineGradient |

---

### Task 1: Create Catmull-Rom Interpolation Utility

**Files:**
- Create: `src/utils/catmullRom.ts`
- Create: `__tests__/utils/catmullRom.test.ts`

- [ ] **Step 1: Write the test file**

Create `__tests__/utils/catmullRom.test.ts`:

```typescript
import { catmullRomPoint, generateSplinePoints } from '@/utils/catmullRom';

describe('catmullRomPoint', () => {
  const p0 = { lat: 30.0, lng: -94.0 };
  const p1 = { lat: 30.1, lng: -94.1 };
  const p2 = { lat: 30.2, lng: -94.2 };
  const p3 = { lat: 30.3, lng: -94.3 };

  it('returns p1 at t=0', () => {
    const result = catmullRomPoint(p0, p1, p2, p3, 0);
    expect(result.lat).toBeCloseTo(p1.lat, 6);
    expect(result.lng).toBeCloseTo(p1.lng, 6);
  });

  it('returns p2 at t=1', () => {
    const result = catmullRomPoint(p0, p1, p2, p3, 1);
    expect(result.lat).toBeCloseTo(p2.lat, 6);
    expect(result.lng).toBeCloseTo(p2.lng, 6);
  });

  it('returns midpoint-ish at t=0.5', () => {
    const result = catmullRomPoint(p0, p1, p2, p3, 0.5);
    expect(result.lat).toBeGreaterThan(p1.lat);
    expect(result.lat).toBeLessThan(p2.lat);
    expect(result.lng).toBeLessThan(p1.lng);
    expect(result.lng).toBeGreaterThan(p2.lng);
  });

  it('clamps t to [0, 1]', () => {
    const atZero = catmullRomPoint(p0, p1, p2, p3, 0);
    const belowZero = catmullRomPoint(p0, p1, p2, p3, -0.5);
    expect(belowZero.lat).toBeCloseTo(atZero.lat, 6);

    const atOne = catmullRomPoint(p0, p1, p2, p3, 1);
    const aboveOne = catmullRomPoint(p0, p1, p2, p3, 1.5);
    expect(aboveOne.lat).toBeCloseTo(atOne.lat, 6);
  });
});

describe('generateSplinePoints', () => {
  it('returns empty array for fewer than 2 waypoints', () => {
    expect(generateSplinePoints([{ lat: 30.0, lng: -94.0 }], 10)).toEqual([]);
    expect(generateSplinePoints([], 10)).toEqual([]);
  });

  it('generates correct number of points for 2 waypoints', () => {
    const waypoints = [
      { lat: 30.0, lng: -94.0 },
      { lat: 30.1, lng: -94.1 },
    ];
    const points = generateSplinePoints(waypoints, 10);
    // 1 segment * 10 samples + 1 endpoint = 11
    expect(points.length).toBe(11);
  });

  it('generates correct number of points for 3 waypoints', () => {
    const waypoints = [
      { lat: 30.0, lng: -94.0 },
      { lat: 30.1, lng: -94.1 },
      { lat: 30.2, lng: -94.2 },
    ];
    const points = generateSplinePoints(waypoints, 5);
    // 2 segments * 5 samples + 1 endpoint = 11
    expect(points.length).toBe(11);
  });

  it('starts at first waypoint and ends at last', () => {
    const waypoints = [
      { lat: 30.0, lng: -94.0 },
      { lat: 30.1, lng: -94.1 },
      { lat: 30.2, lng: -94.2 },
    ];
    const points = generateSplinePoints(waypoints, 10);
    expect(points[0].lat).toBeCloseTo(30.0, 5);
    expect(points[points.length - 1].lat).toBeCloseTo(30.2, 5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/utils/catmullRom.test.ts --verbose`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the utility**

Create `src/utils/catmullRom.ts`:

```typescript
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Catmull-Rom spline interpolation between P1 and P2.
 * P0 and P3 are neighboring control points that influence curvature.
 * t is clamped to [0, 1] — returns P1 at t=0, P2 at t=1.
 */
export function catmullRomPoint(
  p0: LatLng,
  p1: LatLng,
  p2: LatLng,
  p3: LatLng,
  t: number
): LatLng {
  const ct = Math.max(0, Math.min(1, t));
  const t2 = ct * ct;
  const t3 = t2 * ct;

  const lat =
    0.5 *
    (2 * p1.lat +
      (-p0.lat + p2.lat) * ct +
      (2 * p0.lat - 5 * p1.lat + 4 * p2.lat - p3.lat) * t2 +
      (-p0.lat + 3 * p1.lat - 3 * p2.lat + p3.lat) * t3);

  const lng =
    0.5 *
    (2 * p1.lng +
      (-p0.lng + p2.lng) * ct +
      (2 * p0.lng - 5 * p1.lng + 4 * p2.lng - p3.lng) * t2 +
      (-p0.lng + 3 * p1.lng - 3 * p2.lng + p3.lng) * t3);

  return { lat, lng };
}

/**
 * Generate an array of interpolated points along a Catmull-Rom spline
 * through the given waypoints. Used for rendering trail polylines.
 *
 * @param waypoints Ordered lat/lng positions to interpolate through
 * @param samplesPerSegment Number of interpolated points between each pair
 * @returns Array of interpolated LatLng points
 */
export function generateSplinePoints(
  waypoints: LatLng[],
  samplesPerSegment: number
): LatLng[] {
  if (waypoints.length < 2) return [];

  const points: LatLng[] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const p0 = waypoints[Math.max(0, i - 1)];
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    const p3 = waypoints[Math.min(waypoints.length - 1, i + 2)];

    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment;
      points.push(catmullRomPoint(p0, p1, p2, p3, t));
    }
  }

  // Add final endpoint
  points.push(waypoints[waypoints.length - 1]);

  return points;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/utils/catmullRom.test.ts --verbose`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/utils/catmullRom.ts __tests__/utils/catmullRom.test.ts
git commit -m "feat(replay): add Catmull-Rom spline interpolation utility

Pure function for smooth curve interpolation between GPS waypoints.
Used by replay path rendering for demo mode."
```

---

### Task 2: Add Fractional Progress with Overflow-Safe RAF to useAutoPlay

**Files:**
- Modify: `src/hooks/useAutoPlay.ts`

The RAF loop must consume the full time delta each frame. At 360x speed, a 16ms frame produces ~5.76 minutes of progress. The original plan reset progress to 0 after advancing one minute, discarding the overflow. This version uses a while loop to advance as many minutes as needed per frame.

- [ ] **Step 1: Replace useAutoPlay with overflow-safe version**

Replace the entire content of `src/hooks/useAutoPlay.ts`:

```typescript
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
  const lastFrameRef = useRef<number>(0);
  // Refs are the authoritative source of truth for the RAF loop.
  // Written inside tick() and setMinuteAndResetProgress().
  // State is synced from refs once per frame for React rendering.
  const minuteRef = useRef(minuteIndex);
  const progressRef = useRef(progress);

  useEffect(() => {
    minuteRef.current = initialMinute;
    progressRef.current = 0;
    setMinuteIndex(initialMinute);
    setProgress(0);
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

  const clearRaf = useCallback(() => {
    if (rafRef.current) {
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
  }, [clearTimer, clearRaf]);

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
  }, [minuteIndex, sortedKeys, setMinuteAndResetProgress]);

  const skipBack = useCallback(() => {
    let previous: number | undefined;
    for (const key of sortedKeys) {
      if (key >= minuteIndex) break;
      previous = key;
    }
    if (previous !== undefined) {
      setMinuteAndResetProgress(previous);
    }
  }, [minuteIndex, sortedKeys, setMinuteAndResetProgress]);

  const smoothMode = isDemoOrMockMode();

  // Helper: advance minute with auto-skip logic. Returns new minute or -1 to stop.
  const advanceMinute = useCallback(
    (current: number): number => {
      const next = current + 1;
      if (next >= 1440) return -1;

      let emptyMinutes = 0;
      for (
        let m = next;
        m < Math.min(1440, next + NO_ACTIVITY_THRESHOLD);
        m++
      ) {
        if (buckets.has(m)) break;
        emptyMinutes += 1;
      }

      if (emptyMinutes >= NO_ACTIVITY_THRESHOLD) {
        const nextCluster = sortedKeys.find(key => key > next);
        return nextCluster !== undefined ? nextCluster : -1;
      }

      return next;
    },
    [buckets, sortedKeys]
  );

  // Smooth animation loop (demo/mock mode only) — overflow-safe
  useEffect(() => {
    if (!isPlaying || !smoothMode) {
      clearRaf();
      return;
    }

    lastFrameRef.current = performance.now();

    const tick = (now: number) => {
      const delta = now - lastFrameRef.current;
      lastFrameRef.current = now;

      // Total fractional minutes to advance this frame
      let remaining = (delta * speed) / 1000;
      let currentMinute = minuteRef.current;
      let currentProgress = progressRef.current;

      // Consume the full delta, advancing as many minutes as needed
      while (remaining > 0) {
        const spaceInMinute = 1 - currentProgress;
        if (remaining < spaceInMinute) {
          // Stays within current minute
          currentProgress += remaining;
          remaining = 0;
        } else {
          // Cross minute boundary
          remaining -= spaceInMinute;
          currentProgress = 0;
          const nextMinute = advanceMinute(currentMinute);
          if (nextMinute === -1) {
            setIsPlaying(false);
            remaining = 0;
          } else {
            currentMinute = nextMinute;
          }
        }
      }

      // Write refs (authoritative) then sync state for React rendering
      minuteRef.current = currentMinute;
      progressRef.current = currentProgress;
      setMinuteIndex(currentMinute);
      setProgress(currentProgress);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return clearRaf;
  }, [advanceMinute, clearRaf, isPlaying, smoothMode, speed]);

  // Discrete timer (real API mode — original behavior)
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
  }, [clearTimer, clearRaf]);

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
```

- [ ] **Step 2: Verify no new type errors**

Run: `npx tsc --noEmit 2>&1 | grep useAutoPlay || echo "PASS: no errors from useAutoPlay"`
Expected: Prints "PASS: no errors from useAutoPlay" (grep exits 1 on no matches, `||` catches it).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAutoPlay.ts
git commit -m "feat(replay): add overflow-safe fractional progress to useAutoPlay

RAF loop consumes full time delta per frame, advancing multiple
minutes when needed (e.g. 360x speed). In real API mode, keeps
the original discrete minute-jump behavior."
```

---

### Task 3: Create useReplayPath Hook

**Files:**
- Create: `src/hooks/useReplayPath.ts`

Key design decisions addressed:
- **Lookahead:** Path extraction includes `currentMinute + 1` so the interpolator has a target during progress 0→1 within the current minute.
- **Deduplication:** Multiple entries per device per minute (the mock data generates 2-4) are collapsed to one canonical sample (the last entry). This prevents zero-duration segments.
- **Type safety:** Uses `DetectionType` and `ThreatLevel` from existing types, matching `DetectedDeviceMarker`'s prop contract.
- **Trail head clipping:** Trail line coordinates are clipped to the current interpolated head position each frame.

- [ ] **Step 1: Create the hook**

Create `src/hooks/useReplayPath.ts`:

```typescript
import { useMemo } from 'react';
import {
  catmullRomPoint,
  generateSplinePoints,
  LatLng,
} from '@/utils/catmullRom';
import { BucketEntry } from '@/types/replay';
import { DetectionType, ThreatLevel } from '@/types/alert';

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

interface InterpolatedDevice {
  macAddress: string;
  latitude: number;
  longitude: number;
  threatLevel: ThreatLevel;
  signalType: DetectionType;
  confidence: number;
}

interface TrailLine {
  macAddress: string;
  coordinates: [number, number][]; // [lng, lat] pairs for Mapbox
  threatLevel: ThreatLevel;
}

const TRAIL_WINDOW = 15;
const SAMPLES_PER_SEGMENT = 10;

/**
 * Extract per-device waypoint lists from bucketed data.
 * Includes the trail window (currentMinute - 14 through currentMinute)
 * PLUS one lookahead minute (currentMinute + 1) so the interpolator
 * has a target during progress 0→1 within the current minute.
 *
 * When multiple entries exist for the same device at the same minute,
 * only the last entry is kept (canonical sample). This prevents
 * zero-duration segments from the mock data's 2-4 samples per minute.
 */
function buildDevicePaths(
  buckets: Map<number, BucketEntry[]>,
  currentMinute: number
): DevicePath[] {
  const startMinute = Math.max(0, currentMinute - TRAIL_WINDOW + 1);
  const endMinute = currentMinute + 1; // lookahead

  // Collect one canonical waypoint per device per minute (last wins)
  const deviceMinutes = new Map<
    string,
    Map<number, { waypoint: Waypoint; entry: BucketEntry }>
  >();

  for (let minute = startMinute; minute <= endMinute; minute++) {
    const entries = buckets.get(minute);
    if (!entries) continue;

    for (const entry of entries) {
      if (!deviceMinutes.has(entry.macAddress)) {
        deviceMinutes.set(entry.macAddress, new Map());
      }
      // Last entry per minute wins (overwrites previous)
      deviceMinutes.get(entry.macAddress)!.set(minute, {
        waypoint: {
          minuteIndex: minute,
          lat: entry.latitude,
          lng: entry.longitude,
        },
        entry,
      });
    }
  }

  const paths: DevicePath[] = [];
  for (const [mac, minuteMap] of deviceMinutes) {
    const sorted = Array.from(minuteMap.entries())
      .sort(([a], [b]) => a - b);
    const waypoints = sorted.map(([, v]) => v.waypoint);
    const lastEntry = sorted[sorted.length - 1][1].entry;

    paths.push({
      macAddress: mac,
      waypoints,
      threatLevel: lastEntry.threatLevel,
      signalType: lastEntry.signalType,
      confidence: lastEntry.confidence,
    });
  }

  return paths;
}

/**
 * Interpolate a device's position along its waypoint path at the given
 * effective time (minuteIndex + progress).
 */
function interpolatePosition(
  waypoints: Waypoint[],
  effectiveTime: number
): LatLng {
  if (waypoints.length === 1) {
    return { lat: waypoints[0].lat, lng: waypoints[0].lng };
  }

  // Find the segment: latest waypoint at or before effectiveTime
  let segIdx = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    if (effectiveTime >= waypoints[i].minuteIndex) {
      segIdx = i;
    }
  }

  const w1 = waypoints[segIdx];
  const w2 = waypoints[Math.min(segIdx + 1, waypoints.length - 1)];

  // If past the last waypoint or same-minute (shouldn't happen after dedup), hold
  if (w1 === w2 || w1.minuteIndex === w2.minuteIndex) {
    return { lat: w1.lat, lng: w1.lng };
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      (effectiveTime - w1.minuteIndex) / (w2.minuteIndex - w1.minuteIndex)
    )
  );

  const p0 = waypoints[Math.max(0, segIdx - 1)];
  const p3 = waypoints[Math.min(waypoints.length - 1, segIdx + 2)];

  return catmullRomPoint(p0, w1, w2, p3, t);
}

export const THREAT_COLORS: Record<string, string> = {
  critical: '#B84A42',
  high: '#C47F30',
  medium: '#C9A030',
  low: '#5A8A5A',
};

/**
 * Hook that provides interpolated device positions and trail lines
 * for the replay map.
 */
export function useReplayPath(
  buckets: Map<number, BucketEntry[]>,
  minuteIndex: number,
  progress: number
) {
  // Rebuild device paths when the minute changes (includes lookahead)
  const devicePaths = useMemo(
    () => buildDevicePaths(buckets, minuteIndex),
    [buckets, minuteIndex]
  );

  const effectiveTime = minuteIndex + progress;

  // Interpolated marker positions — updates every frame via progress.
  // Suppresses devices whose first waypoint is after effectiveTime
  // (the lookahead can include future-only devices that shouldn't render yet).
  const interpolatedDevices: InterpolatedDevice[] = useMemo(() => {
    return devicePaths
      .filter(path => path.waypoints[0].minuteIndex <= effectiveTime)
      .map(path => {
        const pos = interpolatePosition(path.waypoints, effectiveTime);
        return {
          macAddress: path.macAddress,
          latitude: pos.lat,
          longitude: pos.lng,
          threatLevel: path.threatLevel,
          signalType: path.signalType,
          confidence: path.confidence,
        };
      });
  }, [devicePaths, effectiveTime]);

  // Trail lines — includes head clipped to current interpolated position.
  // Same future-device guard: only devices with first waypoint <= effectiveTime.
  const trailLines: TrailLine[] = useMemo(() => {
    return devicePaths
      .filter(
        path =>
          path.waypoints.length >= 2 &&
          path.waypoints[0].minuteIndex <= effectiveTime
      )
      .map(path => {
        // Only include waypoints up to the current effective time for the trail
        const trailWaypoints = path.waypoints.filter(
          w => w.minuteIndex <= effectiveTime
        );
        if (trailWaypoints.length < 2) {
          // Not enough waypoints for a line yet
          return null;
        }

        // Generate spline through trail waypoints
        const splinePoints = generateSplinePoints(
          trailWaypoints,
          SAMPLES_PER_SEGMENT
        );

        // Append current interpolated head position
        const headPos = interpolatePosition(path.waypoints, effectiveTime);
        splinePoints.push(headPos);

        return {
          macAddress: path.macAddress,
          coordinates: splinePoints.map(
            p => [p.lng, p.lat] as [number, number]
          ),
          threatLevel: path.threatLevel,
        };
      })
      .filter((t): t is TrailLine => t !== null);
  }, [devicePaths, effectiveTime]);

  return { interpolatedDevices, trailLines, THREAT_COLORS };
}
```

- [ ] **Step 2: Verify no new type errors**

Run: `npx tsc --noEmit 2>&1 | grep useReplayPath || echo "PASS: no errors from useReplayPath"`
Expected: Prints "PASS: no errors from useReplayPath" (grep exits 1 on no matches, `||` catches it).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useReplayPath.ts
git commit -m "feat(replay): add useReplayPath hook for smooth interpolation

Builds per-device waypoint lists with lookahead and dedup,
interpolates positions via Catmull-Rom, generates trail lines
clipped to current head position."
```

---

### Task 4: Integrate Smooth Replay into ProximityHeatmapScreen

**Files:**
- Modify: `src/screens/radar/ProximityHeatmapScreen.tsx`

- [ ] **Step 1: Add imports**

At the top of `ProximityHeatmapScreen.tsx`, add after the existing imports:

```typescript
import { useReplayPath, THREAT_COLORS } from '@hooks/useReplayPath';
import { isDemoOrMockMode } from '@/config/demoModeRuntime';
```

- [ ] **Step 2: Add the useReplayPath hook call**

After the `currentReplayEntries` useMemo block (around line 358), add:

```typescript
const smoothMode = isDemoOrMockMode();
const {
  interpolatedDevices,
  trailLines,
} = useReplayPath(
  bucketed.buckets,
  autoPlay.minuteIndex,
  autoPlay.progress
);
```

- [ ] **Step 3: Replace replay marker rendering with interpolated positions**

In the replay MapView JSX (around lines 620-632), replace the `currentReplayEntries.map` block with:

```tsx
{(smoothMode ? interpolatedDevices : currentReplayEntries).map(
  (entry, i) => (
    <DetectedDeviceMarker
      key={`${entry.macAddress}-${i}`}
      id={`replay-${entry.macAddress}-${i}`}
      coordinate={[entry.longitude, entry.latitude]}
      signalType={entry.signalType}
      confidence={entry.confidence}
      onPress={() => {
        autoPlay.pause();
        setPeekMac(entry.macAddress);
      }}
    />
  )
)}
```

- [ ] **Step 4: Add trail line rendering with lineGradient**

Inside the replay `<MapView>`, after the `<TrailSenseDeviceMarker>` and before the marker map, add the trail lines:

```tsx
{smoothMode &&
  trailLines.map(trail => (
    <Mapbox.ShapeSource
      key={`trail-${trail.macAddress}`}
      id={`trail-${trail.macAddress}`}
      lineMetrics={true}
      shape={{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: trail.coordinates,
        },
      }}
    >
      <Mapbox.LineLayer
        id={`trail-line-${trail.macAddress}`}
        style={{
          lineColor:
            THREAT_COLORS[trail.threatLevel] ||
            THREAT_COLORS.medium,
          lineWidth: 2.5,
          lineGradient: [
            'interpolate',
            ['linear'],
            ['line-progress'],
            0, 'rgba(0, 0, 0, 0)',
            0.4, THREAT_COLORS[trail.threatLevel] || THREAT_COLORS.medium,
            1, THREAT_COLORS[trail.threatLevel] || THREAT_COLORS.medium,
          ],
          lineCap: 'round' as const,
          lineJoin: 'round' as const,
        }}
      />
    </Mapbox.ShapeSource>
  ))}
```

Note: `lineMetrics={true}` on `ShapeSource` is required for `lineGradient` to work. The gradient fades from transparent at the tail (line-progress 0) to full color at 40% through the line, giving a natural fade-out effect.

- [ ] **Step 5: Verify no new type errors**

Run: `npx tsc --noEmit 2>&1 | grep ProximityHeatmapScreen || echo "PASS: no errors from ProximityHeatmapScreen"`
Expected: Prints "PASS: no errors from ProximityHeatmapScreen" (grep exits 1 on no matches, `||` catches it).

- [ ] **Step 6: Manual verification**

Start the app with `npm start`, navigate to a device's Proximity Heatmap, switch to Replay mode, and press play:

1. Markers should slide smoothly between positions instead of jumping
2. A colored trail line should appear behind each device, fading toward the tail
3. The trail head should follow the marker's interpolated position
4. Scrubbing the timeline should snap to the start of each minute
5. All playback speeds (1x, 10x, 60x, 360x) should produce smooth animation — at 360x, the effective speed should be ~6 hours per second, not capped at 1 minute per frame

- [ ] **Step 7: Commit**

```bash
git add src/screens/radar/ProximityHeatmapScreen.tsx
git commit -m "feat(replay): render smooth paths and trail lines in demo mode

In demo/mock mode, device markers interpolate smoothly between
positions using Catmull-Rom splines. Trail lines render with
lineGradient fading toward the tail. Real API mode keeps the
original discrete rendering."
```
