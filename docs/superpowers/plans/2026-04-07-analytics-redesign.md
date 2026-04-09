# Analytics Screen Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Analytics dashboard into a 3-tab (Overview, Signals, Patterns) experience with rich signal-level and temporal analytics, replacing the current single-page basic dashboard.

**Architecture:** Refactor `DashboardScreen.tsx` into a tab host with three tab components. Extend `AnalyticsData` type with new fields for signal/pattern data. Update mock data generators to produce the new fields. Replace `react-native-chart-kit` with `react-native-gifted-charts` on the Analytics screen only. Build custom components for the activity heatmap and proximity zone visualization.

**Tech Stack:** React Native (Expo SDK 54), react-native-gifted-charts, React Query, TypeScript, date-fns, expo-haptics

**Critical codebase contracts (all code must follow these):**

- `useTheme()` returns `{ theme, colorScheme, setColorScheme }` — access colors via `theme.colors`
- `ScreenLayout` header accepts `rightActions?: React.ReactNode` (not `rightAction`)
- `DashboardScreen` is a **named export** (`export const DashboardScreen`)
- `MoreStackParamList` uses `'Dashboard'` (not `'Analytics'`)
- `getComparison()` returns `{ current: AnalyticsData; comparison: AnalyticsData; percentageChange: { totalDetections, unknownDevices, avgResponseTime } }`
- Comparison API only supports `period: 'day' | 'week' | 'month'` — no `'year'`

---

## File Structure

```
Modified:
  src/types/alert.ts                          — extend AnalyticsData with new fields
  src/mocks/data/mockAnalytics.ts             — generate new mock data fields
  src/mocks/data/index.ts                     — export new mock data
  src/utils/seedMockData.ts                   — seed new analytics fields
  src/hooks/useAnalytics.ts                   — add useComparison hook (no useThreatTimeline — threatTimeline is a field on AnalyticsData)
  src/api/analytics.ts                        — no changes needed (endpoints exist)
  src/screens/analytics/DashboardScreen.tsx   — refactor into tab host
  src/screens/analytics/index.ts              — update exports
  package.json                                — add react-native-gifted-charts

Created:
  src/screens/analytics/tabs/OverviewTab.tsx
  src/screens/analytics/tabs/SignalsTab.tsx
  src/screens/analytics/tabs/PatternsTab.tsx
  src/screens/analytics/tabs/index.ts
  src/components/organisms/charts/StackedAreaChart.tsx
  src/components/organisms/charts/ActivityHeatmap.tsx
  src/components/organisms/charts/MultiLineChart.tsx
  src/components/molecules/ProximityZoneVisual/ProximityZoneVisual.tsx
  src/components/molecules/ProximityZoneVisual/index.ts
  src/components/molecules/InsightCard/InsightCard.tsx
  src/components/molecules/InsightCard/index.ts
  src/components/molecules/ModalityCard/ModalityCard.tsx
  src/components/molecules/ModalityCard/index.ts
  src/services/analyticsInsights.ts
  __tests__/services/analyticsInsights.test.ts
  __tests__/components/organisms/charts/ActivityHeatmap.test.tsx
  __tests__/components/molecules/ProximityZoneVisual.test.tsx
```

---

### Task 1: Install react-native-gifted-charts

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install the package**

Run: `npx expo install react-native-gifted-charts react-native-linear-gradient expo-linear-gradient`

Expected: Package added to package.json dependencies

- [ ] **Step 2: Verify installation**

Run: `npx expo install --check`

Expected: No version conflicts

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(analytics): install react-native-gifted-charts"
```

---

### Task 2: Extend AnalyticsData Type

**Files:**

- Modify: `src/types/alert.ts:69-91`

- [ ] **Step 1: Add new fields to AnalyticsData interface**

Add these fields after the existing `topDetectedDevices` field (line 78) and before the legacy fields comment (line 79):

```typescript
// Signals tab fields
rssiDistribution: Array<{
  bucketMin: number;
  bucketMax: number;
  count: number;
}>;
medianRssi: number;
peakRssi: number;
proximityZoneDistribution: Array<{
  zone: 'immediate' | 'near' | 'far' | 'extreme';
  count: number;
}>;
confidenceDistribution: Array<{
  tier: 'high' | 'medium' | 'low';
  count: number;
}>;
modalityBreakdown: {
  wifi: {
    count: number;
    channelsActive: number;
    probeRequestPercent: number;
  }
  ble: {
    count: number;
    phonePercent: number;
    applePercent: number;
    beaconPercent: number;
  }
  cellular: {
    count: number;
    avgPeakDbm: number;
    avgBurstDurationMs: number;
    avgNoiseFloorDbm: number;
  }
}
crossModalStats: {
  wifiBleLinks: number;
  avgLinkConfidence: number;
  phantomMerges: number;
}
rssiTrend: Array<{
  date: string;
  wifiAvgRssi: number | null;
  bleAvgRssi: number | null;
  cellularAvgRssi: number | null;
}>;

// Patterns tab fields
hourlyDayOfWeekDistribution: Array<{
  dayOfWeek: number;
  hour: number;
  count: number;
  date: string;
}>;
dayOfWeekDistribution: Array<{
  day: number;
  count: number;
}>;
nighttimeActivity: {
  count: number;
  percentOfTotal: number;
  trend: Array<{ date: string; count: number }>;
}
perSensorTrend: Array<{
  date: string;
  sensors: Array<{
    deviceId: string;
    deviceName: string;
    count: number;
  }>;
}>;

// Threat timeline (per-day breakdown by severity)
threatTimeline: Array<{
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}>;

// Overview metrics (exact values, not approximations)
uniqueDevices: number; // distinct fingerprintHash count in period
avgConfidence: number; // mean confidence across all alerts in period
closestApproachMeters: number; // minimum accuracyMeters in period
```

These three fields live on `AnalyticsData` directly, so both `comparison.current` and `comparison.comparison` carry exact values. The Overview tab reads `analytics.uniqueDevices` vs `comparison.comparison.uniqueDevices` to compute the delta — no approximation needed. The `new-devices` insight compares `current.uniqueDevices > comparison.uniqueDevices`.

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`

Expected: No new type errors

- [ ] **Step 3: Commit**

```bash
git add src/types/alert.ts
git commit -m "feat(analytics): extend AnalyticsData type with signal, pattern, and threat timeline fields"
```

---

### Task 3: Generate Extended Mock Analytics Data

**Files:**

- Modify: `src/mocks/data/mockAnalytics.ts`
- Modify: `src/mocks/data/index.ts`

- [ ] **Step 1: Add deterministic seeded random helper**

Add at the top of `mockAnalytics.ts`, after the imports:

```typescript
// Deterministic seeded random for stable mock data.
// Returns a new RNG function seeded from the input.
// MUST be called inside each generator function, not at module scope,
// so that repeated calls to getAnalyticsData() produce identical output.
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
```

**Do NOT create a module-global `rand`.** Each generator that needs randomness creates its own RNG seeded from the alerts array length: `const rand = seededRandom(alerts.length);` This ensures identical output regardless of how many times `getAnalyticsData()` is called.

- [ ] **Step 2: Add new mock data generators**

Add these functions before the `export const mockAnalyticsData` line (line 114). All use `rand()` instead of `Math.random()`:

