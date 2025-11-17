# Phase 4: Organism Components

**Duration:** 15-18 hours
**Status:** ⬜ Not Started

## Overview

This phase involves major redesigns of organism components including AlertCard, DeviceCard, RadarDisplay, and Header. These components will be refactored to use iOS design patterns and the updated atom/molecule components.

## Prerequisites

- [x] Phase 1 complete (design system)
- [x] Phase 2 complete (atom components)
- [x] Phase 3 complete (molecule components)
- [ ] Understand iOS swipe actions pattern
- [ ] Study Apple's notification/alert cards
- [ ] Reference iOS Health app for card designs

## Tasks

### 4.1 AlertCard Component

**File:** `src/components/organisms/AlertCard.tsx`

#### Remove All Hardcoded Colors

- [ ] Remove: `#999`, `#FFFFFF`, `#CCCCCC`, `#888`, etc.
- [ ] Use theme semantic colors throughout

#### Complete Redesign for iOS

- [ ] **Remove inline action buttons**
  - Delete "Dismiss", "Whitelist", "View" buttons
  - Use swipe actions instead (iOS pattern)

- [ ] **Implement swipe actions:**
  ```typescript
  <SwipeableRow
    rightActions={[
      swipeActions.delete(() => onDismiss?.(alert.id)),
      {
        label: 'Whitelist',
        backgroundColor: colors.systemOrange,
        onPress: () => onWhitelist?.(alert.macAddress),
        icon: <Icon name="shield-checkmark-outline" size={20} color="white" />,
      },
    ]}
  >
    {/* Card content */}
  </SwipeableRow>
  ```

- [ ] **Redesign card layout:**
  ```
  ┌────────────────────────────────────────┐
  │ [Badge] CRITICAL          Nov 16, 8:15 │
  │                                         │
  │ [Icon] Cellular Detection               │
  │        Device: device-001               │
  │        Signal: -55 dBm                  │
  │        BB:B:15:1F:29:33                 │
  │                                      [›]│
  └────────────────────────────────────────┘
  ```

- [ ] **Header row:**
  - Left: Threat level badge (small, subtle)
  - Right: Timestamp (caption1, secondaryLabel)
  - Spacing: 8pt between

- [ ] **Detection type with icon:**
  - Use Ionicon styled like SF Symbol
  - Icon size: 24pt
  - Icon color: Based on detection type
    - Cellular: systemPurple
    - WiFi: systemBlue
    - Bluetooth: systemTeal

- [ ] **Title (detection type):**
  - Text variant: headline
  - Color: label
  - Example: "Cellular Detection", "WiFi Detection"

- [ ] **Metadata rows:**
  - Text variant: subheadline
  - Color: secondaryLabel
  - Format: "Label: Value"
  - Spacing: 4pt between rows

- [ ] **Chevron indicator:**
  - Position: absolute right
  - Icon: chevron-forward, size 20, color tertiaryLabel
  - Indicates tappable for details

- [ ] **Card styling:**
  - Use Card molecule component
  - Variant: grouped
  - Padding: 16pt
  - Haptic feedback on tap

#### Update Props Interface

- [ ] **Update AlertCardProps:**
  ```typescript
  interface AlertCardProps {
    alert: Alert;
    onPress?: (alertId: string) => void;
    onDismiss?: (alertId: string) => void;
    onWhitelist?: (macAddress: string) => void;
    style?: ViewStyle;
  }
  ```

- [ ] Remove button-related props

#### Implement Haptic Feedback

- [ ] Haptic on tap
- [ ] Haptic when swipe actions revealed
- [ ] Haptic on action execution

#### Testing

- [ ] Test card renders with all alert types
- [ ] Test threat level badges
- [ ] Test detection type icons
- [ ] Test swipe actions work
- [ ] Test tap navigation works
- [ ] Test in light and dark mode
- [ ] Verify no hardcoded colors

---

### 4.2 DeviceCard Component

**File:** `src/components/organisms/DeviceCard.tsx`

#### Remove All Hardcoded Colors

- [ ] Remove: `#FFFFFF`, `#999`, `#666`, etc.
- [ ] Use theme semantic colors

#### Complete Redesign for iOS

- [ ] **Status indicator as colored dot:**
  ```typescript
  // Not a badge, just a colored circle
  <View style={{
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: device.online ? colors.systemGreen : colors.systemRed,
  }} />
  ```

- [ ] **Redesign card layout:**
  ```
  ┌────────────────────────────────────────┐
  │ 🟢 South Boundary            ONLINE    │
  │                                         │
  │ ┌─────────┬──────────┬─────────────┐  │
  │ │   92%   │   good   │     87      │  │
  │ │ Battery │  Signal  │ Detections  │  │
  │ └─────────┴──────────┴─────────────┘  │
  │                                         │
  │ 📍 29.7589, -95.3710                   │
  └────────────────────────────────────────┘
  ```

- [ ] **Header row:**
  - Status dot (8pt, green/red)
  - Device name (headline, label)
  - Status text (footnote, secondaryLabel) - aligned right

