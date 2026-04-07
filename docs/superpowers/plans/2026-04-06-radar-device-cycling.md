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

Add after the existing `startHour` param useEffect (after line 487):

```typescript
useEffect(() => {
  const incomingDeviceId = route?.params?.deviceId;
  if (incomingDeviceId && devices.some(d => d.id === incomingDeviceId)) {
    setSelectedDeviceId(incomingDeviceId);
    navigation.setParams({ deviceId: undefined });
  }
}, [route?.params?.deviceId, devices, navigation]);
```

- [ ] **Step 3: Update the selectedDeviceIndex useEffect to use selectedDeviceId**

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

- [ ] **Step 5: Add imports for DevicePicker and Haptics**

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

      <View style={styles.pickerAnchor}>
        <DevicePicker
          devices={devices}
          selectedDeviceId={selectedDevice?.id ?? ''}
          onSelectDevice={handleSelectDevice}
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
        />
      </View>

      <View style={styles.modeContainer}>
```

- [ ] **Step 7: Add pickerAnchor style**

Add to the `styles` StyleSheet:

```typescript
pickerAnchor: {
  position: 'relative',
  zIndex: 12,
},
```

- [ ] **Step 8: Remove `devices` prop from LiveMapContent call and interface**

In the `LiveMapContent` function props interface (around line 89), remove:

```typescript
devices: any[];
```

In the `LiveMapContent` call inside the parent return (around line 609), remove:

```typescript
devices={devices}
```

- [ ] **Step 9: Run type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/screens/radar/ProximityHeatmapScreen.tsx
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

### Task 5: Manual verification and final tests

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
2. Tap device name in status bar — dropdown opens with all 5 mock devices
3. Tap "South Boundary" — map flies to that device's GPS, detected devices update
4. Switch to Replay — shows South Boundary's replay data, timeline resets
5. Switch back to Live Map — still shows South Boundary
6. Tap device name, select "West Perimeter" (offline) — status dot turns red, map shows "No GPS Location" or its last known position
7. Navigate to Devices tab → tap a device → tap "View on Map" — Radar opens with that device pre-selected
8. With only 1 device (mock data would need modification): status bar shows name, no chevron, not tappable

- [ ] **Step 5: Commit any lint fixes if needed**

```bash
git add -A
git commit -m "chore: lint fixes for radar device cycling"
```
