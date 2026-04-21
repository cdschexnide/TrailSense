# Map-Centric Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 6-tab multi-screen app with a single full-screen map showing TrailSense sensor nodes and triangulated detected devices.

**Architecture:** New `MapScreen` composes existing data hooks (`useDevices`, `usePositions`) and marker components (`TrailSenseDeviceMarker`, `DetectedDeviceMarker`). WebSocket is handled globally by `AuthLifecycle` — MapScreen does not touch it. Positions are deduplicated by `fingerprintHash` so the map shows one marker per unique detected device. All existing screens/navigation are left in place but unreferenced. New bottom sheets use `@gorhom/bottom-sheet` v5 (already installed). Store slices are NOT removed (avoids TypeScript breakage in old screens).

**Tech Stack:** React Native (Expo 54), MapBox (`@rnmapbox/maps` v10), `@gorhom/bottom-sheet` v5, Redux Toolkit, React Query, TypeScript

**Deferred:** Position animation (lerp between old/new coordinates) is spec'd but deferred — positions update reactively via React Query re-renders. Smooth animation can be added as a follow-up.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/screens/map/MapScreen.tsx` | Single full-screen map with markers, floating controls, bottom sheets |
| Create | `src/components/molecules/StatusChip/StatusChip.tsx` | Detection count pill overlay |
| Create | `src/components/organisms/DetectionBottomSheet/DetectionBottomSheet.tsx` | Detected device detail sheet |
| Create | `src/components/organisms/DeviceBottomSheet/DeviceBottomSheet.tsx` | Sensor node detail sheet |
| Create | `src/components/organisms/SettingsOverlay/SettingsOverlay.tsx` | Gear menu modal |
| Create | `src/hooks/useAllPositions.ts` | Aggregates and deduplicates positions across all online devices |
| Modify | `src/navigation/RootNavigator.tsx` | Replace `MainNavigator` with `MapScreen` |
| Modify | `src/navigation/linking.ts` | Flatten deep link config for single-screen layout |
| Modify | `src/navigation/persistence.ts` | Clear incompatible persisted nav state |
| Modify | `src/App.tsx` | Remove `AIProvider` wrapper |
| Modify | `src/components/molecules/TrailSenseDeviceMarker/TrailSenseDeviceMarker.tsx` | Add `onPress` prop |

**NOT modified:** `src/store/index.ts` — all slices stay to preserve TypeScript compatibility with old screens.

---

### Task 1: Rewire Navigation and App Entry

**Files:**
- Modify: `src/navigation/RootNavigator.tsx`
- Modify: `src/navigation/linking.ts`
- Modify: `src/navigation/persistence.ts`
- Modify: `src/App.tsx`
- Create: `src/screens/map/MapScreen.tsx` (placeholder)

- [ ] **Step 1: Create placeholder MapScreen**

Create `src/screens/map/MapScreen.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const MapScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>MapScreen placeholder</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111210',
  },
  text: {
    color: '#e8e8e0',
    fontSize: 16,
  },
});

export default MapScreen;
```

- [ ] **Step 2: Replace MainNavigator with MapScreen in RootNavigator**

In `src/navigation/RootNavigator.tsx`, comment out the `MainNavigator` import and use `MapScreen`:

Change import:
```typescript
// import MainNavigator from './MainNavigator';
import MapScreen from '@screens/map/MapScreen';
```

Change the authenticated screen (around line 99):
```typescript
<Stack.Screen name="Main" component={MapScreen} />
```

- [ ] **Step 3: Flatten deep link config**

Replace `src/navigation/linking.ts` contents with:

```typescript
import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['trailsense://', 'https://app.trailsense.com'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
        },
      },
      Main: 'map',
    },
  },
};
```

- [ ] **Step 4: Clear incompatible persisted nav state on restore**

In `src/navigation/persistence.ts`, update `sanitizeNavigationState` to return `undefined` (discard entirely) when it encounters nested tab state from the old layout. This triggers `clearNavigationState()` in `RootNavigator.tsx:49`. Replace the `stripNestedStackStates` call:

```typescript
export function sanitizeNavigationState(
  state: PersistedNavigationState | undefined,
  isAuthenticated: boolean
): PersistedNavigationState | undefined {
  if (!state) {
    return undefined;
  }

  const expectedRootRoute = isAuthenticated ? 'Main' : 'Auth';
  const actualRootRoute = getActiveRootRouteName(state);

  if (actualRootRoute !== expectedRootRoute) {
    console.warn('[Navigation] Discarding persisted navigation state', {
      expectedRootRoute,
      actualRootRoute,
    });
    return undefined;
  }

  // Discard any persisted state with nested tab routes from the old
  // multi-tab layout. The new single-screen layout has no nested routes
  // under Main, so returning undefined triggers clearNavigationState().
  const mainRoute = state.routes.find(r => r.name === 'Main');
  if (mainRoute?.state) {
    console.warn(
      '[Navigation] Discarding stale nested tab state from old layout'
    );
    return undefined;
  }

  return state;
}
```

Remove the now-unused `stripNestedStackStates` function.

Also fix the pre-existing type mismatch in `RootNavigator.tsx`. The `initialState` state variable is typed as `NavigationState | undefined` (line 29) but receives a `PersistedNavigationState | undefined` from `sanitizeNavigationState` (line 53). Since `sanitizeNavigationState` returns a subset of `NavigationState`, cast it at the call site:

```typescript
setInitialState(sanitizedState as NavigationState | undefined);
```

This resolves the existing `TS2345` error at `RootNavigator.tsx:53`.

- [ ] **Step 5: Remove AIProvider from App.tsx**

In `src/App.tsx`:

Comment out the `AIProvider` import:
```typescript
// import { AIProvider } from '@/services/llm';
```

Remove the `<AIProvider>` wrapper in JSX. Change:
```tsx
<QueryClientProvider client={queryClient}>
  <AuthLifecycle />
  <AIProvider>
    <StatusBar style="auto" />
    <OfflineBanner />
    <ToastProvider>
      <RootNavigator />
    </ToastProvider>
  </AIProvider>
</QueryClientProvider>
```

To:
```tsx
<QueryClientProvider client={queryClient}>
  <AuthLifecycle />
  <StatusBar style="auto" />
  <OfflineBanner />
  <ToastProvider>
    <RootNavigator />
  </ToastProvider>
</QueryClientProvider>
```

Comment out the ExecuTorch initialization block (lines 28-44):
```typescript
// ExecuTorch initialization commented out — no AI features in map-centric mode
// if (Platform.OS === 'android' || Platform.OS === 'ios') { ... }
```

Remove `Platform` from the `react-native` import if it's only used for ExecuTorch. Remove the `AIProvider` import line.

- [ ] **Step 6: Verify TypeScript compiles for modified files**

Run: `npx tsc --noEmit 2>&1 | grep -E "(RootNavigator|linking|persistence|App\.tsx|MapScreen)" | head -10`

Expected: No errors in these files.

- [ ] **Step 7: Commit**

```bash
git add src/screens/map/MapScreen.tsx src/navigation/RootNavigator.tsx src/navigation/linking.ts src/navigation/persistence.ts src/App.tsx
git commit -m "refactor: rewire app to single MapScreen, flatten nav, clear stale state"
```

---

### Task 2: Build useAllPositions Hook with Deduplication

**Files:**
- Create: `src/hooks/useAllPositions.ts`

This hook fetches positions for ALL online devices, injects `deviceId` from query context (mock WS payloads omit it on individual position objects), and deduplicates by `fingerprintHash` — keeping the highest-confidence triangulation per unique device and tracking all detecting sensor IDs.

- [ ] **Step 1: Write the hook**

