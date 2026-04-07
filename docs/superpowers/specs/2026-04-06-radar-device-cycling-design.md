# Radar Screen Device Cycling

## Problem

The Radar screen (`ProximityHeatmapScreen.tsx`) is hardcoded to show only the first device (`devices[0]`). Users with multiple deployed sensors have no way to view Live Map or Replay for any device other than the first one. The "1/5" text indicator at line 128 is static and non-interactive.

## Solution

Add a dropdown device picker to the Radar screen so users can cycle through their deployed devices. Selecting a device re-centers the map on that device's GPS location and loads that device's positions (Live Map) and historical data (Replay). No new visual elements are added to the map — the existing views (satellite map, TrailSense marker, detected device markers, trail lines, timeline scrubber) remain exactly as they are.

## Approach

**Local state lift** — `selectedDeviceId` as component state in `ProximityHeatmapScreen`, with a new `DevicePicker` overlay component. No Zustand store changes. All existing hooks (`usePositions`, `useReplayData`) already accept `deviceId` as a parameter, so the data flow change is minimal.

## Navigation Changes

### `RadarStackParamList` (src/navigation/types.ts)

Add `deviceId` param to `LiveRadar`:

```typescript
LiveRadar: { startHour?: number; deviceId?: string } | undefined;
```

### Cross-tab deep linking

`DeviceDetailScreen.handleViewOnMap` updates to pass the device ID:

```typescript
navigation.navigate('RadarTab', {
  screen: 'LiveRadar',
  params: { deviceId: device.id },
});
```

When Radar receives a `deviceId` param, it pre-selects that device in the picker and centers the map on it.

## State Changes in ProximityHeatmapScreen

### Remove

- `const [selectedDeviceIndex] = useState(0)` (line 297)
- `const selectedDevice = devices[selectedDeviceIndex]` (line 319)
- Static "1/5" text indicator (line 128)

### Add

```typescript
const initialDeviceId = route?.params?.deviceId;
const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
  initialDeviceId
);
const [pickerOpen, setPickerOpen] = useState(false);

const selectedDevice = selectedDeviceId
  ? devices.find(d => d.id === selectedDeviceId) ?? devices[0]
  : devices[0];
```

### On device switch

When `setSelectedDeviceId(newId)` is called:

1. Clear `selectedPosition` to `null`
2. Clear `peekFingerprint` to `null`
3. Pause autoplay and reset to minute 0 (`autoPlay.pause()`, `autoPlay.setMinuteIndex(0)`)
4. **Live Map camera**: re-centers via the existing `useEffect` that calls `cameraRef.current.setCamera()` when `deviceCoordinates` change
5. **Replay camera**: requires an explicit `replayCameraRef.current.setCamera()` call. The replay camera uses declarative `<Camera centerCoordinate={...}>` props which may not re-trigger `flyTo` animation on prop change. Add a `useEffect` watching `deviceCoordinates` + `replayCameraRef` to imperatively drive the replay camera, mirroring the live-map camera pattern.
6. `usePositions(selectedDevice.id)` and `useReplayData(selectedDevice.id)` automatically refetch since their query key includes the device ID

**Important:** All reset logic (steps 1-5) must execute for BOTH picker-driven and route-driven (deep link) device switches. The `deviceId` param handler must call the same `handleSelectDevice` function, not just `setSelectedDeviceId`.

### Handle deviceId nav param

Add a `useEffect` to respond to incoming `deviceId` param (same pattern as the existing `startHour` param):

```typescript
useEffect(() => {
  const incomingDeviceId = route?.params?.deviceId;
  if (incomingDeviceId && devices.some(d => d.id === incomingDeviceId)) {
    setSelectedDeviceId(incomingDeviceId);
    navigation.setParams({ deviceId: undefined });
  }
}, [route?.params?.deviceId, devices, navigation]);
```

## DevicePicker Component

**File:** `src/components/molecules/DevicePicker/DevicePicker.tsx`

### Props

```typescript
interface DevicePickerProps {
  devices: Device[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}
```

### Rendering

- The `DevicePicker` is rendered as a direct child of the `ScreenLayout` content area (same level as `FingerprintPeek`), NOT inside a small wrapper. The backdrop must use `StyleSheet.absoluteFillObject` from a full-screen parent to properly block all touches and enable "tap outside to dismiss". Follow the same pattern as `FingerprintPeek` which renders at the top level with a full-screen backdrop.
- Dropdown panel: `#1c1c1e` with 1px `#333` border, 10px border-radius, shadow, positioned below the status bar
- Each row:
  - Status dot: green (`systemGreen`) if online (derived from `isDeviceOnline(lastSeen)`), red (`systemRed`) if offline
  - Device name
  - Selected device: blue left border (`#007AFF`), blue background tint, checkmark
  - Offline devices: muted text color, "OFFLINE" label on the right in red
