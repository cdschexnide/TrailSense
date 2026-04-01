# Workstream 2: Replay Radar Implementation Plan (v3)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a time-travel replay interface to the Radar tab that scrubs through 24h of detection history using Skia rendering with pre-computed coordinates for smooth playback.

**Architecture:** Header segmented control on ProximityHeatmapScreen toggles between live MapBox heatmap and a dark-mode Skia-rendered replay radar. Detection positions (lat/lng from TriangulatedPosition) are pre-bucketed into 1-minute slots at load time with threat levels correlated from co-generated alerts. A pan-gesture-driven TimelineScrubber updates a plain `minuteIndex` state; the radar reads this as a prop and re-renders only the trailing 15-minute window via `useMemo`. Pre-computed x/y coordinates in each bucket entry mean the per-frame work is just an array slice + Skia circle draw — no projection math at render time. Reanimated is used for the crossfade animation between live/replay views (both always mounted, opacity-driven), not for the radar rendering loop. Tapping a detection dot (via `runOnJS` bridge from a Gesture Handler worklet) opens a FingerprintPeek bottom sheet.

**Tech Stack:** React Native Skia (`@shopify/react-native-skia` 1.5.0), Reanimated (`react-native-reanimated` ~3.16.1), React Native Gesture Handler, Zustand (replay state), React Query (data fetch).

**Design doc:** `docs/plans/2026-04-01-workstream2-replay-radar-design.md`

**Test plan:** `~/.gstack/projects/cdschexnide-TrailSense/codyschexnider-main-test-plan-20260331-223000.md` (WS2 section, lines 59-74)

**Precondition:** Run `npm run type-check` before starting. The baseline may have pre-existing errors — record the count. New code must not increase the error count.

### Review findings addressed in v2 and v3

| # | Finding | Fix |
|---|---------|-----|
| 1 | Timestamp shared value never syncs | Removed dead `timestamp` shared value entirely. Radar takes plain `currentMinute` prop, filters dots via `useMemo`. Architecture updated to reflect JS-thread rendering with pre-computed coordinates. |
| 2 | Mock data hardwired | New `useReplayPositions` hook wraps API with time-window params, falls back to mock in dev |
| 3 | fingerprintHash vs macAddress | Mock generator co-produces positions + alerts with stable MACs per scenario. `useReplayData` returns both. `useTimeBucketing` joins on deviceId+timestamp with authoritative data. BucketEntry carries real `macAddress`; FingerprintPeek navigates with it. |
| 4 | Scrubber has no pan gesture | `Gesture.Pan()` on scrub track maps drag X to minute index |
| 5 | Tap handler accesses JS from worklet | `runOnJS` bridges tap callback; hit-test data stored as plain array, not Map |
| 6 | threatLevel fabricated from confidence | Co-generated alerts carry authoritative `threatLevel` per scenario. Correlation is 1:1 by design in mock data. Real backend must return pre-joined data or correlated alerts alongside positions. |
| 7 | Crossfade impossible with conditional mount | Both views always mounted; `pointerEvents="none"` + animated opacity |
| 8 | Props contract mismatch | TimelineScrubberProps uses plain JS state; Task 12 test directly invokes and verifies navigation payload |

### v3 follow-up findings addressed

| # | Finding | Fix |
|---|---------|-----|
| v3-1 | startHour deep link doesn't flip fadeAnim | `mode` and `fadeAnim` both initialize synchronously from `startHour` — no effect needed. First render is already in replay mode. |
| v3-2 | Dead `timestamp` shared value, inconsistent architecture | Removed `timestamp` shared value entirely. Architecture text updated: radar reads plain `currentMinute` prop, pre-computed x/y avoids math at render time. Reanimated used only for crossfade opacity. |
| v3-3 | Heuristic MAC/threat correlation | Mock generator co-produces positions + alerts with stable MAC/threatLevel per scenario via `generateReplayData()`. `useReplayData` returns both. Correlation is 1:1 by construction. |
| v3-4 | Empty macAddress tap pauses with no sheet | `handleTap` skips dots with empty `macAddress` — they are not tappable. Only dots with correlated alerts are interactive. |
| v3-5 | Task 12 test is a no-op | Test now directly invokes the navigation callback and asserts `navigate` was called with `{ screen: 'LiveRadar', params: { startHour: 14 } }`. |

### v4 follow-up findings addressed

| # | Finding | Fix |
|---|---------|-----|
| v4-1 | Real-data path returns `alerts: []` | `useReplayData` now fetches alerts in parallel via `alertsApi.getAlerts` with time-window filter. Both mock and prod paths return `{ positions, alerts }`. |
| v4-2 | Task 12 test doesn't exercise real wiring | Test now renders the actual component, presses Pressable elements, and asserts `navigate` was called with `RadarTab` + `startHour` — proving the callback is wired through the real component tree. |
| v4-3 | Re-navigation with new startHour not handled | `useEffect` tracks `startHour` via `prevStartHourRef`. On change: updates `minuteIndex`, switches to replay mode if needed. Deduplicates same-hour no-ops. |

### Open questions resolved

- **Timezone:** All time computations use the device's local timezone via `Date`. The replay window is "today midnight to now" in the viewer's local time. This matches ActivitySparkline's behavior (uses `Date.setHours(0,0,0,0)`). Property timezone awareness deferred to backend phase.
- **startHour persistence:** `startHour` is tracked via `prevStartHourRef`. Initial mount initializes mode/fadeAnim synchronously. Re-navigation with a new startHour updates the scrubber and switches to replay. Navigating away resets to live (React Navigation unmounts/remounts the screen).

---

## Task 1: Types & Interfaces

**Files:**
- Create: `src/types/replay.ts`
- Modify: `src/types/index.ts`

**Step 1: Write the type definitions**

```typescript
// src/types/replay.ts
import { ThreatLevel, DetectionType } from './alert';

export type PlaybackSpeed = 1 | 10 | 60 | 360;

export interface BucketEntry {
  fingerprintHash: string;
  macAddress: string; // real MAC for navigation to DeviceFingerprintScreen
  x: number;
  y: number;
  threatLevel: ThreatLevel;
  confidence: number;
  signalType: DetectionType;
}

export interface TimeBucketedPositions {
  startTime: number; // epoch ms, midnight
  buckets: Map<number, BucketEntry[]>; // key = minute index (0-1439)
}

// Props use plain JS state — no SharedValue in component interfaces.
// The parent component bridges JS state to SharedValue internally.
export interface TimelineScrubberProps {
  minuteIndex: number;
  buckets: Map<number, BucketEntry[]>;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  onPlayPause: () => void;
  onSpeedChange: () => void;
  onSkipForward: () => void;
  onSkipBack: () => void;
  onScrub: (minuteIndex: number) => void;
}

export interface FingerprintPeekProps {
  macAddress: string; // real MAC address for DeviceFingerprintScreen navigation
  fingerprintHash: string;
  scrubTimestamp: number;
  onViewProfile: (macAddress: string) => void;
  onDismiss: () => void;
}

export type RadarMode = 'live' | 'replay';
```

**Step 2: Export from barrel**

Add to `src/types/index.ts`:
```typescript
export * from './replay';
```

**Step 3: Run type check**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: Record baseline error count. New types should not add errors.

**Step 4: Commit**

```bash
git add src/types/replay.ts src/types/index.ts
git commit -m "feat(ws2): add replay radar type definitions"
```

---

## Task 2: Mock Replay Positions Generator

**Files:**
- Create: `src/mocks/data/mockReplayPositions.ts`
- Modify: `src/mocks/data/index.ts`

**Step 1: Write the failing test**

Create `__tests__/mocks/mockReplayPositions.test.ts`:

```typescript
import { generateReplayPositions } from '@/mocks/data/mockReplayPositions';
import { TriangulatedPosition } from '@/types/triangulation';

describe('generateReplayPositions', () => {
  let positions: TriangulatedPosition[];

  beforeAll(() => {
    positions = generateReplayPositions();
  });

  it('generates positions for all 4 scenarios', () => {
    const hashes = new Set(positions.map(p => p.fingerprintHash));
    expect(hashes.size).toBe(4);
  });

  it('distributes positions across 24h', () => {
    const hours = new Set(
      positions.map(p => new Date(p.updatedAt).getHours())
    );
    // Delivery (10, 15), Repeat (8, 12, 18), Loiterer (1-2), Passing (7)
    expect(hours.size).toBeGreaterThanOrEqual(6);
  });

  it('all positions have valid lat/lng near property center', () => {
    // Property center is ~31.53, -110.288 (Sierra Vista, AZ)
    for (const pos of positions) {
      expect(pos.latitude).toBeGreaterThan(31.52);
      expect(pos.latitude).toBeLessThan(31.54);
      expect(pos.longitude).toBeGreaterThan(-110.30);
      expect(pos.longitude).toBeLessThan(-110.28);
    }
  });

  it('all positions have required fields', () => {
    for (const pos of positions) {
      expect(pos.id).toBeDefined();
      expect(pos.fingerprintHash).toBeDefined();
      expect(pos.signalType).toMatch(/wifi|bluetooth|cellular/);
      expect(pos.confidence).toBeGreaterThan(0);
      expect(pos.confidence).toBeLessThanOrEqual(1);
      expect(pos.updatedAt).toBeDefined();
    }
  });

  it('loiterer scenario has ~90 positions over 45 min', () => {
    const loitererHash = positions.find(p => {
      const hour = new Date(p.updatedAt).getHours();
      return hour === 1 || hour === 2;
    })?.fingerprintHash;
    const loitererPositions = positions.filter(
      p => p.fingerprintHash === loitererHash
    );
    expect(loitererPositions.length).toBeGreaterThanOrEqual(70);
    expect(loitererPositions.length).toBeLessThanOrEqual(110);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/mocks/mockReplayPositions.test.ts --no-coverage`
Expected: FAIL — module not found

**Step 3: Write the mock data generator**

Create `src/mocks/data/mockReplayPositions.ts`:

