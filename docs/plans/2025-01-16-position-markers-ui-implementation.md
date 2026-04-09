# Position Markers UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Display triangulated device positions as map markers on the ProximityHeatmapScreen, replacing the zone-only heatmap visualization.

**Architecture:** Use Mapbox PointAnnotation components to render detected devices at their GPS coordinates. The TrailSense device shows as a blue pulsing marker, detected devices show as signal-type-colored markers. Tap a marker to see a minimal popup with confidence/accuracy.

**Tech Stack:** React Native, @rnmapbox/maps 10.x, TypeScript, React Query (usePositions hook)

---

## Task 1: Create DetectedDeviceMarker Component

**Files:**

- Create: `/Users/codyschexnider/Documents/Project/TrailSense/src/components/molecules/DetectedDeviceMarker/DetectedDeviceMarker.tsx`
- Create: `/Users/codyschexnider/Documents/Project/TrailSense/src/components/molecules/DetectedDeviceMarker/index.ts`

**Step 1: Create the marker component**

```typescript
/**
 * DetectedDeviceMarker
 *
 * Map marker for a triangulated detected device position
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { PointAnnotation } from '@rnmapbox/maps';
import { Icon } from '@components/atoms/Icon';
import { TriangulationSignalType } from '@/types/triangulation';

interface DetectedDeviceMarkerProps {
  id: string;
  coordinate: [number, number]; // [longitude, latitude]
  signalType: TriangulationSignalType;
  confidence: number;
  onPress?: () => void;
}

const SIGNAL_TYPE_COLORS: Record<TriangulationSignalType, string> = {
  wifi: '#007AFF',      // systemBlue
  bluetooth: '#5856D6', // systemIndigo
  cellular: '#FF9500',  // systemOrange
};

const SIGNAL_TYPE_ICONS: Record<TriangulationSignalType, string> = {
  wifi: 'wifi',
  bluetooth: 'bluetooth',
  cellular: 'cellular',
};

export const DetectedDeviceMarker: React.FC<DetectedDeviceMarkerProps> = ({
  id,
  coordinate,
  signalType,
  confidence,
  onPress,
}) => {
  const color = SIGNAL_TYPE_COLORS[signalType] || '#8E8E93';
  const iconName = SIGNAL_TYPE_ICONS[signalType] || 'ellipse';

  // Opacity based on confidence (50% conf = 0.6 opacity, 100% conf = 1.0)
  const opacity = 0.6 + (confidence / 100) * 0.4;

  return (
    <PointAnnotation
      id={`detected-device-${id}`}
      coordinate={coordinate}
      onSelected={onPress}
    >
      <TouchableOpacity
        style={[styles.markerContainer, { opacity }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={[styles.markerOuter, { backgroundColor: color }]}>
          <View style={styles.markerInner}>
            <Icon name={iconName} size={14} color={color} />
          </View>
        </View>
      </TouchableOpacity>
    </PointAnnotation>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  markerInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DetectedDeviceMarker;
```

**Step 2: Create index export**

```typescript
export { DetectedDeviceMarker } from './DetectedDeviceMarker';
export { default } from './DetectedDeviceMarker';
```