```typescript
function generateRssiDistribution(alerts: Alert[]) {
  const buckets = [-90, -80, -70, -60, -50, -40, -30];
  return buckets.map((bucketMin, i) => {
    const bucketMax = i < buckets.length - 1 ? buckets[i + 1] : -20;
    const count = alerts.filter(a => {
      const simulatedRssi = -90 + (a.confidence / 100) * 70;
      return simulatedRssi >= bucketMin && simulatedRssi < bucketMax;
    }).length;
    return { bucketMin, bucketMax, count };
  });
}

function computeMedianRssi(alerts: Alert[]): number {
  if (alerts.length === 0) return -60;
  const rssiValues = alerts
    .map(a => -90 + (a.confidence / 100) * 70)
    .sort((a, b) => a - b);
  const mid = Math.floor(rssiValues.length / 2);
  return Math.round(
    rssiValues.length % 2 !== 0
      ? rssiValues[mid]
      : (rssiValues[mid - 1] + rssiValues[mid]) / 2
  );
}

function generateProximityZones(alerts: Alert[]) {
  return [
    {
      zone: 'immediate' as const,
      count: alerts.filter(a => a.accuracyMeters < 5).length,
    },
    {
      zone: 'near' as const,
      count: alerts.filter(a => a.accuracyMeters >= 5 && a.accuracyMeters < 15)
        .length,
    },
    {
      zone: 'far' as const,
      count: alerts.filter(a => a.accuracyMeters >= 15 && a.accuracyMeters < 50)
        .length,
    },
    {
      zone: 'extreme' as const,
      count: alerts.filter(a => a.accuracyMeters >= 50).length,
    },
  ];
}

function generateConfidenceDistribution(alerts: Alert[]) {
  return [
    {
      tier: 'high' as const,
      count: alerts.filter(a => a.confidence >= 75).length,
    },
    {
      tier: 'medium' as const,
      count: alerts.filter(a => a.confidence >= 50 && a.confidence < 75).length,
    },
    {
      tier: 'low' as const,
      count: alerts.filter(a => a.confidence < 50).length,
    },
  ];
}

function generateModalityBreakdown(alerts: Alert[]) {
  const rand = seededRandom(alerts.length * 7);
  const wifi = alerts.filter(a => a.detectionType === 'wifi');
  const ble = alerts.filter(a => a.detectionType === 'bluetooth');
  const cellular = alerts.filter(a => a.detectionType === 'cellular');

  return {
    wifi: {
      count: wifi.length,
      channelsActive: Math.min(7, Math.max(1, Math.ceil(wifi.length / 3))),
      probeRequestPercent: Math.round(70 + rand() * 20),
    },
    ble: {
      count: ble.length,
      phonePercent: Math.round(55 + rand() * 20),
      applePercent: Math.round(30 + rand() * 20),
      beaconPercent: Math.round(5 + rand() * 15),
    },
    cellular: {
      count: cellular.length,
      avgPeakDbm: Math.round(-65 + rand() * 10),
      avgBurstDurationMs: Math.round(60 + rand() * 80),
      avgNoiseFloorDbm: Math.round(-82 + rand() * 8),
    },
  };
}

function generateCrossModalStats(alerts: Alert[]) {
  const rand = seededRandom(alerts.length * 13);
  const wifiCount = alerts.filter(a => a.detectionType === 'wifi').length;
  const bleCount = alerts.filter(a => a.detectionType === 'bluetooth').length;
  const minCount = Math.min(wifiCount, bleCount);

  return {
    wifiBleLinks: Math.max(0, Math.round(minCount * 0.3)),
    avgLinkConfidence: Math.round(65 + rand() * 20),
    phantomMerges: Math.max(0, Math.round(wifiCount * 0.1)),
  };
}

function generateRssiTrend(alerts: Alert[]) {
  const dailyMap = new Map<
    string,
    { wifi: number[]; ble: number[]; cell: number[] }
  >();

  alerts.forEach(alert => {
    const date = alert.timestamp.split('T')[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { wifi: [], ble: [], cell: [] });
    }
    const entry = dailyMap.get(date)!;
    const rssi = -90 + (alert.confidence / 100) * 60;
    if (alert.detectionType === 'wifi') entry.wifi.push(rssi);
    else if (alert.detectionType === 'bluetooth') entry.ble.push(rssi);
    else entry.cell.push(rssi);
  });

  const avg = (arr: number[]) =>
    arr.length > 0
      ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
      : null;

  return Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, data]) => ({
      date,
      wifiAvgRssi: avg(data.wifi),
      bleAvgRssi: avg(data.ble),
      cellularAvgRssi: avg(data.cell),
    }));
}

function generateHourlyDayOfWeekDistribution(alerts: Alert[]) {
  const result: Array<{
    dayOfWeek: number;
    hour: number;
    count: number;
    date: string;
  }> = [];

  alerts.forEach(alert => {
    const d = new Date(alert.timestamp);
    const dayOfWeek = (d.getDay() + 6) % 7; // 0=Mon, 6=Sun
    const hour = d.getHours();
    const date = alert.timestamp.split('T')[0];
    const existing = result.find(
      r => r.dayOfWeek === dayOfWeek && r.hour === hour && r.date === date
    );
    if (existing) {
      existing.count++;
    } else {
      result.push({ dayOfWeek, hour, count: 1, date });
    }
  });

  return result;
}

function generateDayOfWeekDistribution(alerts: Alert[]) {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  alerts.forEach(alert => {
    const d = new Date(alert.timestamp);
    const dayOfWeek = (d.getDay() + 6) % 7; // 0=Mon, 6=Sun
    counts[dayOfWeek]++;
  });
  return counts.map((count, day) => ({ day, count }));
}

function generateNighttimeActivity(alerts: Alert[]) {
  const nightAlerts = alerts.filter(a => {
    const hour = new Date(a.timestamp).getHours();
    return hour >= 22 || hour < 6;
  });

  const dailyMap = new Map<string, number>();
  nightAlerts.forEach(a => {
    const date = a.timestamp.split('T')[0];
    dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
  });

  const trend = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, count]) => ({ date, count }));

  return {
    count: nightAlerts.length,
    percentOfTotal:
      alerts.length > 0
        ? Math.round((nightAlerts.length / alerts.length) * 100)
        : 0,
    trend,
  };
}

function generatePerSensorTrend(alerts: Alert[]) {
  const devices = getMockDevices();
  const dailyMap = new Map<string, Map<string, number>>();

  alerts.forEach(alert => {
    const date = alert.timestamp.split('T')[0];
    if (!dailyMap.has(date)) dailyMap.set(date, new Map());
    const dayMap = dailyMap.get(date)!;
    dayMap.set(alert.deviceId, (dayMap.get(alert.deviceId) || 0) + 1);
  });

  return Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, sensorMap]) => ({
      date,
      sensors: devices.map(d => ({
        deviceId: d.id,
        deviceName: d.name,
        count: sensorMap.get(d.id) || 0,
      })),
    }));
}

function generateThreatTimeline(alerts: Alert[]) {
  const dailyMap = new Map<
    string,
    { critical: number; high: number; medium: number; low: number }
  >();

  alerts.forEach(alert => {
    const date = alert.timestamp.split('T')[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { critical: 0, high: 0, medium: 0, low: 0 });
    }
    const entry = dailyMap.get(date)!;
    entry[alert.threatLevel]++;
  });

  return Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, counts]) => ({ date, ...counts }));
}
```

- [ ] **Step 3: Update getAnalyticsData return value**

In the `getAnalyticsData` function, add the new fields to the return object before the closing `};`:

