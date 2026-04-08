# Analytics Screen Redesign

## Overview

Redesign the Analytics dashboard from a single scrollable page with basic metrics into a tabbed, insight-driven analytics experience that leverages the full depth of ESP32 device telemetry. Three tabs — **Overview**, **Signals**, **Patterns** — provide layered depth: Overview is glanceable and insight-driven; Signals and Patterns go deep into signal-level and temporal data.

### Goals

- Surface the rich device data (RSSI, proximity zones, confidence scores, cross-modal correlations, burst timing, noise floors) that the ESP32 firmware collects but the app currently ignores
- Provide statistical analysis across predefined time ranges (24h, 7d, 30d, 1y)
- Maintain the existing dark tactical UI aesthetic and theme system

### Non-Goals

- Real-time alerting (handled by Home, Alerts, Radar screens)
- Per-fingerprint device tracking (unreliable due to MAC randomization)
- Report generation/export (existing Reports screen, out of scope)

## Architecture

### Tab Structure

The global time range picker (24h / 7d / 30d / 1y) sits above a horizontal tab bar. All tabs share the selected time range.

```
[  24h  |  7d  |  30d  |  1y  ]     ← existing period selector
[ Overview | Signals | Patterns ]    ← new tab bar
─────────────────────────────────
       (tab content)
```

### Chart Library Migration

Replace `react-native-chart-kit` with `react-native-gifted-charts` across the Analytics screen. Gifted Charts is purpose-built for React Native, lighter than Victory, and natively supports stacked area, grouped bar, line with multiple datasets, and histogram-style charts. The activity heatmap (hour × day grid) will be a custom component.

Existing charts on other screens are unaffected by this migration — the swap is scoped to the Analytics screen only.

## Tab 1: Overview

The glanceable tab. Key metrics with period-over-period comparison, a threat trend visualization, detection breakdown, auto-generated insight cards, and sensor health.

### Section 1: Period Comparison Cards (2×2 grid)

Four metric cards, each showing the current value and % change vs the previous equivalent period:

| Card | Metric | Source | Change Color |
|------|--------|--------|-------------|
| Detections | Total alert count in period | `analyticsApi.getComparison()` | Green = decrease, Red = increase (neutral — not inherently good/bad) |
| Unique Devices | Distinct `fingerprintHash` values | New: `comparison.uniqueDevices` | Red = more unknown devices |
| Avg Confidence | Mean `confidence` across alerts | New: `comparison.avgConfidence` | Green = higher confidence |
| Closest Approach | Minimum `accuracyMeters` in period | New: `comparison.closestApproach` | Amber = closer than last period |

**API changes required:** Extend the `getComparison()` response to include `uniqueDevices`, `avgConfidence`, and `closestApproach` in both `current` and `comparison` objects, plus corresponding `percentageChange` fields.

### Section 2: Threat Trend (Stacked Area Chart)

Replaces the current single-line `Detection Trend` chart. Shows all four threat levels (critical, high, medium, low) as stacked areas over time, revealing both total volume and severity composition changes.

- X-axis: time buckets appropriate to period (hours for 24h, days for 7d/30d, months for 1y)
- Y-axis: detection count
- Colors: critical `#ef4444`, high `#f59e0b`, medium `#fbbf24`, low `#4ade80`
- Data source: `analyticsApi.getThreatTimeline()`

**API changes required:** The existing `getThreatTimeline()` endpoint returns `{ timestamp, threatLevel, count }` per bucket — this is sufficient. No changes needed.

### Section 3: Detection Breakdown (Horizontal Stacked Bar)

Replaces the current pie chart. A single horizontal stacked bar showing WiFi / BLE / Cellular proportions, with counts and percentages below.

- Colors: WiFi `#60a5fa`, BLE `#2dd4bf`, Cellular `#a78bfa`
- Data source: `analyticsData.detectionTypeDistribution` (existing)

### Section 4: Highlights (Insight Cards)