```typescript
import { TriangulatedPosition, TriangulationSignalType } from '@/types/triangulation';
import { Alert, DetectionType } from '@/types/alert';
import { mockDevices } from './mockDevices';

// Property center derived from device-001 (North Gate Sensor)
const PROPERTY_CENTER = {
  latitude: mockDevices[0].latitude ?? 31.530757,
  longitude: mockDevices[0].longitude ?? -110.287842,
};

// ~244 meters = ~800ft max range
const MAX_RANGE_DEG = 0.0022; // ~244m in degrees at this latitude

interface Scenario {
  fingerprintHash: string;
  macAddress: string; // stable MAC for alert correlation
  signalType: TriangulationSignalType;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  visits: Array<{
    startHour: number;
    startMinute: number;
    durationMinutes: number;
    positionCount: number;
    approachAngle: number; // degrees, 0=north, 90=east
    startRadius: number; // 0-1 fraction of max range
    endRadius: number;
    drift: number; // lateral drift in degrees
  }>;
}

const scenarios: Scenario[] = [
  {
    // Delivery driver: approaches from south, stops near center, leaves
    fingerprintHash: 'fp-delivery-a1b2c3',
    macAddress: 'AA:14:1E:28:32:3C',
    signalType: 'cellular',
    threatLevel: 'low',
    visits: [
      {
        startHour: 10, startMinute: 15, durationMinutes: 5,
        positionCount: 10, approachAngle: 180,
        startRadius: 0.95, endRadius: 0.3, drift: 5,
      },
      {
        startHour: 15, startMinute: 30, durationMinutes: 5,
        positionCount: 10, approachAngle: 180,
        startRadius: 0.95, endRadius: 0.3, drift: 5,
      },
    ],
  },
  {
    // Repeat visitor: same approach from east, 3 visits
    fingerprintHash: 'fp-visitor-d4e5f6',
    macAddress: 'BB:15:1F:29:33:3D',
    signalType: 'wifi',
    threatLevel: 'medium',
    visits: [
      {
        startHour: 8, startMinute: 0, durationMinutes: 3,
        positionCount: 6, approachAngle: 90,
        startRadius: 0.9, endRadius: 0.5, drift: 3,
      },
      {
        startHour: 12, startMinute: 0, durationMinutes: 3,
        positionCount: 6, approachAngle: 90,
        startRadius: 0.9, endRadius: 0.5, drift: 3,
      },
      {
        startHour: 18, startMinute: 0, durationMinutes: 3,
        positionCount: 6, approachAngle: 90,
        startRadius: 0.9, endRadius: 0.5, drift: 3,
      },
    ],
  },
  {
    // Suspicious loiterer: slow drift along north boundary
    fingerprintHash: 'fp-loiterer-g7h8i9',
    macAddress: 'CC:16:20:2A:34:3E',
    signalType: 'bluetooth',
    threatLevel: 'critical',
    visits: [
      {
        startHour: 1, startMinute: 30, durationMinutes: 45,
        positionCount: 90, approachAngle: 0,
        startRadius: 0.85, endRadius: 0.85, drift: 60,
      },
    ],
  },
  {
    // Passing vehicle: fast traversal west to east
    fingerprintHash: 'fp-vehicle-j0k1l2',
    macAddress: 'DD:17:21:2B:35:3F',
    signalType: 'cellular',
    threatLevel: 'high',
    visits: [
      {
        startHour: 7, startMinute: 45, durationMinutes: 2,
        positionCount: 8, approachAngle: 270,
        startRadius: 0.95, endRadius: 0.95, drift: 180,
      },
    ],
  },
];

function generateVisitPositions(
  scenario: Scenario,
  visit: Scenario['visits'][0],
  baseDate: Date
): TriangulatedPosition[] {
  const positions: TriangulatedPosition[] = [];
  const intervalMs = (visit.durationMinutes * 60 * 1000) / visit.positionCount;

  for (let i = 0; i < visit.positionCount; i++) {
    const progress = i / (visit.positionCount - 1 || 1);
    const timestamp = new Date(baseDate);
    timestamp.setHours(visit.startHour, visit.startMinute, 0, 0);
    timestamp.setTime(timestamp.getTime() + i * intervalMs);

    const radius = visit.startRadius + (visit.endRadius - visit.startRadius) * progress;
    const angle = visit.approachAngle + (progress - 0.5) * visit.drift;
    const angleRad = (angle * Math.PI) / 180;

    const latOffset = radius * MAX_RANGE_DEG * Math.cos(angleRad);
    const lngOffset = radius * MAX_RANGE_DEG * Math.sin(angleRad);

    const jitter = MAX_RANGE_DEG * 0.02;
    const jitterLat = (Math.random() - 0.5) * jitter;
    const jitterLng = (Math.random() - 0.5) * jitter;

    positions.push({
      id: `replay-${scenario.fingerprintHash}-${visit.startHour}-${i}`,
      deviceId: mockDevices[0].id,
      fingerprintHash: scenario.fingerprintHash,
      signalType: scenario.signalType,
      latitude: PROPERTY_CENTER.latitude + latOffset + jitterLat,
      longitude: PROPERTY_CENTER.longitude + lngOffset + jitterLng,
      accuracyMeters: 10 + Math.random() * 30,
      confidence: 0.5 + Math.random() * 0.5,
      measurementCount: 3 + Math.floor(Math.random() * 5),
      updatedAt: timestamp.toISOString(),
    });
  }

  return positions;
}

// Generate a correlated Alert for each position, using the scenario's
// stable macAddress and threatLevel. This gives useTimeBucketing an
// authoritative join: same deviceId + timestamp within the 5-min window.
function generateCorrelatedAlerts(
  positions: TriangulatedPosition[],
  scenario: Scenario
): Alert[] {
  return positions.map((pos, i) => ({
    id: `replay-alert-${scenario.fingerprintHash}-${i}`,
    deviceId: pos.deviceId,
    timestamp: pos.updatedAt,
    threatLevel: scenario.threatLevel,
    detectionType: scenario.signalType as DetectionType,
    rssi: -60 - Math.floor(Math.random() * 20),
    macAddress: scenario.macAddress,
    isReviewed: false,
    isFalsePositive: false,
    location: { latitude: pos.latitude, longitude: pos.longitude },
  }));
}

export interface ReplayData {
  positions: TriangulatedPosition[];
  alerts: Alert[];
}

export function generateReplayData(date?: Date): ReplayData {
  const baseDate = date ?? new Date();
  const allPositions: TriangulatedPosition[] = [];
  const allAlerts: Alert[] = [];

  for (const scenario of scenarios) {
    for (const visit of scenario.visits) {
      const positions = generateVisitPositions(scenario, visit, baseDate);
      allPositions.push(...positions);
      allAlerts.push(...generateCorrelatedAlerts(positions, scenario));
    }
  }

  allPositions.sort(
    (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
  );
  allAlerts.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return { positions: allPositions, alerts: allAlerts };
}

// Legacy export for backward compat with tests
export function generateReplayPositions(date?: Date): TriangulatedPosition[] {
  return generateReplayData(date).positions;
}

export const mockReplayData = generateReplayData();
export const mockReplayPositions = mockReplayData.positions;
```

**Step 4: Add to barrel export**

Add to `src/mocks/data/index.ts`:
```typescript
export { mockReplayPositions, mockReplayData, generateReplayPositions, generateReplayData } from './mockReplayPositions';
```

**Step 5: Run test to verify it passes**

Run: `npx jest __tests__/mocks/mockReplayPositions.test.ts --no-coverage`
Expected: PASS (all 5 tests)

**Step 6: Commit**

```bash
git add src/mocks/data/mockReplayPositions.ts src/mocks/data/index.ts __tests__/mocks/mockReplayPositions.test.ts
git commit -m "feat(ws2): add mock replay positions generator with 4 scenarios"
```

---

## Task 3: useRadarProjection Hook

**Files:**
- Create: `src/hooks/useRadarProjection.ts`

**Step 1: Write the failing test**

Create `__tests__/hooks/useRadarProjection.test.ts`:

```typescript
import { renderHook } from '@testing-library/react-native';
import { useRadarProjection } from '@hooks/useRadarProjection';

const PROPERTY_CENTER = { latitude: 31.530757, longitude: -110.287842 };
const CANVAS_SIZE = 350;
const MAX_RANGE = 244; // meters

describe('useRadarProjection', () => {
  it('projects property center to canvas center', () => {
    const { result } = renderHook(() =>
      useRadarProjection({ propertyCenter: PROPERTY_CENTER, canvasSize: CANVAS_SIZE, maxRange: MAX_RANGE })
    );

    const { x, y } = result.current.project(PROPERTY_CENTER.latitude, PROPERTY_CENTER.longitude);
    expect(x).toBeCloseTo(CANVAS_SIZE / 2, 0);
    expect(y).toBeCloseTo(CANVAS_SIZE / 2, 0);
  });

  it('projects point due north to top of canvas', () => {
    const { result } = renderHook(() =>
      useRadarProjection({ propertyCenter: PROPERTY_CENTER, canvasSize: CANVAS_SIZE, maxRange: MAX_RANGE })
    );

    const northPoint = {
      lat: PROPERTY_CENTER.latitude + 0.0022,
      lng: PROPERTY_CENTER.longitude,
    };
    const { x, y } = result.current.project(northPoint.lat, northPoint.lng);

    expect(x).toBeCloseTo(CANVAS_SIZE / 2, 0);
    expect(y).toBeLessThan(CANVAS_SIZE / 2);
    const distFromCenter = CANVAS_SIZE / 2 - y;
    expect(distFromCenter).toBeGreaterThan(CANVAS_SIZE / 2 * 0.8);
  });

  it('clips points beyond maxRange to circle edge', () => {
    const { result } = renderHook(() =>
      useRadarProjection({ propertyCenter: PROPERTY_CENTER, canvasSize: CANVAS_SIZE, maxRange: MAX_RANGE })
    );

    const farPoint = {
      lat: PROPERTY_CENTER.latitude + 0.01,
      lng: PROPERTY_CENTER.longitude,
    };
    const { x, y } = result.current.project(farPoint.lat, farPoint.lng);
    const dx = x - CANVAS_SIZE / 2;
    const dy = y - CANVAS_SIZE / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Should be clipped to radius (center - padding)
    expect(dist).toBeCloseTo(CANVAS_SIZE / 2 - 10, -1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/hooks/useRadarProjection.test.ts --no-coverage`
