# Workstream 2: Replay Radar — Design Document

Generated: 2026-04-01
Branch: main

## Overview

Transform the Radar tab into a time-travel interface. A header segmented control on ProximityHeatmapScreen toggles between the existing MapBox heatmap ("Live Map") and a new dark-mode Replay Radar. The replay radar shows historical detection data on a Skia-rendered circular radar with a gesture-driven timeline scrubber, fading dot trails, and fingerprint peek cards.

## Navigation & Screen Architecture

The Radar tab keeps `ProximityHeatmapScreen` as its entry point. A header segmented control ("Live Map | Replay") toggles between the existing MapBox heatmap and the new `ReplayRadarDisplay`.

Both modes share the `LiveRadar` route — no new screen is pushed. Selecting "Replay" triggers a crossfade transition from the light heatmap to a dark-background replay radar. Local state (`mode: 'live' | 'replay'`) drives which component renders.

### Deep Link from ActivitySparkline

`onHourPress` navigates to the Radar tab, sets mode to `'replay'`, and passes `startHour` as a route param. The `RadarStackParamList` gains an optional `startHour?: number` param on the `LiveRadar` route. When present, the scrubber initializes to that hour's start time instead of midnight.

```typescript
type RadarStackParamList = {
  LiveRadar: { startHour?: number } | undefined;
  RadarSettings: undefined;
  DeviceFingerprint: { fingerprintHash: string };
};
```

The existing `RadarDisplay` component is untouched — `ReplayRadarDisplay` is a wholly new organism that shares the circular radar aesthetic (range rings, crosshairs, center dot) but is built on Skia instead of SVG.

## ReplayRadarDisplay Component

New Skia-based organism that renders a circular radar with time-filtered detection data.

### Props

```typescript
interface ReplayRadarDisplayProps {
  timestamp: SharedValue<number>; // Reanimated shared value, epoch ms
  positions: TimeBucketedPositions; // Pre-bucketed at load time
  maxRange?: number; // Default 244 (meters, ~800ft)
  propertyCenter: { latitude: number; longitude: number };
  onDotTap?: (fingerprintHash: string) => void;
  onEmptyTap?: () => void;
  style?: ViewStyle;
}
```

### Projection

Fixed-radius equirectangular projection. Each `TriangulatedPosition`'s lat/lng is converted to x/y on the Skia canvas relative to `propertyCenter`. Positions beyond `maxRange` clip to the circle edge. North is always 12 o'clock.

### Visual Elements (all Skia)

- 4 concentric range rings (matching existing RadarDisplay aesthetic)
- Crosshairs dividing quadrants
- Center property dot (blue)
- **Detection dots** — colored by threat level, sized by confidence. Only positions within the current 1-minute bucket (driven by `timestamp` shared value) render at full opacity.
- **Fading trail** — Previous dots from the trailing 15-minute window render with decreasing opacity. Newest = full opacity, oldest = ~0.1 opacity. No connecting lines.

### Gesture Handling

- Tap a detection dot → calls `onDotTap` with the `fingerprintHash`
- Tap empty space → calls `onEmptyTap` (parent uses this to pause auto-play)

The `timestamp` shared value is driven by `TimelineScrubber` — because it's a Reanimated shared value, the radar re-renders on the UI thread during scrubbing with no JS bridge hops.

## Time Bucketing & Data Layer

### Pre-bucketing at Load Time

When replay mode activates, all `TriangulatedPosition` data for the selected 24h window is fetched and sorted into 1-minute buckets (1,440 buckets per day). This happens once on a background thread, not during scrubbing.

```typescript
interface TimeBucketedPositions {
  startTime: number; // epoch ms, midnight
  buckets: Map<number, BucketEntry[]>; // key = minute index (0-1439)
}

interface BucketEntry {
  fingerprintHash: string;
  x: number; // pre-computed radar x
  y: number; // pre-computed radar y
  threatLevel: ThreatLevel;
  confidence: number;
  signalType: DetectionType;
}
```

### Key Decisions

- Lat/lng to x/y projection is computed at bucket time, not render time. The radar only reads pre-computed coordinates during scrubbing.
- The 15-minute trailing window means the renderer reads the current bucket plus the previous 14 buckets. With pre-computed x/y, this is a simple map lookup — no math on the UI thread.
- Empty buckets are simply absent from the Map. The renderer checks existence, gets nothing, draws nothing.

## TimelineScrubber Component

New organism at the bottom of the replay screen. Drives the `timestamp` shared value that controls the radar.

### Layout (bottom to top)

- **Time labels row** — "12am - 6am - 12pm - 6pm - Now" evenly spaced
- **Scrub track** — Horizontal bar (full width, ~40px tall) showing density visualization. Each segment is colored by the highest threat level in that time window. Empty periods are dark/minimal.
- **Draggable playhead** — Golden accent circle with subtle glow, sits on the track. Pan gesture drives its position.
- **Timestamp display** — Large text above the track showing current time (e.g., "2:47 AM") with date
- **Transport controls** — Play/pause button, skip-forward/skip-back (jump to next/previous detection cluster), speed selector pill (1x - 10x - 60x - 360x)

### Interaction Model

- **Drag playhead** → updates `timestamp` shared value directly on UI thread via Reanimated. Radar responds at 60fps.
- **Lift finger** → auto-play begins from current position at the selected speed
- **Tap play/pause** → toggles auto-play
- **Tap speed pill** → cycles through 1x, 10x, 60x, 360x
- **Skip buttons** → jump to the start of the next/previous detection cluster (any bucket with entries)

### Auto-play Behavior

