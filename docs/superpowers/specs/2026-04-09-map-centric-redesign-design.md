# Map-Centric Redesign — Design Spec

**Date:** 2026-04-09
**Branch:** Experimental branch (non-destructive — existing screens left in place but unreferenced)
**Approach:** Hybrid — new MapScreen composed from existing data layer

## Vision

Strip TrailSense back to its core purpose: "Are there any devices emitting RF signals, and if so, where are they?" The app becomes a single full-screen map showing TrailSense sensor nodes and the detected devices they've triangulated. No tabs, no alerts screen, no AI chat, no analytics, no replay.

## App Structure

After authentication, the app renders a single `MapScreen` directly — no tab bar, no navigation stacks.

```
RootNavigator (auth-gated)
├── AuthNavigator (unchanged)
└── MapScreen (replaces MainNavigator)
```

### MapScreen Layout

```
┌─────────────────────────────┐
│ Status Bar (iOS)            │
├─────────────────────────────┤
│                             │
│  [⚙]              [🛰/🗺]  │  floating controls
│                             │
│      Full-Screen MapBox     │
│    (outdoor/terrain style)  │
│                             │
│   🔵 sensor node            │
│         📍📍 detections     │
│                             │
│  ┌─ Status Chip ──────────┐│
│  └────────────────────────┘│
├─────────────────────────────┤
│  Bottom Sheet (on tap)      │
└─────────────────────────────┘
```

**Floating controls:**
- Top-left: gear icon — opens SettingsOverlay (logout, app version)
- Top-right: map style toggle (outdoor/terrain ↔ satellite)
- Bottom-center: StatusChip showing detection count

**Map defaults:**
- Style: `mapbox/outdoors-v12`
- Satellite toggle switches to `Mapbox.StyleURL.SatelliteStreet`
- Scroll and zoom enabled, pitch and rotate disabled
- Camera initially centers on the centroid of all sensor nodes

## Data Flow

### Fetching

`MapScreen` fetches all sensor nodes via `useDevices()`, then calls `usePositions(deviceId)` for each online device. Positions from all sensors are merged, deduplicated by `fingerprintHash` (keeping the highest-confidence triangulation per fingerprint), and rendered as one marker per unique detected device.

```
useDevices() → devices[]
  └─ for each online device:
       usePositions(device.id) → positions[]
           └─ deduplicate by fingerprintHash
               └─ one marker per unique fingerprint
```

Each deduplicated position tracks which sensor(s) detected it, so the bottom sheet can list multiple detecting nodes.

### Real-Time Updates

WebSocket service stays as-is:
- `device-status` events update device online/offline, battery, signal strength via React Query cache invalidation
- `positions-updated` events update triangulated positions via React Query cache invalidation

### Position Animation

When positions update:
- Existing detections interpolate from old → new coordinates over ~500ms using a simple linear lerp on lat/lng (the Catmull-Rom spline math in `useReplayPath` is for multi-point path smoothing and is overkill here — a basic lerp between two points is sufficient for live updates)
- New detections fade in (opacity 0 → 1 over 300ms)
- Stale detections (no update for 60s+) fade out and are removed

### State Management

**Active:**
- Redux: `authSlice` (persisted), `settingsSlice` (persisted), `blockedDevicesSlice` (persisted, unused until known-device filtering is built)
- React Query: `['devices']`, `['positions', deviceId]` cache keys
- WebSocket: `positions-updated`, `device-status` event listeners
- Local component state: map camera position, bottom sheet open/close, selected marker, map style

**Kept in store config but unreferenced by new code:**
- `savedReportsSlice`, `uiSlice`, `userSlice` — remain in the Redux reducer to avoid breaking TypeScript in old (unreferenced) screen files
- All Zustand stores (`radarStore`, `filterStore`, `uiStore`) — left in place, unreferenced

### Mock Mode

`EXPO_PUBLIC_USE_MOCK_API=true` continues to work. Same 5 mock devices, same mock WebSocket emitting events every 5-15 seconds, same mock positions. Mock position objects lack `deviceId` on individual entries (only the envelope has it), so `useAllPositions` injects `deviceId` from the React Query key context when merging.

## New Components

### 1. MapScreen (`src/screens/map/MapScreen.tsx`)

The single screen of the app.

- Full-screen `Mapbox.MapView` with outdoor-v12 style
- Calls `useDevices()` to get all sensors
- Calls `usePositions(deviceId)` for each online sensor
- Renders `TrailSenseDeviceMarker` for each sensor node
- Renders `DetectedDeviceMarker` for each triangulated position
- Floating gear icon (top-left) opens `SettingsOverlay`
- Floating satellite toggle (top-right) swaps map style
- `StatusChip` anchored at bottom-center
- On marker tap: opens appropriate bottom sheet with marker data
- WebSocket is handled globally by `AuthLifecycle` — MapScreen does NOT call `useWebSocket` (avoids duplicate connections)

### 2. StatusChip (`src/components/molecules/StatusChip/StatusChip.tsx`)

Small pill overlay at bottom-center of map.

- "No active detections" when no unique fingerprints are detected
- "{n} devices detected" when unique fingerprints exist (deduplicated count, not raw position count)
- Subtle semi-transparent background, small text
- Non-interactive