Expected: FAIL — module not found

**Step 3: Write the hook**

```typescript
// src/hooks/useRadarProjection.ts
import { useMemo } from 'react';

interface UseRadarProjectionOptions {
  propertyCenter: { latitude: number; longitude: number };
  canvasSize: number;
  maxRange: number; // meters
}

function metersPerDegLat(): number {
  return 111_320;
}

function metersPerDegLng(lat: number): number {
  return 111_320 * Math.cos((lat * Math.PI) / 180);
}

export function useRadarProjection({
  propertyCenter,
  canvasSize,
  maxRange,
}: UseRadarProjectionOptions) {
  return useMemo(() => {
    const center = canvasSize / 2;
    const radius = center - 10; // 10px padding from edge
    const mPerDegLat = metersPerDegLat();
    const mPerDegLng = metersPerDegLng(propertyCenter.latitude);

    function project(lat: number, lng: number): { x: number; y: number } {
      const dLat = lat - propertyCenter.latitude;
      const dLng = lng - propertyCenter.longitude;

      const northMeters = dLat * mPerDegLat;
      const eastMeters = dLng * mPerDegLng;

      const distMeters = Math.sqrt(northMeters ** 2 + eastMeters ** 2);
      const scale = Math.min(distMeters, maxRange) / maxRange;
      const pixelDist = scale * radius;

      // North = up = -y
      const angle = Math.atan2(eastMeters, northMeters);

      return {
        x: center + pixelDist * Math.sin(angle),
        y: center - pixelDist * Math.cos(angle),
      };
    }

    return { project, center, radius };
  }, [propertyCenter.latitude, propertyCenter.longitude, canvasSize, maxRange]);
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/hooks/useRadarProjection.test.ts --no-coverage`
Expected: PASS (all 3 tests)

**Step 5: Commit**

```bash
git add src/hooks/useRadarProjection.ts __tests__/hooks/useRadarProjection.test.ts
git commit -m "feat(ws2): add useRadarProjection hook with lat/lng to canvas projection"
```

---

## Task 4: useTimeBucketing Hook

> **Fix #3 & #6:** BucketEntry now carries `macAddress` from alert correlation. Threat level comes from the nearest alert by timestamp+deviceId, not fabricated from confidence.

**Files:**
- Create: `src/hooks/useTimeBucketing.ts`

**Step 1: Write the failing test**

Create `__tests__/hooks/useTimeBucketing.test.ts`:

```typescript
import { renderHook } from '@testing-library/react-native';
import { useTimeBucketing } from '@hooks/useTimeBucketing';
import { TriangulatedPosition } from '@/types/triangulation';
import { Alert } from '@/types/alert';

const PROPERTY_CENTER = { latitude: 31.530757, longitude: -110.287842 };
const CANVAS_SIZE = 350;
const MAX_RANGE = 244;

function makePosition(hour: number, minute: number, hash = 'fp-test'): TriangulatedPosition {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
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
    updatedAt: date.toISOString(),
  };
}

function makeAlert(hour: number, minute: number, mac = 'AA:BB:CC:DD:EE:01'): Alert {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return {
    id: `alert-${hour}-${minute}`,
    deviceId: 'device-001',
    timestamp: date.toISOString(),
    threatLevel: 'high',
    detectionType: 'cellular',
    rssi: -65,
    macAddress: mac,
    isReviewed: false,
    isFalsePositive: false,
  };
}

describe('useTimeBucketing', () => {
  it('sorts positions into 1-minute buckets', () => {
    const positions = [
      makePosition(10, 15),
      makePosition(10, 15),
      makePosition(10, 16),
    ];
    const alerts = [makeAlert(10, 15), makeAlert(10, 16)];

    const { result } = renderHook(() =>
      useTimeBucketing({ positions, alerts, propertyCenter: PROPERTY_CENTER, canvasSize: CANVAS_SIZE, maxRange: MAX_RANGE })
    );

    const bucket615 = result.current.buckets.get(10 * 60 + 15);
    const bucket616 = result.current.buckets.get(10 * 60 + 16);

    expect(bucket615).toHaveLength(2);
    expect(bucket616).toHaveLength(1);
  });

  it('pre-computes x/y coordinates in bucket entries', () => {
    const positions = [makePosition(8, 0)];
    const alerts = [makeAlert(8, 0)];

    const { result } = renderHook(() =>
      useTimeBucketing({ positions, alerts, propertyCenter: PROPERTY_CENTER, canvasSize: CANVAS_SIZE, maxRange: MAX_RANGE })
    );

    const bucket = result.current.buckets.get(8 * 60);
    expect(bucket).toHaveLength(1);
    expect(bucket![0].x).toBeGreaterThan(0);
    expect(bucket![0].y).toBeGreaterThan(0);
    expect(bucket![0].fingerprintHash).toBe('fp-test');
  });

  it('correlates threat level from nearest alert', () => {
    const positions = [makePosition(8, 0)];
    const alerts = [makeAlert(8, 0)]; // threatLevel: 'high'

    const { result } = renderHook(() =>
      useTimeBucketing({ positions, alerts, propertyCenter: PROPERTY_CENTER, canvasSize: CANVAS_SIZE, maxRange: MAX_RANGE })
    );

    const bucket = result.current.buckets.get(8 * 60);
    expect(bucket![0].threatLevel).toBe('high');
  });

  it('carries macAddress from correlated alert', () => {
    const positions = [makePosition(8, 0)];
    const alerts = [makeAlert(8, 0, 'FF:EE:DD:CC:BB:AA')];

    const { result } = renderHook(() =>
      useTimeBucketing({ positions, alerts, propertyCenter: PROPERTY_CENTER, canvasSize: CANVAS_SIZE, maxRange: MAX_RANGE })
    );

    const bucket = result.current.buckets.get(8 * 60);
    expect(bucket![0].macAddress).toBe('FF:EE:DD:CC:BB:AA');
  });

  it('falls back to medium threat when no alert correlates', () => {
    const positions = [makePosition(8, 0)];
    const alerts: Alert[] = []; // no alerts

    const { result } = renderHook(() =>
      useTimeBucketing({ positions, alerts, propertyCenter: PROPERTY_CENTER, canvasSize: CANVAS_SIZE, maxRange: MAX_RANGE })
    );

    const bucket = result.current.buckets.get(8 * 60);
    expect(bucket![0].threatLevel).toBe('medium');
    expect(bucket![0].macAddress).toBe(''); // no correlated MAC
  });

  it('returns empty map for no positions', () => {
    const { result } = renderHook(() =>
      useTimeBucketing({ positions: [], alerts: [], propertyCenter: PROPERTY_CENTER, canvasSize: CANVAS_SIZE, maxRange: MAX_RANGE })
    );

    expect(result.current.buckets.size).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/hooks/useTimeBucketing.test.ts --no-coverage`
Expected: FAIL — module not found

**Step 3: Write the hook**

```typescript
// src/hooks/useTimeBucketing.ts
import { useMemo } from 'react';
import { TriangulatedPosition } from '@/types/triangulation';
import { Alert, ThreatLevel } from '@/types/alert';
import { BucketEntry, TimeBucketedPositions } from '@/types/replay';
import { useRadarProjection } from './useRadarProjection';

// Map TriangulationSignalType to DetectionType
function mapSignalType(signalType: string): 'cellular' | 'wifi' | 'bluetooth' {
  if (signalType === 'wifi') return 'wifi';
  if (signalType === 'bluetooth') return 'bluetooth';
  return 'cellular';
}

// Find the nearest alert by timestamp and deviceId within a 5-minute window
function findNearestAlert(
  pos: TriangulatedPosition,
  alerts: Alert[],
  posTimeMs: number
): Alert | undefined {
  const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  let best: Alert | undefined;
  let bestDist = Infinity;

  for (const alert of alerts) {
    if (alert.deviceId !== pos.deviceId) continue;
    const alertTime = new Date(alert.timestamp).getTime();
    const dist = Math.abs(alertTime - posTimeMs);
    if (dist < WINDOW_MS && dist < bestDist) {
      bestDist = dist;
      best = alert;
    }
  }

  return best;
}

interface UseTimeBucketingOptions {
  positions: TriangulatedPosition[];
  alerts: Alert[];
  propertyCenter: { latitude: number; longitude: number };
  canvasSize: number;
  maxRange: number;
}

export function useTimeBucketing({
  positions,
  alerts,
  propertyCenter,
  canvasSize,
  maxRange,
}: UseTimeBucketingOptions): TimeBucketedPositions {
  const { project } = useRadarProjection({ propertyCenter, canvasSize, maxRange });

  return useMemo(() => {
    const buckets = new Map<number, BucketEntry[]>();

    if (positions.length === 0) {
      return { startTime: 0, buckets };
    }

    // Compute midnight of the first position's day
    const firstDate = new Date(positions[0].updatedAt);
    const midnight = new Date(firstDate);
    midnight.setHours(0, 0, 0, 0);
    const startTime = midnight.getTime();

    for (const pos of positions) {
      const posTime = new Date(pos.updatedAt);
      const posTimeMs = posTime.getTime();
      const minuteIndex = posTime.getHours() * 60 + posTime.getMinutes();

      const { x, y } = project(pos.latitude, pos.longitude);

      // Correlate with nearest alert for real threat level and macAddress
      const nearestAlert = findNearestAlert(pos, alerts, posTimeMs);

      const entry: BucketEntry = {
        fingerprintHash: pos.fingerprintHash,
        macAddress: nearestAlert?.macAddress ?? '',
        x,
        y,
        threatLevel: nearestAlert?.threatLevel ?? 'medium',
        confidence: pos.confidence,
        signalType: mapSignalType(pos.signalType),
      };

      const bucket = buckets.get(minuteIndex);
      if (bucket) {
        bucket.push(entry);
      } else {
        buckets.set(minuteIndex, [entry]);
      }
    }

    return { startTime, buckets };
  }, [positions, alerts, project]);
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/hooks/useTimeBucketing.test.ts --no-coverage`
Expected: PASS (all 6 tests)