**Step 3: Commit**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
git add src/components/molecules/DetectedDeviceMarker/
git commit -m "feat(components): add DetectedDeviceMarker for map positions"
```

---

## Task 2: Create PositionInfoPopup Component

**Files:**

- Create: `/Users/codyschexnider/Documents/Project/TrailSense/src/components/molecules/PositionInfoPopup/PositionInfoPopup.tsx`
- Create: `/Users/codyschexnider/Documents/Project/TrailSense/src/components/molecules/PositionInfoPopup/index.ts`

**Step 1: Create the popup component**

```typescript
/**
 * PositionInfoPopup
 *
 * Minimal popup shown when tapping a detected device marker
 * Shows: signal type icon, confidence %, accuracy radius
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { TriangulationSignalType } from '@/types/triangulation';

interface PositionInfoPopupProps {
  signalType: TriangulationSignalType;
  confidence: number;
  accuracyMeters: number;
  onClose: () => void;
}

const SIGNAL_TYPE_LABELS: Record<TriangulationSignalType, string> = {
  wifi: 'WiFi',
  bluetooth: 'Bluetooth',
  cellular: 'Cellular',
};

const SIGNAL_TYPE_COLORS: Record<TriangulationSignalType, string> = {
  wifi: '#007AFF',
  bluetooth: '#5856D6',
  cellular: '#FF9500',
};

const SIGNAL_TYPE_ICONS: Record<TriangulationSignalType, string> = {
  wifi: 'wifi',
  bluetooth: 'bluetooth',
  cellular: 'cellular',
};

export const PositionInfoPopup: React.FC<PositionInfoPopupProps> = ({
  signalType,
  confidence,
  accuracyMeters,
  onClose,
}) => {
  const color = SIGNAL_TYPE_COLORS[signalType] || '#8E8E93';
  const iconName = SIGNAL_TYPE_ICONS[signalType] || 'ellipse';
  const label = SIGNAL_TYPE_LABELS[signalType] || 'Unknown';

  return (
    <View style={styles.container}>
      <View style={styles.popup}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="close" size={16} color="secondaryLabel" />
        </TouchableOpacity>

        {/* Signal type row */}
        <View style={styles.row}>
          <Icon name={iconName} size={18} color={color} />
          <Text variant="subheadline" weight="semibold" color="label" style={styles.label}>
            {label}
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {/* Confidence */}
          <View style={styles.stat}>
            <Text variant="caption1" color="secondaryLabel">
              Confidence
            </Text>
            <Text variant="headline" weight="bold" color="label">
              {confidence}%
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Accuracy */}
          <View style={styles.stat}>
            <Text variant="caption1" color="secondaryLabel">
              Accuracy
            </Text>
            <Text variant="headline" weight="bold" color="label">
              ±{accuracyMeters.toFixed(1)}m
            </Text>
          </View>
        </View>
      </View>

      {/* Pointer triangle */}
      <View style={styles.pointer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  popup: {
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderRadius: 12,
    padding: 12,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  label: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(28, 28, 30, 0.95)',
    marginTop: -1,
  },
});

export default PositionInfoPopup;
```

**Step 2: Create index export**

```typescript
export { PositionInfoPopup } from './PositionInfoPopup';
export { default } from './PositionInfoPopup';
```

**Step 3: Commit**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
git add src/components/molecules/PositionInfoPopup/
git commit -m "feat(components): add PositionInfoPopup for marker details"
```

---

## Task 3: Export New Components from Molecules Index

**Files:**

- Modify: `/Users/codyschexnider/Documents/Project/TrailSense/src/components/molecules/index.ts`

**Step 1: Check current exports and add new ones**

First read the file to see current structure, then add:

```typescript
export * from './DetectedDeviceMarker';
export * from './PositionInfoPopup';
```

**Step 2: Commit**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
git add src/components/molecules/index.ts
git commit -m "feat(components): export DetectedDeviceMarker and PositionInfoPopup"
```

---

## Task 4: Create TrailSenseDeviceMarker Component

**Files:**

- Create: `/Users/codyschexnider/Documents/Project/TrailSense/src/components/molecules/TrailSenseDeviceMarker/TrailSenseDeviceMarker.tsx`
- Create: `/Users/codyschexnider/Documents/Project/TrailSense/src/components/molecules/TrailSenseDeviceMarker/index.ts`

**Step 1: Create the blue pulsing marker for TrailSense device**

```typescript
/**
 * TrailSenseDeviceMarker
 *
 * Blue pulsing marker showing the TrailSense device's GPS location
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { PointAnnotation } from '@rnmapbox/maps';

interface TrailSenseDeviceMarkerProps {
  id: string;
  coordinate: [number, number]; // [longitude, latitude]
  isOnline?: boolean;
}

export const TrailSenseDeviceMarker: React.FC<TrailSenseDeviceMarkerProps> = ({
  id,
  coordinate,
  isOnline = true,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation when online
  useEffect(() => {
    if (isOnline) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isOnline, pulseAnim]);

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [1, 1.3],
    outputRange: [0.4, 0],
  });

  return (
    <PointAnnotation
      id={`trailsense-device-${id}`}
      coordinate={coordinate}
    >
      <View style={styles.container}>
        {/* Pulse ring (only when online) */}
        {isOnline && (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseOpacity,
              },
            ]}
          />
        )}

        {/* Outer blue circle */}
        <View style={[styles.outerCircle, !isOnline && styles.offlineOuter]}>
          {/* Inner white circle */}
          <View style={styles.innerCircle}>
            {/* Center dot */}
            <View style={[styles.centerDot, !isOnline && styles.offlineDot]} />
          </View>
        </View>
      </View>
    </PointAnnotation>
  );
};

const BLUE = '#007AFF';
const GRAY = '#8E8E93';

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BLUE,
  },
  outerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  offlineOuter: {
    backgroundColor: GRAY,
  },
  innerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BLUE,
  },
  offlineDot: {
    backgroundColor: GRAY,
  },
});