```typescript
/**
 * useAllPositions
 *
 * Aggregates triangulated positions from all online sensor devices,
 * deduplicates by fingerprintHash (one marker per unique detected device),
 * and tracks which sensors detected each fingerprint.
 */

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getPositions } from '@api/endpoints/positions';
import { POSITIONS_QUERY_KEY } from '@hooks/api/usePositions';
import { Device } from '@/types/device';
import { TriangulatedPosition } from '@/types/triangulation';
import { isDemoOrMockMode } from '@/config/demoModeRuntime';

export interface DeduplicatedPosition extends TriangulatedPosition {
  /** All sensor device IDs that detected this fingerprint */
  detectedByDeviceIds: string[];
}

export function useAllPositions(devices: Device[] | undefined) {
  const mockMode = isDemoOrMockMode();
  const onlineDevices = useMemo(
    () => (devices ?? []).filter(d => d.online),
    [devices]
  );

  const queries = useQueries({
    queries: onlineDevices.map(device => ({
      queryKey: [POSITIONS_QUERY_KEY, device.id] as const,
      queryFn: () => getPositions(device.id),
      refetchInterval: mockMode ? false : (10000 as number | false),
      staleTime: mockMode ? Infinity : 5000,
      meta: { deviceId: device.id },
    })),
  });

  const positions = useMemo(() => {
    // Collect all raw positions, injecting deviceId from query context
    const raw: TriangulatedPosition[] = [];
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      const deviceId = onlineDevices[i]?.id;
      if (!query.data || !deviceId) continue;

      const data = query.data as
        | { positions: TriangulatedPosition[] }
        | TriangulatedPosition[];
      const posArray = Array.isArray(data)
        ? data
        : Array.isArray(data.positions)
          ? data.positions
          : [];

      for (const pos of posArray) {
        raw.push({ ...pos, deviceId: pos.deviceId || deviceId });
      }
    }

    // Deduplicate by fingerprintHash — keep highest confidence per fingerprint
    const byFingerprint = new Map<string, DeduplicatedPosition>();
    for (const pos of raw) {
      const existing = byFingerprint.get(pos.fingerprintHash);
      if (!existing) {
        byFingerprint.set(pos.fingerprintHash, {
          ...pos,
          detectedByDeviceIds: [pos.deviceId],
        });
      } else {
        // Track all detecting sensors
        if (!existing.detectedByDeviceIds.includes(pos.deviceId)) {
          existing.detectedByDeviceIds.push(pos.deviceId);
        }
        // Keep the higher-confidence position
        if (pos.confidence > existing.confidence) {
          const deviceIds = existing.detectedByDeviceIds;
          byFingerprint.set(pos.fingerprintHash, {
            ...pos,
            detectedByDeviceIds: deviceIds,
          });
        }
      }
    }

    return Array.from(byFingerprint.values());
  }, [queries, onlineDevices]);

  const isLoading = queries.some(q => q.isLoading);

  return { positions, isLoading };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep useAllPositions`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAllPositions.ts
git commit -m "feat: add useAllPositions hook with fingerprint deduplication"
```

---

### Task 3: Build StatusChip Component

**Files:**
- Create: `src/components/molecules/StatusChip/StatusChip.tsx`

- [ ] **Step 1: Write the StatusChip component**

```typescript
/**
 * StatusChip
 *
 * Small pill overlay showing deduplicated detection count
 * or "No active detections"
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusChipProps {
  count: number;
}

export const StatusChip: React.FC<StatusChipProps> = ({ count }) => {
  const label =
    count === 0
      ? 'No active detections'
      : `${count} device${count === 1 ? '' : 's'} detected`;

  return (
    <View style={styles.container}>
      <View
        style={[styles.dot, count > 0 ? styles.dotActive : styles.dotIdle]}
      />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 18, 16, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(42, 42, 26, 0.6)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#fbbf24',
  },
  dotIdle: {
    backgroundColor: '#4ade80',
  },
  text: {
    color: '#a8a898',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

export default StatusChip;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/molecules/StatusChip/StatusChip.tsx
git commit -m "feat: add StatusChip component for detection count overlay"
```

---

### Task 4: Build DetectionBottomSheet

**Files:**
- Create: `src/components/organisms/DetectionBottomSheet/DetectionBottomSheet.tsx`

- [ ] **Step 1: Write the DetectionBottomSheet component**

This sheet receives a `DeduplicatedPosition` which carries `detectedByDeviceIds` — allowing it to list all sensor nodes that detected this fingerprint.

```typescript
/**
 * DetectionBottomSheet
 *
 * Bottom sheet showing details of a triangulated detected device.
 * Slides up when a DetectedDeviceMarker is tapped.
 */