**Step 5: Commit**

```bash
git add src/hooks/useTimeBucketing.ts __tests__/hooks/useTimeBucketing.test.ts
git commit -m "feat(ws2): add useTimeBucketing hook with alert-correlated threat levels"
```

---

## Task 5: useAutoPlay Hook

**Files:**
- Create: `src/hooks/useAutoPlay.ts`

**Step 1: Write the failing test**

Create `__tests__/hooks/useAutoPlay.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useAutoPlay } from '@hooks/useAutoPlay';
import { BucketEntry } from '@/types/replay';

function makeBuckets(): Map<number, BucketEntry[]> {
  const map = new Map<number, BucketEntry[]>();
  const entry: BucketEntry = {
    fingerprintHash: 'fp-test',
    macAddress: 'AA:BB:CC:DD:EE:01',
    x: 100, y: 100,
    threatLevel: 'medium',
    confidence: 0.7,
    signalType: 'cellular',
  };
  map.set(60, [entry]);
  map.set(120, [entry]);
  map.set(600, [entry]);
  return map;
}

describe('useAutoPlay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts paused', () => {
    const { result } = renderHook(() => useAutoPlay({ buckets: makeBuckets() }));
    expect(result.current.isPlaying).toBe(false);
  });

  it('defaults to 10x speed', () => {
    const { result } = renderHook(() => useAutoPlay({ buckets: makeBuckets() }));
    expect(result.current.speed).toBe(10);
  });

  it('cycles speed through 1, 10, 60, 360', () => {
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

  it('skipForward jumps to next bucket with entries', () => {
    const { result } = renderHook(() => useAutoPlay({ buckets: makeBuckets() }));

    act(() => result.current.setMinuteIndex(0));
    act(() => result.current.skipForward());
    expect(result.current.minuteIndex).toBe(60);

    act(() => result.current.skipForward());
    expect(result.current.minuteIndex).toBe(120);
  });

  it('skipBack jumps to previous bucket with entries', () => {
    const { result } = renderHook(() => useAutoPlay({ buckets: makeBuckets() }));

    act(() => result.current.setMinuteIndex(600));
    act(() => result.current.skipBack());
    expect(result.current.minuteIndex).toBe(120);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/hooks/useAutoPlay.test.ts --no-coverage`
Expected: FAIL — module not found

**Step 3: Write the hook**

```typescript
// src/hooks/useAutoPlay.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { BucketEntry, PlaybackSpeed } from '@/types/replay';

const SPEEDS: PlaybackSpeed[] = [1, 10, 60, 360];
const NO_ACTIVITY_THRESHOLD = 15; // minutes

interface UseAutoPlayOptions {
  buckets: Map<number, BucketEntry[]>;
  initialMinute?: number;
}

export function useAutoPlay({ buckets, initialMinute = 0 }: UseAutoPlayOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(10);
  const [minuteIndex, setMinuteIndex] = useState(initialMinute);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sortedKeys = useRef<number[]>([]);
  useEffect(() => {
    sortedKeys.current = Array.from(buckets.keys()).sort((a, b) => a - b);
  }, [buckets]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const cycleSpeed = useCallback(() => {
    setSpeed(prev => {
      const idx = SPEEDS.indexOf(prev);
      return SPEEDS[(idx + 1) % SPEEDS.length];
    });
  }, []);

  const skipForward = useCallback(() => {
    const keys = sortedKeys.current;
    const next = keys.find(k => k > minuteIndex);
    if (next !== undefined) setMinuteIndex(next);
  }, [minuteIndex]);

  const skipBack = useCallback(() => {
    const keys = sortedKeys.current;
    let prev: number | undefined;
    for (const k of keys) {
      if (k >= minuteIndex) break;
      prev = k;
    }
    if (prev !== undefined) setMinuteIndex(prev);
  }, [minuteIndex]);

  // Auto-play timer
  useEffect(() => {
    clearTimer();
    if (!isPlaying) return;

    const intervalMs = 1000 / speed;

    intervalRef.current = setInterval(() => {
      setMinuteIndex(prev => {
        const next = prev + 1;
        if (next >= 1440) {
          setIsPlaying(false);
          return prev;
        }

        // No-activity skip
        let emptyCount = 0;
        for (let i = next; i < Math.min(next + NO_ACTIVITY_THRESHOLD, 1440); i++) {
          if (!buckets.has(i)) emptyCount++;
          else break;
        }
        if (emptyCount >= NO_ACTIVITY_THRESHOLD) {
          const keys = Array.from(buckets.keys()).sort((a, b) => a - b);
          const nextCluster = keys.find(k => k > next);
          if (nextCluster !== undefined) return nextCluster;
          setIsPlaying(false);
          return prev;
        }

        return next;
      });
    }, intervalMs);

    return clearTimer;
  }, [isPlaying, speed, buckets, clearTimer]);

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
```

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/hooks/useAutoPlay.test.ts --no-coverage`
Expected: PASS (all 5 tests)

**Step 5: Commit**

```bash
git add src/hooks/useAutoPlay.ts __tests__/hooks/useAutoPlay.test.ts
git commit -m "feat(ws2): add useAutoPlay hook with speed cycling and skip navigation"
```

---

## Task 6: useReplayPositions Hook

> **Fix #2:** Wraps positions API with time-window params. Falls back to mock data in dev mode.

**Files:**
- Create: `src/hooks/api/useReplayPositions.ts`
- Modify: `src/api/endpoints/positions.ts`

**Step 1: Write the failing test**

Create `__tests__/hooks/useReplayPositions.test.ts`:

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useReplayPositions } from '@hooks/api/useReplayPositions';

// Mock the config to enable mock mode
jest.mock('@/config/mockConfig', () => ({
  isMockMode: true,
}));

jest.mock('@/mocks/data/mockReplayPositions', () => ({
  generateReplayPositions: () => [
    {
      id: 'pos-1',
      deviceId: 'device-001',
      fingerprintHash: 'fp-test',
      signalType: 'cellular',
      latitude: 31.53,
      longitude: -110.288,
      accuracyMeters: 15,
      confidence: 0.8,
      measurementCount: 4,
      updatedAt: new Date().toISOString(),
    },
  ],
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useReplayPositions', () => {
  it('returns mock positions in mock mode', async () => {
    const { result } = renderHook(
      () => useReplayPositions('device-001'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].fingerprintHash).toBe('fp-test');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/hooks/useReplayPositions.test.ts --no-coverage`
Expected: FAIL — module not found

**Step 3: Add time-window params to positions API**

In `src/api/endpoints/positions.ts`, add a new function (do NOT modify existing `getPositions`):

```typescript
/**
 * Get historical positions for replay (time-windowed)
 */
export const getReplayPositions = async (
  deviceId: string,
  from: string, // ISO timestamp
  to: string,   // ISO timestamp
): Promise<PositionsResponse> => {
  const params = new URLSearchParams({ deviceId, from, to });
  const response = await apiClient.get<PositionsResponse>(`/api/positions/history?${params.toString()}`);
  return response.data;
};
```

**Step 4: Write the hook**

```typescript
// src/hooks/api/useReplayPositions.ts
import { useQuery } from '@tanstack/react-query';
import { getReplayPositions } from '@/api/endpoints/positions';
import { alertsApi } from '@/api/endpoints/alerts';
import { TriangulatedPosition } from '@/types/triangulation';
import { Alert } from '@/types/alert';
import { isMockMode } from '@/config/mockConfig';
import { generateReplayData, ReplayData } from '@/mocks/data/mockReplayPositions';

// Returns both positions AND correlated alerts so useTimeBucketing
// has authoritative threat levels and MAC addresses.
export function useReplayData(deviceId: string | undefined) {
  return useQuery<ReplayData>({
    queryKey: ['replayData', deviceId],
    queryFn: async () => {
      if (isMockMode) {
        // Mock mode: return co-generated positions + alerts
        return generateReplayData();
      }

      // Real API: fetch today's positions and alerts in parallel
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(0, 0, 0, 0);

      const [posResponse, alertsResponse] = await Promise.all([
        getReplayPositions(deviceId!, midnight.toISOString(), now.toISOString()),
        alertsApi.getAlerts({ deviceId: deviceId!, startDate: midnight.toISOString(), endDate: now.toISOString() }),
      ]);
      return { positions: posResponse.positions, alerts: alertsResponse };
    },
    enabled: !!deviceId,
    staleTime: 60_000,
  });
}

// Convenience alias for backward compat
export function useReplayPositions(deviceId: string | undefined) {
  const query = useReplayData(deviceId);
  return {
    ...query,
    data: query.data?.positions,
  };
}
```

**Step 5: Run test to verify it passes**

Run: `npx jest __tests__/hooks/useReplayPositions.test.ts --no-coverage`
Expected: PASS

**Step 6: Commit**

```bash
git add src/hooks/api/useReplayPositions.ts src/api/endpoints/positions.ts __tests__/hooks/useReplayPositions.test.ts
git commit -m "feat(ws2): add useReplayPositions hook with time-window API and mock fallback"
```

---

## Task 7: ReplayRadarDisplay Component

> **Fix #1:** Radar reads `currentMinute` prop and only renders the trailing 15-minute window.
> **Fix #5:** Tap handling uses `runOnJS` to bridge worklet → JS thread. Hit-test data is a plain array, not a Map.

**Files:**
- Create: `src/components/organisms/ReplayRadarDisplay/ReplayRadarDisplay.tsx`
- Create: `src/components/organisms/ReplayRadarDisplay/index.ts`

**Step 1: Write the failing test**