### 3. DetectionBottomSheet (`src/components/organisms/DetectionBottomSheet/DetectionBottomSheet.tsx`)

Slides up when a detected device marker is tapped. Uses `@gorhom/bottom-sheet` v5.

Contents:
- Signal type icon + color (WiFi `#007AFF`, Bluetooth `#5856D6`, Cellular `#FF9500`)
- Fingerprint hash
- Confidence percentage
- Accuracy in meters
- Which sensor node(s) detected it (derived from deduplication — lists all sensors that reported this fingerprint)
- Last seen timestamp
- Swipe down to dismiss

Future (not built now): "Mark as Known" and "Block" action buttons.

### 4. DeviceBottomSheet (`src/components/organisms/DeviceBottomSheet/DeviceBottomSheet.tsx`)

Slides up when a sensor node marker is tapped. Uses `@gorhom/bottom-sheet` v5.

Contents:
- Device name
- Online/offline status indicator
- Battery percentage
- Signal strength
- Last seen / uptime
- Count of devices currently being detected by this sensor
- Simple list of detected devices (fingerprint hash + signal type)
- "Rename" action

Future (not built now): configure and remove device actions.

### 5. SettingsOverlay (`src/components/organisms/SettingsOverlay/SettingsOverlay.tsx`)

Triggered by gear icon. Simple modal.

Contents:
- Logout button (dispatches auth logout action)
- App version string
- Placeholder for future settings

## Existing Components Reused

- `TrailSenseDeviceMarker` — blue pulsing `PointAnnotation` for sensor nodes. Minor change: add `onPress` prop (wired to `PointAnnotation.onSelected`).
- `DetectedDeviceMarker` — color-coded `PointAnnotation` for RF detections. No changes needed (already has `onPress`).

## Existing Infrastructure Reused

- `src/api/client.ts` — axios instance with auth interceptors
- `src/api/endpoints/devices.ts` — device CRUD
- `src/api/endpoints/positions.ts` — position fetching
- `src/api/websocket.ts` — WebSocket service
- `src/hooks/api/useDevices.ts` — React Query hook for devices
- `src/hooks/api/usePositions.ts` — React Query hook for positions
- `src/hooks/useWebSocket.ts` — WebSocket subscription hook
- `src/hooks/useReplayPath.ts` — available for reference but not directly used; live position animation uses a simpler lerp
- `src/mocks/` — all mock data, mock WebSocket, mock API adapter
- `src/store/slices/authSlice.ts` — authentication state
- `src/store/slices/settingsSlice.ts` — user preferences
- `src/components/AuthLifecycle.tsx` — auth state management
- `src/components/molecules/TrailSenseDeviceMarker/`
- `src/components/molecules/DetectedDeviceMarker/`

## What Gets Disconnected

All items below are left in place but unreferenced by the new code. Nothing is deleted — the files remain on disk and can be re-wired if needed.

### Navigation
- `MainNavigator.tsx` — tab bar navigator (import replaced with MapScreen in RootNavigator)
- All stacks: `HomeStack`, `AlertsStack`, `AIStack`, `RadarStack`, `DevicesStack`, `MoreStack`, `AnalyticsStack`, `SettingsStack`
- `navigation/types.ts` — stack param lists (left in place, unreferenced)
- `navigation/linking.ts` — deep link config replaced with flat `Main: 'map'` route
- `navigation/persistence.ts` — persisted nav state cleared on upgrade (old nested tab state is incompatible with single-screen layout)

### Screens
- All existing screens remain on disk but are no longer imported or rendered: `PropertyCommandCenter`, `AlertListScreen`, `AlertDetailScreen`, `AIAssistantScreen`, `ProximityHeatmapScreen`, `DeviceListScreen`, `DeviceDetailScreen`, `DashboardScreen`, `ReportsScreen`, `ReportBuilderScreen`, `BriefScreen`, `ReportPreviewScreen`, all settings screens, fingerprint screen, known devices screen, vacation mode, etc.

### Store
- `savedReportsSlice`, `uiSlice`, `userSlice` — kept in store config to avoid TypeScript breakage in old screens, but unreferenced by new code
- All Zustand stores: `radarStore`, `filterStore`, `uiStore` — left in place, unreferenced

### Services (left in place, unreferenced)
- `src/services/llm/` — entire LLM pipeline
- `src/services/threatClassifier.ts`
- `src/services/fingerprintStore.ts`
- `src/services/reportExport.ts`

### Components (left in place, unreferenced)
- All organisms: `AlertCard`, `RadarDisplay`, `TimelineScrubber`, chart components, report components
- Most molecules: `InsightCard`, `SearchBar`, `FilterChip`, `FloatingActionBar`, etc.
- AI components: `ChatMessage`, `SuggestionChips`, briefing cards
- Templates: `EmptyState`, `ErrorState`, etc.

## Out of Scope

- Known device filtering (show/hide whitelisted devices on map)
- Device fleet management (add/remove/configure sensors)
- Alert history or notifications
- Replay / historical position playback
- AI / LLM features
- Analytics or reporting
