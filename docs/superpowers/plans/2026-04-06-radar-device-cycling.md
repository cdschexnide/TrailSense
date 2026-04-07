# Radar Device Cycling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to switch between deployed devices on the Radar screen via a dropdown picker, loading each device's Live Map and Replay data independently.

**Architecture:** Add `selectedDeviceId` as local state in `ProximityHeatmapScreen`. Build a `DevicePicker` molecule component rendered as an overlay dropdown. Move the status bar out of `LiveMapContent` to the parent so it's visible in both modes. Add `deviceId` nav param for cross-tab deep linking from DeviceDetail.

**Tech Stack:** React Native, Mapbox, React Query, expo-haptics

**Spec:** `docs/superpowers/specs/2026-04-06-radar-device-cycling-design.md`

---

### Task 1: Add `deviceId` to `RadarStackParamList`

**Files:**
- Modify: `src/navigation/types.ts:41-45`

- [ ] **Step 1: Update the LiveRadar param type**

In `src/navigation/types.ts`, change the `LiveRadar` entry in `RadarStackParamList`:

```typescript
// Before
LiveRadar: { startHour?: number } | undefined;

// After
LiveRadar: { startHour?: number; deviceId?: string } | undefined;
```

- [ ] **Step 2: Run type-check**

Run: `npm run type-check`
Expected: PASS (no consumers reference this param yet)

- [ ] **Step 3: Commit**

```bash
git add src/navigation/types.ts
git commit -m "feat: add deviceId param to LiveRadar nav type"
```

---

### Task 2: Create DevicePicker component

**Files:**
- Create: `src/components/molecules/DevicePicker/DevicePicker.tsx`
- Create: `src/components/molecules/DevicePicker/index.ts`
- Modify: `src/components/molecules/index.ts`
- Create: `__tests__/components/molecules/DevicePicker.test.tsx`

- [ ] **Step 1: Write the test**

Create `__tests__/components/molecules/DevicePicker.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DevicePicker } from '@components/molecules/DevicePicker';

// Mock haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

// Mock theme
jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        systemGreen: '#4ade80',
        systemRed: '#ef4444',
        systemBlue: '#007AFF',
        label: '#e8e8e0',
        secondaryLabel: '#a8a898',
        tertiaryLabel: '#5a5a50',
        separator: '#333',
      },
    },
  }),
}));

jest.mock('@utils/dateUtils', () => ({
  isDeviceOnline: jest.fn((lastSeen: string | undefined) => {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
  }),
}));

const onlineDevice = {
  id: 'device-001',
  name: 'North Gate Sensor',
  online: true,
  lastSeen: new Date().toISOString(),
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
};

const offlineDevice = {
  id: 'device-004',
  name: 'West Perimeter',
  online: false,
  lastSeen: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
};

const devices = [onlineDevice, offlineDevice];

describe('DevicePicker', () => {
  it('renders nothing when isOpen is false', () => {
    const { queryByText } = render(
      <DevicePicker
        devices={devices}
        selectedDeviceId="device-001"
        onSelectDevice={jest.fn()}
        isOpen={false}
        onClose={jest.fn()}
      />
    );
    expect(queryByText('North Gate Sensor')).toBeNull();
  });

  it('renders all devices when isOpen is true', () => {
    const { getByText } = render(
      <DevicePicker
        devices={devices}
        selectedDeviceId="device-001"
        onSelectDevice={jest.fn()}
        isOpen={true}
        onClose={jest.fn()}
      />
    );
    expect(getByText('North Gate Sensor')).toBeTruthy();
    expect(getByText('West Perimeter')).toBeTruthy();
  });

  it('shows OFFLINE label for offline devices', () => {
    const { getByText } = render(
      <DevicePicker
        devices={devices}
        selectedDeviceId="device-001"
        onSelectDevice={jest.fn()}
        isOpen={true}
        onClose={jest.fn()}
      />
    );
    expect(getByText('OFFLINE')).toBeTruthy();
  });

  it('calls onSelectDevice and onClose when a device is tapped', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const { getByText } = render(
      <DevicePicker
        devices={devices}
        selectedDeviceId="device-001"
        onSelectDevice={onSelect}
        isOpen={true}
        onClose={onClose}
      />
    );
    fireEvent.press(getByText('West Perimeter'));
    expect(onSelect).toHaveBeenCalledWith('device-004');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is tapped', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <DevicePicker
        devices={devices}
        selectedDeviceId="device-001"
        onSelectDevice={jest.fn()}
        isOpen={true}
        onClose={onClose}
      />
    );
    fireEvent.press(getByTestId('picker-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/components/molecules/DevicePicker.test.tsx --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 3: Create the DevicePicker component**

Create `src/components/molecules/DevicePicker/DevicePicker.tsx`:

```typescript
import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { isDeviceOnline } from '@utils/dateUtils';
import type { Device } from '@/types/device';