import React, { forwardRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Icon } from '@components/atoms/Icon';
import type { IconName } from '@components/atoms/Icon/Icon';
import {
  TriangulationSignalType,
} from '@/types/triangulation';
import type { DeduplicatedPosition } from '@hooks/useAllPositions';

const SIGNAL_COLORS: Record<TriangulationSignalType, string> = {
  wifi: '#007AFF',
  bluetooth: '#5856D6',
  cellular: '#FF9500',
};

const SIGNAL_ICONS: Record<TriangulationSignalType, IconName> = {
  wifi: 'wifi',
  bluetooth: 'bluetooth',
  cellular: 'cellular',
};

const SIGNAL_LABELS: Record<TriangulationSignalType, string> = {
  wifi: 'WiFi',
  bluetooth: 'Bluetooth',
  cellular: 'Cellular',
};

interface DetectionBottomSheetProps {
  position: DeduplicatedPosition | null;
  sensorNames: string[];
  onClose: () => void;
}

export const DetectionBottomSheet = forwardRef<
  BottomSheet,
  DetectionBottomSheetProps
>(({ position, sensorNames, onClose }, ref) => {
  const snapPoints = useMemo(() => [300], []);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  if (!position) return null;

  const color = SIGNAL_COLORS[position.signalType] || '#8E8E93';
  const iconName = SIGNAL_ICONS[position.signalType] ?? 'ellipse';
  const label = SIGNAL_LABELS[position.signalType] ?? position.signalType;
  const updatedAt = new Date(position.updatedAt);
  const timeStr = updatedAt.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <BottomSheet
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleSheetChange}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.signalBadge, { backgroundColor: color }]}>
            <Icon name={iconName} size={20} color="#FFFFFF" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{label} Device</Text>
            <Text style={styles.fingerprint}>
              {position.fingerprintHash}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Confidence</Text>
            <Text style={styles.statValue}>{position.confidence}%</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Accuracy</Text>
            <Text style={styles.statValue}>
              {position.accuracyMeters.toFixed(0)}m
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Last Seen</Text>
            <Text style={styles.statValue}>{timeStr}</Text>
          </View>
        </View>

        {/* Sensor info — lists all detecting nodes */}
        {sensorNames.length > 0 && (
          <View style={styles.sensorRow}>
            <Icon name="radio-outline" size={16} color="#a8a898" />
            <Text style={styles.sensorText}>
              Detected by {sensorNames.join(', ')}
            </Text>
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#1a1a14',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: '#48483e',
    width: 36,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signalBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: '#e8e8e0',
    fontSize: 17,
    fontWeight: '600',
  },
  fingerprint: {
    color: '#a8a898',
    fontSize: 13,
    fontFamily: 'Menlo',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#222218',
    borderRadius: 12,
    padding: 16,
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    color: '#8a887a',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    color: '#e8e8e0',
    fontSize: 17,
    fontWeight: '600',
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  sensorText: {
    color: '#a8a898',
    fontSize: 14,
  },
});

export default DetectionBottomSheet;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/organisms/DetectionBottomSheet/DetectionBottomSheet.tsx
git commit -m "feat: add DetectionBottomSheet with multi-sensor attribution"
```

---

### Task 5: Build DeviceBottomSheet

**Files:**
- Create: `src/components/organisms/DeviceBottomSheet/DeviceBottomSheet.tsx`

- [ ] **Step 1: Write the DeviceBottomSheet component**

```typescript
/**
 * DeviceBottomSheet
 *
 * Bottom sheet showing sensor node details and its detected devices.
 * Slides up when a TrailSenseDeviceMarker is tapped.
 */

import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Icon } from '@components/atoms/Icon';
import { useUpdateDevice } from '@hooks/api/useDevices';
import { Device } from '@/types/device';
import {
  TriangulationSignalType,
} from '@/types/triangulation';
import type { DeduplicatedPosition } from '@hooks/useAllPositions';

const SIGNAL_COLORS: Record<TriangulationSignalType, string> = {
  wifi: '#007AFF',
  bluetooth: '#5856D6',
  cellular: '#FF9500',
};

interface DeviceBottomSheetProps {
  device: Device | null;
  positions: DeduplicatedPosition[];
  onClose: () => void;
}