```typescript
    // New signal fields
    rssiDistribution: generateRssiDistribution(alerts),
    medianRssi: computeMedianRssi(alerts),
    peakRssi: Math.round(
      -90 + (Math.max(...alerts.map(a => a.confidence), 0) / 100) * 60
    ),
    proximityZoneDistribution: generateProximityZones(alerts),
    confidenceDistribution: generateConfidenceDistribution(alerts),
    modalityBreakdown: generateModalityBreakdown(alerts),
    crossModalStats: generateCrossModalStats(alerts),
    rssiTrend: generateRssiTrend(alerts),

    // New pattern fields
    hourlyDayOfWeekDistribution: generateHourlyDayOfWeekDistribution(alerts),
    dayOfWeekDistribution: generateDayOfWeekDistribution(alerts),
    nighttimeActivity: generateNighttimeActivity(alerts),
    perSensorTrend: generatePerSensorTrend(alerts),
    threatTimeline: generateThreatTimeline(alerts),

    // Overview metrics (exact values)
    uniqueDevices: new Set(alerts.map(a => a.fingerprintHash)).size,
    avgConfidence: alerts.length > 0
      ? Math.round(alerts.reduce((sum, a) => sum + a.confidence, 0) / alerts.length)
      : 0,
    closestApproachMeters: alerts.length > 0
      ? Math.round(Math.min(...alerts.map(a => a.accuracyMeters)))
      : 0,
```

- [ ] **Step 4: Verify types compile**

Run: `npm run type-check`

Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add src/types/alert.ts src/mocks/data/mockAnalytics.ts
git commit -m "feat(analytics): generate extended mock analytics data with deterministic seeding"
```

---

### Task 4: Add useComparison Hook and Seed Comparison Data

**Files:**

- Modify: `src/hooks/useAnalytics.ts`
- Modify: `src/utils/seedMockData.ts`

No `useThreatTimeline` hook. The threat timeline is a field on `AnalyticsData` (`analytics.threatTimeline`), populated by the mock generator. The existing `getThreatTimeline()` API endpoint is available for a real backend but is not wired up in the app — single source of truth is the `AnalyticsData` object.

- [ ] **Step 1: Add useComparison hook to useAnalytics.ts**

Add after the existing `useDeviceHistory` hook. Returns the real API shape:

```typescript
export const useComparison = (
  options: {
    period?: 'day' | 'week' | 'month';
    compareWith?: 'previous' | 'lastYear';
    enabled?: boolean;
  } = {}
) => {
  const { period = 'week', compareWith = 'previous', enabled = true } = options;

  return useQuery({
    queryKey: ['analytics-comparison', period, compareWith],
    queryFn: () => analyticsApi.getComparison({ period, compareWith }),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled,
  });
};
```

- [ ] **Step 2: Seed comparison data in seedMockData.ts**

Add after the analytics seeding block (around line 175). The comparison mock creates a "previous period" `AnalyticsData` with slightly different values so that deltas are meaningful:

```typescript
// Comparison data — uses the real API shape.
// The previous-period data must differ in hourlyDayOfWeekDistribution
// so that anomaly detection (spikes, quiet gaps, timing shifts) has a
// meaningful baseline to compare against.
const shiftedHourly = freshAnalytics.hourlyDayOfWeekDistribution.map(entry => ({
  ...entry,
  // Shift counts: halve nighttime (hour 0-5), boost daytime (hour 10-16)
  count:
    entry.hour >= 0 && entry.hour <= 5
      ? Math.round(entry.count * 0.5)
      : entry.hour >= 10 && entry.hour <= 16
        ? Math.round(entry.count * 1.5)
        : entry.count,
}));
// Shift peak hour earlier (move hour-20/21 counts to hour-17/18)
const shiftedHourlyDist = (freshAnalytics.hourlyDistribution ?? []).map(h => ({
  ...h,
  count:
    h.hour >= 20 && h.hour <= 21
      ? Math.round(h.count * 0.3)
      : h.hour >= 17 && h.hour <= 18
        ? Math.round(h.count * 2.0)
        : h.count,
}));
const previousAnalytics: AnalyticsData = {
  ...freshAnalytics,
  totalAlerts: Math.round(freshAnalytics.totalAlerts * 0.85),
  uniqueDevices: Math.round(freshAnalytics.uniqueDevices * 0.75),
  avgConfidence: Math.round(freshAnalytics.avgConfidence * 1.15), // Previous was HIGHER → triggers confidence drop
  closestApproachMeters: Math.round(freshAnalytics.closestApproachMeters * 1.3),
  hourlyDayOfWeekDistribution: shiftedHourly,
  hourlyDistribution: shiftedHourlyDist,
};
const compPeriods = ['day', 'week', 'month'] as const;
compPeriods.forEach(period => {
  queryClient.setQueryData(['analytics-comparison', period, 'previous'], {
    current: freshAnalytics,
    comparison: previousAnalytics,
    percentageChange: {
      totalDetections: 18,
      unknownDevices: 35,
      avgResponseTime: -5,
    },
  });
});
```

Add the `AnalyticsData` type import at the top of `seedMockData.ts`:

```typescript
import type { AnalyticsData } from '@/types/alert';
```

- [ ] **Step 3: Verify types compile**

Run: `npm run type-check`

Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useAnalytics.ts src/utils/seedMockData.ts
git commit -m "feat(analytics): add useComparison hook with correct API shape, seed comparison data"
```

---

### Task 5: Build Insight Generation Service

**Files:**

- Create: `src/services/analyticsInsights.ts`
- Create: `__tests__/services/analyticsInsights.test.ts`

- [ ] **Step 1: Write the test**

Create `__tests__/services/analyticsInsights.test.ts`:

```typescript
import { generateInsights, type Insight } from '@services/analyticsInsights';
import type { AnalyticsData } from '@/types/alert';
import { mockAnalyticsData } from '@/mocks/data';

describe('generateInsights', () => {
  it('returns empty array when no data', () => {
    const result = generateInsights(null, null, []);
    expect(result).toEqual([]);
  });

  it('detects new devices when current period has more unique devices', () => {
    const currentData: AnalyticsData = {
      ...mockAnalyticsData,
      uniqueDevices: 15,
    };
    const previousData: AnalyticsData = {
      ...mockAnalyticsData,
      uniqueDevices: 10,
    };
    const comparisonData = {
      current: currentData,
      comparison: previousData,
      percentageChange: {
        totalDetections: 10,
        unknownDevices: 5,
        avgResponseTime: 0,
      },
    };
    const result = generateInsights(currentData, comparisonData, []);
    const newDevices = result.find(i => i.type === 'new-devices');
    expect(newDevices).toBeDefined();
    expect(newDevices!.title).toContain('5 new device');
  });

  it('detects activity spike when a day exceeds 2x average', () => {
    const analytics: AnalyticsData = {
      ...mockAnalyticsData,
      dailyTrend: [
        { date: '2026-04-01', count: 5 },
        { date: '2026-04-02', count: 5 },
        { date: '2026-04-03', count: 5 },
        { date: '2026-04-04', count: 5 },
        { date: '2026-04-05', count: 5 },
        { date: '2026-04-06', count: 25 },
        { date: '2026-04-07', count: 5 },
      ],
    };
    const result = generateInsights(analytics, null, []);
    const spike = result.find(i => i.type === 'activity-spike');
    expect(spike).toBeDefined();
  });

  it('detects nighttime activity above 20%', () => {
    const analytics: AnalyticsData = {
      ...mockAnalyticsData,
      nighttimeActivity: { count: 30, percentOfTotal: 35, trend: [] },
    };
    const result = generateInsights(analytics, null, []);
    const nighttime = result.find(i => i.type === 'nighttime');
    expect(nighttime).toBeDefined();
  });

  it('detects sensor offline', () => {
    const offlineDevice = { id: '1', name: 'Test', online: false };
    const result = generateInsights(mockAnalyticsData, null, [
      offlineDevice,
    ] as any);
    const offline = result.find(i => i.type === 'sensor-offline');
    expect(offline).toBeDefined();
  });

  it('detects confidence drop when previous period had higher avgConfidence', () => {
    const currentData: AnalyticsData = {
      ...mockAnalyticsData,
      avgConfidence: 55,
    };
    const previousData: AnalyticsData = {
      ...mockAnalyticsData,
      avgConfidence: 78,
    };
    const comparisonData = {
      current: currentData,
      comparison: previousData,
      percentageChange: {
        totalDetections: 10,
        unknownDevices: 5,
        avgResponseTime: 0,
      },
    };
    const result = generateInsights(currentData, comparisonData, []);
    const confDrop = result.find(i => i.type === 'confidence-drop');
    expect(confDrop).toBeDefined();
    expect(confDrop!.severity).toBe('warning');
    expect(confDrop!.subtitle).toContain('23%');
    expect(confDrop!.targetTab).toBe('signals');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/services/analyticsInsights.test.ts --no-coverage`