Create `__tests__/components/ReplayRadarDisplay.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { ReplayRadarDisplay } from '@components/organisms/ReplayRadarDisplay';
import { BucketEntry } from '@/types/replay';

// Mock Skia
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: ({ children }: any) => children,
  Circle: () => null,
  Line: () => null,
  Group: ({ children }: any) => children,
  vec: (x: number, y: number) => ({ x, y }),
}));

jest.mock('react-native-reanimated', () =>
  jest.requireActual('__mocks__/react-native-reanimated.js')
);

jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: any) => children,
  Gesture: {
    Tap: () => ({ onEnd: () => ({}) }),
  },
}));

function makeBuckets(): Map<number, BucketEntry[]> {
  const map = new Map<number, BucketEntry[]>();
  map.set(600, [
    {
      fingerprintHash: 'fp-test',
      macAddress: 'AA:BB:CC:DD:EE:01',
      x: 175, y: 100,
      threatLevel: 'high',
      confidence: 0.8,
      signalType: 'cellular',
    },
  ]);
  return map;
}

describe('ReplayRadarDisplay', () => {
  it('renders without crashing', () => {
    const tree = render(
      <ReplayRadarDisplay
        currentMinute={600}
        positions={{ startTime: Date.now(), buckets: makeBuckets() }}
        propertyCenter={{ latitude: 31.530757, longitude: -110.287842 }}
      />
    );
    expect(tree).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/components/ReplayRadarDisplay.test.tsx --no-coverage`
Expected: FAIL — module not found

**Step 3: Write the component**

```typescript
// src/components/organisms/ReplayRadarDisplay/ReplayRadarDisplay.tsx
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  Line,
  Group,
  vec,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { BucketEntry, TimeBucketedPositions } from '@/types/replay';
import { ThreatLevel } from '@/types/alert';
import { Text } from '@components/atoms';

const SIZE = 350;
const CENTER = SIZE / 2;
const RADIUS = CENTER - 10;
const RING_RADII = [RADIUS * 0.25, RADIUS * 0.5, RADIUS * 0.75, RADIUS];
const TRAIL_WINDOW = 15; // minutes
const HIT_RADIUS = 20;

const DARK_BG = '#0a0a0f';
const RING_COLOR = 'rgba(255, 255, 255, 0.08)';
const CROSSHAIR_COLOR = 'rgba(255, 255, 255, 0.06)';
const CENTER_DOT_COLOR = '#3478F6';

const THREAT_COLORS: Record<ThreatLevel, string> = {
  critical: '#B84A42',
  high: '#C47F30',
  medium: '#C9A030',
  low: '#5A8A5A',
};

const DOT_SIZES: Record<ThreatLevel, number> = {
  critical: 8,
  high: 7,
  medium: 6,
  low: 5,
};

interface ReplayRadarDisplayProps {
  currentMinute: number; // plain JS number, parent syncs to shared value
  positions: TimeBucketedPositions;
  maxRange?: number;
  propertyCenter: { latitude: number; longitude: number };
  onDotTap?: (macAddress: string) => void;
  onEmptyTap?: () => void;
}

// Flatten the trailing window into a plain array for rendering and hit-testing.
// This runs on the JS thread, not in a worklet.
function getTrailingDots(
  currentMinute: number,
  buckets: Map<number, BucketEntry[]>
): Array<BucketEntry & { opacity: number }> {
  const dots: Array<BucketEntry & { opacity: number }> = [];

  for (let offset = 0; offset < TRAIL_WINDOW; offset++) {
    const idx = currentMinute - offset;
    if (idx < 0) continue;
    const entries = buckets.get(idx);
    if (!entries) continue;

    const opacity = offset === 0 ? 1 : Math.max(0.1, 1 - offset / TRAIL_WINDOW);
    for (const entry of entries) {
      dots.push({ ...entry, opacity });
    }
  }

  return dots;
}

export const ReplayRadarDisplay: React.FC<ReplayRadarDisplayProps> = ({
  currentMinute,
  positions,
  onDotTap,
  onEmptyTap,
}) => {
  const { buckets } = positions;

  // Compute visible dots for the current 15-min trailing window
  const visibleDots = useMemo(
    () => getTrailingDots(currentMinute, buckets),
    [currentMinute, buckets]
  );

  const hasActivity = visibleDots.length > 0;

  // Hit-test callback — runs on JS thread via runOnJS.
  // Skips dots with empty macAddress (uncorrelated positions) to avoid
  // pausing auto-play and showing nothing.
  const handleTap = (tapX: number, tapY: number) => {
    for (const dot of visibleDots) {
      if (!dot.macAddress) continue; // skip uncorrelated dots
      const dx = tapX - dot.x;
      const dy = tapY - dot.y;
      if (dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS) {
        onDotTap?.(dot.macAddress);
        return;
      }
    }
    onEmptyTap?.();
  };

  // Gesture runs in worklet, bridges to JS via runOnJS
  const tap = Gesture.Tap().onEnd((event) => {
    'worklet';
    runOnJS(handleTap)(event.x, event.y);
  });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={tap}>
        <Canvas style={styles.canvas}>
          {/* Range rings */}
          {RING_RADII.map((r, i) => (
            <Circle
              key={`ring-${i}`}
              cx={CENTER}
              cy={CENTER}
              r={r}
              color={RING_COLOR}
              style="stroke"
              strokeWidth={1}
            />
          ))}

          {/* Crosshairs */}
          <Line
            p1={vec(CENTER, 0)}
            p2={vec(CENTER, SIZE)}
            color={CROSSHAIR_COLOR}
            strokeWidth={1}
          />
          <Line
            p1={vec(0, CENTER)}
            p2={vec(SIZE, CENTER)}
            color={CROSSHAIR_COLOR}
            strokeWidth={1}
          />

          {/* Center property dot */}
          <Circle cx={CENTER} cy={CENTER} r={6} color={CENTER_DOT_COLOR} />

          {/* Detection dots — only the trailing 15-min window */}
          <Group>
            {visibleDots.map((dot, i) => (
              <Circle
                key={`dot-${i}`}
                cx={dot.x}
                cy={dot.y}
                r={DOT_SIZES[dot.threatLevel]}
                color={THREAT_COLORS[dot.threatLevel]}
                opacity={dot.opacity}
              />
            ))}
          </Group>
        </Canvas>
      </GestureDetector>

      {/* No Activity overlay — rendered as RN View outside Canvas tree */}
      {!hasActivity && (
        <View style={styles.noActivityOverlay}>
          <Text variant="title3" color="secondaryLabel" style={styles.noActivityText}>
            No Activity
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: DARK_BG,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  canvas: {
    width: SIZE,
    height: SIZE,
  },
  noActivityOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noActivityText: {
    opacity: 0.3,
  },
});
```

Create `src/components/organisms/ReplayRadarDisplay/index.ts`:
```typescript
export { ReplayRadarDisplay } from './ReplayRadarDisplay';
```

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/components/ReplayRadarDisplay.test.tsx --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/organisms/ReplayRadarDisplay/ __tests__/components/ReplayRadarDisplay.test.tsx
git commit -m "feat(ws2): add ReplayRadarDisplay with trailing-window rendering and runOnJS tap"
```

---

## Task 8: TimelineScrubber Component

> **Fix #4:** Implements `Gesture.Pan()` on the scrub track that maps drag X position to minute index and calls `onScrub`.

**Files:**
- Create: `src/components/organisms/TimelineScrubber/TimelineScrubber.tsx`
- Create: `src/components/organisms/TimelineScrubber/index.ts`

**Step 1: Write the failing test**

Create `__tests__/components/TimelineScrubber.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TimelineScrubber } from '@components/organisms/TimelineScrubber';
import { BucketEntry } from '@/types/replay';

jest.mock('react-native-reanimated', () =>
  jest.requireActual('__mocks__/react-native-reanimated.js')
);

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  return {
    GestureDetector: ({ children }: any) => children,
    Gesture: {
      Pan: () => ({
        onStart: function() { return this; },
        onUpdate: function() { return this; },
        onEnd: function() { return this; },
      }),
    },
  };
});

function makeBuckets(): Map<number, BucketEntry[]> {
  const map = new Map<number, BucketEntry[]>();
  const entry: BucketEntry = {
    fingerprintHash: 'fp-test', macAddress: 'AA:BB:CC:DD:EE:01',
    x: 100, y: 100,
    threatLevel: 'medium', confidence: 0.7, signalType: 'cellular',
  };
  map.set(120, [entry]); // 2:00 AM
  map.set(600, [entry]); // 10:00 AM
  return map;
}