export const DeviceBottomSheet = forwardRef<
  BottomSheet,
  DeviceBottomSheetProps
>(({ device, positions, onClose }, ref) => {
  const snapPoints = useMemo(() => [360], []);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const updateDevice = useUpdateDevice();

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        setIsRenaming(false);
        onClose();
      }
    },
    [onClose]
  );

  const handleRename = useCallback(() => {
    if (!device || !nameInput.trim()) return;
    updateDevice.mutate({
      id: device.id,
      updates: { name: nameInput.trim() },
    });
    setIsRenaming(false);
  }, [device, nameInput, updateDevice]);

  const startRename = useCallback(() => {
    if (device) {
      setNameInput(device.name);
      setIsRenaming(true);
    }
  }, [device]);

  if (!device) return null;

  const batteryColor =
    (device.batteryPercent ?? 0) > 50
      ? '#4ade80'
      : (device.batteryPercent ?? 0) > 20
        ? '#f59e0b'
        : '#ef4444';

  const lastSeen = device.lastSeen
    ? new Date(device.lastSeen).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown';

  return (
    <BottomSheet
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleSheetChange}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: device.online ? '#4ade80' : '#8a887a',
              },
            ]}
          />
          <View style={styles.headerText}>
            {isRenaming ? (
              <View style={styles.renameRow}>
                <TextInput
                  style={styles.renameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  selectTextOnFocus
                  onSubmitEditing={handleRename}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={handleRename}>
                  <Icon name="checkmark" size={20} color="#4ade80" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={startRename}
                style={styles.nameRow}
              >
                <Text style={styles.title}>{device.name}</Text>
                <Icon name="pencil" size={14} color="#8a887a" />
              </TouchableOpacity>
            )}
            <Text style={styles.status}>
              {device.online ? 'Online' : 'Offline'} · Last seen{' '}
              {lastSeen}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Icon
              name="battery-half"
              size={16}
              color={batteryColor}
            />
            <Text style={styles.statValue}>
              {device.batteryPercent ?? '--'}%
            </Text>
          </View>
          <View style={styles.stat}>
            <Icon name="radio-outline" size={16} color="#a8a898" />
            <Text style={styles.statValue}>
              {device.signalStrength ?? '--'}
            </Text>
          </View>
          <View style={styles.stat}>
            <Icon name="scan-outline" size={16} color="#fbbf24" />
            <Text style={styles.statValue}>
              {positions.length} detected
            </Text>
          </View>
        </View>

        {/* Detected devices list */}
        {positions.length > 0 && (
          <View style={styles.listSection}>
            <Text style={styles.listTitle}>Detected Devices</Text>
            <FlatList
              data={positions.slice(0, 10)}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View
                    style={[
                      styles.signalDot,
                      {
                        backgroundColor:
                          SIGNAL_COLORS[item.signalType] || '#8E8E93',
                      },
                    ]}
                  />
                  <Text style={styles.listHash} numberOfLines={1}>
                    {item.fingerprintHash}
                  </Text>
                  <Text style={styles.listConf}>
                    {item.confidence}%
                  </Text>
                </View>
              )}
            />
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#1a1a14',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: '#48483e',
    width: 36,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  headerText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: '#e8e8e0',
    fontSize: 17,
    fontWeight: '600',
  },
  status: {
    color: '#a8a898',
    fontSize: 13,
    marginTop: 2,
  },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  renameInput: {
    flex: 1,
    color: '#e8e8e0',
    fontSize: 17,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#fbbf24',
    paddingBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#222218',
    borderRadius: 12,
    padding: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    color: '#e8e8e0',
    fontSize: 15,
    fontWeight: '500',
  },
  listSection: {
    gap: 8,
  },
  listTitle: {
    color: '#8a887a',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2a1a',
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listHash: {
    flex: 1,
    color: '#a8a898',
    fontSize: 13,
    fontFamily: 'Menlo',
  },
  listConf: {
    color: '#e8e8e0',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default DeviceBottomSheet;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/organisms/DeviceBottomSheet/DeviceBottomSheet.tsx
git commit -m "feat: add DeviceBottomSheet for sensor node details"
```

---

### Task 6: Build SettingsOverlay

**Files:**
- Create: `src/components/organisms/SettingsOverlay/SettingsOverlay.tsx`

- [ ] **Step 1: Write the SettingsOverlay component**

```typescript
/**
 * SettingsOverlay
 *
 * Simple modal triggered by gear icon.
 * Shows logout button and app version.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import Constants from 'expo-constants';
import { Icon } from '@components/atoms/Icon';
import { useAppDispatch } from '@store/index';
import { logout } from '@store/slices/authSlice';

interface SettingsOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({
  visible,
  onClose,
}) => {
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
    onClose();
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View
          style={styles.overlay}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Icon name="close" size={22} color="#a8a898" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
          >
            <Icon name="log-out-outline" size={20} color="#ef4444" />
            <Text style={[styles.menuText, { color: '#ef4444' }]}>
              Log Out
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.version}>TrailSense v{version}</Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  overlay: {
    backgroundColor: '#1a1a14',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#2a2a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#e8e8e0',
    fontSize: 17,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2a2a1a',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2a2a1a',
  },
  version: {
    color: '#8a887a',
    fontSize: 12,
  },
});

export default SettingsOverlay;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/organisms/SettingsOverlay/SettingsOverlay.tsx
git commit -m "feat: add SettingsOverlay modal with logout and version"
```

---

### Task 7: Add onPress to TrailSenseDeviceMarker and Build Full MapScreen

**Files:**
- Modify: `src/components/molecules/TrailSenseDeviceMarker/TrailSenseDeviceMarker.tsx`
- Modify: `src/screens/map/MapScreen.tsx` (replace placeholder)

- [ ] **Step 1: Add onPress prop to TrailSenseDeviceMarker**

In `src/components/molecules/TrailSenseDeviceMarker/TrailSenseDeviceMarker.tsx`:

Add `onPress` to the interface:

```typescript
interface TrailSenseDeviceMarkerProps {
  id: string;
  coordinate: [number, number]; // [longitude, latitude]
  isOnline?: boolean;
  onPress?: () => void;
}
```

Update the component destructuring:

```typescript
export const TrailSenseDeviceMarker: React.FC<TrailSenseDeviceMarkerProps> = ({
  id,
  coordinate,
  isOnline = true,
  onPress,
}) => {
```

Add `onSelected` to the `PointAnnotation`:

```tsx
<PointAnnotation
  id={`trailsense-device-${id}`}
  coordinate={coordinate}
  onSelected={onPress}
>
```

- [ ] **Step 2: Write the complete MapScreen**

Replace `src/screens/map/MapScreen.tsx` with:

```typescript
/**
 * MapScreen
 *
 * The single screen of the app. Full-screen MapBox map showing
 * TrailSense sensor nodes and triangulated detected devices.
 *
 * WebSocket is managed globally by AuthLifecycle — not called here.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Mapbox, { Camera, MapView } from '@rnmapbox/maps';
import BottomSheet from '@gorhom/bottom-sheet';
import { Icon } from '@components/atoms/Icon';
import { TrailSenseDeviceMarker } from '@components/molecules/TrailSenseDeviceMarker';
import { DetectedDeviceMarker } from '@components/molecules/DetectedDeviceMarker';
import { StatusChip } from '@components/molecules/StatusChip/StatusChip';
import { DetectionBottomSheet } from '@components/organisms/DetectionBottomSheet/DetectionBottomSheet';
import { DeviceBottomSheet } from '@components/organisms/DeviceBottomSheet/DeviceBottomSheet';
import { SettingsOverlay } from '@components/organisms/SettingsOverlay/SettingsOverlay';
import { useDevices } from '@hooks/api/useDevices';
import {
  useAllPositions,
  DeduplicatedPosition,
} from '@hooks/useAllPositions';
import { Device } from '@/types/device';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (!MAPBOX_TOKEN) {
  console.warn(
    '[MapBox] No access token found. Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env'
  );
}
Mapbox.setAccessToken(MAPBOX_TOKEN || '');

const OUTDOOR_STYLE = 'mapbox://styles/mapbox/outdoors-v12';

export const MapScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Camera>(null);
  const detectionSheetRef = useRef<BottomSheet>(null);
  const deviceSheetRef = useRef<BottomSheet>(null);
  const hasCenteredRef = useRef(false);

  // Data
  const { data: devices } = useDevices();
  const { positions } = useAllPositions(devices);

  // Local state
  const [showSatellite, setShowSatellite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPosition, setSelectedPosition] =
    useState<DeduplicatedPosition | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(
    null
  );

  // Compute map center from device centroids
  const mapCenter = useMemo(() => {
    const devicesWithCoords = (devices ?? []).filter(
      d => d.latitude != null && d.longitude != null
    );
    if (devicesWithCoords.length === 0) {
      return [-94.317, 30.396]; // Default: SE Texas
    }
    const sumLng = devicesWithCoords.reduce(
      (sum, d) => sum + (d.longitude ?? 0),
      0
    );
    const sumLat = devicesWithCoords.reduce(
      (sum, d) => sum + (d.latitude ?? 0),
      0
    );
    return [
      sumLng / devicesWithCoords.length,
      sumLat / devicesWithCoords.length,
    ];
  }, [devices]);

  // Re-center camera when devices first load with valid coordinates
  useEffect(() => {
    if (hasCenteredRef.current) return;
    const devicesWithCoords = (devices ?? []).filter(
      d => d.latitude != null && d.longitude != null
    );
    if (devicesWithCoords.length > 0) {
      hasCenteredRef.current = true;
      cameraRef.current?.setCamera({
        centerCoordinate: mapCenter,
        zoomLevel: 15,
        animationDuration: 1000,
        animationMode: 'flyTo',
      });
    }
  }, [devices, mapCenter]);

  // Map style
  const mapStyle = showSatellite
    ? Mapbox.StyleURL.SatelliteStreet
    : OUTDOOR_STYLE;

  // Handlers
  const handleDetectionPress = useCallback(
    (position: DeduplicatedPosition) => {
      setSelectedDevice(null);
      deviceSheetRef.current?.close();
      setSelectedPosition(position);
      detectionSheetRef.current?.snapToIndex(0);
    },
    []
  );

  const handleDevicePress = useCallback((device: Device) => {
    setSelectedPosition(null);
    detectionSheetRef.current?.close();
    setSelectedDevice(device);
    deviceSheetRef.current?.snapToIndex(0);
  }, []);

  const handleCloseDetectionSheet = useCallback(() => {
    setSelectedPosition(null);
  }, []);

  const handleCloseDeviceSheet = useCallback(() => {
    setSelectedDevice(null);
  }, []);

  // Positions detected by the selected sensor (for DeviceBottomSheet)
  const selectedDevicePositions = useMemo(() => {
    if (!selectedDevice) return [];
    return positions.filter(p =>
      p.detectedByDeviceIds.includes(selectedDevice.id)
    );
  }, [selectedDevice, positions]);

  // Sensor names for the selected detection (for DetectionBottomSheet)
  const sensorNamesForPosition = useMemo(() => {
    if (!selectedPosition || !devices) return [];
    return selectedPosition.detectedByDeviceIds
      .map(id => devices.find(d => d.id === id)?.name)
      .filter((name): name is string => Boolean(name));
  }, [selectedPosition, devices]);

  return (
    <View style={styles.container}>
      {/* Full-screen map */}
      <MapView
        style={styles.map}
        styleURL={mapStyle}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: mapCenter,
            zoomLevel: 15,
          }}
        />

        {/* Sensor node markers */}
        {(devices ?? [])
          .filter(d => d.latitude != null && d.longitude != null)
          .map(device => (
            <TrailSenseDeviceMarker
              key={device.id}
              id={device.id}
              coordinate={[device.longitude!, device.latitude!]}
              isOnline={device.online}
              onPress={() => handleDevicePress(device)}
            />
          ))}

        {/* Detected device markers (deduplicated by fingerprint) */}
        {positions.map(pos => (
          <DetectedDeviceMarker
            key={pos.fingerprintHash}
            id={pos.fingerprintHash}
            coordinate={[pos.longitude, pos.latitude]}
            signalType={pos.signalType}
            confidence={pos.confidence}
            onPress={() => handleDetectionPress(pos)}
          />
        ))}
      </MapView>

      {/* Floating controls */}
      <View style={[styles.controlsLeft, { top: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setShowSettings(true)}
        >
          <Icon name="settings-outline" size={22} color="#e8e8e0" />
        </TouchableOpacity>
      </View>

      <View style={[styles.controlsRight, { top: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setShowSatellite(prev => !prev)}
        >
          <Icon
            name={showSatellite ? 'map-outline' : 'earth'}
            size={22}
            color="#e8e8e0"
          />
        </TouchableOpacity>
      </View>

      {/* Status chip */}
      <View
        style={[
          styles.statusChipContainer,
          { bottom: insets.bottom + 20 },
        ]}
      >
        <StatusChip count={positions.length} />
      </View>

      {/* Bottom sheets */}
      {selectedPosition && (
        <DetectionBottomSheet
          ref={detectionSheetRef}
          position={selectedPosition}
          sensorNames={sensorNamesForPosition}
          onClose={handleCloseDetectionSheet}
        />
      )}

      {selectedDevice && (
        <DeviceBottomSheet
          ref={deviceSheetRef}
          device={selectedDevice}
          positions={selectedDevicePositions}
          onClose={handleCloseDeviceSheet}
        />
      )}

      {/* Settings overlay */}
      <SettingsOverlay
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111210',
  },
  map: {
    flex: 1,
  },
  controlsLeft: {
    position: 'absolute',
    left: 16,
  },
  controlsRight: {
    position: 'absolute',
    right: 16,
  },
  floatingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(17, 18, 16, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(42, 42, 26, 0.6)',
  },
  statusChipContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
});

export default MapScreen;
```

- [ ] **Step 3: Verify TypeScript compiles for all new/modified files**

Run: `npx tsc --noEmit 2>&1 | grep -E "(MapScreen|TrailSenseDeviceMarker|DetectionBottomSheet|DeviceBottomSheet|SettingsOverlay|StatusChip|useAllPositions)" | head -20`

Expected: No errors in any of these files.

- [ ] **Step 4: Commit**

```bash
git add src/screens/map/MapScreen.tsx src/components/molecules/TrailSenseDeviceMarker/TrailSenseDeviceMarker.tsx
git commit -m "feat: build full MapScreen with deduped markers, bottom sheets, floating controls"
```

---

### Task 8: Smoke Test

**Files:** None (verification only)

- [ ] **Step 1: Run full TypeScript type check**

Run: `npx tsc --noEmit 2>&1 | head -40`

Review output. All new files must be error-free:
- `src/App.tsx`
- `src/navigation/RootNavigator.tsx`
- `src/navigation/linking.ts`
- `src/navigation/persistence.ts`
- `src/screens/map/MapScreen.tsx`
- `src/hooks/useAllPositions.ts`
- `src/components/molecules/StatusChip/StatusChip.tsx`
- `src/components/molecules/TrailSenseDeviceMarker/TrailSenseDeviceMarker.tsx`
- `src/components/organisms/DetectionBottomSheet/DetectionBottomSheet.tsx`
- `src/components/organisms/DeviceBottomSheet/DeviceBottomSheet.tsx`
- `src/components/organisms/SettingsOverlay/SettingsOverlay.tsx`

Pre-existing errors in old (unreferenced) screens are acceptable only if they existed before this branch.

- [ ] **Step 2: Run the app in mock mode**

Run: `npx expo start --ios`

Expected behavior:
1. App launches, shows login screen
2. After login/demo mode, full-screen map renders with outdoor terrain style
3. Blue pulsing sensor node markers visible at mock device coordinates
4. Colored detected device markers visible (deduplicated — one per fingerprint)
5. Status chip at bottom shows "{n} devices detected"
6. Tapping a detected device marker opens DetectionBottomSheet with signal info and sensor attribution
7. Tapping a sensor node marker opens DeviceBottomSheet with status, battery, and detected device list
8. Gear icon (top-left) opens SettingsOverlay with logout
9. Map style toggle (top-right) switches between outdoor and satellite
10. No old tab bar visible

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address smoke test issues in map-centric redesign"
```