export default TrailSenseDeviceMarker;
```

**Step 2: Create index export**

```typescript
export { TrailSenseDeviceMarker } from './TrailSenseDeviceMarker';
export { default } from './TrailSenseDeviceMarker';
```

**Step 3: Export from molecules index**

Add to `/Users/codyschexnider/Documents/Project/TrailSense/src/components/molecules/index.ts`:

```typescript
export * from './TrailSenseDeviceMarker';
```

**Step 4: Commit**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
git add src/components/molecules/TrailSenseDeviceMarker/ src/components/molecules/index.ts
git commit -m "feat(components): add TrailSenseDeviceMarker with pulse animation"
```

---

## Task 5: Update ProximityHeatmapScreen - Add Position State and Imports

**Files:**

- Modify: `/Users/codyschexnider/Documents/Project/TrailSense/src/screens/radar/ProximityHeatmapScreen.tsx`

**Step 1: Add imports at top of file (after existing imports around line 30)**

Add after the existing Mapbox imports:

```typescript
import { PointAnnotation } from '@rnmapbox/maps';
import { usePositions } from '@hooks/api/usePositions';
import { DetectedDeviceMarker } from '@components/molecules/DetectedDeviceMarker';
import { TrailSenseDeviceMarker } from '@components/molecules/TrailSenseDeviceMarker';
import { PositionInfoPopup } from '@components/molecules/PositionInfoPopup';
import { TriangulatedPosition } from '@/types/triangulation';
```

**Step 2: Add state for selected position popup (inside component, after existing state around line 136)**

Add after the `initialCameraRef` line:

```typescript
// Selected position for popup
const [selectedPosition, setSelectedPosition] =
  useState<TriangulatedPosition | null>(null);
```

**Step 3: Add usePositions hook call (after useAlerts call around line 153)**

Add after the `useAlerts` call:

```typescript
// Fetch triangulated positions for selected device
const { data: positionsData } = usePositions(selectedDevice?.id);
const positions = positionsData?.positions ?? [];
```

**Step 4: Commit**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
git add src/screens/radar/ProximityHeatmapScreen.tsx
git commit -m "feat(heatmap): add imports and state for position markers"
```

---

## Task 6: Update ProximityHeatmapScreen - Add Position Markers to Map

**Files:**

- Modify: `/Users/codyschexnider/Documents/Project/TrailSense/src/screens/radar/ProximityHeatmapScreen.tsx`

**Step 1: Add position markers inside the MapView (after the Camera component, around line 503)**

Find the `</Camera>` closing tag and add after it (but still inside `<MapView>`):

```typescript
                  {/* TrailSense Device Marker */}
                  <TrailSenseDeviceMarker
                    id={selectedDevice?.id || 'device'}
                    coordinate={[deviceCoordinates.longitude!, deviceCoordinates.latitude!]}
                    isOnline={selectedDevice?.online}
                  />

                  {/* Detected Device Position Markers */}
                  {positions.map((position) => (
                    <DetectedDeviceMarker
                      key={position.id}
                      id={position.id}
                      coordinate={[position.longitude, position.latitude]}
                      signalType={position.signalType}
                      confidence={position.confidence}
                      onPress={() => setSelectedPosition(position)}
                    />
                  ))}
```

**Step 2: Commit**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
git add src/screens/radar/ProximityHeatmapScreen.tsx
git commit -m "feat(heatmap): render TrailSense and detected device markers on map"
```

---

## Task 7: Update ProximityHeatmapScreen - Add Position Popup Overlay

**Files:**

- Modify: `/Users/codyschexnider/Documents/Project/TrailSense/src/screens/radar/ProximityHeatmapScreen.tsx`

**Step 1: Add popup overlay (after the Reset View Button, around line 641)**

Find the closing `</>` after the resetButton and add before it:

```typescript
                {/* Position Info Popup */}
                {selectedPosition && (
                  <View style={styles.popupOverlay}>
                    <PositionInfoPopup
                      signalType={selectedPosition.signalType}
                      confidence={selectedPosition.confidence}
                      accuracyMeters={selectedPosition.accuracyMeters}
                      onClose={() => setSelectedPosition(null)}
                    />
                  </View>
                )}
```

**Step 2: Add popup overlay style (in styles object at bottom of file)**

Add to the StyleSheet:

```typescript
  popupOverlay: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
```

