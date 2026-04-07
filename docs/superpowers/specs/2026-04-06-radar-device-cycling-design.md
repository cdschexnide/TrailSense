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
4. Camera flies to new device coordinates (handled by existing `useEffect` that watches `deviceCoordinates`)
5. `usePositions(selectedDevice.id)` and `useReplayData(selectedDevice.id)` automatically refetch since their query key includes the device ID

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

- Absolute-positioned overlay anchored below the status bar area
- Background: `#1c1c1e` with 1px `#333` border, 10px border-radius, shadow
- Semi-transparent backdrop behind it (tap to dismiss)
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
If the selected device disappears from the `devices` array (deleted on another client, React Query refetch removes it), fall back to `devices[0]`. Handled by the `?? devices[0]` fallback in the `selectedDevice` derivation.

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

## No Changes Needed

- `usePositions` / `useReplayData` hooks (already parameterized by deviceId)
- `TrailSenseDeviceMarker` / `DetectedDeviceMarker` components
- `TimelineScrubber` / `useAutoPlay` / `useTimeBucketing` / `useReplayPath` hooks
- `FingerprintPeek` / `PositionListItem` components
- `radarStore` (Zustand)
- `websocketService` / `useWebSocket`
- Mock data

## Success Criteria

- User can tap the status bar to open a device picker listing all devices with online/offline status
- Selecting a device re-centers the map and loads that device's positions (Live Map) and history (Replay)
- Replay timeline resets when switching devices
- "View on Map" from DeviceDetail pre-selects the correct device
- Single device: no picker shown, same behavior as current
- All existing Radar functionality (map interaction, markers, replay, fingerprint peek) works identically
