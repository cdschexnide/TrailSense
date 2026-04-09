# ProximityHeatmapScreen Modernization

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the ProximityHeatmapScreen from a zone-based heatmap to a clean satellite map with position markers and a detected device list.

**Context:** The original screen was built before triangulation was complete, showing estimated distance zones. Now that we have actual GPS coordinates for detected devices, the zone-based UI is obsolete.

---

## Screen Structure

```
┌─────────────────────────────────┐
│  Device Header Card             │  ← Keep (device name, status, coords)
├─────────────────────────────────┤
│                                 │
│     Satellite Map               │  ← Keep Mapbox, remove SVG overlay
│   ┌───┐                         │
│   │ESP│  ◉ ◉ ◉                  │  ← ESP32 marker + detected device markers
│   └───┘                         │
│                                 │
├─────────────────────────────────┤
│  Detected Devices (3)           │  ← NEW: List header with count
├─────────────────────────────────┤
│  📶 0001        87%             │  ← NEW: Minimal list items
│  📡 c001        92%             │
│  📱 0002        74%             │
└─────────────────────────────────┘
```

---

## Task 1: Create PositionListItem Component

**Files:**

- Create: `src/components/molecules/PositionListItem/PositionListItem.tsx`
- Create: `src/components/molecules/PositionListItem/index.ts`
- Modify: `src/components/molecules/index.ts`

**Step 1: Create the component**

```typescript
/**
 * PositionListItem
 *
 * Minimal list item for a triangulated device position.
 * Shows signal type icon, fingerprint hash, and confidence %.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { TriangulatedPosition, TriangulationSignalType } from '@/types/triangulation';

interface PositionListItemProps {
  position: TriangulatedPosition;
  onPress: () => void;
}

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

export const PositionListItem: React.FC<PositionListItemProps> = ({
  position,
  onPress,
}) => {
  const color = SIGNAL_TYPE_COLORS[position.signalType] || '#8E8E93';
  const iconName = SIGNAL_TYPE_ICONS[position.signalType] || 'ellipse';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon name={iconName} size={18} color={color} />
      </View>
      <Text variant="body" weight="medium" color="label" style={styles.fingerprint}>
        {position.fingerprintHash}
      </Text>
      <Text variant="body" color="secondaryLabel">
        {position.confidence}%
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3a3a3c',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fingerprint: {
    flex: 1,
  },
});

export default PositionListItem;
```

**Step 2: Create index export**

```typescript
export { PositionListItem } from './PositionListItem';
export { default } from './PositionListItem';
```

**Step 3: Add export to molecules index**

Add to `src/components/molecules/index.ts`:

```typescript
export * from './PositionListItem';
```

**Step 4: Commit**

```bash
git add src/components/molecules/PositionListItem/ src/components/molecules/index.ts
git commit -m "feat(components): add PositionListItem for detected devices list"
```

---

## Task 2: Remove SVG Imports and Zone Constants

**Files:**

- Modify: `src/screens/radar/ProximityHeatmapScreen.tsx`

**Step 1: Remove SVG imports (lines 16-24)**

Delete these imports:

```typescript
import Svg, {
  Circle,
  Text as SvgText,
  G,
  Defs,
  RadialGradient,
  Stop,
  Line,
} from 'react-native-svg';
```

**Step 2: Remove mock data toggle and generator (lines 50-96)**

Delete:

- `USE_MOCK_HEATMAP_DATA` constant
- `generateMockAlerts` function
- `MOCK_ALERTS` constant

**Step 3: Remove zone constants and types (lines 103-125)**

Delete:

- `ZONES` array
- `MAX_RADIUS_METERS` constant
- `ProximityData` interface

**Step 4: Commit**

```bash
git add src/screens/radar/ProximityHeatmapScreen.tsx
git commit -m "refactor(heatmap): remove SVG imports and zone constants"
```

---

## Task 3: Remove Zone Calculation Logic

**Files:**

- Modify: `src/screens/radar/ProximityHeatmapScreen.tsx`

**Step 1: Remove overlay transform state (around line 139-144)**

Delete:

```typescript
const [overlayTransform, setOverlayTransform] = useState({
  translateX: 0,
  translateY: 0,
  scale: 1,
});
const initialCameraRef = useRef<{
  center: [number, number];
  zoom: number;
} | null>(null);
```