- [ ] **Stats grid (3 columns):**
  - Container: Light background (systemGray6 light, systemGray5 dark)
  - Border radius: 8pt
  - Padding: 12pt
  - Spacing between columns: 8pt

- [ ] **Stat column:**
  ```typescript
  // Each column:
  <View style={{ flex: 1, alignItems: 'center' }}>
    <Icon name="battery-half" size={20} color={colors.secondaryLabel} />
    <Text variant="title3" color="label">{value}</Text>
    <Text variant="caption2" color="secondaryLabel">{label}</Text>
  </View>
  ```

- [ ] **Stats icons:**
  - Battery: "battery-half" (or appropriate battery icon)
  - Signal: "wifi" or "cellular"
  - Detections: "eye-outline"

- [ ] **Location row:**
  - Icon: "location" size 16, secondaryLabel
  - Text: caption1, secondaryLabel
  - Format: "lat, lng"

- [ ] **Card styling:**
  - Use Card component variant="grouped"
  - Padding: 16pt
  - Spacing between sections: 12pt

#### Update Props Interface

- [ ] **Update DeviceCardProps:**
  ```typescript
  interface DeviceCardProps {
    device: Device;
    onPress?: (deviceId: string) => void;
    style?: ViewStyle;
  }
  ```

#### Battery Icon Selection

- [ ] **Create battery icon helper:**
  ```typescript
  const getBatteryIcon = (level: number): string => {
    if (level >= 80) return 'battery-full';
    if (level >= 50) return 'battery-half';
    if (level >= 20) return 'battery-charging';
    return 'battery-dead';
  };
  ```

#### Testing

- [ ] Test with online device
- [ ] Test with offline device
- [ ] Test battery levels (different icons)
- [ ] Test signal strength levels
- [ ] Test tap navigation
- [ ] Test in light and dark mode
- [ ] Verify no hardcoded colors

---

### 4.3 RadarDisplay Component

**File:** `src/components/organisms/RadarDisplay.tsx`

#### Remove All Hardcoded Colors

- [ ] Remove all hardcoded colors:
  - `#FF0000`, `#FF6B00`, `#FFB800`, `#00C853` (threat levels)
  - `#888888`, `#333`, `#666`, `#000` (grays)

- [ ] **Use theme semantic colors:**
  ```typescript
  const { colors } = useTheme();

  // Threat level colors
  const threatColors = {
    critical: colors.systemRed,
    high: colors.systemOrange,
    medium: colors.systemYellow,
    low: colors.systemGreen,
  };
  ```

#### Update Radar Visualization

- [ ] **Background:**
  - Color: secondarySystemBackground
  - Border: 1pt solid separator

- [ ] **Grid lines (concentric circles):**
  - Color: separator (adapt to dark mode)
  - Stroke width: 1pt
  - Subtle, not prominent

- [ ] **Crosshairs:**
  - Color: separator
  - Stroke width: 1pt
  - Subtle vertical and horizontal lines

- [ ] **Center point:**
  - Small circle (6pt radius)
  - Color: systemBlue
  - Represents device location

- [ ] **Sweep animation:**
  - Color: systemGreen with 20% opacity
  - More subtle than current
  - Smooth rotation

- [ ] **Detection points:**
  - Size: 8-12pt based on threat level
  - Color: Use threatColors mapping
  - Subtle glow effect (optional)

- [ ] **Distance markers:**
  - Text variant: caption2
  - Color: secondaryLabel
  - Position at 200ft, 400ft, 800ft rings

#### Redesign Legend

- [ ] **Create legend component:**
  ```typescript
  <View style={styles.legend}>
    <LegendItem color={colors.systemRed} label="Critical" />
    <LegendItem color={colors.systemOrange} label="High" />
    <LegendItem color={colors.systemYellow} label="Medium" />
    <LegendItem color={colors.systemGreen} label="Low" />
  </View>

  const LegendItem = ({ color, label }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text variant="caption1" color="secondaryLabel">{label}</Text>
    </View>
  );
  ```

- [ ] Position legend at bottom
- [ ] Horizontal layout with spacing
- [ ] Use semantic colors

#### Optimize Performance

- [ ] Ensure smooth 60fps animation
- [ ] Use `useNativeDriver: true` where possible
- [ ] Optimize re-renders

#### Update Props Interface

- [ ] **Update RadarDisplayProps:**
  ```typescript
  interface RadarDisplayProps {
    detections: Detection[];
    maxRange?: number;  // Default 800ft
    showSweep?: boolean;  // Default true
    style?: ViewStyle;
  }
  ```

#### Testing

- [ ] Test with various detection counts
- [ ] Test sweep animation smoothness
- [ ] Test in light mode
- [ ] Test in dark mode
- [ ] Verify all colors are from theme
- [ ] Test performance (should be 60fps)

---

### 4.4 Header Component

**File:** `src/components/organisms/Header.tsx`

#### Ensure iOS Navigation Bar Styling

- [ ] **Verify current implementation matches iOS:**
  - Height: 44pt (standard iOS nav bar)
  - Background: systemBackground
  - Border bottom: hairline separator

