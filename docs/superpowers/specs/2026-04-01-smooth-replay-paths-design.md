# Smooth Replay Paths in Demo Mode

Smooth the jerky position jumps in the Replay screen by interpolating device positions between minute-level waypoints and rendering visible trail lines.

## Decisions

- **Path rendering:** Both a visible trail line AND smooth marker animation along it
- **Trail behavior:** Trailing window (last 15 minutes), fading at the tail. Not full history.
- **Interpolation method:** Catmull-Rom spline — passes through all real data points, natural-looking curves, minimal code
- **Bucketing unchanged:** Keep minute-level bucketing. Interpolation is purely a rendering concern layered on top.
- **Scope:** Demo/mock mode only. Real API mode keeps discrete behavior.

## Fractional Time Tracking

The current `useAutoPlay` hook advances by whole minutes. To animate smoothly, add a `progress` value (0.0-1.0) representing position within the current minute.

- During playback, update `progress` at ~60fps using `requestAnimationFrame` or a fast interval (~16ms)
- The RAF loop must consume the full time delta each frame. At high speeds (e.g., 360x), a single 16ms frame represents ~5.76 minutes. Use a while loop that advances as many minutes as needed, carrying over the fractional remainder.
- When scrubbing, set `progress` to 0.0 (snap to start of the target minute)
- The effective time is `minuteIndex + progress` (e.g., 615.73 = 10:15 AM, 73% through)
- At all playback speeds (1x, 10x, 60x, 360x), `progress` ticks at the same frame rate (~60fps). Speed only affects how fast `progress` advances from 0 to 1 within each minute.

## Catmull-Rom Interpolation Utility

A pure function that takes 4 waypoints (P0, P1, P2, P3) and a `t` value (0.0-1.0) and returns the interpolated position on the curve between P1 and P2.

- Input: `{ lat, lng }` for each of the 4 control points, plus `t`
- Output: `{ lat, lng }` at the interpolated position
- For the first waypoint in a path (no P0), duplicate P1 as P0
- For the last waypoint (no P3), duplicate P2 as P3
- Standalone utility, no dependencies, easily testable
- ~15-20 lines of math

The spline passes exactly through P1 at t=0 and P2 at t=1, with curvature influenced by surrounding points.

## Per-Device Path Builder

Given a device's MAC address and the bucketed data, extracts an ordered waypoint list for the trailing window plus one lookahead minute.

- Scans the trailing window (current minute back 15 minutes) **plus one lookahead minute (currentMinute + 1)** for all bucket entries matching the MAC address. The lookahead is essential — without it, during progress 0.0→1.0 within minute N, there is no N+1 waypoint to interpolate toward, and the marker holds position until the minute flips.
- **Future-only device guard:** Devices whose first waypoint is after the current effective time must be suppressed. The lookahead can include minute N+1 which may contain a device not yet "seen" — rendering it during minute N would be a correctness bug. Filter out any device path where `effectiveTime < firstWaypoint.minuteIndex`.
- When multiple entries exist for the same device at the same minute (the mock data generates 2-4 per minute), take only **one canonical sample per device per minute** (the last entry). Multiple same-minute entries create zero-duration segments that degenerate to holds.
- Returns `{ minuteIndex, lat, lng }[]` sorted by time, one entry per minute
- Gaps (minutes with no entry for that device) are skipped — the spline connects through the waypoints that exist within the extraction window (trailing + 1 lookahead)
- Memoized per `minuteIndex` change, not per `progress` tick — the waypoint list only changes when the minute advances

## Smooth Marker Position

Given a device's waypoint list and the current `minuteIndex + progress`, calculate the marker's interpolated position.

- Find which segment the device is on: the two waypoints (W1, W2) whose minute indices straddle the current effective time
- Calculate `t` within that segment: `t = (effectiveTime - W1.minuteIndex) / (W2.minuteIndex - W1.minuteIndex)` where `effectiveTime = minuteIndex + progress`. This handles gaps between waypoints that are both within the extraction window — e.g., if W1 is at minute 610 and W2 is at minute 614, the marker moves proportionally across those 4 minutes. The extraction window is limited to trailing + 1 lookahead, so gaps larger than the window are not interpolated across.
- Feed surrounding 4 waypoints (P0, P1, P2, P3) into Catmull-Rom with `t`
- If only 1 waypoint in the trail, place marker at that point (no interpolation)
- If no waypoints at current time but future ones exist in trail, hold at last known position
- Recalculated every frame (~60fps) — lightweight polynomial evaluation per device

## Trail Line Rendering

For each device in the trailing window, draw a smooth fading path line on the Mapbox map.

- Generate a polyline by sampling the Catmull-Rom spline at regular intervals (e.g., 10 interpolated points per segment) across the trailing window
- Line extends from the oldest waypoint in the window up to the marker's current interpolated position. The head is clipped to the current effective time — a partial segment is generated from the last waypoint to the interpolated position each frame.
- Fade effect: use Mapbox `line-gradient` on the `LineLayer` with `lineMetrics: true` on the `ShapeSource`. The gradient runs from transparent at the start (oldest point) to full opacity at the head (current position). This is the native Mapbox approach and avoids splitting into multiple layers.
- Line styling: 2.5px width, colored by device's threat level (green/yellow/orange/red, matching existing scheme)
- The full trailing polyline is recomputed when `minuteIndex` changes. The head segment (from last waypoint to interpolated head) updates per frame and is appended to the cached polyline.
- Use Mapbox `ShapeSource` with `lineMetrics: true` + `LineLayer` with `lineGradient` for trail rendering

## Type Safety

The `InterpolatedDevice` interface used in `useReplayPath` must use `DetectionType` (from `@/types/alert`) for `signalType` and `ThreatLevel` for `threatLevel` — not `string`. These must match the prop contracts of `DetectedDeviceMarker` (which expects `TriangulationSignalType`, identical values to `DetectionType`) and the existing `BucketEntry` types.

## Scope & Boundaries

- **Demo/mock mode only.** When `isDemoOrMockMode()` is true. Real API mode keeps current discrete behavior — real-world data may have irregular gaps where interpolation would be misleading.
- **Trailing window:** 15 minutes (unchanged from current).
- **No changes to:** bucketing, scrubber UI, autoplay skip logic, `ReplayRadarDisplay` component (circular radar view). Interpolation applies only to Mapbox map rendering in `ProximityHeatmapScreen`.
- **Playback speed:** At 360x the animation is very fast but still frame-interpolated rather than jumping. The RAF loop correctly handles multi-minute frame deltas.

## Files to Modify or Create

| File | Action | Responsibility |
|------|--------|----------------|
| `src/utils/catmullRom.ts` | Create | Catmull-Rom spline interpolation utility |
| `src/hooks/useAutoPlay.ts` | Modify | Add `progress` (0.0-1.0) with overflow-safe RAF loop |
| `src/hooks/useReplayPath.ts` | Create | Per-device path builder (with lookahead + dedup) + smooth marker position + trail line generation |
| `src/screens/radar/ProximityHeatmapScreen.tsx` | Modify | Use interpolated positions for markers, add trail line rendering with lineGradient + lineMetrics |