- Default speed: 1s real time = 10min replay (10x)
- No-activity skip: when the playhead enters a window with no detections for 15+ minutes, the radar dims with "No Activity" text overlay, and auto-play fast-forwards to the next cluster
- Reaches end of timeline → stops at "Now"

### Reanimated Shared Values

- `timestamp` (epoch ms) — shared between scrubber and radar
- `playbackSpeed` (multiplier)
- `isPlaying` (boolean as 0/1)

## FingerprintPeek & Interactions

### FingerprintPeek Bottom Sheet

When the user taps a detection dot, a small bottom sheet slides up (~30% screen height) showing a compact fingerprint card:

- **Avatar** — "?" for unknown, initial letter for known devices
- **Name** — Device name if known, "Unknown Device" otherwise
- **Badges** — Known/New, signal type (cellular/wifi/bluetooth)
- **Signal strength** — RSSI bar indicator
- **Manufacturer** — Derived from OUI lookup
- **Last seen** — Relative to current scrub position, not wall clock
- **Action row** — "View Full Profile" button navigates to `DeviceFingerprintScreen` (WS3)

### Interaction State Machine

```
IDLE → tap dot → PEEK_SHOWN (auto-play pauses)
PEEK_SHOWN → tap "View Full Profile" → navigate to DeviceFingerprintScreen
PEEK_SHOWN → tap outside / swipe down → IDLE (auto-play resumes)
PEEK_SHOWN → drag scrubber → IDLE (peek dismisses, scrubbing takes over)
```

### Crossfade Zoom Transition

When toggling from "Live Map" to "Replay":

- Heatmap fades out (opacity 1 to 0, 300ms)
- Background transitions from light theme to dark (#0a0a0f)
- Replay radar fades in (opacity 0 to 1, 300ms) with a subtle scale (0.95 to 1.0)
- Reverse on switching back to "Live Map"
- When `reduceMotion` is enabled: instant swap, no animation

## Mock Data Generator

`src/mocks/data/mockReplayPositions.ts` produces a full 24h of `TriangulatedPosition` data with four scenarios:

| Scenario            | Time              | Duration   | Positions     | Behavior                                        |
| ------------------- | ----------------- | ---------- | ------------- | ----------------------------------------------- |
| Delivery driver     | 10:15 AM, 3:30 PM | 5 min each | ~10 per visit | Approaches from south, stops near door, leaves  |
| Repeat visitor      | 8 AM, 12 PM, 6 PM | 3 min each | ~6 per visit  | Same approach from east, consistent pattern     |
| Suspicious loiterer | 1:30 AM           | 45 min     | ~90           | Slow drift along north boundary, back and forth |
| Passing vehicle     | 7:45 AM           | 2 min      | ~8            | Fast west-to-east traversal at max range        |

Each position gets a `fingerprintHash`, `signalType`, `confidence`, and `threatLevel`. The generator uses the property center from existing mock device GPS coordinates and distributes positions within the `maxRange` radius realistically.

## Test Plan

### Unit Tests

- Time bucket pre-computation: detections sorted into 1-minute buckets
- Sparse data handling: 24h with 1 detection shows correct bucket
- Detection trail geometry: fading dots for 15-min window with correct opacity
- Speed selector: cycles through 1x, 10x, 60x, 360x
- Radar projection: lat/lng to x/y for known property center and maxRange

### Integration Tests

- Scrubber gesture: drag updates timestamp, lift finger starts auto-play
- Scrub during auto-play: touch cancels auto-play, scrub takes over
- Tap detection dot: shows FingerprintPeek bottom sheet, pauses auto-play
- Tap empty space during playback: pauses auto-play
- No-activity skip: auto-play advances past empty 15-min windows
- Sparse data: fewer than 3 clusters disables auto-play, shows summary
- 60fps verification: scrub gesture does not drop below 55fps

### Performance Tests

- Replay data load: < 500ms for 24h of detection history
- Pattern computation: < 200ms for 90 days of data (1000 detections)

## Accessibility

All animations check `AccessibilityInfo.isReduceMotionEnabled()`. When enabled:

- Instant mode switch (no crossfade)
- Static dots (no fade trail animation)
- No playhead glow pulse
- Auto-play still functions, just without visual transitions

## File Structure

### New Files

```
src/
  components/
    organisms/
      ReplayRadarDisplay/
        ReplayRadarDisplay.tsx    # Skia radar with time-filtered dots
        index.ts
      TimelineScrubber/
        TimelineScrubber.tsx      # Pan gesture + transport controls
        index.ts
    molecules/
      FingerprintPeek/
        FingerprintPeek.tsx       # Bottom sheet compact card
        index.ts
  hooks/
    useTimeBucketing.ts           # Pre-buckets positions into 1-min slots
    useAutoPlay.ts                # Auto-play timer, speed control, skip logic
    useRadarProjection.ts         # Lat/lng to x/y for fixed-radius circle
  mocks/
    data/
      mockReplayPositions.ts      # 4-scenario position generator
```

### Modified Files

```
src/screens/radar/ProximityHeatmapScreen.tsx  # Add header segmented control, mode toggle
src/screens/radar/LiveRadarScreen.tsx         # Remove (no longer used)
src/navigation/stacks/RadarStack.tsx          # Add startHour param to LiveRadar route
src/navigation/types.ts                       # Update RadarStackParamList
src/components/molecules/ActivitySparkline/
  ActivitySparkline.tsx                       # Wire onHourPress to navigate to replay
```

### Dependencies (all already installed)

- `@shopify/react-native-skia` 1.5.0 — radar rendering
- `react-native-reanimated` ~3.16.1 — shared values, gesture-driven scrubbing
- `react-native-gesture-handler` — pan gesture for scrubber
- No new dependencies required