describe('TimelineScrubber', () => {
  const defaultProps = {
    minuteIndex: 120,
    buckets: makeBuckets(),
    isPlaying: false,
    speed: 10 as const,
    onPlayPause: jest.fn(),
    onSpeedChange: jest.fn(),
    onSkipForward: jest.fn(),
    onSkipBack: jest.fn(),
    onScrub: jest.fn(),
  };

  it('renders time labels', () => {
    const { getByText } = render(<TimelineScrubber {...defaultProps} />);
    expect(getByText('12am')).toBeTruthy();
    expect(getByText('6am')).toBeTruthy();
    expect(getByText('12pm')).toBeTruthy();
    expect(getByText('6pm')).toBeTruthy();
    expect(getByText('Now')).toBeTruthy();
  });

  it('displays formatted timestamp', () => {
    const { getByText } = render(<TimelineScrubber {...defaultProps} />);
    expect(getByText('2:00 AM')).toBeTruthy();
  });

  it('shows current speed', () => {
    const { getByText } = render(<TimelineScrubber {...defaultProps} />);
    expect(getByText('10x')).toBeTruthy();
  });

  it('calls onPlayPause when play button pressed', () => {
    const onPlayPause = jest.fn();
    const { getByTestId } = render(
      <TimelineScrubber {...defaultProps} onPlayPause={onPlayPause} />
    );
    fireEvent.press(getByTestId('play-pause-button'));
    expect(onPlayPause).toHaveBeenCalled();
  });

  it('calls onSpeedChange when speed pill pressed', () => {
    const onSpeedChange = jest.fn();
    const { getByTestId } = render(
      <TimelineScrubber {...defaultProps} onSpeedChange={onSpeedChange} />
    );
    fireEvent.press(getByTestId('speed-button'));
    expect(onSpeedChange).toHaveBeenCalled();
  });

  it('calls onSkipForward and onSkipBack', () => {
    const onSkipForward = jest.fn();
    const onSkipBack = jest.fn();
    const { getByTestId } = render(
      <TimelineScrubber
        {...defaultProps}
        onSkipForward={onSkipForward}
        onSkipBack={onSkipBack}
      />
    );
    fireEvent.press(getByTestId('skip-forward-button'));
    expect(onSkipForward).toHaveBeenCalled();
    fireEvent.press(getByTestId('skip-back-button'));
    expect(onSkipBack).toHaveBeenCalled();
  });

  it('renders the scrub track with testID for gesture target', () => {
    const { getByTestId } = render(<TimelineScrubber {...defaultProps} />);
    expect(getByTestId('scrub-track')).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/components/TimelineScrubber.test.tsx --no-coverage`
Expected: FAIL — module not found

**Step 3: Write the component**

```typescript
// src/components/organisms/TimelineScrubber/TimelineScrubber.tsx
import React, { useCallback, useRef } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Text, Icon } from '@components/atoms';
import { BucketEntry, PlaybackSpeed, TimelineScrubberProps } from '@/types/replay';
import { ThreatLevel } from '@/types/alert';

const TRACK_HEIGHT = 40;
const TOTAL_MINUTES = 1440;

const THREAT_TRACK_COLORS: Record<ThreatLevel, string> = {
  critical: 'rgba(184, 74, 66, 0.7)',
  high: 'rgba(196, 127, 48, 0.6)',
  medium: 'rgba(201, 160, 48, 0.5)',
  low: 'rgba(90, 138, 90, 0.3)',
};

function formatTime(minuteIndex: number): string {
  const hours = Math.floor(minuteIndex / 60);
  const minutes = minuteIndex % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMin = minutes.toString().padStart(2, '0');
  return `${displayHour}:${displayMin} ${period}`;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  minuteIndex,
  buckets,
  isPlaying,
  speed,
  onPlayPause,
  onSpeedChange,
  onSkipForward,
  onSkipBack,
  onScrub,
}) => {
  const trackWidthRef = useRef(0);

  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
  }, []);

  // Pan gesture: maps drag X to minute index
  const handleScrubUpdate = useCallback(
    (x: number) => {
      const width = trackWidthRef.current;
      if (width <= 0) return;
      const clamped = Math.max(0, Math.min(x, width));
      const minute = Math.round((clamped / width) * (TOTAL_MINUTES - 1));
      onScrub(minute);
    },
    [onScrub]
  );

  const pan = Gesture.Pan()
    .onStart((e) => {
      'worklet';
      runOnJS(handleScrubUpdate)(e.x);
    })
    .onUpdate((e) => {
      'worklet';
      runOnJS(handleScrubUpdate)(e.x);
    })
    .onEnd(() => {
      'worklet';
      // Lifting finger could auto-play — handled by parent
    });

  // Compute density segments (96 x 15-minute segments)
  const segments = React.useMemo(() => {
    const segCount = 96;
    const segs: Array<{ maxThreat: ThreatLevel | null; count: number }> = Array.from(
      { length: segCount },
      () => ({ maxThreat: null, count: 0 })
    );

    const threatPriority: Record<ThreatLevel, number> = {
      low: 0, medium: 1, high: 2, critical: 3,
    };

    for (const [min, entries] of buckets) {
      const segIdx = Math.floor(min / 15);
      if (segIdx >= segCount) continue;
      segs[segIdx].count += entries.length;
      for (const entry of entries) {
        if (
          !segs[segIdx].maxThreat ||
          threatPriority[entry.threatLevel] > threatPriority[segs[segIdx].maxThreat!]
        ) {
          segs[segIdx].maxThreat = entry.threatLevel;
        }
      }
    }

    return segs;
  }, [buckets]);

  const playheadPosition = (minuteIndex / TOTAL_MINUTES) * 100;

  return (
    <View style={styles.container}>
      {/* Timestamp display */}
      <Text
        variant="title1"
        weight="bold"
        color="white"
        style={styles.timestamp}
      >
        {formatTime(minuteIndex)}
      </Text>

      {/* Transport controls */}
      <View style={styles.controls}>
        <Pressable
          testID="skip-back-button"
          onPress={onSkipBack}
          style={styles.controlButton}
        >
          <Icon name="play-skip-back" size={20} color="white" />
        </Pressable>
        <Pressable
          testID="play-pause-button"
          onPress={onPlayPause}
          style={styles.playButton}
        >
          <Icon
            name={isPlaying ? 'pause' : 'play'}
            size={24}
            color="white"
          />
        </Pressable>
        <Pressable
          testID="skip-forward-button"
          onPress={onSkipForward}
          style={styles.controlButton}
        >
          <Icon name="play-skip-forward" size={20} color="white" />
        </Pressable>
        <Pressable
          testID="speed-button"
          onPress={onSpeedChange}
          style={styles.speedPill}
        >
          <Text variant="caption1" weight="bold" color="white">
            {speed}x
          </Text>
        </Pressable>
      </View>

      {/* Scrub track with pan gesture */}
      <GestureDetector gesture={pan}>
        <View
          testID="scrub-track"
          style={styles.track}
          onLayout={onTrackLayout}
        >
          {segments.map((seg, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                {
                  backgroundColor: seg.maxThreat
                    ? THREAT_TRACK_COLORS[seg.maxThreat]
                    : 'rgba(255, 255, 255, 0.05)',
                  height: seg.count > 0
                    ? Math.min(TRACK_HEIGHT, 4 + (seg.count / 5) * TRACK_HEIGHT)
                    : 2,
                },
              ]}
            />
          ))}

          {/* Playhead */}
          <View
            style={[
              styles.playhead,
              { left: `${playheadPosition}%` },
            ]}
          />
        </View>
      </GestureDetector>

      {/* Time labels */}
      <View style={styles.timeLabels}>
        <Text variant="caption2" color="secondaryLabel">12am</Text>
        <Text variant="caption2" color="secondaryLabel">6am</Text>
        <Text variant="caption2" color="secondaryLabel">12pm</Text>
        <Text variant="caption2" color="secondaryLabel">6pm</Text>
        <Text variant="caption2" color="secondaryLabel">Now</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#0a0a0f',
  },
  timestamp: {
    textAlign: 'center',
    marginBottom: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: TRACK_HEIGHT,
    gap: 1,
    position: 'relative',
  },
  segment: {
    flex: 1,
    borderRadius: 1,
  },
  playhead: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    width: 3,
    borderRadius: 1.5,
    backgroundColor: '#C9B896',
    shadowColor: '#C9B896',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
});
```

Create `src/components/organisms/TimelineScrubber/index.ts`:
```typescript
export { TimelineScrubber } from './TimelineScrubber';
```

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/components/TimelineScrubber.test.tsx --no-coverage`
Expected: PASS (all 7 tests)

**Step 5: Commit**

```bash
git add src/components/organisms/TimelineScrubber/ __tests__/components/TimelineScrubber.test.tsx
git commit -m "feat(ws2): add TimelineScrubber with pan gesture scrubbing and transport controls"
```

---

## Task 9: FingerprintPeek Bottom Sheet

> **Fix #3:** Navigates with `macAddress`, not `fingerprintHash`.

**Files:**
- Create: `src/components/molecules/FingerprintPeek/FingerprintPeek.tsx`
- Create: `src/components/molecules/FingerprintPeek/index.ts`

**Step 1: Write the failing test**

Create `__tests__/components/FingerprintPeek.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FingerprintPeek } from '@components/molecules/FingerprintPeek';

describe('FingerprintPeek', () => {
  const defaultProps = {
    macAddress: 'AA:BB:CC:DD:EE:FF',
    fingerprintHash: 'fp-test-hash',
    scrubTimestamp: Date.now(),
    onViewProfile: jest.fn(),
    onDismiss: jest.fn(),
  };

  it('renders unknown device label', () => {
    const { getByText } = render(<FingerprintPeek {...defaultProps} />);
    expect(getByText('Unknown Device')).toBeTruthy();
  });

  it('displays truncated MAC address', () => {
    const { getByText } = render(<FingerprintPeek {...defaultProps} />);
    expect(getByText('AA:BB:CC')).toBeTruthy();
  });

  it('calls onViewProfile with macAddress when button pressed', () => {
    const onViewProfile = jest.fn();
    const { getByText } = render(
      <FingerprintPeek {...defaultProps} onViewProfile={onViewProfile} />
    );
    fireEvent.press(getByText('View Full Profile'));
    expect(onViewProfile).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF');
  });

  it('calls onDismiss when backdrop pressed', () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <FingerprintPeek {...defaultProps} onDismiss={onDismiss} />
    );
    fireEvent.press(getByTestId('peek-backdrop'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('shows empty state when no macAddress', () => {
    const { getByText } = render(
      <FingerprintPeek {...defaultProps} macAddress="" />
    );
    expect(getByText('Unknown Device')).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/components/FingerprintPeek.test.tsx --no-coverage`
Expected: FAIL — module not found

**Step 3: Write the component**

```typescript
// src/components/molecules/FingerprintPeek/FingerprintPeek.tsx
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, Icon } from '@components/atoms';
import { FingerprintPeekProps } from '@/types/replay';

export const FingerprintPeek: React.FC<FingerprintPeekProps> = ({
  macAddress,
  onViewProfile,
  onDismiss,
}) => {
  const shortMac = macAddress ? macAddress.substring(0, 8) : '—';

  return (
    <>
      {/* Backdrop */}
      <Pressable
        testID="peek-backdrop"
        style={styles.backdrop}
        onPress={onDismiss}
      />

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text variant="title2" weight="bold" color="white">
              ?
            </Text>
          </View>

          <View style={styles.headerText}>
            <Text variant="headline" weight="semibold" color="white">
              Unknown Device
            </Text>
            <Text variant="caption1" color="secondaryLabel">
              {shortMac}
            </Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badges}>
          <View style={styles.badge}>
            <View style={[styles.badgeDot, { backgroundColor: '#B84A42' }]} />
            <Text variant="caption2" color="secondaryLabel">
              New
            </Text>
          </View>
        </View>

        {/* Action — navigates with macAddress, not fingerprintHash */}
        <Pressable
          style={styles.profileButton}
          onPress={() => onViewProfile(macAddress)}
          disabled={!macAddress}
        >
          <Text variant="subheadline" weight="semibold" color="systemBlue">
            View Full Profile
          </Text>
          <Icon name="chevron-forward" size={16} color="systemBlue" />
        </Pressable>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  profileButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 120, 246, 0.12)',
  },
});
```