Expected: FAIL — module not found

- [ ] **Step 3: Implement the service**

Create `src/services/analyticsInsights.ts`:

```typescript
import type { AnalyticsData } from '@/types/alert';
import type { Device } from '@/types/device';

export type InsightType =
  | 'new-devices'
  | 'activity-spike'
  | 'nighttime'
  | 'sensor-offline'
  | 'confidence-drop';

export type InsightSeverity = 'info' | 'warning' | 'critical';

export interface Insight {
  type: InsightType;
  title: string;
  subtitle: string;
  severity: InsightSeverity;
  targetTab?: 'signals' | 'patterns';
}

// Comparison data uses the real API shape
interface ComparisonResponse {
  current: AnalyticsData;
  comparison: AnalyticsData;
  percentageChange: {
    totalDetections: number;
    unknownDevices: number;
    avgResponseTime: number;
  };
}

export function generateInsights(
  analytics: AnalyticsData | null | undefined,
  comparison: ComparisonResponse | null | undefined,
  devices: Device[]
): Insight[] {
  const insights: Insight[] = [];

  if (!analytics) return insights;

  // New devices detected — uses exact uniqueDevices field
  if (comparison?.current && comparison?.comparison) {
    const currentUnique = comparison.current.uniqueDevices;
    const prevUnique = comparison.comparison.uniqueDevices;
    if (currentUnique > prevUnique) {
      const newCount = currentUnique - prevUnique;
      insights.push({
        type: 'new-devices',
        title: `${newCount} new device${newCount !== 1 ? 's' : ''} detected`,
        subtitle: `${currentUnique} unique this period vs ${prevUnique} last period`,
        severity: 'warning',
        targetTab: 'patterns',
      });
    }
  }

  // Activity spike (any day >2× the period average)
  if (analytics.dailyTrend && analytics.dailyTrend.length > 2) {
    const counts = analytics.dailyTrend.map(d => d.count);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const spikeDay = analytics.dailyTrend.find(d => d.count > avg * 2);
    if (spikeDay && avg > 0) {
      const multiplier = (spikeDay.count / avg).toFixed(1);
      insights.push({
        type: 'activity-spike',
        title: `Activity spike: ${multiplier}× average`,
        subtitle: `${spikeDay.date} had ${spikeDay.count} detections`,
        severity: 'warning',
        targetTab: 'patterns',
      });
    }
  }

  // Nighttime activity
  if (
    analytics.nighttimeActivity &&
    analytics.nighttimeActivity.percentOfTotal > 20
  ) {
    insights.push({
      type: 'nighttime',
      title: `${analytics.nighttimeActivity.percentOfTotal}% nighttime activity`,
      subtitle: `${analytics.nighttimeActivity.count} detections between 10 PM–6 AM`,
      severity:
        analytics.nighttimeActivity.percentOfTotal > 40 ? 'critical' : 'info',
      targetTab: 'patterns',
    });
  }

  // Sensor offline
  const offlineDevices = devices.filter(d => !d.online);
  if (offlineDevices.length > 0) {
    insights.push({
      type: 'sensor-offline',
      title: `${offlineDevices.length} sensor${offlineDevices.length !== 1 ? 's' : ''} offline`,
      subtitle: offlineDevices.map(d => d.name).join(', '),
      severity: 'critical',
    });
  }

  // Confidence drop — uses the exact avgConfidence field on AnalyticsData
  if (comparison?.current && comparison?.comparison) {
    const currentConf = comparison.current.avgConfidence;
    const prevConf = comparison.comparison.avgConfidence;
    if (
      currentConf !== undefined &&
      prevConf !== undefined &&
      prevConf - currentConf > 10
    ) {
      insights.push({
        type: 'confidence-drop',
        title: 'Detection confidence dropped',
        subtitle: `${Math.round(prevConf - currentConf)}% decrease vs last period`,
        severity: 'warning',
        targetTab: 'signals',
      });
    }
  }

  return insights;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest __tests__/services/analyticsInsights.test.ts --no-coverage`

Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/analyticsInsights.ts __tests__/services/analyticsInsights.test.ts
git commit -m "feat(analytics): add insight generation service with tests"
```

---

### Task 6: Build Custom Components — InsightCard, ModalityCard, ProximityZoneVisual

**Files:**

- Create: `src/components/molecules/InsightCard/InsightCard.tsx`
- Create: `src/components/molecules/InsightCard/index.ts`
- Create: `src/components/molecules/ModalityCard/ModalityCard.tsx`
- Create: `src/components/molecules/ModalityCard/index.ts`
- Create: `src/components/molecules/ProximityZoneVisual/ProximityZoneVisual.tsx`
- Create: `src/components/molecules/ProximityZoneVisual/index.ts`
- Create: `__tests__/components/molecules/ProximityZoneVisual.test.tsx`

All components use the correct `useTheme()` pattern: `const { theme } = useTheme(); const colors = theme.colors;`

- [ ] **Step 1: Create InsightCard**

Create `src/components/molecules/InsightCard/InsightCard.tsx`:

```tsx
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { useTheme } from '@hooks/useTheme';
import type { Insight } from '@services/analyticsInsights';

interface InsightCardProps {
  insight: Insight;
  onPress?: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#60a5fa',
};

export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onPress,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const dotColor = SEVERITY_COLORS[insight.severity] || '#60a5fa';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: colors.secondarySystemGroupedBackground,
          borderColor: colors.separator,
        },
      ]}
    >
      <View
        style={[styles.iconContainer, { backgroundColor: `${dotColor}15` }]}
      >
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.label }]}>
          {insight.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>
          {insight.subtitle}
        </Text>
      </View>
      <Icon name="chevron-forward" size={16} color={colors.tertiaryLabel} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: '500' },
  subtitle: { fontSize: 12, marginTop: 2 },
});
```

Create `src/components/molecules/InsightCard/index.ts`:

```typescript
export { InsightCard } from './InsightCard';
```

- [ ] **Step 2: Create ModalityCard**

Create `src/components/molecules/ModalityCard/ModalityCard.tsx`:

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms/Text';
import { useTheme } from '@hooks/useTheme';

interface ModalityStat {
  label: string;
  value: string | number;
}

interface ModalityCardProps {
  title: string;
  color: string;
  count: number;
  stats: ModalityStat[];
}

export const ModalityCard: React.FC<ModalityCardProps> = ({
  title,
  color,
  count,
  stats,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.secondarySystemGroupedBackground,
          borderColor: colors.separator,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: `${color}15` }]}>
          <View style={[styles.iconDot, { backgroundColor: color }]} />
        </View>
        <Text style={[styles.title, { color }]}>{title}</Text>
        <Text style={[styles.count, { color: colors.label }]}>{count}</Text>
      </View>
      <View style={styles.statsRow}>
        {stats.map((stat, i) => (
          <View
            key={i}
            style={[
              styles.statBox,
              { backgroundColor: colors.tertiarySystemGroupedBackground },
            ]}
          >
            <Text style={[styles.statValue, { color }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryLabel }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: { width: 12, height: 12, borderRadius: 6 },
  title: { fontSize: 15, fontWeight: '600' },
  count: { marginLeft: 'auto', fontSize: 22, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, borderRadius: 8, padding: 10, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 10, marginTop: 2 },
});
```