- Tap a device → `onSelectDevice(deviceId)` + `onClose()`
- Tap backdrop → `onClose()`
- Haptic feedback: `Haptics.impactAsync(ImpactFeedbackStyle.Light)` on open and on selection

### Barrel export

Add `DevicePicker` to `src/components/molecules/DevicePicker/index.ts` and re-export from `src/components/molecules/index.ts`.

## Status Bar Changes

The status bar with the device picker trigger lives in the parent `ProximityHeatmapScreen` component, above the mode container (between the segmented control and the `modeContainer` View). This way it's visible in both Live Map and Replay modes.

The existing status subtitle row (currently inside `LiveMapContent`):

```
● Online · 30.3965, -94.3178    1/5
```

Moves out of `LiveMapContent` and becomes a tappable `Pressable` at the parent level:

```
● North Gate Sensor ▾         30.3965, -94.3178
```

- Status dot + device name (bold) + chevron (`▾` when closed, `▴` when open)
- Coordinates move to the right
- Tapping opens/closes the `DevicePicker` overlay
- If `devices.length === 1`: show device name, no chevron, not tappable
- The `DevicePicker` overlay renders at the parent level too, positioned below this bar

## Edge Cases

### Single device
Status bar shows device name but no chevron. Picker is not available. Functionally identical to current behavior.

### Offline device selected
User can select an offline device. Status dot shows red. If the device has no GPS coordinates, the existing "No GPS Location" empty state renders. Positions will be empty. Replay still works if historical data exists.

### Device deleted while viewing
If the selected device disappears from the `devices` array (deleted on another client, React Query refetch removes it), the `?? devices[0]` render fallback shows the correct device, but `selectedDeviceId` state becomes stale. Add a reconciliation `useEffect`: when `selectedDeviceId` is set but `devices.find(d => d.id === selectedDeviceId)` returns undefined, call `handleSelectDevice(devices[0]?.id)` to reset state (clearing selection, replay, etc.).

### WebSocket listener
The existing `useEffect` that listens for `positions-updated` events filters by `selectedDevice?.id`. This works automatically — switching devices means the listener only processes events for the currently selected device.

### Mode switching
Switching between Live Map and Replay keeps the same device selected. Only the mode changes.

### Replay data on device switch
When switching devices in Replay mode:
- `useReplayData(newDeviceId)` fires automatically (query key change)
- Timeline resets to minute 0, autoplay pauses
- Bucketing and interpolation hooks recompute from new data (they derive from `replayPositions`)

## Files Changed

### Modified
- `src/screens/radar/ProximityHeatmapScreen.tsx` — state changes, status bar update, picker integration
- `src/screens/devices/DeviceDetailScreen.tsx` — pass `deviceId` in "View on Map" navigation
- `src/navigation/types.ts` — add `deviceId` to `LiveRadar` params
- `src/components/molecules/index.ts` — re-export DevicePicker

### Created
- `src/components/molecules/DevicePicker/DevicePicker.tsx` — dropdown picker component
- `src/components/molecules/DevicePicker/index.ts` — barrel export

## Mock Data Changes

The mock replay data generator (`src/mocks/data/mockReplayPositions.ts`) currently hardcodes all scenarios to `device-001`. To validate device cycling in demo mode, `generateReplayData()` should accept an optional `deviceId` parameter and vary the replay scenarios (or at minimum the property center coordinates) per device. Without this, switching devices in demo/mock mode will show device-001's replay data for every device, making it impossible to verify the feature works correctly.

The `useReplayData` hook in mock mode (`src/hooks/api/useReplayPositions.ts:14`) currently calls `generateReplayData()` without passing the `deviceId`. Update it to pass the device ID through.

## No Changes Needed

- `usePositions` hooks (already parameterized by deviceId; mock positions are seeded per-device)
- `TrailSenseDeviceMarker` / `DetectedDeviceMarker` components
- `TimelineScrubber` / `useAutoPlay` / `useTimeBucketing` / `useReplayPath` hooks
- `FingerprintPeek` / `PositionListItem` components
- `radarStore` (Zustand)
- `websocketService` / `useWebSocket`

## Success Criteria

- User can tap the status bar to open a device picker listing all devices with online/offline status
- Selecting a device re-centers the map and loads that device's positions (Live Map) and history (Replay)
- Replay timeline resets when switching devices
- "View on Map" from DeviceDetail pre-selects the correct device
- Single device: no picker shown, same behavior as current
- All existing Radar functionality (map interaction, markers, replay, fingerprint peek) works identically