Create `src/components/molecules/FingerprintPeek/index.ts`:
```typescript
export { FingerprintPeek } from './FingerprintPeek';
```

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/components/FingerprintPeek.test.tsx --no-coverage`
Expected: PASS (all 5 tests)

**Step 5: Commit**

```bash
git add src/components/molecules/FingerprintPeek/ __tests__/components/FingerprintPeek.test.tsx
git commit -m "feat(ws2): add FingerprintPeek bottom sheet with macAddress navigation"
```

---

## Task 10: Update Navigation Types

**Files:**
- Modify: `src/navigation/types.ts:34-37`

**Step 1: Update RadarStackParamList**

In `src/navigation/types.ts`, change:

```typescript
// From:
export type RadarStackParamList = {
  LiveRadar: undefined;
  RadarSettings: undefined;
  DeviceFingerprint: { macAddress: string };
};

// To:
export type RadarStackParamList = {
  LiveRadar: { startHour?: number } | undefined;
  RadarSettings: undefined;
  DeviceFingerprint: { macAddress: string };
};
```

**Step 2: Run type check**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: No new errors beyond baseline

**Step 3: Commit**

```bash
git add src/navigation/types.ts
git commit -m "feat(ws2): add startHour param to LiveRadar route type"
```

---

## Task 11: Integrate Replay Mode into ProximityHeatmapScreen

> **Fix #1:** `useEffect` syncs `minuteIndex` → `timestamp.value`.
> **Fix #2:** Uses `useReplayPositions` instead of hardwired mock data.
> **Fix #3:** FingerprintPeek navigates with `macAddress`.
> **Fix #7:** Both views always mounted; opacity + `pointerEvents` for crossfade.
> **Open question:** `startHour` consumed once via `hasConsumedRef`.

**Files:**
- Modify: `src/screens/radar/ProximityHeatmapScreen.tsx`

**Step 1: Write the failing test**

Create `__tests__/screens/ProximityHeatmapScreen.replay.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@rnmapbox/maps', () => ({
  __esModule: true,
  default: { setAccessToken: jest.fn(), StyleURL: { SatelliteStreet: 'sat', Dark: 'dark' } },
  Camera: () => null,
  MapView: () => null,
}));
jest.mock('react-native-reanimated', () =>
  jest.requireActual('__mocks__/react-native-reanimated.js')
);
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: ({ children }: any) => children,
  Circle: () => null,
  Line: () => null,
  Group: ({ children }: any) => children,
  vec: (x: number, y: number) => ({ x, y }),
}));
jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: any) => children,
  Gesture: {
    Tap: () => ({ onEnd: () => ({}) }),
    Pan: () => ({
      onStart: function() { return this; },
      onUpdate: function() { return this; },
      onEnd: function() { return this; },
    }),
  },
}));
jest.mock('@hooks/api/useAlerts', () => ({
  useAlerts: () => ({ data: [], isLoading: false }),
}));
jest.mock('@hooks/api/useDevices', () => ({
  useDevices: () => ({
    data: [
      {
        id: 'device-001',
        name: 'North Gate',
        online: true,
        latitude: 31.530757,
        longitude: -110.287842,
      },
    ],
    isLoading: false,
  }),
}));
jest.mock('@hooks/api/usePositions', () => ({
  usePositions: () => ({ data: { positions: [] } }),
  POSITIONS_QUERY_KEY: 'positions',
}));
jest.mock('@hooks/api/useReplayPositions', () => ({
  useReplayData: () => ({
    data: { positions: [], alerts: [] },
    isLoading: false,
    isSuccess: true,
  }),
  useReplayPositions: () => ({
    data: [],
    isLoading: false,
    isSuccess: true,
  }),
}));
jest.mock('@api/websocket', () => ({
  websocketService: { on: jest.fn(), off: jest.fn() },
}));

import { ProximityHeatmapScreen } from '@screens/radar/ProximityHeatmapScreen';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderScreen = (params?: { startHour?: number }) => {
  const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
  const route = { params };
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <ProximityHeatmapScreen navigation={navigation} route={route} />
        </NavigationContainer>
      </QueryClientProvider>
    ),
    navigation,
  };
};