Create `src/components/molecules/ModalityCard/index.ts`:

```typescript
export { ModalityCard } from './ModalityCard';
```

- [ ] **Step 3: Create ProximityZoneVisual**

Create `src/components/molecules/ProximityZoneVisual/ProximityZoneVisual.tsx`:

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms/Text';
import { useTheme } from '@hooks/useTheme';

interface ZoneData {
  zone: 'immediate' | 'near' | 'far' | 'extreme';
  count: number;
}

interface ProximityZoneVisualProps {
  data: ZoneData[];
}

const ZONE_CONFIG = {
  immediate: { label: 'Immediate', range: '<5m', color: '#ef4444' },
  near: { label: 'Near', range: '5–15m', color: '#f59e0b' },
  far: { label: 'Far', range: '15–50m', color: '#fbbf24' },
  extreme: { label: 'Extreme', range: '>50m', color: '#4ade80' },
} as const;

export const ProximityZoneVisual: React.FC<ProximityZoneVisualProps> = ({
  data,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const getCount = (zone: string) =>
    data.find(d => d.zone === zone)?.count ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.rings}>
        <View
          style={[
            styles.ring,
            styles.extremeRing,
            { borderColor: `${ZONE_CONFIG.extreme.color}33` },
          ]}
        />
        <View
          style={[
            styles.ring,
            styles.farRing,
            { borderColor: `${ZONE_CONFIG.far.color}4D` },
          ]}
        />
        <View
          style={[
            styles.ring,
            styles.nearRing,
            { borderColor: `${ZONE_CONFIG.near.color}66` },
          ]}
        />
        <View
          style={[
            styles.ring,
            styles.immediateRing,
            {
              borderColor: `${ZONE_CONFIG.immediate.color}80`,
              backgroundColor: `${ZONE_CONFIG.immediate.color}14`,
            },
          ]}
        />
      </View>
      <View style={styles.countsRow}>
        {(['immediate', 'near', 'far', 'extreme'] as const).map(zone => (
          <View key={zone} style={styles.countItem}>
            <Text
              style={[styles.countValue, { color: ZONE_CONFIG[zone].color }]}
            >
              {getCount(zone)}
            </Text>
            <Text style={[styles.countLabel, { color: colors.secondaryLabel }]}>
              {ZONE_CONFIG[zone].label}
            </Text>
            <Text style={[styles.countRange, { color: colors.tertiaryLabel }]}>
              {ZONE_CONFIG[zone].range}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  rings: { height: 160, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 1, borderRadius: 9999 },
  extremeRing: { width: 280, height: 150 },
  farRing: { width: 210, height: 115 },
  nearRing: { width: 140, height: 80 },
  immediateRing: { width: 70, height: 45 },
  countsRow: { flexDirection: 'row', marginTop: 12 },
  countItem: { flex: 1, alignItems: 'center' },
  countValue: { fontSize: 20, fontWeight: '700' },
  countLabel: { fontSize: 10 },
  countRange: { fontSize: 10 },
});
```

Create `src/components/molecules/ProximityZoneVisual/index.ts`:

```typescript
export { ProximityZoneVisual } from './ProximityZoneVisual';
```

- [ ] **Step 4: Write ProximityZoneVisual test**

Create `__tests__/components/molecules/ProximityZoneVisual.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { ProximityZoneVisual } from '@components/molecules/ProximityZoneVisual';

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        secondaryLabel: '#888',
        tertiaryLabel: '#666',
      },
    },
    colorScheme: 'dark',
    setColorScheme: jest.fn(),
  }),
}));