- [ ] **Back button:**
  - Icon: chevron-back (chevron-left)
  - Text: Previous screen title or "Back"
  - Color: systemBlue
  - Tappable area: 44x44pt minimum
  - Haptic feedback on press

- [ ] **Title:**
  - Text variant: title3 (20pt)
  - Color: label
  - Center-aligned
  - Weight: regular (not bold)

- [ ] **Action buttons (right side):**
  - Use Button component with buttonStyle="plain"
  - Color: systemBlue
  - Multiple actions: space 8-16pt apart
  - Icons or text labels

- [ ] **Large title support (iOS 11+ pattern):**
  ```typescript
  largeTitle?: boolean;
  largeTitleText?: string;
  ```
  - When true, show large title below nav bar
  - Text variant: largeTitle (34pt)
  - Scrollable content collapses it

#### Update Props Interface

- [ ] **Update HeaderProps:**
  ```typescript
  interface HeaderProps {
    // Navigation
    showBack?: boolean;
    backTitle?: string;
    onBackPress?: () => void;

    // Title
    title: string;
    subtitle?: string;
    largeTitle?: boolean;

    // Actions
    rightActions?: React.ReactNode;

    // Style
    style?: ViewStyle;
  }
  ```

#### Testing

- [ ] Test back button
- [ ] Test title rendering
- [ ] Test right actions
- [ ] Test large title mode
- [ ] Test in light and dark mode
- [ ] Verify 44pt minimum touch targets

---

## Update All Usage Sites

### AlertCard Usage

- [ ] Find all AlertCard imports
- [ ] Remove button handlers (onDismiss, onWhitelist kept but used for swipe)
- [ ] Update to handle onPress for navigation
- [ ] Add swipe action handlers

**Key files:**
- [ ] `src/screens/alerts/AlertListScreen.tsx`

### DeviceCard Usage

- [ ] Find all DeviceCard imports
- [ ] Verify device data structure matches
- [ ] Update onPress handlers

**Key files:**
- [ ] `src/screens/devices/DeviceListScreen.tsx`

### RadarDisplay Usage

- [ ] Find all RadarDisplay imports
- [ ] Verify detections data structure
- [ ] Update any custom styling

**Key files:**
- [ ] `src/screens/radar/LiveRadarScreen.tsx`

### Header Usage

- [ ] Find all Header imports (if used standalone)
- [ ] Verify props match new interface
- [ ] Most headers are in ScreenLayout template

---

## TypeScript Error Resolution

- [ ] Run type check: `npm run type-check`
- [ ] Fix all type errors related to organism changes
- [ ] Update Alert, Device, Detection types if needed

---

## Testing Checklist

- [ ] **Visual Testing:**
  - [ ] AlertCard looks iOS-native
  - [ ] DeviceCard has proper stats grid
  - [ ] RadarDisplay has subtle, themed colors
  - [ ] Header matches iOS nav bar

- [ ] **Interaction Testing:**
  - [ ] Swipe actions on AlertCard work
  - [ ] Device card tap navigation works
  - [ ] Radar animation is smooth
  - [ ] Header back button works

- [ ] **Mode Testing:**
  - [ ] All organisms work in light mode
  - [ ] All organisms work in dark mode
  - [ ] Colors transition smoothly

- [ ] **Performance Testing:**
  - [ ] Radar maintains 60fps
  - [ ] List scrolling is smooth
  - [ ] No jank or lag

- [ ] **Build Testing:**
  ```bash
  npm run type-check
  npm run lint
  npm start
  ```

---

## Success Criteria

- ✅ AlertCard redesigned with swipe actions, no inline buttons
- ✅ DeviceCard has iOS-style stats grid with status dot
- ✅ RadarDisplay has no hardcoded colors, uses theme
- ✅ Header matches iOS navigation bar exactly
- ✅ All organisms use semantic colors
- ✅ All organisms use updated molecule/atom components
- ✅ Swipe actions work smoothly with haptics
- ✅ All usage sites updated
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Smooth 60fps animations

## Commit Messages

```bash
git commit -m "feat: redesign AlertCard with iOS swipe actions

- Remove inline action buttons
- Implement swipe-to-delete and swipe-to-whitelist
- Update layout to iOS patterns
- Remove all hardcoded colors
- Add haptic feedback

BREAKING CHANGE: AlertCard no longer has action buttons, uses swipe actions"

git commit -m "feat: redesign DeviceCard with iOS stats grid

- Add colored status dot instead of badge
- Implement 3-column stats grid
- Update typography and spacing
- Remove all hardcoded colors"

git commit -m "refactor: remove hardcoded colors from RadarDisplay

- Use theme semantic colors throughout
- Update legend to iOS style
- Improve dark mode support
- Optimize animation performance"

git commit -m "refactor: ensure Header matches iOS nav bar patterns"

git commit -m "refactor: update all organism component usage sites"
```

---

**Status:** ⬜ Not Started → ⬜ In Progress → ✅ Complete

**Next Phase:** `05-template-components.md`