interface DevicePickerProps {
  devices: Device[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const DevicePicker: React.FC<DevicePickerProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
  isOpen,
  onClose,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  if (!isOpen) return null;

  const handleSelect = (deviceId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectDevice(deviceId);
    onClose();
  };

  return (
    <>
      <Pressable
        testID="picker-backdrop"
        style={styles.backdrop}
        onPress={onClose}
      />
      <View style={[styles.dropdown, { borderColor: colors.separator }]}>
        {devices.map((device, index) => {
          const isSelected = device.id === selectedDeviceId;
          const online = isDeviceOnline(device.lastSeen);

          return (
            <Pressable
              key={device.id}
              style={[
                styles.row,
                isSelected && styles.rowSelected,
                index > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: 'rgba(255,255,255,0.06)',
                },
              ]}
              onPress={() => handleSelect(device.id)}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: online
                      ? colors.systemGreen
                      : colors.systemRed,
                  },
                ]}
              />
              <Text
                variant="subheadline"
                color={online ? 'label' : 'tertiaryLabel'}
                style={styles.deviceName}
              >
                {device.name}
              </Text>
              {isSelected && (
                <Text variant="subheadline" color="systemBlue">
                  ✓
                </Text>
              )}
              {!online && !isSelected && (
                <Text
                  variant="caption2"
                  color="systemRed"
                  style={styles.offlineLabel}
                >
                  OFFLINE
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  dropdown: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 0,
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    borderWidth: 1,
    zIndex: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
  },
  rowSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    paddingLeft: 11,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  deviceName: {
    flex: 1,
  },
  offlineLabel: {
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
```

- [ ] **Step 4: Create barrel export**

Create `src/components/molecules/DevicePicker/index.ts`:

```typescript
export { DevicePicker } from './DevicePicker';
```

- [ ] **Step 5: Add to molecules barrel export**

In `src/components/molecules/index.ts`, add after the `DetailHero` export:

```typescript
export * from './DevicePicker';
```

- [ ] **Step 6: Run tests**

Run: `npx jest __tests__/components/molecules/DevicePicker.test.tsx --no-coverage`
Expected: PASS (all 5 tests)

- [ ] **Step 7: Run type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/components/molecules/DevicePicker/ src/components/molecules/index.ts __tests__/components/molecules/DevicePicker.test.tsx
git commit -m "feat: add DevicePicker dropdown component"
```

---

### Task 3: Integrate DevicePicker into ProximityHeatmapScreen

**Files:**
- Modify: `src/screens/radar/ProximityHeatmapScreen.tsx`

This is the main integration task. It has three parts: (A) replace state, (B) move status bar to parent + add picker trigger, (C) add device switch handler and deviceId param handler.

- [ ] **Step 1: Replace `selectedDeviceIndex` with `selectedDeviceId`**

In `src/screens/radar/ProximityHeatmapScreen.tsx`, replace lines 297 and 319:

```typescript
// Remove:
const [selectedDeviceIndex] = useState(0);

// Add:
const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
  route?.params?.deviceId
);
const [pickerOpen, setPickerOpen] = useState(false);
```

Replace line 319:

```typescript
// Remove:
const selectedDevice = devices[selectedDeviceIndex];

// Add:
const selectedDevice = selectedDeviceId
  ? devices.find(d => d.id === selectedDeviceId) ?? devices[0]
  : devices[0];
```

- [ ] **Step 2: Add deviceId param handler useEffect**

Add after the existing `startHour` param useEffect (after line 487). This must call `handleSelectDevice` (not just `setSelectedDeviceId`) so the full reset path executes — clearing selection state, pausing autoplay, resetting replay to minute 0:

```typescript
useEffect(() => {
  const incomingDeviceId = route?.params?.deviceId;
  if (incomingDeviceId && devices.some(d => d.id === incomingDeviceId)) {
    handleSelectDevice(incomingDeviceId);
    navigation.setParams({ deviceId: undefined });
  }
}, [route?.params?.deviceId, devices, navigation, handleSelectDevice]);
```

- [ ] **Step 3: Update the selectedDeviceIndex useEffect to use selectedDeviceId and add stale-ID reconciliation**

Replace the useEffect at line 433-435:

```typescript
// Remove:
useEffect(() => {
  setSelectedPosition(null);
}, [selectedDeviceIndex]);

// Add:
useEffect(() => {
  setSelectedPosition(null);
  setPeekFingerprint(null);
}, [selectedDeviceId]);
```

Add a reconciliation effect for when the selected device disappears (deleted on another client, React Query refetch removes it). Place it right after the above:

```typescript
useEffect(() => {
  if (
    selectedDeviceId &&
    devices.length > 0 &&
    !devices.some(d => d.id === selectedDeviceId)
  ) {
    handleSelectDevice(devices[0].id);
  }
}, [selectedDeviceId, devices, handleSelectDevice]);
```

- [ ] **Step 4: Add device switch handler**

Add after the `centerOnPosition` callback:

```typescript
const handleSelectDevice = useCallback(
  (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    autoPlayRef.current.pause();
    autoPlayRef.current.setMinuteIndex(0);
  },
  []
);
```

- [ ] **Step 5: Add replay camera re-center effect**

The live-map camera has an imperative `useEffect` (line 405) that calls `cameraRef.current.setCamera()` on coordinate changes. The replay camera at line 649 uses declarative `<Camera centerCoordinate={...}>` props, which may not re-trigger the `flyTo` animation on prop changes after initial mount. Add an equivalent imperative effect for the replay camera.

Add after the existing live-map camera `useEffect` (after line 431):

```typescript
useEffect(() => {
  if (!replayCameraRef.current || !hasValidLocation) {
    return;
  }

  replayCameraRef.current.setCamera({
    centerCoordinate: [
      deviceCoordinates.longitude!,
      deviceCoordinates.latitude!,
    ],
    zoomLevel: 16,
    animationDuration: 1000,
  });
}, [
  deviceCoordinates.latitude,
  deviceCoordinates.longitude,
  hasValidLocation,
]);
```

- [ ] **Step 6: Add imports for DevicePicker and Haptics**

Add to imports at the top of the file:

```typescript
import * as Haptics from 'expo-haptics';
import { DevicePicker } from '@components/molecules/DevicePicker';
```

- [ ] **Step 6: Move status bar from LiveMapContent to parent, add picker trigger**

Remove the `statusSubtitle` View from `LiveMapContent` (lines 107-131 inside the `return` of `LiveMapContent`). Also remove the `devices` prop from `LiveMapContent`'s props interface since it was only used for the `1/{devices.length}` indicator.

In the parent `ProximityHeatmapScreen` return, add the new status bar and picker between the segmented control and `modeContainer`. Replace the section from after `</View>` (end of segmented control, line 598) to `<View style={styles.modeContainer}>` (line 600):

```tsx
      </View>

      {/* Device status bar + picker */}
      <Pressable
        style={styles.statusSubtitle}
        onPress={() => {
          if (devices.length > 1) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPickerOpen(prev => !prev);
          }
        }}
        disabled={devices.length <= 1}
      >
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: isDeviceOnline(selectedDevice?.lastSeen)
                ? colors.systemGreen
                : colors.systemRed,
            },
          ]}
        />
        <Text variant="subheadline" weight="semibold" color="label">
          {selectedDevice?.name ?? 'No Device'}
        </Text>
        {devices.length > 1 && (
          <Text variant="caption1" color="tertiaryLabel">
            {pickerOpen ? '▴' : '▾'}
          </Text>
        )}
        <Text
          variant="caption1"
          color="tertiaryLabel"
          style={styles.deviceIndicator}
        >
          {formatCoordinates(deviceCoordinates)}
        </Text>
      </Pressable>

      <View style={styles.modeContainer}>
```

Then, at the end of the `ScreenLayout` children (after the closing `</View>` of `modeContainer`, before `</ScreenLayout>`), render the `DevicePicker` at the top level — same pattern as `FingerprintPeek`. This ensures the backdrop fills the full screen and blocks all touches:

```tsx
      {pickerOpen && (
        <DevicePicker
          devices={devices}
          selectedDeviceId={selectedDevice?.id ?? ''}
          onSelectDevice={handleSelectDevice}
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </ScreenLayout>
```

- [ ] **Step 7: Update DevicePicker dropdown positioning**

The `DevicePicker` component's `dropdown` style needs a `top` value that accounts for the header, segmented control, and status bar. Since it's now rendered from the full-screen level, update the `dropdown` style in `DevicePicker.tsx` to position from the top of the screen. The exact `top` value will be approximately 140-160px (header ~44px + segmented control ~40px + status bar ~36px + padding). Use a prop or calculate based on the layout:

Update `DevicePicker` props to accept an optional `topOffset` number:

```typescript
interface DevicePickerProps {
  devices: Device[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  topOffset?: number;
}
```

Apply it in the dropdown style:

```typescript
<View style={[styles.dropdown, { borderColor: colors.separator, top: topOffset ?? 140 }]}>
```

Pass from `ProximityHeatmapScreen`:

```tsx
<DevicePicker
  ...
  topOffset={140}
/>
```

- [ ] **Step 8: Update DevicePicker test for topOffset prop**

In `__tests__/components/molecules/DevicePicker.test.tsx`, update the test renders to pass `topOffset={140}` (optional prop, tests still pass without it, but add it to one test for coverage):

```typescript
// In the 'renders all devices when isOpen is true' test, add:
<DevicePicker
  devices={devices}
  selectedDeviceId="device-001"
  onSelectDevice={jest.fn()}
  isOpen={true}
  onClose={jest.fn()}
  topOffset={140}
/>
```

- [ ] **Step 9: Remove `devices` prop from LiveMapContent call and interface**

In the `LiveMapContent` function props interface (around line 89), remove:

```typescript
devices: any[];
```

In the `LiveMapContent` call inside the parent return (around line 609), remove:

```typescript
devices={devices}
```

- [ ] **Step 10: Run type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add src/screens/radar/ProximityHeatmapScreen.tsx __tests__/components/molecules/DevicePicker.test.tsx
git commit -m "feat: integrate DevicePicker into Radar screen"
```

---

### Task 4: Update DeviceDetail cross-tab navigation

**Files:**
- Modify: `src/screens/devices/DeviceDetailScreen.tsx:124-132`

- [ ] **Step 1: Update handleViewOnMap to pass deviceId**

In `src/screens/devices/DeviceDetailScreen.tsx`, replace the `handleViewOnMap` function (lines 124-132):

```typescript
const handleViewOnMap = () => {
  navigation.navigate('RadarTab', {
    screen: 'LiveRadar',
    params: { deviceId: device.id },
  });
};
```

This replaces the old `focusLat`/`focusLng` params (which were never consumed by the Radar screen) with the new `deviceId` param.

- [ ] **Step 2: Run type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/screens/devices/DeviceDetailScreen.tsx
git commit -m "feat: pass deviceId when navigating from DeviceDetail to Radar"
```

---

### Task 5: Fix mock replay data to support per-device switching

**Files:**
- Modify: `src/mocks/data/mockReplayPositions.ts`
- Modify: `src/hooks/api/useReplayPositions.ts`

The mock replay data generator currently hardcodes all scenarios to `device-001` and uses a global `PROPERTY_CENTER` constant. Four functions depend on it: `toLatLng` (line 43), `METERS_PER_DEG_LNG` (line 11), `createScenarioAlert` (line 79, 85), and the position generation loop (line 187 via `toLatLng`). The `generateReplayData` signature is `(date?: Date)` and `generateReplayPositions` wraps it with the same signature (line 227). Both need updating without breaking each other.

- [ ] **Step 1: Change `generateReplayData` signature to an options object**

The current signature is `generateReplayData(date?: Date)`. Changing the first param to `deviceId` would break `generateReplayPositions(date?: Date)` which passes `date` through. Use an options object instead.

In `src/mocks/data/mockReplayPositions.ts`, replace the global `PROPERTY_CENTER` constant and the function signatures:

```typescript
// Remove the global PROPERTY_CENTER constant (line 9):
// const PROPERTY_CENTER = { latitude: 30.396526, longitude: -94.317806 };

// Replace with a device center lookup:
const DEVICE_CENTERS: Record<string, { latitude: number; longitude: number }> = {
  'device-001': { latitude: 30.396526, longitude: -94.317806 },
  'device-002': { latitude: 30.3943, longitude: -94.3191 },
  'device-003': { latitude: 30.397, longitude: -94.3155 },
  'device-004': { latitude: 30.3958, longitude: -94.3205 },
  'device-005': { latitude: 30.3988, longitude: -94.3162 },
};

const DEFAULT_CENTER = DEVICE_CENTERS['device-001'];

function getDeviceCenter(deviceId?: string): { latitude: number; longitude: number } {
  if (!deviceId) return DEFAULT_CENTER;
  return DEVICE_CENTERS[deviceId] ?? DEFAULT_CENTER;
}
```

- [ ] **Step 2: Thread center through `toLatLng`, `METERS_PER_DEG_LNG`, and `createScenarioAlert`**

`METERS_PER_DEG_LNG` depends on latitude. Since all devices are within ~0.005 degrees of each other, the cosine factor is nearly identical. Keep it computed from a fixed reference latitude to avoid complexity:

```typescript
const METERS_PER_DEG_LAT = 111_320;
// Use fixed reference latitude — devices are close enough that this is accurate
const METERS_PER_DEG_LNG =
  111_320 * Math.cos((30.396526 * Math.PI) / 180);
```

Update `toLatLng` to accept a center parameter:

```typescript
function toLatLng(
  northMeters: number,
  eastMeters: number,
  center: { latitude: number; longitude: number }
) {
  return {
    latitude: center.latitude + northMeters / METERS_PER_DEG_LAT,
    longitude: center.longitude + eastMeters / METERS_PER_DEG_LNG,
  };
}
```

Update `createScenarioAlert` to accept a center parameter. Replace the two references to `PROPERTY_CENTER` (lines 79 and 85) with the `center` parameter:

```typescript
function createScenarioAlert(
  scenario: ScenarioDefinition,
  timestamp: string,
  index: number,
  accuracyMeters: number,
  confidence: number,
  center: { latitude: number; longitude: number }
): Alert {
  return {
    id: `replay-alert-${scenario.fingerprintHash}-${index}`,
    deviceId: scenario.deviceId,
    timestamp,
    threatLevel: scenario.threatLevel,
    detectionType:
      scenario.signalType === 'bluetooth' ? 'bluetooth' : scenario.signalType,
    fingerprintHash: scenario.fingerprintHash,
    confidence,
    accuracyMeters,
    isReviewed: false,
    isFalsePositive: false,
    location: { ...center },
    metadata: {
      source: 'positions',
      measurementCount: 4,
      signalCount: 2,
      triangulatedPosition: {
        ...center,
        accuracyMeters,
        confidence,
      },
    },
    createdAt: timestamp,
  };
}
```

- [ ] **Step 3: Update `generateReplayData` to accept options and filter by deviceId**

Replace the function signature and add device filtering:

```typescript
interface ReplayDataOptions {
  date?: Date;
  deviceId?: string;
}

export function generateReplayData(options?: ReplayDataOptions): ReplayData {
  const { date, deviceId } = options ?? {};
  const center = getDeviceCenter(deviceId);
  const positions: ReplayPosition[] = [];
  const alerts: Alert[] = [];
  const baseDate = createBaseDate(date);
  let alertIndex = 0;

  const scenarios = deviceId
    ? SCENARIOS.filter(s => s.deviceId === deviceId)
    : SCENARIOS;

  for (const scenario of scenarios) {
    for (const visit of scenario.visits) {
      const visitStart = new Date(baseDate);
      visitStart.setHours(visit.startHour, visit.startMinute, 0, 0);

      const totalPositions = visit.durationMinutes * visit.positionsPerMinute;

      for (let step = 0; step < totalPositions; step++) {
        const positionTime = new Date(visitStart);
        positionTime.setSeconds(
          Math.floor((step * 60) / visit.positionsPerMinute),
          (step % visit.positionsPerMinute) *
            Math.floor(60 / visit.positionsPerMinute)
        );

        const visitProgress =
          totalPositions <= 1 ? 0 : step / (totalPositions - 1);
        const minuteProgress =
          (step % visit.positionsPerMinute) / visit.positionsPerMinute;
        const point = scenario.pointForProgress(visitProgress, minuteProgress);
        const coords = toLatLng(point.northMeters, point.eastMeters, center);
        const accuracyMeters = 10 + (step % 5) * 2;
        const confidence = Math.round(Math.min(99, Math.max(55, point.confidence)));
        const timestamp = positionTime.toISOString();

        positions.push({
          id: `replay-${scenario.fingerprintHash}-${visit.startHour}-${visit.startMinute}-${step}`,
          deviceId: scenario.deviceId,
          fingerprintHash: scenario.fingerprintHash,
          signalType: scenario.signalType,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracyMeters,
          confidence,
          measurementCount: 4 + (step % 3),
          presenceCertainty: confidence,
          proximity: Math.max(0, Math.min(100, 100 - accuracyMeters * 2)),
          threatLevel: scenario.threatLevel,
          observedAt: timestamp,
        });

        alerts.push(
          createScenarioAlert(
            scenario,
            timestamp,
            alertIndex++,
            accuracyMeters,
            confidence,
            center
          )
        );
      }
    }
  }

  positions.sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  alerts.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return { positions, alerts };
}
```

- [ ] **Step 4: Update `generateReplayPositions` to pass through the options object**

```typescript
// Before:
export function generateReplayPositions(date?: Date): ReplayPosition[] {
  return generateReplayData(date).positions;
}

// After:
export function generateReplayPositions(options?: ReplayDataOptions): ReplayPosition[] {
  return generateReplayData(options).positions;
}
```

- [ ] **Step 5: Update callers of `generateReplayPositions(date)` if any**

Run: `grep -rn 'generateReplayPositions\|generateReplayData' src/ __tests__/`

Check for any callers passing a `Date` argument directly. If found, wrap in the options object: `generateReplayData({ date: someDate })`. The bottom of the file has:

```typescript
export const mockReplayData = generateReplayData();
```

This still works — `options` defaults to `undefined`, `deviceId` defaults to `undefined`, and the `scenarios` filter falls back to all scenarios. No change needed here.

- [ ] **Step 6: Add a scenario for device-002 (South Boundary)**

Add to the `SCENARIOS` array after the existing device-001 scenarios:

```typescript
{
  deviceId: 'device-002',
  fingerprintHash: PERSONAS.delivery,
  signalType: 'wifi',
  threatLevel: 'low',
  visits: [
    { startHour: 8, startMinute: 0, durationMinutes: 10, positionsPerMinute: 2 },
  ],
  pointForProgress: progress => ({
    northMeters: -50 + progress * 40,
    eastMeters: 12 * Math.sin(progress * Math.PI),
    confidence: 65 + progress * 25,
    detectionType: 'wifi',
  }),
},
{
  deviceId: 'device-002',
  fingerprintHash: PERSONAS.loiterer,
  signalType: 'bluetooth',
  threatLevel: 'high',
  visits: [
    { startHour: 22, startMinute: 15, durationMinutes: 20, positionsPerMinute: 2 },
  ],
  pointForProgress: (progress, minuteProgress) => ({
    northMeters: 30 + Math.sin(progress * Math.PI * 2) * 15,
    eastMeters: -40 + progress * 60,
    confidence: 80 - Math.abs(minuteProgress - 0.5) * 10,
    detectionType: 'bluetooth',
  }),
},
```

Devices 003-005 intentionally have no scenarios — switching to them in Replay shows an empty timeline, which is valid and tests the empty-state path.

- [ ] **Step 7: Update `useReplayData` to pass deviceId in mock mode**

In `src/hooks/api/useReplayPositions.ts`, update the mock mode branch:

```typescript
// Before:
if (isDemoOrMockMode()) {
  return generateReplayData();
}

// After:
if (isDemoOrMockMode()) {
  return generateReplayData({ deviceId: deviceId! });
}
```

- [ ] **Step 8: Run type-check and tests**

Run: `npm run type-check && npm test -- --no-coverage`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/mocks/data/mockReplayPositions.ts src/hooks/api/useReplayPositions.ts
git commit -m "fix: mock replay data varies by deviceId for device cycling"
```

---

### Task 6: Manual verification and final tests

**Files:**
- No file changes — verification only

- [ ] **Step 1: Run all existing tests**

Run: `npm test -- --no-coverage`
Expected: All existing tests PASS. No regressions.

- [ ] **Step 2: Run type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Run lint**

Run: `npm run lint:fix`
Expected: PASS (auto-fixes any formatting issues)

- [ ] **Step 4: Start the app and verify**

Run: `npm start`

Manual verification checklist:
1. Open Radar tab — should show first device's Live Map (same as before)
2. Tap device name in status bar — dropdown opens with all 5 mock devices, backdrop covers full screen
3. Tap outside the dropdown (on the map area) — dropdown dismisses
4. Tap device name again, select "South Boundary" — map flies to South Boundary's GPS coordinates, detected devices update
5. Switch to Replay — shows South Boundary's replay data (different from North Gate's), timeline resets to 0
6. Switch device while in Replay — replay pauses, timeline resets, map re-centers on new device
7. Switch back to Live Map — still shows the selected device
8. Tap device name, select "West Perimeter" (offline) — status dot turns red, map shows "No GPS Location" or last known position
9. Navigate to Devices tab → tap a device → tap "View on Map" — Radar opens with that device pre-selected, replay state is reset
10. Select "East Trail Monitor" (which has no mock replay scenarios) → switch to Replay — shows empty timeline, no crashes

- [ ] **Step 5: Commit any lint fixes if needed**

```bash
git add -A
git commit -m "chore: lint fixes for radar device cycling"
```