Auto-generated, tappable insight cards. Each navigates to the relevant tab/section for more detail. Insight types:

| Insight | Trigger | Detail Link |
|---------|---------|-------------|
| New devices detected | `comparison.uniqueDevices` increased vs previous period | Patterns → Anomalies |
| Activity spike | Any day >2× the period average | Patterns → Hourly Distribution |
| Nighttime activity summary | Night detections > 20% of total | Patterns → Nighttime Activity |
| Sensor offline | Any device `online === false` | Overview → Sensor Health |
| Confidence drop | Avg confidence dropped >10% vs last period | Signals → Detection Confidence |

**Computation:** Insights are derived client-side from the analytics data already fetched for other sections. No dedicated API endpoint needed.

### Section 5: Sensor Health Summary

Per-TrailSense-device status list showing:
- Online/offline indicator (green/red dot)
- Device name
- Battery percentage
- Uptime duration (formatted from `uptimeSeconds`)

Data source: `useDevices()` hook (existing). This section does not depend on the time range picker — it always shows current state.

## Tab 2: Signals

Deep dive into signal-level analytics. All sections respect the selected time range.

### Section 1: Signal Strength Distribution (Histogram)

RSSI distribution across all detections in the period, bucketed in 10 dBm increments from -90 to -20 dBm.

- Bar height = count of detections in that RSSI bucket
- Callouts below: Median RSSI, Peak (strongest) RSSI
- Uses `BarChart` from gifted-charts

**API changes required:** New field on analytics response:

```typescript
rssiDistribution: Array<{
  bucketMin: number;  // e.g., -90
  bucketMax: number;  // e.g., -80
  count: number;
}>
medianRssi: number;
peakRssi: number;
```

### Section 2: Proximity Zone Breakdown

Concentric ellipse visualization showing detection counts per proximity zone, with count and distance range below each zone.

| Zone | Distance | Color |
|------|----------|-------|
| Immediate | <5m | `#ef4444` |
| Near | 5–15m | `#f59e0b` |
| Far | 15–50m | `#fbbf24` |
| Extreme | >50m | `#4ade80` |

Custom component (SVG-based, not a chart library widget).

**API changes required:** New field on analytics response:

```typescript
proximityZoneDistribution: Array<{
  zone: 'immediate' | 'near' | 'far' | 'extreme';
  count: number;
}>
```

### Section 3: Detection Confidence Distribution

Three-tier horizontal progress bars showing the distribution of device confidence scores:
- High (75–100%): green `#4ade80`
- Medium (50–74%): amber `#fbbf24`
- Low (0–49%): red `#ef4444`

**API changes required:** New field on analytics response:

```typescript
confidenceDistribution: Array<{
  tier: 'high' | 'medium' | 'low';
  count: number;
}>
```

### Section 4: Signal Modality Breakdown (3 Cards)

Per-detection-type card, each showing three metrics specific to that modality:

**WiFi card:**
- Channels active: count of distinct WiFi channels seen (from `channel_bitmap`)
- Probe request %: percentage of WiFi detections that were probe requests vs beacons
**BLE card:**
- Phone %: percentage of BLE detections classified as phones (from `is_phone_likely`)
- Apple %: percentage with Apple manufacturer data (from `has_apple_mfr`)
- Beacon %: percentage classified as beacons (from `is_beacon`)

**Cellular card:**
- Avg power: mean `peak_dbm` across cellular bursts
- Avg burst duration: mean `burst_duration_ms`
- Noise floor: mean `noise_floor_dbm`

**API changes required:** New endpoint or analytics response section:

```typescript
modalityBreakdown: {
  wifi: {
    count: number;
    channelsActive: number;
    probeRequestPercent: number;
  };
  ble: {
    count: number;
    phonePercent: number;
    applePercent: number;
    beaconPercent: number;
  };
  cellular: {
    count: number;
    avgPeakDbm: number;
    avgBurstDurationMs: number;
    avgNoiseFloorDbm: number;
  };
}
```