**Step 2: Remove mock alerts usage (around line 186)**

Delete:

```typescript
const alerts = USE_MOCK_HEATMAP_DATA ? MOCK_ALERTS : fetchedAlerts;
```

**Step 3: Remove proximityData calculation (around line 206-245)**

Delete the entire `proximityData` calculation block including:

- `proximityData: ProximityData[]` mapping
- `totalDetections` calculation
- `maxCount` calculation

**Step 4: Remove handleCameraChanged callback (around line 314-345)**

Delete the entire `handleCameraChanged` callback function.

**Step 5: Remove resetMapView's overlay reset logic**

Simplify `resetMapView` to only handle camera:

```typescript
const resetMapView = useCallback(() => {
  if (cameraRef.current && hasValidLocation) {
    cameraRef.current.setCamera({
      centerCoordinate: [
        deviceCoordinates.longitude!,
        deviceCoordinates.latitude!,
      ],
      zoomLevel: 16,
      animationDuration: 500,
    });
  }
}, [hasValidLocation, deviceCoordinates.longitude, deviceCoordinates.latitude]);
```

**Step 6: Remove overlay reset from device change effect (around line 364-368)**

Simplify to only clear selected position:

```typescript
useEffect(() => {
  setSelectedPosition(null);
}, [selectedDeviceIndex]);
```

**Step 7: Remove estimateDistanceFromRSSI helper (around line 867-872)**

Delete the entire function.

**Step 8: Commit**

```bash
git add src/screens/radar/ProximityHeatmapScreen.tsx
git commit -m "refactor(heatmap): remove zone calculation logic"
```

---

## Task 4: Add centerOnPosition Function

**Files:**

- Modify: `src/screens/radar/ProximityHeatmapScreen.tsx`

**Step 1: Add centerOnPosition callback after resetMapView**

```typescript
// Center map on a specific position and show its popup
const centerOnPosition = useCallback((position: TriangulatedPosition) => {
  if (cameraRef.current) {
    cameraRef.current.setCamera({
      centerCoordinate: [position.longitude, position.latitude],
      zoomLevel: 17,
      animationDuration: 500,
    });
  }
  setSelectedPosition(position);
}, []);
```

**Step 2: Add PositionListItem import at top of file**

```typescript
import { PositionListItem } from '@components/molecules/PositionListItem';
```

**Step 3: Commit**

```bash
git add src/screens/radar/ProximityHeatmapScreen.tsx
git commit -m "feat(heatmap): add centerOnPosition for list-to-map interaction"
```

---

## Task 5: Remove SVG Overlay from JSX

**Files:**

- Modify: `src/screens/radar/ProximityHeatmapScreen.tsx`

**Step 1: Remove the heatmapOverlay View (around lines 558-677)**

Delete the entire block:

```typescript
{/* SVG Heatmap Overlay - syncs with map gestures via transform */}
<View
  style={[
    styles.heatmapOverlay,
    ...
  ]}
  pointerEvents="none"
>
  <Svg ...>
    ...
  </Svg>
</View>
```

**Step 2: Remove onCameraChanged prop from MapView**

Change:

```typescript
onCameraChanged = { handleCameraChanged };
```

To: (remove the prop entirely)

**Step 3: Simplify Reset View button condition**

The button should show when map has been moved from device center. Simplify to always show or use a simpler condition based on camera state.

For now, keep a simple version:

```typescript
{/* Reset View Button */}
<TouchableOpacity
  style={styles.resetButton}
  onPress={resetMapView}
  activeOpacity={0.8}
>
  <Icon name="locate" size={18} color="white" />
</TouchableOpacity>
```

**Step 4: Commit**

```bash
git add src/screens/radar/ProximityHeatmapScreen.tsx
git commit -m "refactor(heatmap): remove SVG heatmap overlay from JSX"
```

---

## Task 6: Remove Zone Cards from JSX

**Files:**

- Modify: `src/screens/radar/ProximityHeatmapScreen.tsx`

**Step 1: Remove Zone Legend card (around lines 726-760)**

Delete the entire `legendCard` Card component.

**Step 2: Remove Detection Type Totals card (around lines 762-789)**

Delete the entire `typeCard` Card component.

**Step 3: Remove Detection Breakdown by Zone card (around lines 791-860)**

Delete the entire `detailsCard` Card component.

**Step 4: Commit**