describe('ProximityZoneVisual', () => {
  const mockData = [
    { zone: 'immediate' as const, count: 8 },
    { zone: 'near' as const, count: 27 },
    { zone: 'far' as const, count: 64 },
    { zone: 'extreme' as const, count: 43 },
  ];

  it('renders all zone counts', () => {
    const { getByText } = render(<ProximityZoneVisual data={mockData} />);
    expect(getByText('8')).toBeTruthy();
    expect(getByText('27')).toBeTruthy();
    expect(getByText('64')).toBeTruthy();
    expect(getByText('43')).toBeTruthy();
  });

  it('renders zone labels', () => {
    const { getByText } = render(<ProximityZoneVisual data={mockData} />);
    expect(getByText('Immediate')).toBeTruthy();
    expect(getByText('Near')).toBeTruthy();
    expect(getByText('Far')).toBeTruthy();
    expect(getByText('Extreme')).toBeTruthy();
  });

  it('handles empty data', () => {
    const { getByText } = render(<ProximityZoneVisual data={[]} />);
    expect(getByText('Immediate')).toBeTruthy();
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx jest __tests__/components/molecules/ProximityZoneVisual.test.tsx --no-coverage`

Expected: All 3 tests PASS

- [ ] **Step 6: Update molecules barrel export**

Add to `src/components/molecules/index.ts`:

```typescript
export { InsightCard } from './InsightCard';
export { ModalityCard } from './ModalityCard';
export { ProximityZoneVisual } from './ProximityZoneVisual';
```

- [ ] **Step 7: Commit**

```bash
git add src/components/molecules/InsightCard/ src/components/molecules/ModalityCard/ src/components/molecules/ProximityZoneVisual/ src/components/molecules/index.ts __tests__/components/molecules/ProximityZoneVisual.test.tsx
git commit -m "feat(analytics): add InsightCard, ModalityCard, ProximityZoneVisual components"
```

---

### Task 7: Build Chart Components — StackedAreaChart, ActivityHeatmap, MultiLineChart

**Files:**

- Create: `src/components/organisms/charts/StackedAreaChart.tsx`
- Create: `src/components/organisms/charts/ActivityHeatmap.tsx`
- Create: `src/components/organisms/charts/MultiLineChart.tsx`
- Create: `__tests__/components/organisms/charts/ActivityHeatmap.test.tsx`

All components use `const { theme } = useTheme(); const colors = theme.colors;`

- [ ] **Step 1: Create StackedAreaChart**

Create `src/components/organisms/charts/StackedAreaChart.tsx`. This wraps gifted-charts' LineChart in area mode with 4 stacked datasets (critical, high, medium, low). Each level is cumulative from the bottom. Includes a legend row below the chart. See Task 8 for usage — it receives `analytics.threatTimeline` data directly.

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Text } from '@components/atoms/Text';
import { useTheme } from '@hooks/useTheme';

interface ThreatTimelinePoint {
  date: string;
  label?: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface StackedAreaChartProps {
  data: ThreatTimelinePoint[];
  height?: number;
}

const THREAT_COLORS = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#fbbf24',
  low: '#4ade80',
};

export const StackedAreaChart: React.FC<StackedAreaChartProps> = ({
  data,
  height = 180,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  if (!data || data.length === 0) return null;

  // Cumulative stacking: each level includes everything above it
  const lowData = data.map((d, i) => ({
    value: d.low + d.medium + d.high + d.critical,
    label:
      i % Math.ceil(data.length / 5) === 0 ? d.label || d.date.slice(5) : '',
  }));
  const medData = data.map(d => ({
    value: d.medium + d.high + d.critical,
  }));
  const highData = data.map(d => ({
    value: d.high + d.critical,
  }));
  const critData = data.map(d => ({
    value: d.critical,
  }));

  return (
    <View>
      <LineChart
        data={lowData}
        data2={medData}
        data3={highData}
        data4={critData}
        height={height}
        width={300}
        spacing={300 / Math.max(data.length - 1, 1)}
        color1={THREAT_COLORS.low}
        color2={THREAT_COLORS.medium}
        color3={THREAT_COLORS.high}
        color4={THREAT_COLORS.critical}
        areaChart
        startFillColor1={`${THREAT_COLORS.low}33`}
        startFillColor2={`${THREAT_COLORS.medium}40`}
        startFillColor3={`${THREAT_COLORS.high}4D`}
        startFillColor4={`${THREAT_COLORS.critical}4D`}
        endFillColor1={`${THREAT_COLORS.low}1A`}
        endFillColor2={`${THREAT_COLORS.medium}1A`}
        endFillColor3={`${THREAT_COLORS.high}1A`}
        endFillColor4={`${THREAT_COLORS.critical}1A`}
        hideDataPoints
        thickness={2}
        curved
        yAxisColor="transparent"
        xAxisColor="transparent"
        yAxisTextStyle={{ color: colors.tertiaryLabel, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.tertiaryLabel, fontSize: 9 }}
        hideRules={false}
        rulesColor={colors.separator}
        rulesType="dashed"
        noOfSections={3}
      />
      <View style={styles.legend}>
        {Object.entries(THREAT_COLORS).map(([level, color]) => (
          <View key={level} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={[styles.legendText, { color: colors.secondaryLabel }]}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11 },
});
```

- [ ] **Step 2: Create ActivityHeatmap with period-aware rendering**

Create `src/components/organisms/charts/ActivityHeatmap.tsx`. This supports three modes:

- **24h**: Single-row heatmap by hour (24 columns)
- **7d/30d (default)**: 7 rows (Mon–Sun) × 12 columns (2-hour blocks)
- **1y**: Aggregated by month from the `date` field

```tsx
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms/Text';
import { useTheme } from '@hooks/useTheme';

interface HeatmapDataPoint {
  dayOfWeek: number;
  hour: number;
  count: number;
  date: string;
}

interface ActivityHeatmapProps {
  data: HeatmapDataPoint[];
  period?: 'day' | 'week' | 'month' | 'year';
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOUR_LABELS = [
  '12a',
  '2a',
  '4a',
  '6a',
  '8a',
  '10a',
  '12p',
  '2p',
  '4p',
  '6p',
  '8p',
  '10p',
];
const HOUR_24_LABELS = [
  '12a',
  '',
  '2a',
  '',
  '4a',
  '',
  '6a',
  '',
  '8a',
  '',
  '10a',
  '',
  '12p',
  '',
  '2p',
  '',
  '4p',
  '',
  '6p',
  '',
  '8p',
  '',
  '10p',
  '',
];
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const ACCENT = '#f59e0b';

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  data,
  period = 'week',
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const { grid, rowLabels, colLabels, maxCount } = useMemo(() => {
    if (period === 'day') {
      // Single row, 24 columns (one per hour)
      const row = Array(24).fill(0);
      data.forEach(point => {
        if (point.hour >= 0 && point.hour < 24) {
          row[point.hour] += point.count;
        }
      });
      return {
        grid: [row],
        rowLabels: ['Today'],
        colLabels: HOUR_24_LABELS,
        maxCount: Math.max(1, ...row),
      };
    }

    if (period === 'year') {
      // 7 rows (days) × 12 columns (months)
      const g: number[][] = Array.from({ length: 7 }, () => Array(12).fill(0));
      data.forEach(point => {
        const month = parseInt(point.date.slice(5, 7), 10) - 1; // 0-11
        if (
          point.dayOfWeek >= 0 &&
          point.dayOfWeek < 7 &&
          month >= 0 &&
          month < 12
        ) {
          g[point.dayOfWeek][month] += point.count;
        }
      });
      return {
        grid: g,
        rowLabels: DAY_LABELS,
        colLabels: MONTH_LABELS,
        maxCount: Math.max(1, ...g.flat()),
      };
    }

    // Default: 7 rows × 12 columns (2-hour blocks)
    const g: number[][] = Array.from({ length: 7 }, () => Array(12).fill(0));
    data.forEach(point => {
      const col = Math.floor(point.hour / 2);
      if (point.dayOfWeek >= 0 && point.dayOfWeek < 7 && col >= 0 && col < 12) {
        g[point.dayOfWeek][col] += point.count;
      }
    });
    return {
      grid: g,
      rowLabels: DAY_LABELS,
      colLabels: HOUR_LABELS,
      maxCount: Math.max(1, ...g.flat()),
    };
  }, [data, period]);

  return (
    <View>
      {/* Column labels */}
      <View style={styles.headerRow}>
        <View style={styles.dayLabel} />
        {colLabels.map((label, i) => (
          <View key={i} style={styles.cell}>
            <Text style={[styles.colLabel, { color: colors.tertiaryLabel }]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Grid rows */}
      {rowLabels.map((rowLabel, rowIdx) => (
        <View key={rowLabel} style={styles.row}>
          <View style={styles.dayLabel}>
            <Text style={[styles.dayText, { color: colors.secondaryLabel }]}>
              {rowLabel}
            </Text>
          </View>
          {grid[rowIdx].map((count, colIdx) => {
            const opacity =
              count === 0 ? 0.05 : Math.max(0.1, count / maxCount);
            return (
              <View key={colIdx} style={styles.cell}>
                <View
                  style={[
                    styles.heatCell,
                    {
                      backgroundColor: count === 0 ? 'transparent' : ACCENT,
                      opacity,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View style={styles.legendRow}>
        <Text style={[styles.legendLabel, { color: colors.tertiaryLabel }]}>
          Less
        </Text>
        {[0.1, 0.3, 0.55, 0.8, 1.0].map((op, i) => (
          <View
            key={i}
            style={[
              styles.legendSwatch,
              { backgroundColor: ACCENT, opacity: op },
            ]}
          />
        ))}
        <Text style={[styles.legendLabel, { color: colors.tertiaryLabel }]}>
          More
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', marginBottom: 2 },
  row: { flexDirection: 'row', marginBottom: 2 },
  dayLabel: { width: 32, justifyContent: 'center' },
  dayText: { fontSize: 9 },
  colLabel: { fontSize: 9, textAlign: 'center' },
  cell: { flex: 1, paddingHorizontal: 1 },
  heatCell: { height: 22, borderRadius: 3 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
  },
  legendLabel: { fontSize: 10 },
  legendSwatch: { width: 16, height: 10, borderRadius: 2 },
});
```

- [ ] **Step 3: Create MultiLineChart with invertYAxis support**

Create `src/components/organisms/charts/MultiLineChart.tsx`:

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Text } from '@components/atoms/Text';
import { useTheme } from '@hooks/useTheme';

interface LineDataset {
  label: string;
  color: string;
  dashWidth?: number;
  dashGap?: number;
  data: Array<{ value: number | null; label?: string }>;
}

interface MultiLineChartProps {
  datasets: LineDataset[];
  height?: number;
  yAxisSuffix?: string;
  invertYAxis?: boolean;
}

export const MultiLineChart: React.FC<MultiLineChartProps> = ({
  datasets,
  height = 100,
  yAxisSuffix = '',
  invertYAxis = false,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  if (datasets.length === 0 || datasets[0].data.length === 0) return null;

  // For inverted Y-axis (RSSI: closer to 0 = stronger at top),
  // negate values and format labels back to negative
  const transformValue = (v: number | null) => {
    if (v === null) return 0;
    return invertYAxis ? -v : v;
  };

  const cleanData = (data: Array<{ value: number | null; label?: string }>) =>
    data.map(d => ({
      value: transformValue(d.value),
      label: d.label || '',
    }));

  const spacing = 300 / Math.max(datasets[0].data.length - 1, 1);

  const lineProps: Record<string, any> = {
    data: cleanData(datasets[0].data),
    color1: datasets[0].color,
    thickness: 2,
    ...(datasets[0].dashWidth && {
      dashWidth1: datasets[0].dashWidth,
      dashGap1: datasets[0].dashGap ?? 0,
    }),
  };

  if (datasets[1]) {
    lineProps.data2 = cleanData(datasets[1].data);
    lineProps.color2 = datasets[1].color;
    if (datasets[1].dashWidth) {
      lineProps.dashWidth2 = datasets[1].dashWidth;
      lineProps.dashGap2 = datasets[1].dashGap ?? 0;
    }
  }
  if (datasets[2]) {
    lineProps.data3 = cleanData(datasets[2].data);
    lineProps.color3 = datasets[2].color;
    if (datasets[2].dashWidth) {
      lineProps.dashWidth3 = datasets[2].dashWidth;
      lineProps.dashGap3 = datasets[2].dashGap ?? 0;
    }
  }

  return (
    <View>
      <LineChart
        {...lineProps}
        height={height}
        width={300}
        spacing={spacing}
        hideDataPoints
        curved
        yAxisColor="transparent"
        xAxisColor="transparent"
        yAxisTextStyle={{ color: colors.tertiaryLabel, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.tertiaryLabel, fontSize: 9 }}
        hideRules={false}
        rulesColor={colors.separator}
        rulesType="dashed"
        noOfSections={3}
        yAxisLabelSuffix={yAxisSuffix}
        formatYLabel={invertYAxis ? (v: string) => `-${v}` : undefined}
      />
      <View style={styles.legend}>
        {datasets.map(ds => (
          <View key={ds.label} style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: ds.color }]} />
            <Text style={[styles.legendText, { color: colors.secondaryLabel }]}>
              {ds.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendLine: { width: 16, height: 2, borderRadius: 1 },
  legendText: { fontSize: 11 },
});
```

- [ ] **Step 4: Write ActivityHeatmap test**

Create `__tests__/components/organisms/charts/ActivityHeatmap.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivityHeatmap } from '@components/organisms/charts/ActivityHeatmap';

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        secondaryLabel: '#888',
        tertiaryLabel: '#666',
      },
    },
    colorScheme: 'dark',
    setColorScheme: jest.fn(),
  }),
}));