**Step 3: Commit**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
git add src/screens/radar/ProximityHeatmapScreen.tsx
git commit -m "feat(heatmap): add position info popup on marker tap"
```

---

## Task 8: Update ProximityHeatmapScreen - Add Positions Count to Summary

**Files:**

- Modify: `/Users/codyschexnider/Documents/Project/TrailSense/src/screens/radar/ProximityHeatmapScreen.tsx`

**Step 1: Update the Zone Summary card to show triangulated positions count**

Find the legendCard section (around line 662) and update the header to show positions:

Replace the legendHeader View content:

```typescript
          <View style={styles.legendHeader}>
            <Text variant="headline" weight="semibold" color="label">
              Zone Summary
            </Text>
            <View style={styles.legendHeaderRight}>
              {positions.length > 0 && (
                <View style={styles.positionsCount}>
                  <Icon name="location" size={14} color="systemGreen" />
                  <Text variant="footnote" color="systemGreen">
                    {positions.length} triangulated
                  </Text>
                </View>
              )}
              <Text variant="footnote" color="secondaryLabel">
                {totalDetections} detection{totalDetections !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
```

**Step 2: Add styles for the new elements**

Add to StyleSheet:

```typescript
  legendHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  positionsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
```

**Step 3: Commit**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
git add src/screens/radar/ProximityHeatmapScreen.tsx
git commit -m "feat(heatmap): show triangulated positions count in summary"
```

---

## Task 9: Clear Selected Position on Device Change

**Files:**

- Modify: `/Users/codyschexnider/Documents/Project/TrailSense/src/screens/radar/ProximityHeatmapScreen.tsx`

**Step 1: Update the useEffect that resets overlay on device change (around line 334)**

Find the useEffect with `setOverlayTransform` and add:

```typescript
// Reset overlay when device changes
useEffect(() => {
  setOverlayTransform({ translateX: 0, translateY: 0, scale: 1 });
  initialCameraRef.current = null;
  setSelectedPosition(null); // Clear any open popup
}, [selectedDeviceIndex]);
```

**Step 2: Commit**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
git add src/screens/radar/ProximityHeatmapScreen.tsx
git commit -m "fix(heatmap): clear position popup when switching devices"
```

---

## Task 10: Add WebSocket Handler to Invalidate Positions on Update

**Files:**

- Modify: `/Users/codyschexnider/Documents/Project/TrailSense/src/screens/radar/ProximityHeatmapScreen.tsx`

**Step 1: Add import for websocketService and queryClient**

Add to imports:

```typescript
import { websocketService } from '@api/websocket';
import { useQueryClient } from '@tanstack/react-query';
import { POSITIONS_QUERY_KEY } from '@hooks/api/usePositions';
```

**Step 2: Add useEffect to handle WebSocket updates (after the usePositions call)**

```typescript
// Handle WebSocket position updates
const queryClient = useQueryClient();

useEffect(() => {
  const handlePositionsUpdated = (data: {
    deviceId: string;
    positions: any[];
  }) => {
    // Invalidate positions query for this device to trigger refetch
    if (data.deviceId === selectedDevice?.id) {
      queryClient.invalidateQueries({
        queryKey: [POSITIONS_QUERY_KEY, data.deviceId],
      });
    }
  };

  websocketService.on('positions-updated', handlePositionsUpdated);
  return () =>
    websocketService.off('positions-updated', handlePositionsUpdated);
}, [selectedDevice?.id, queryClient]);
```

**Step 3: Commit**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
git add src/screens/radar/ProximityHeatmapScreen.tsx
git commit -m "feat(heatmap): handle WebSocket position updates in real-time"
```

---

## Task 11: Final Commit and Test

**Step 1: Run TypeScript check**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
npx tsc --noEmit
```

Expected: No errors

**Step 2: Run Metro bundler to verify**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
npx expo start --clear
```

Expected: App bundles without errors

**Step 3: Final commit**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
git add -A
git commit -m "feat: complete position markers UI for ProximityHeatmapScreen"
```

---

## Summary of Changes

| File                                               | Change                                      |
| -------------------------------------------------- | ------------------------------------------- |
| `src/components/molecules/DetectedDeviceMarker/`   | New component - signal-type-colored marker  |
| `src/components/molecules/PositionInfoPopup/`      | New component - minimal popup on tap        |
| `src/components/molecules/TrailSenseDeviceMarker/` | New component - blue pulsing device marker  |
| `src/components/molecules/index.ts`                | Export new components                       |
| `src/screens/radar/ProximityHeatmapScreen.tsx`     | Integrate markers, popup, WebSocket updates |

## Visual Result

After implementation:

- **Blue pulsing marker**: TrailSense device location
- **Colored markers**: Detected devices (blue=WiFi, purple=Bluetooth, orange=Cellular)
- **Tap marker**: Shows popup with signal type, confidence %, accuracy ±Xm
- **Real-time**: Markers update via WebSocket when new positions arrive
- **Zone overlay preserved**: Heatmap zones still visible underneath markers