```bash
git add src/screens/radar/ProximityHeatmapScreen.tsx
git commit -m "refactor(heatmap): remove zone-based cards from UI"
```

---

## Task 7: Add Detected Devices List

**Files:**

- Modify: `src/screens/radar/ProximityHeatmapScreen.tsx`

**Step 1: Add the detected devices list card after the heatmapCard**

```typescript
{/* Detected Devices List */}
<Card variant="grouped" style={styles.listCard}>
  <View style={styles.listHeader}>
    <Text variant="headline" weight="semibold" color="label">
      Detected Devices
    </Text>
    <Text variant="footnote" color="secondaryLabel">
      {positions.length}
    </Text>
  </View>

  {positions.length === 0 ? (
    <View style={styles.emptyState}>
      <Icon name="radio-outline" size={32} color="systemGray" />
      <Text variant="subheadline" color="secondaryLabel" style={styles.emptyText}>
        No detected devices
      </Text>
    </View>
  ) : (
    positions.map(position => (
      <PositionListItem
        key={position.id}
        position={position}
        onPress={() => centerOnPosition(position)}
      />
    ))
  )}
</Card>
```

**Step 2: Add styles for the list**

```typescript
listCard: {
  marginHorizontal: 16,
  marginBottom: 16,
  paddingBottom: 0,
},
listHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 12,
  paddingVertical: 12,
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: '#3a3a3c',
},
emptyState: {
  alignItems: 'center',
  paddingVertical: 32,
  gap: 8,
},
emptyText: {
  marginTop: 4,
},
```

**Step 3: Commit**

```bash
git add src/screens/radar/ProximityHeatmapScreen.tsx
git commit -m "feat(heatmap): add detected devices list with map interaction"
```

---

## Task 8: Clean Up Unused Styles

**Files:**

- Modify: `src/screens/radar/ProximityHeatmapScreen.tsx`

**Step 1: Remove unused styles from StyleSheet**

Delete these style definitions:

- `heatmapOverlay`
- `legendCard`
- `legendHeader`
- `legendHeaderRight`
- `positionsCount`
- `zoneSummaryRow`
- `zoneSummaryItem`
- `zoneSummaryColor`
- `zoneSummaryLabel`
- `typeCard`
- `typeRow`
- `typeItem`
- `typeCount`
- `typeDivider`
- `detailsCard`
- `detailsTitle`
- `zoneRow`
- `zoneLeftSection`
- `zoneRightSection`
- `colorIndicator`
- `zoneInfo`
- `zoneNameRow`
- `threatLabel`
- `zoneTypeIcons`
- `typeIconBadge`
- `zoneBar`
- `zoneBarFill`

**Step 2: Commit**

```bash
git add src/screens/radar/ProximityHeatmapScreen.tsx
git commit -m "refactor(heatmap): remove unused zone-related styles"
```

---

## Task 9: Final Verification

**Step 1: Run TypeScript check**

```bash
cd /Users/codyschexnider/Documents/Project/TrailSense
npx tsc --noEmit
```

Expected: No errors

**Step 2: Run ESLint**

```bash
npm run lint
```

Expected: No errors (or only pre-existing ones)

**Step 3: Test the app**

```bash
npx expo start --clear
```

Verify:

- Map loads with satellite view
- ESP32 device shows as blue pulsing marker
- Detected devices show as colored markers
- Tapping marker shows popup
- Detected devices list shows below map
- Tapping list item centers map and shows popup
- Empty state shows when no positions

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(heatmap): complete modernization - positions over zones"
```

---

## Summary of Changes

| Action | Files                                                            |
| ------ | ---------------------------------------------------------------- |
| Create | `src/components/molecules/PositionListItem/PositionListItem.tsx` |
| Create | `src/components/molecules/PositionListItem/index.ts`             |
| Modify | `src/components/molecules/index.ts`                              |
| Modify | `src/screens/radar/ProximityHeatmapScreen.tsx`                   |

**Removed:**

- SVG heatmap overlay with zone rings
- Zone Summary, Detection Type Totals, Detection Breakdown cards
- Zone constants, calculations, and related state
- Mock data generation
- ~350 lines of code

**Added:**

- PositionListItem component
- Detected devices list with empty state
- centerOnPosition function for list-to-map interaction
- ~100 lines of code

**Net result:** ~250 fewer lines, cleaner focused UI