### Section 5: Cross-Modal Correlations

Two stat cards side by side:
- **WiFi↔BLE Links**: count of cross-modal device correlations with average link confidence
- **Phantom Merges**: count of MAC rotation detections (devices that changed MAC but were identified as the same device via IE fingerprint)

Venn-diagram-style visualization above the cards showing WiFi and BLE overlap.

**API changes required:** New analytics response fields:

```typescript
crossModalStats: {
  wifiBleLinks: number;
  avgLinkConfidence: number;
  phantomMerges: number;
}
```

### Section 6: Signal Strength Trend (Multi-Line Chart)

Average RSSI per modality per time bucket, plotted as three lines on the same chart. Y-axis is inverted (closer to 0 = stronger signal at top).

- WiFi: solid line `#60a5fa`
- BLE: dashed line `#2dd4bf`
- Cellular: dotted line `#a78bfa`

**API changes required:** New analytics response field:

```typescript
rssiTrend: Array<{
  date: string;
  wifiAvgRssi: number | null;
  bleAvgRssi: number | null;
  cellularAvgRssi: number | null;
}>
```

## Tab 3: Patterns

Temporal pattern analysis and anomaly detection. All sections respect the selected time range.

### Section 1: Activity Heatmap (Hour × Day-of-Week Grid)

GitHub-contributions-style grid: 7 rows (Mon–Sun) × 12 columns (2-hour blocks). Cell opacity proportional to detection count in that slot. Custom component using a flat grid of styled Views.