describe('ActivityHeatmap', () => {
  it('renders day labels in default mode', () => {
    const { getByText } = render(<ActivityHeatmap data={[]} />);
    expect(getByText('Mon')).toBeTruthy();
    expect(getByText('Sun')).toBeTruthy();
  });

  it('renders hour labels in default mode', () => {
    const { getByText } = render(<ActivityHeatmap data={[]} />);
    expect(getByText('12a')).toBeTruthy();
    expect(getByText('12p')).toBeTruthy();
  });

  it('renders single row for 24h period', () => {
    const { getByText, queryByText } = render(
      <ActivityHeatmap data={[]} period="day" />
    );
    expect(getByText('Today')).toBeTruthy();
    expect(queryByText('Mon')).toBeNull();
  });

  it('renders month labels for 1y period', () => {
    const { getByText } = render(<ActivityHeatmap data={[]} period="year" />);
    expect(getByText('Jan')).toBeTruthy();
    expect(getByText('Dec')).toBeTruthy();
  });

  it('renders legend', () => {
    const { getByText } = render(<ActivityHeatmap data={[]} />);
    expect(getByText('Less')).toBeTruthy();
    expect(getByText('More')).toBeTruthy();
  });
});
```

- [ ] **Step 5: Update charts barrel export**

Add to `src/components/organisms/charts/index.ts`:

```typescript
export { StackedAreaChart } from './StackedAreaChart';
export { ActivityHeatmap } from './ActivityHeatmap';
export { MultiLineChart } from './MultiLineChart';
```

- [ ] **Step 6: Run tests**

Run: `npx jest __tests__/components/organisms/charts/ActivityHeatmap.test.tsx --no-coverage`

Expected: All 5 tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/organisms/charts/ __tests__/components/organisms/charts/ActivityHeatmap.test.tsx
git commit -m "feat(analytics): add StackedAreaChart, period-aware ActivityHeatmap, MultiLineChart with invertYAxis"
```

---

### Task 8: Build Overview Tab

**Files:**

- Create: `src/screens/analytics/tabs/OverviewTab.tsx`

- [ ] **Step 1: Create OverviewTab**

Create `src/screens/analytics/tabs/OverviewTab.tsx`. Key contracts:

- Uses `const { theme } = useTheme(); const colors = theme.colors;`
- Comparison data is `{ current: AnalyticsData; comparison: AnalyticsData; percentageChange: {...} }`
- Overview cards compute uniqueDevices, avgConfidence, closestApproach client-side from the two `AnalyticsData` objects
- Threat trend uses `analytics.threatTimeline` directly (real per-day severity data, NOT fabricated from global distribution)
- Sensor health includes `uptimeSeconds` formatted as duration
- closestApproach uses amber color, not green/red

The component receives `analytics: AnalyticsData`, `comparison` (the full API response or null), `period: string`, and `devices` from `useDevices()`.

Overview cards use the exact fields now on `AnalyticsData`:

- **Detections**: `analytics.totalAlerts` vs `comparison.comparison.totalAlerts`
- **Unique Devices**: `analytics.uniqueDevices` vs `comparison.comparison.uniqueDevices`
- **Avg Confidence**: `analytics.avgConfidence` vs `comparison.comparison.avgConfidence`
- **Closest Approach**: `analytics.closestApproachMeters` vs `comparison.comparison.closestApproachMeters` (amber color when closer than previous, per spec)

No approximations. All four values are explicit fields computed in mock data and available on both sides of the comparison.

For the year period, comparison data is unavailable (API only supports day/week/month), so hide the comparison row and show just the values.

The threat trend chart uses `analytics.threatTimeline` — the real per-day breakdown from the mock data, not a proportional spread.

Sensor health shows `device.uptimeSeconds` formatted as a human-readable duration (e.g., "4d 12h").

The full component code is substantial. The implementing agent should:

1. Build the component following the patterns above
2. Match the mockup from the design spec (2×2 comparison grid, stacked area chart, horizontal stacked bar, insight cards, sensor health list)
3. Import `StackedAreaChart` from `@components/organisms/charts`
4. Import `InsightCard` from `@components/molecules`
5. Import `generateInsights` from `@services/analyticsInsights`
6. Import `useDevices` from `@hooks/api/useDevices`

- [ ] **Step 2: Commit**

```bash
git add src/screens/analytics/tabs/OverviewTab.tsx
git commit -m "feat(analytics): build Overview tab with real threat timeline data and sensor uptime"
```

---

### Task 9: Build Signals Tab

**Files:**

- Create: `src/screens/analytics/tabs/SignalsTab.tsx`

- [ ] **Step 1: Create SignalsTab**

Create `src/screens/analytics/tabs/SignalsTab.tsx`. Uses `const { theme } = useTheme(); const colors = theme.colors;`

The RSSI trend chart must pass `invertYAxis={true}` to `MultiLineChart` so that stronger signals (closer to 0 dBm) appear at the top. It must also pass line styles per the spec: WiFi solid (no dash), BLE dashed (`dashWidth: 6, dashGap: 3`), Cellular dotted (`dashWidth: 2, dashGap: 4`).

The component receives `analytics: AnalyticsData` and renders 6 sections matching the design spec:

1. RSSI histogram using gifted-charts `BarChart`
2. Proximity zones using `ProximityZoneVisual`
3. Confidence distribution as progress bars
4. Modality breakdown using 3 `ModalityCard` components
5. Cross-modal correlations (two stat cards)
6. Signal strength trend using `MultiLineChart` with `invertYAxis={true}` and per-line dash styles:
   - WiFi: `{ label: 'WiFi', color: '#60a5fa', data: ... }` (solid — no dashWidth)
   - BLE: `{ label: 'BLE', color: '#2dd4bf', dashWidth: 6, dashGap: 3, data: ... }`
   - Cellular: `{ label: 'Cellular', color: '#a78bfa', dashWidth: 2, dashGap: 4, data: ... }`

- [ ] **Step 2: Commit**

```bash
git add src/screens/analytics/tabs/SignalsTab.tsx
git commit -m "feat(analytics): build Signals tab with RSSI histogram, proximity zones, inverted Y-axis trend"
```

---

### Task 10: Build Patterns Tab

**Files:**

- Create: `src/screens/analytics/tabs/PatternsTab.tsx`

- [ ] **Step 1: Create PatternsTab**

Create `src/screens/analytics/tabs/PatternsTab.tsx`. Uses `const { theme } = useTheme(); const colors = theme.colors;`

The component receives `analytics: AnalyticsData`, `period: 'day' | 'week' | 'month' | 'year'`, and `comparisonAnalytics: AnalyticsData | null` (the `comparison.comparison` object from the comparison API response — this is the previous period's data used as the baseline for anomaly detection).

**Critical: pass `period` to `ActivityHeatmap`** so it renders the correct mode (single-row for 24h, month columns for 1y).

**Critical: DashboardScreen must pass `comparisonAnalytics`** to PatternsTab. This is `comparison?.comparison ?? null` from the `useComparison` hook result.

Anomaly detection must implement all three types from the spec:

- **Spike**: Any 2-hour block with >2× the baseline average for that time slot (use `hourlyDayOfWeekDistribution` from current period vs `comparisonAnalytics.hourlyDayOfWeekDistribution`)
- **Quiet gap**: Any normally-active 2-hour block (baseline avg > 1) with zero detections in current period
- **Timing shift**: Peak activity hour in current data shifted >2 hours from peak hour in `comparisonAnalytics`

The `detectAnomalies` function takes both `analytics.hourlyDayOfWeekDistribution` and `comparisonAnalytics?.hourlyDayOfWeekDistribution`. It should:

1. Aggregate both current and baseline data into 2-hour blocks per day-of-week
2. For each block, compare current count vs baseline count
3. Flag blocks where current > 2× baseline as spikes
4. Flag blocks where baseline avg > 1 but current = 0 as quiet gaps
5. Find the peak hour in current data and peak hour in baseline — if shifted >2 hours, flag as timing shift
6. If `comparisonAnalytics` is null (year period), fall back to self-comparison: use the overall average of the current data as the baseline

Renders 6 sections:

1. Activity heatmap (period-aware via `period` prop)
2. Hourly distribution (24-bar chart)
3. Day of week (7-bar chart, busiest highlighted)
4. Nighttime activity (count, %, area trend)
5. Anomalies (from the enhanced detection above)
6. Activity by sensor (multi-line trend)

- [ ] **Step 2: Commit**

```bash
git add src/screens/analytics/tabs/PatternsTab.tsx
git commit -m "feat(analytics): build Patterns tab with period-aware heatmap and enhanced anomaly detection"
```

---

### Task 11: Create Tab Barrel Export and Refactor DashboardScreen

**Files:**

- Create: `src/screens/analytics/tabs/index.ts`
- Modify: `src/screens/analytics/DashboardScreen.tsx`
- Modify: `src/screens/analytics/index.ts`

- [ ] **Step 1: Create barrel export**

Create `src/screens/analytics/tabs/index.ts`:

```typescript
export { OverviewTab } from './OverviewTab';
export { SignalsTab } from './SignalsTab';
export { PatternsTab } from './PatternsTab';
```

- [ ] **Step 2: Refactor DashboardScreen as tab host**

Replace the contents of `src/screens/analytics/DashboardScreen.tsx`. Key contracts:

- **Named export**: `export const DashboardScreen = ...` (not default export)
- **useTheme**: `const { theme } = useTheme(); const colors = theme.colors;`
- **ScreenLayout header**: `rightActions: <Button>Reports</Button>` (ReactNode, matching existing pattern at line 197)
- **MoreStackParamList**: uses `'Dashboard'` (matches `src/navigation/types.ts:63`)
- **Year period**: `useComparison` is called with `enabled: period !== 'year'` since the API doesn't support year comparison. When `period === 'year'`, comparison is null and the Overview tab hides comparison percentages.
- Passes `period` to both OverviewTab and PatternsTab so they can adapt rendering.
- Passes `comparison` (full API response) to OverviewTab for metric deltas and insight generation.
- Passes `comparison?.comparison ?? null` (the previous period's `AnalyticsData`) to PatternsTab as `comparisonAnalytics` for anomaly baseline detection.

The screen renders:

1. Period selector (existing pattern from current DashboardScreen)
2. Tab bar (Overview | Signals | Patterns) with haptic feedback
3. Conditional tab content based on `activeTab` state

- [ ] **Step 3: Update analytics barrel export**

`src/screens/analytics/index.ts` remains unchanged — it already exports `DashboardScreen` as a named export:

```typescript
export { DashboardScreen } from './DashboardScreen';
export { HeatmapScreen } from './HeatmapScreen';
export { ReportsScreen } from './ReportsScreen';
```

- [ ] **Step 4: Verify types compile**

Run: `npm run type-check`

Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add src/screens/analytics/tabs/index.ts src/screens/analytics/DashboardScreen.tsx
git commit -m "feat(analytics): refactor DashboardScreen into 3-tab host with correct API contracts"
```

---

### Task 12: Run Full Test Suite and Fix Issues

- [ ] **Step 1: Run type check**

Run: `npm run type-check`

Expected: No errors. Fix any that appear.

- [ ] **Step 2: Run all tests**

Run: `npm test -- --no-coverage`

Expected: All tests pass. If existing DashboardScreen tests break, update them for the new tab structure.

- [ ] **Step 3: Run linting and formatting**

Run: `npm run lint:fix && npm run format`

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(analytics): resolve type-check, test, and lint issues from analytics redesign"
```

---

### Task 13: Manual Smoke Test

- [ ] **Step 1: Start the app**

Run: `npm start` then press `i` for iOS simulator.

- [ ] **Step 2: Verify all tabs and periods**

Navigate to Analytics. For each period (24h, 7d, 30d, 1y), check each tab:

**Overview:**

- Comparison cards show values (hidden % change for 1y period)
- Stacked area chart shows real severity breakdown per day (not uniform proportions)
- Detection breakdown bar renders
- Insight cards appear when conditions are met
- Sensor health shows battery % AND uptime duration

**Signals:**

- RSSI histogram renders with median/peak callouts
- Proximity zones render with correct counts
- Confidence distribution bars render
- Modality cards show per-type metrics
- Cross-modal stats render
- RSSI trend has inverted Y-axis (stronger signals at top)

**Patterns:**

- Heatmap renders as single-row for 24h, 7×12 for 7d/30d, month-columns for 1y
- Hourly bars render with peak/quietest callouts
- Day-of-week bars render with busiest highlighted
- Nighttime section shows count, %, and trend
- Anomalies list shows spikes, quiet gaps, and timing shifts
- Per-sensor trend renders multiple lines

- [ ] **Step 3: Commit final state**

```bash
git add -A
git commit -m "feat(analytics): complete analytics redesign — Overview, Signals, Patterns tabs"
```