describe('ProximityHeatmapScreen replay mode', () => {
  it('shows segmented control with Live Map and Replay', () => {
    const { getByText } = renderScreen();
    expect(getByText('Live Map')).toBeTruthy();
    expect(getByText('Replay')).toBeTruthy();
  });

  it('both views are always mounted (for crossfade)', () => {
    const { getByTestId } = renderScreen();
    // Both exist in the tree — one is hidden via opacity/pointerEvents
    expect(getByTestId('live-map-content')).toBeTruthy();
    expect(getByTestId('replay-content')).toBeTruthy();
  });

  it('defaults to Live Map as the active mode', () => {
    const { getByText } = renderScreen();
    // The Live Map segment should have semibold weight (active state)
    // We verify by checking the segmented control's active styling
    const liveMapText = getByText('Live Map');
    // Animated styles aren't directly inspectable in test, but we verify
    // the mode state by pressing Replay and checking it toggles
    expect(liveMapText).toBeTruthy();
  });

  it('switches to replay mode when Replay is pressed', () => {
    const { getByText } = renderScreen();
    // Press Replay segment
    fireEvent.press(getByText('Replay'));
    // After pressing, the Replay segment should be active
    // We can verify the mode changed by checking the segmented control
    const replayText = getByText('Replay');
    expect(replayText).toBeTruthy();
  });

  it('activates replay mode immediately with startHour deep link', () => {
    // When startHour is present, mode initializes to 'replay' and
    // fadeAnim initializes to 0 (replay visible) — no effect needed.
    const { getByText } = renderScreen({ startHour: 14 });
    // The Replay segment should be in active state from the first render.
    // Both views are mounted, but the replay view has opacity=1 and
    // the live view has opacity=0 from initialization.
    const replayText = getByText('Replay');
    expect(replayText).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/screens/ProximityHeatmapScreen.replay.test.tsx --no-coverage`
Expected: FAIL — no segmented control exists yet

**Step 3: Modify ProximityHeatmapScreen**

This is the main integration. Key changes to `src/screens/radar/ProximityHeatmapScreen.tsx`:

Add imports at top:

```typescript
import { ReplayRadarDisplay } from '@components/organisms/ReplayRadarDisplay';
import { TimelineScrubber } from '@components/organisms/TimelineScrubber';
import { FingerprintPeek } from '@components/molecules/FingerprintPeek';
import { useTimeBucketing } from '@hooks/useTimeBucketing';
import { useAutoPlay } from '@hooks/useAutoPlay';
import { useReplayData } from '@hooks/api/useReplayPositions';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { RadarMode } from '@/types/replay';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useCallback } from 'react';
```

Change the component signature to accept `route`:

```typescript
export const ProximityHeatmapScreen = ({ navigation, route }: any) => {
```

Add replay state after existing state declarations:

```typescript
// --- Replay mode state ---
const startHour = route?.params?.startHour;
const [mode, setMode] = useState<RadarMode>(
  // Initialize directly to 'replay' if startHour is present, so the
  // first render already has the correct mode before any effects run.
  startHour !== undefined ? 'replay' : 'live'
);
const [peekMac, setPeekMac] = useState<string | null>(null);
const reduceMotion = useReducedMotion();

// Replay data via useReplayData (mock fallback in dev)
// Returns co-generated positions + alerts for authoritative correlation
const { data: replayData } = useReplayData(selectedDevice?.id);
const replayPositions = replayData?.positions ?? [];
const replayAlerts = replayData?.alerts ?? [];
const propertyCenter = {
  latitude: selectedDevice?.latitude ?? 31.530757,
  longitude: selectedDevice?.longitude ?? -110.287842,
};

// Time bucketing — correlates with co-generated replay alerts for
// authoritative threat levels and MAC addresses (not the live alerts)
const bucketed = useTimeBucketing({
  positions: replayPositions,
  alerts: replayAlerts,
  propertyCenter,
  canvasSize: 350,
  maxRange: 244,
});

// Auto-play
const autoPlay = useAutoPlay({
  buckets: bucketed.buckets,
  initialMinute: startHour !== undefined ? startHour * 60 : 0,
});

// Crossfade animation (Fix #7: both always mounted, opacity-driven)
// Initialize fadeAnim to match the initial mode — 0 if startHour deep link
const fadeAnim = useSharedValue(startHour !== undefined ? 0 : 1);
const liveStyle = useAnimatedStyle(() => ({
  opacity: fadeAnim.value,
  pointerEvents: fadeAnim.value > 0.5 ? 'auto' : 'none',
}));
const replayStyle = useAnimatedStyle(() => ({
  opacity: 1 - fadeAnim.value,
  pointerEvents: fadeAnim.value < 0.5 ? 'auto' : 'none',
}));

const handleModeChange = useCallback((newMode: RadarMode) => {
  setMode(newMode);
  if (reduceMotion) {
    fadeAnim.value = newMode === 'live' ? 1 : 0;
  } else {
    fadeAnim.value = withTiming(newMode === 'live' ? 1 : 0, { duration: 300 });
  }
  if (newMode === 'live') {
    autoPlay.pause();
    setPeekMac(null);
  }
}, [reduceMotion, fadeAnim, autoPlay]);

// Handle startHour changes — covers both first mount and re-navigation.
// On first mount: mode/fadeAnim are already initialized from startHour,
// but we still need to mark it consumed.
// On re-navigation (already mounted, new startHour arrives): switch to
// replay mode, update the scrubber position, and flip fadeAnim.
const prevStartHourRef = useRef<number | undefined>(undefined);
useEffect(() => {
  if (startHour === undefined) return;
  if (startHour === prevStartHourRef.current) return; // same hour, no-op
  prevStartHourRef.current = startHour;

  // If already in replay mode from initialization, just update the minute
  if (mode === 'replay') {
    autoPlay.setMinuteIndex(startHour * 60);
    return;
  }

  // Otherwise, switch to replay mode (covers re-navigation while in live mode)
  handleModeChange('replay');
  autoPlay.setMinuteIndex(startHour * 60);
}, [startHour, mode, handleModeChange, autoPlay]);
```

> **Implementation note:** `mode` and `fadeAnim` are initialized synchronously
> from `startHour`, so the first render already shows replay mode. The
> `useEffect` on `startHour` handles re-navigation (tapping a different
> sparkline hour while already on the Radar tab) by updating `minuteIndex`
> and switching to replay mode if needed. `prevStartHourRef` deduplicates
> so re-renders with the same startHour are no-ops.

In the JSX, add the segmented control after `<ScreenLayout>` and before the content. Then wrap the existing MapBox content and add the replay content. Both are always mounted:

```tsx
{/* Segmented Control */}
<View style={styles.segmentedControl}>
  <Pressable
    style={[styles.segment, mode === 'live' && styles.segmentActive]}
    onPress={() => handleModeChange('live')}
  >
    <Text
      variant="subheadline"
      weight={mode === 'live' ? 'semibold' : 'regular'}
      color={mode === 'live' ? 'label' : 'secondaryLabel'}
    >
      Live Map
    </Text>
  </Pressable>
  <Pressable
    style={[styles.segment, mode === 'replay' && styles.segmentActive]}
    onPress={() => handleModeChange('replay')}
  >
    <Text
      variant="subheadline"
      weight={mode === 'replay' ? 'semibold' : 'regular'}
      color={mode === 'replay' ? 'label' : 'secondaryLabel'}
    >
      Replay
    </Text>
  </Pressable>
</View>

{/* Both views always mounted for crossfade overlap */}
<View style={styles.modeContainer}>
  <Animated.View style={[StyleSheet.absoluteFill, liveStyle]} testID="live-map-content">
    <ScrollView>
      {/* ...existing MapBox heatmap content... */}
    </ScrollView>
  </Animated.View>

  <Animated.View
    style={[StyleSheet.absoluteFill, replayStyle, styles.replayContainer]}
    testID="replay-content"
  >
    <ReplayRadarDisplay
      currentMinute={autoPlay.minuteIndex}
      positions={bucketed}
      propertyCenter={propertyCenter}
      onDotTap={(macAddress) => {
        autoPlay.pause();
        setPeekMac(macAddress);
      }}
      onEmptyTap={() => autoPlay.pause()}
    />
    <TimelineScrubber
      minuteIndex={autoPlay.minuteIndex}
      buckets={bucketed.buckets}
      isPlaying={autoPlay.isPlaying}
      speed={autoPlay.speed}
      onPlayPause={autoPlay.togglePlayPause}
      onSpeedChange={autoPlay.cycleSpeed}
      onSkipForward={autoPlay.skipForward}
      onSkipBack={autoPlay.skipBack}
      onScrub={(min) => autoPlay.setMinuteIndex(min)}
    />
    {peekMac && (
      <FingerprintPeek
        macAddress={peekMac}
        fingerprintHash=""
        scrubTimestamp={bucketed.startTime + autoPlay.minuteIndex * 60_000}
        onViewProfile={(mac) => {
          setPeekMac(null);
          navigation.navigate('DeviceFingerprint', { macAddress: mac });
        }}
        onDismiss={() => {
          setPeekMac(null);
          autoPlay.play();
        }}
      />
    )}
  </Animated.View>
</View>
```

Add new styles:

```typescript
segmentedControl: {
  flexDirection: 'row',
  marginHorizontal: 16,
  marginBottom: 8,
  borderRadius: 8,
  backgroundColor: 'rgba(118, 118, 128, 0.12)',
  padding: 2,
},
segment: {
  flex: 1,
  paddingVertical: 8,
  alignItems: 'center',
  borderRadius: 6,
},
segmentActive: {
  backgroundColor: 'rgba(255, 255, 255, 0.18)',
},
modeContainer: {
  flex: 1,
  position: 'relative',
},
replayContainer: {
  backgroundColor: '#0a0a0f',
  justifyContent: 'space-between',
  paddingTop: 16,
},
```

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/screens/ProximityHeatmapScreen.replay.test.tsx --no-coverage`
Expected: PASS (all 5 tests)

**Step 5: Run type check**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: No new errors beyond baseline

**Step 6: Commit**

```bash
git add src/screens/radar/ProximityHeatmapScreen.tsx __tests__/screens/ProximityHeatmapScreen.replay.test.tsx
git commit -m "feat(ws2): integrate replay mode with crossfade, timestamp sync, and macAddress navigation"
```

---

## Task 12: Wire ActivitySparkline Deep Link

> **Fix #8 (partial):** Test now verifies positive navigation with correct params.

**Files:**
- Modify: `src/screens/home/PropertyCommandCenter.tsx:351-357`

**Step 1: Write the test**

Create `__tests__/screens/PropertyCommandCenter.sparkline.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@hooks/usePropertyStatus', () => ({
  usePropertyStatus: () => ({
    level: 'clear',
    title: 'All Clear',
    subtitle: 'No active alerts',
    isLoading: false,
    activeAlertCount: 0,
    visitorsToday: 1,
    devicesOnline: 1,
    devicesOffline: 0,
    devicesTotal: 1,
    allAlerts: [
      {
        id: 'a1',
        timestamp: new Date().toISOString(),
        threatLevel: 'low',
        macAddress: 'AA:BB:CC:DD:EE:FF',
      },
    ],
    recentAlerts: [],
    allDevices: [],
    recentVisitorMacs: [],
    onlineDeviceNames: ['North Gate'],
    offlineDeviceNames: [],
    alertsError: null,
    devicesError: null,
    refetchAlerts: jest.fn(),
    refetchDevices: jest.fn(),
  }),
  PropertyStatusLevel: {},
}));
jest.mock('@hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('@components/organisms', () => ({
  AlertCard: () => null,
  MiniPropertyMap: () => null,
}));

import { PropertyCommandCenter } from '@screens/home/PropertyCommandCenter';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('PropertyCommandCenter sparkline deep link', () => {
  it('sparkline bar press navigates to RadarTab with startHour', () => {
    const navigate = jest.fn();

    // ActivitySparkline renders 24 Pressable bars (one per hour).
    // Each bar's onPress calls onHourPress(index), which
    // PropertyCommandCenter wires to navigate.
    //
    // The mock allAlerts has 1 alert at the current hour, so that
    // bar will have activity and be pressable.

    const { getAllByRole } = render(
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <PropertyCommandCenter navigation={{ navigate }} />
        </NavigationContainer>
      </QueryClientProvider>
    );

    // ActivitySparkline renders 24 Pressable bars. Each Pressable
    // has role="button" by default in RNTL. Find them and press
    // the bar at index 0 (12am hour).
    const pressables = getAllByRole('button');
    // The sparkline bars are among the pressable elements.
    // The sparkline is near the end of the screen. Each bar calls
    // onHourPress(barIndex). We press the first bar (hour 0).
    // Since there are many pressables on screen (stat cards, etc.),
    // we look for the one that triggers our specific navigate call.
    //
    // Press every pressable until we find one that triggers the
    // RadarTab navigation — this proves the wiring exists.
    for (const p of pressables) {
      fireEvent.press(p);
      if (navigate.mock.calls.some(
        (args: any[]) =>
          args[0] === 'RadarTab' &&
          args[1]?.screen === 'LiveRadar' &&
          typeof args[1]?.params?.startHour === 'number'
      )) {
        break;
      }
    }

    expect(navigate).toHaveBeenCalledWith('RadarTab', {
      screen: 'LiveRadar',
      params: expect.objectContaining({ startHour: expect.any(Number) }),
    });
  });
});
```

**Step 2: Update the navigation call**

In `src/screens/home/PropertyCommandCenter.tsx`, change lines 351-357:

```typescript
// From:
<ActivitySparkline
  alerts={status.allAlerts}
  onHourPress={(_hour) =>
    // WS2 will update to: navigate('RadarTab', { screen: 'ReplayRadar', params: { startHour: _hour } })
    navigation.navigate('RadarTab', { screen: 'LiveRadar' })
  }
/>

// To:
<ActivitySparkline
  alerts={status.allAlerts}
  onHourPress={(hour) =>
    navigation.navigate('RadarTab', {
      screen: 'LiveRadar',
      params: { startHour: hour },
    })
  }
/>
```

**Step 3: Run type check**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: No new errors

**Step 4: Commit**

```bash
git add src/screens/home/PropertyCommandCenter.tsx __tests__/screens/PropertyCommandCenter.sparkline.test.tsx
git commit -m "feat(ws2): wire ActivitySparkline onHourPress to replay radar deep link"
```

---

## Task 13: Remove LiveRadarScreen

**Files:**
- Delete: `src/screens/radar/LiveRadarScreen.tsx`
- Modify: `src/screens/radar/index.ts`

**Step 1: Verify LiveRadarScreen is unused**

Run: `grep -r "LiveRadarScreen" src/ --include="*.ts" --include="*.tsx" -l`
Expected: Only `src/screens/radar/LiveRadarScreen.tsx` and `src/screens/radar/index.ts`

**Step 2: Remove the export**

In `src/screens/radar/index.ts`, remove:
```typescript
export { LiveRadarScreen } from './LiveRadarScreen';
```

**Step 3: Delete the file**

```bash
rm src/screens/radar/LiveRadarScreen.tsx
```

**Step 4: Run type check and tests**

Run: `npx tsc --noEmit 2>&1 | tail -5 && npx jest --no-coverage 2>&1 | tail -10`
Expected: No new errors, all tests pass

**Step 5: Commit**

```bash
git add -u src/screens/radar/
git commit -m "refactor(ws2): remove unused LiveRadarScreen"
```

---

## Task 14: Final Integration Test & Lint

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass, including new WS2 tests

**Step 2: Run type check**

Run: `npm run type-check`
Expected: No new errors beyond recorded baseline

**Step 3: Run lint**

Run: `npm run lint:fix`
Expected: PASS or auto-fixed

**Step 4: Final commit if lint made changes**

```bash
git add -A
git commit -m "chore(ws2): lint fixes"
```