- Color: amber `#f59e0b` with opacity 0.05–1.0 based on count
- Legend: gradient strip from "Less" to "More"
- For 24h period: show a single-row heatmap by hour instead (client-side: filter to today's data)
- For 1y period: show month × day-of-week (client-side: aggregate the same `hourlyDayOfWeekDistribution` data by month from the `date` field — requires adding `date` to each entry, see API changes below)

**API changes required:** New endpoint or analytics response section:

```typescript
hourlyDayOfWeekDistribution: Array<{
  dayOfWeek: number;  // 0=Mon, 6=Sun
  hour: number;       // 0-23
  count: number;
  date: string;       // ISO date, for client-side aggregation by month in 1y view
}>
```

### Section 2: Hourly Distribution (24-Bar Chart)

Bar chart with one bar per hour (0–23). Peak and quietest hours called out below.

**API changes required:** The existing `hourlyDistribution` field on `AnalyticsData` (`Array<{ hour: number; count: number }>`) is sufficient. Currently listed as a legacy field — promote it to a primary field.

### Section 3: Day of Week (Bar Chart)

Seven vertical bars (Mon–Sun), busiest day highlighted with accent color. Count label above each bar.

**API changes required:** New analytics response field:

```typescript
dayOfWeekDistribution: Array<{
  day: number;  // 0=Mon, 6=Sun
  count: number;
}>
```

### Section 4: Nighttime Activity (Isolated View)

Detections occurring between 10 PM–6 AM, shown as:
- Total nighttime detection count
- Percentage of all detections that occurred at night
- Area chart showing nightly detection count across the period

This aligns with the device firmware's threat scoring which adds +20 points for detections between 22:00–06:00.

**API changes required:** New analytics response fields:

```typescript
nighttimeActivity: {
  count: number;
  percentOfTotal: number;
  trend: Array<{ date: string; count: number }>;
}
```

### Section 5: Anomalies (Auto-Detected List)

Statistically unusual patterns detected by comparing current-period data against the historical baseline. Each anomaly shows a severity dot, title, and magnitude description.

Anomaly detection types:
- **Spike**: Any 2-hour block with >2× the historical average for that time slot
- **Quiet gap**: Any normally-active period with zero detections
- **Timing shift**: Peak activity hour shifted >2 hours from historical norm

**Computation:** Client-side. Compare current period's `hourlyDayOfWeekDistribution` against a baseline from `getComparison()` with `compareWith: 'previous'`. No dedicated anomaly API needed.

**API changes required:** None beyond what's already specified above.

### Section 6: Activity by Sensor (Multi-Line Trend)

One line per TrailSense device showing detection count per time bucket. Reveals whether sensors are seeing similar activity or if one is carrying most of the load.

**API changes required:** New analytics response field:

```typescript
perSensorTrend: Array<{
  date: string;
  sensors: Array<{
    deviceId: string;
    deviceName: string;
    count: number;
  }>;
}>
```

## API Changes Summary

All new fields are additions to the existing `AnalyticsData` response from `GET /api/analytics`. No new endpoints are required — the existing endpoint is extended.

### New fields on `AnalyticsData`:

```typescript
// Signals tab
rssiDistribution: Array<{ bucketMin: number; bucketMax: number; count: number }>;
medianRssi: number;
peakRssi: number;
proximityZoneDistribution: Array<{ zone: string; count: number }>;
confidenceDistribution: Array<{ tier: string; count: number }>;
modalityBreakdown: { wifi: {...}; ble: {...}; cellular: {...} };
crossModalStats: { wifiBleLinks: number; avgLinkConfidence: number; phantomMerges: number };
rssiTrend: Array<{ date: string; wifiAvgRssi: number; bleAvgRssi: number; cellularAvgRssi: number }>;

// Patterns tab
hourlyDayOfWeekDistribution: Array<{ dayOfWeek: number; hour: number; count: number; date: string }>;
dayOfWeekDistribution: Array<{ day: number; count: number }>;
nighttimeActivity: { count: number; percentOfTotal: number; trend: Array<{ date: string; count: number }> };
perSensorTrend: Array<{ date: string; sensors: Array<{ deviceId: string; deviceName: string; count: number }> }>;

// Overview tab (extend existing comparison endpoint)
// Add to getComparison() response:
uniqueDevices: number;
avgConfidence: number;
closestApproach: number;
```

### Existing endpoints used as-is:
- `analyticsApi.getThreatTimeline()` — for stacked area chart
- `analyticsApi.getComparison()` — for period comparison cards (extended with new fields)
- `analyticsApi.getAnalytics()` — for detection type distribution, daily trend
- `useDevices()` — for sensor health (not time-range dependent)

## Mock Data

All new fields must be added to `src/mocks/data/mockAnalytics.ts`. Mock data should be generated dynamically from `mockAlerts` (matching the existing pattern) rather than hardcoded, ensuring realistic distributions and correct totals.

For fields derived from device firmware data not present in the current alert model (e.g., `modalityBreakdown.wifi.phantomMacMerges`, `crossModalStats`), generate plausible mock values using randomization seeded by the alert data.

## Component Structure

```
src/screens/analytics/
  DashboardScreen.tsx          ← refactored: now hosts tab navigation
  tabs/
    OverviewTab.tsx
    SignalsTab.tsx
    PatternsTab.tsx

src/components/organisms/charts/
  StackedAreaChart.tsx          ← wraps gifted-charts AreaChart
  HorizontalStackedBar.tsx     ← detection breakdown
  RssiHistogram.tsx            ← wraps gifted-charts BarChart
  HourlyBarChart.tsx            ← 24-bar hourly distribution
  DayOfWeekChart.tsx            ← 7-bar day of week
  ActivityHeatmap.tsx           ← custom: hour × day grid
  MultiLineChart.tsx            ← wraps gifted-charts LineChart with multiple datasets

src/components/molecules/
  ProximityZoneVisual.tsx       ← concentric ellipse SVG
  InsightCard.tsx               ← tappable highlight card
  ModalityCard.tsx              ← per-signal-type stat card
  CrossModalCard.tsx            ← venn diagram + stat cards
```

## Testing

- Unit tests for each new chart/component with mock data
- Unit tests for insight generation logic (spike detection, anomaly computation)
- Unit tests for mock data generators (verify distributions sum correctly)
- Integration test for tab navigation and time range picker state sharing
