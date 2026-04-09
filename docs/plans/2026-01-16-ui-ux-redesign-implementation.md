# TrailSense UI/UX Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform TrailSense from dated/amateur UI to Apple-native polish with consistent design language across all screens.

**Architecture:** Update design tokens first (brand accent, remove colored card backgrounds), then refactor components bottom-up (atoms → molecules → organisms), finally apply to screens. Each change maintains backward compatibility until full rollout.

**Tech Stack:** React Native, Expo, TypeScript, React Native StyleSheet

---

## Phase 1: Design Tokens (P0)

### Task 1.1: Add Brand Accent Color

**Files:**

- Modify: `src/constants/colors.ts:11-619`

**Step 1: Add brand accent colors to light mode**

In `Colors.light`, after the semantic aliases section (~line 278), add:

```typescript
// ======================
// TrailSense Brand Accent
// ======================

/**
 * Brand accent color - Golden tan from logo
 * Use for primary actions, selected states, brand moments
 */
brandAccent: '#C9B896',
brandAccentLight: '#D4C9A8',
brandAccentDark: '#B5A682',

/**
 * Brand accent with opacity for backgrounds
 */
brandAccentBackground: 'rgba(201, 184, 150, 0.12)',
brandAccentBorder: 'rgba(201, 184, 150, 0.30)',
```

**Step 2: Add brand accent colors to dark mode**

In `Colors.dark`, after the semantic aliases section (~line 477), add:

```typescript
// ======================
// TrailSense Brand Accent
// ======================

/**
 * Brand accent color - Golden tan from logo (adjusted for dark mode)
 */
brandAccent: '#D4C9A8',
brandAccentLight: '#E0D6BE',
brandAccentDark: '#C9B896',

/**
 * Brand accent with opacity for backgrounds
 */
brandAccentBackground: 'rgba(212, 201, 168, 0.15)',
brandAccentBorder: 'rgba(212, 201, 168, 0.35)',
```

**Step 3: Verify the app still compiles**

Run: `npx expo start --clear`
Expected: App launches without errors

**Step 4: Commit**

```bash
git add src/constants/colors.ts
git commit -m "feat(theme): add brand accent color from logo

Golden tan (#C9B896) derived from TrailSense logo trail element.
Replaces cyan accent for brand consistency."
```

---

### Task 1.2: Update Primary Color Reference

**Files:**

- Modify: `src/constants/colors.ts`

**Step 1: Update primary alias to use brand accent**

In `Colors.light` (around line 258), change:

```typescript
// FROM:
primary: '#007AFF',

// TO:
/**
 * Primary color for the app - Brand Accent (Golden Tan)
 * @note systemBlue still available for iOS-native interactive elements
 */
primary: '#C9B896',
```

**Step 2: Update primary alias in dark mode**

In `Colors.dark` (around line 473), change:

```typescript
// FROM:
primary: '#0A84FF',

// TO:
primary: '#D4C9A8',
```

**Step 3: Verify the app still compiles**

Run: `npx expo start --clear`
Expected: App launches, buttons/links now golden instead of blue

**Step 4: Commit**

```bash
git add src/constants/colors.ts
git commit -m "feat(theme): update primary color to brand accent

Primary actions now use golden tan brand color.
systemBlue remains for iOS-native interactive patterns."
```

---

## Phase 2: Core Components (P2)

### Task 2.1: Create FilterChip Component

**Files:**

- Create: `src/components/molecules/FilterChip/FilterChip.tsx`
- Create: `src/components/molecules/FilterChip/index.ts`
- Modify: `src/components/molecules/index.ts`

**Step 1: Create FilterChip component**

Create `src/components/molecules/FilterChip/FilterChip.tsx`:

```typescript
/**
 * FilterChip Component
 *
 * Compact, tappable chip for filtering lists.
 * Shows count with colored status dot indicator.
 * Used to replace chunky colored summary cards.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface FilterChipProps {
  label: string;
  count: number;
  color: string;
  isSelected?: boolean;
  onPress?: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  count,
  color,
  isSelected = false,
  onPress,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isSelected
            ? colors.brandAccentBackground
            : colors.secondarySystemBackground,
          borderColor: isSelected
            ? colors.brandAccent
            : colors.separator,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        variant="headline"
        weight="semibold"
        color={isSelected ? 'label' : 'label'}
        style={styles.count}
      >
        {count}
      </Text>
      <Text
        variant="caption1"
        color="secondaryLabel"
        style={styles.label}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  count: {
    minWidth: 16,
  },
  label: {
    textTransform: 'capitalize',
  },
});

export default FilterChip;
```

**Step 2: Create barrel export**

Create `src/components/molecules/FilterChip/index.ts`:

```typescript
export { FilterChip } from './FilterChip';
export default FilterChip;
```

**Step 3: Add to molecules index**

In `src/components/molecules/index.ts`, add:

```typescript
export { FilterChip } from './FilterChip';
```

**Step 4: Verify component renders**

Run: `npx expo start --clear`
Expected: No compilation errors

**Step 5: Commit**

```bash
git add src/components/molecules/FilterChip/
git add src/components/molecules/index.ts
git commit -m "feat(components): add FilterChip molecule

Compact filter chip with status dot indicator.
Replaces chunky colored summary cards."
```

---

### Task 2.2: Create InlineFilterBar Component

**Files:**

- Create: `src/components/molecules/InlineFilterBar/InlineFilterBar.tsx`
- Create: `src/components/molecules/InlineFilterBar/index.ts`
- Modify: `src/components/molecules/index.ts`

**Step 1: Create InlineFilterBar component**

Create `src/components/molecules/InlineFilterBar/InlineFilterBar.tsx`:

```typescript
/**
 * InlineFilterBar Component
 *
 * Horizontal row of FilterChips for quick filtering.
 * Supports single selection with clear option.
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { FilterChip } from '../FilterChip';

interface FilterOption {
  key: string;
  label: string;
  count: number;
  color: string;
}

interface InlineFilterBarProps {
  options: FilterOption[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}

export const InlineFilterBar: React.FC<InlineFilterBarProps> = ({
  options,
  selectedKey,
  onSelect,
}) => {
  const handlePress = (key: string) => {
    // Toggle selection - tap again to clear
    onSelect(selectedKey === key ? null : key);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((option) => (
        <FilterChip
          key={option.key}
          label={option.label}
          count={option.count}
          color={option.color}
          isSelected={selectedKey === option.key}
          onPress={() => handlePress(option.key)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
});

export default InlineFilterBar;
```

**Step 2: Create barrel export**

Create `src/components/molecules/InlineFilterBar/index.ts`:

```typescript
export { InlineFilterBar } from './InlineFilterBar';
export default InlineFilterBar;
```

**Step 3: Add to molecules index**

In `src/components/molecules/index.ts`, add:

```typescript
export { InlineFilterBar } from './InlineFilterBar';
```

**Step 4: Commit**

```bash
git add src/components/molecules/InlineFilterBar/
git add src/components/molecules/index.ts
git commit -m "feat(components): add InlineFilterBar molecule

Horizontal scrollable row of FilterChips.
Supports single selection with toggle behavior."
```

---

### Task 2.3: Create GroupedListSection Component

**Files:**

- Create: `src/components/molecules/GroupedListSection/GroupedListSection.tsx`
- Create: `src/components/molecules/GroupedListSection/index.ts`
- Modify: `src/components/molecules/index.ts`

**Step 1: Create GroupedListSection component**

Create `src/components/molecules/GroupedListSection/GroupedListSection.tsx`:

```typescript
/**
 * GroupedListSection Component
 *
 * iOS Settings-style grouped list section.
 * Includes section header, rounded container, and inset separators.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface GroupedListSectionProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
}

export const GroupedListSection: React.FC<GroupedListSectionProps> = ({
  title,
  footer,
  children,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  // Filter out null/undefined children and add separators
  const childArray = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.section}>
      {title && (
        <Text
          variant="footnote"
          color="secondaryLabel"
          style={styles.sectionTitle}
        >
          {title.toUpperCase()}
        </Text>
      )}
      <View
        style={[
          styles.container,
          { backgroundColor: colors.secondarySystemGroupedBackground },
        ]}
      >
        {childArray.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {index < childArray.length - 1 && (
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors.separator },
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
      {footer && (
        <Text
          variant="footnote"
          color="secondaryLabel"
          style={styles.sectionFooter}
        >
          {footer}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginLeft: 16,
    marginBottom: 8,
  },
  container: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52, // Inset separator
  },
  sectionFooter: {
    marginLeft: 16,
    marginTop: 8,
    marginRight: 16,
  },
});

export default GroupedListSection;
```

**Step 2: Create barrel export**

Create `src/components/molecules/GroupedListSection/index.ts`:

```typescript
export { GroupedListSection } from './GroupedListSection';
export default GroupedListSection;
```

**Step 3: Add to molecules index**

In `src/components/molecules/index.ts`, add:

```typescript
export { GroupedListSection } from './GroupedListSection';
```

**Step 4: Commit**

```bash
git add src/components/molecules/GroupedListSection/
git add src/components/molecules/index.ts
git commit -m "feat(components): add GroupedListSection molecule

iOS Settings-style grouped list section with:
- Section header (uppercase, muted)
- Rounded container
- Inset separators
- Optional footer"
```

---

### Task 2.4: Create GroupedListRow Component

**Files:**

- Create: `src/components/molecules/GroupedListRow/GroupedListRow.tsx`
- Create: `src/components/molecules/GroupedListRow/index.ts`
- Modify: `src/components/molecules/index.ts`

**Step 1: Create GroupedListRow component**

Create `src/components/molecules/GroupedListRow/GroupedListRow.tsx`:

```typescript
/**
 * GroupedListRow Component
 *
 * Single row for use within GroupedListSection.
 * Supports icon, title, subtitle, value, and navigation chevron.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface GroupedListRowProps {
  icon?: string;
  iconColor?: string;
  iconBackgroundColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  showChevron?: boolean;
  destructive?: boolean;
  onPress?: () => void;
}

export const GroupedListRow: React.FC<GroupedListRowProps> = ({
  icon,
  iconColor,
  iconBackgroundColor,
  title,
  subtitle,
  value,
  showChevron = false,
  destructive = false,
  onPress,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const handlePress = () => {
    if (destructive) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const titleColor = destructive ? colors.systemRed : colors.label;

  return (
    <Pressable
      onPress={onPress ? handlePress : undefined}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && onPress && styles.pressed,
      ]}
    >
      {icon && (
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: iconBackgroundColor || `${iconColor || colors.systemBlue}20`,
            },
          ]}
        >
          <Icon
            name={icon as any}
            size={20}
            color={iconColor || colors.systemBlue}
          />
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            variant="body"
            style={[styles.title, { color: titleColor }]}
          >
            {title}
          </Text>
          {value && (
            <Text variant="body" color="secondaryLabel">
              {value}
            </Text>
          )}
        </View>
        {subtitle && (
          <Text variant="footnote" color="secondaryLabel">
            {subtitle}
          </Text>
        )}
      </View>
      {showChevron && onPress && (
        <Icon
          name="chevron-forward"
          size={18}
          color={colors.tertiaryLabel}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  pressed: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
});

export default GroupedListRow;
```

**Step 2: Create barrel export**

Create `src/components/molecules/GroupedListRow/index.ts`:

```typescript
export { GroupedListRow } from './GroupedListRow';
export default GroupedListRow;
```

**Step 3: Add to molecules index**

In `src/components/molecules/index.ts`, add:

```typescript
export { GroupedListRow } from './GroupedListRow';
```

**Step 4: Commit**

```bash
git add src/components/molecules/GroupedListRow/
git add src/components/molecules/index.ts
git commit -m "feat(components): add GroupedListRow molecule

iOS Settings-style list row with:
- Optional icon with tinted background
- Title and optional subtitle
- Right-aligned value
- Navigation chevron
- Destructive variant (red text)"
```

---

## Phase 3: Alert Screens (P1)

### Task 3.1: Refactor AlertsHeaderHero to Use InlineFilterBar

**Files:**

- Modify: `src/components/organisms/HeaderHero/AlertsHeaderHero.tsx`

**Step 1: Replace gradient cards with InlineFilterBar**

Replace the entire file content of `src/components/organisms/HeaderHero/AlertsHeaderHero.tsx`:

```typescript
/**
 * AlertsHeaderHero - Redesigned
 *
 * Clean inline filter bar replacing chunky gradient cards.
 * Uses FilterChip components for threat level filtering.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { InlineFilterBar } from '@components/molecules/InlineFilterBar';
import { useTheme } from '@hooks/useTheme';
import { ThreatLevel } from '@types';

interface AlertsHeaderHeroProps {
  threatCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  selectedFilter: ThreatLevel | null;
  onFilterSelect: (level: ThreatLevel | null) => void;
}

export const AlertsHeaderHero: React.FC<AlertsHeaderHeroProps> = ({
  threatCounts,
  selectedFilter,
  onFilterSelect,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const filterOptions = [
    {
      key: 'critical',
      label: 'Critical',
      count: threatCounts.critical,
      color: colors.systemRed,
    },
    {
      key: 'high',
      label: 'High',
      count: threatCounts.high,
      color: colors.systemOrange,
    },
    {
      key: 'medium',
      label: 'Medium',
      count: threatCounts.medium,
      color: colors.systemYellow,
    },
    {
      key: 'low',
      label: 'Low',
      count: threatCounts.low,
      color: colors.systemGreen,
    },
  ];

  return (
    <View style={styles.container}>
      <InlineFilterBar
        options={filterOptions}
        selectedKey={selectedFilter}
        onSelect={(key) => onFilterSelect(key as ThreatLevel | null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
});
```

**Step 2: Verify the Alerts screen renders correctly**

Run: `npx expo start --clear`
Navigate to Alerts screen
Expected: Filter chips instead of gradient cards

**Step 3: Commit**

```bash
git add src/components/organisms/HeaderHero/AlertsHeaderHero.tsx
git commit -m "refactor(AlertsHeaderHero): replace gradient cards with FilterChips

Removes chunky colored boxes in favor of inline filter bar.
Cleaner, more iOS-native appearance."
```

---

### Task 3.2: Simplify AlertCard - Remove Colored Background

**Files:**

- Modify: `src/components/organisms/AlertCard/AlertCard.tsx`

**Step 1: Update AlertCard to use neutral background**

In `src/components/organisms/AlertCard/AlertCard.tsx`, update the card container styles.

Find the return statement (~line 202) and update:

```typescript
// Change the Animated.View style from:
style={[
  styles.card,
  {
    backgroundColor: theme.colors.secondarySystemBackground,
    // ... rest
  },
  style,
]}

// The background is already neutral, but ensure we remove any threat-based tinting
// The key change is removing the action buttons row and making the card cleaner
```

**Step 2: Remove inline action buttons, keep swipe actions**

Find the action row section (~line 402-450) and remove it entirely:

```typescript
// DELETE this entire block:
{/* Action buttons */}
<View style={styles.actionRow}>
  {/* ... Whitelist and Delete buttons */}
</View>
```

Also remove the corresponding styles:

```typescript
// DELETE these styles:
actionRow: { ... },
actionButton: { ... },
```

**Step 3: Clean up the card content**

Update the card content area to be more compact:

```typescript
// In cardContent style:
cardContent: {
  flex: 1,
  padding: 14,
  paddingLeft: 16,
},

// In header marginBottom:
header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
},

// In detectionRow marginBottom:
detectionRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 12,
  marginBottom: 0, // Remove bottom margin
},
```

**Step 4: Verify the Alerts screen renders correctly**

Run: `npx expo start --clear`
Navigate to Alerts screen
Expected: Cleaner alert cards without inline action buttons

**Step 5: Commit**

```bash
git add src/components/organisms/AlertCard/AlertCard.tsx
git commit -m "refactor(AlertCard): remove inline action buttons

Action buttons now available via swipe gesture only.
Cleaner, less cluttered card appearance."
```

---

### Task 3.3: Refactor AlertDetailScreen with Grouped Lists

**Files:**

- Modify: `src/screens/alerts/AlertDetailScreen.tsx`

**Step 1: Read current AlertDetailScreen**

First, read the current implementation to understand its structure.

**Step 2: Update imports**

Add the new component imports at the top:

```typescript
import { GroupedListSection, GroupedListRow } from '@components/molecules';
```

**Step 3: Refactor the screen content**

Replace the card-based layout with grouped list sections following this structure:

- Screen title: Detection type (e.g., "Bluetooth Detection")
- Subtitle: Priority + timestamp
- SIGNAL section: Signal strength info
- LOCATION section: GPS coordinates + View on Map
- SOURCE DEVICE section: Device link
- STATUS section: Mark Reviewed, False Positive actions
- Delete action (separate, destructive)

**Step 4: Verify the Alert Detail screen renders correctly**

Run: `npx expo start --clear`
Navigate to Alert Detail screen
Expected: Grouped list layout matching design spec

**Step 5: Commit**

```bash
git add src/screens/alerts/AlertDetailScreen.tsx
git commit -m "refactor(AlertDetail): apply grouped list design

- Detection type as screen title
- Grouped sections: Signal, Location, Source, Status
- Actions consolidated into single section
- GPS coordinates added to Location section"
```

---

## Phase 4: Device Screens (P1)

### Task 4.1: Refactor DevicesHeaderHero to Use InlineFilterBar

**Files:**

- Modify: `src/components/organisms/HeaderHero/DevicesHeaderHero.tsx`

**Step 1: Read current implementation**

Read `src/components/organisms/HeaderHero/DevicesHeaderHero.tsx` to understand current structure.

**Step 2: Replace with InlineFilterBar pattern**

Similar to AlertsHeaderHero, replace the chunky cards with inline filter chips:

```typescript
/**
 * DevicesHeaderHero - Redesigned
 *
 * Clean inline filter bar for device status filtering.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { InlineFilterBar } from '@components/molecules/InlineFilterBar';
import { useTheme } from '@hooks/useTheme';

type DeviceStatus = 'online' | 'offline' | null;

interface DevicesHeaderHeroProps {
  deviceCounts: {
    total: number;
    online: number;
    offline: number;
  };
  selectedFilter: DeviceStatus;
  onFilterSelect: (status: DeviceStatus) => void;
}

export const DevicesHeaderHero: React.FC<DevicesHeaderHeroProps> = ({
  deviceCounts,
  selectedFilter,
  onFilterSelect,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const filterOptions = [
    {
      key: 'online',
      label: 'Online',
      count: deviceCounts.online,
      color: colors.systemGreen,
    },
    {
      key: 'offline',
      label: 'Offline',
      count: deviceCounts.offline,
      color: colors.systemRed,
    },
  ];

  return (
    <View style={styles.container}>
      <InlineFilterBar
        options={filterOptions}
        selectedKey={selectedFilter}
        onSelect={(key) => onFilterSelect(key as DeviceStatus)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
});
```

**Step 3: Verify Devices screen renders correctly**

Run: `npx expo start --clear`
Navigate to Devices screen
Expected: Filter chips instead of colored boxes

**Step 4: Commit**

```bash
git add src/components/organisms/HeaderHero/DevicesHeaderHero.tsx
git commit -m "refactor(DevicesHeaderHero): replace colored boxes with FilterChips

Inline filter bar for Online/Offline filtering.
Matches AlertsHeaderHero pattern."
```

---

### Task 4.2: Simplify DeviceCard - Neutral Background

**Files:**

- Modify: `src/components/organisms/DeviceCard/DeviceCard.tsx`

**Step 1: Remove status-based background coloring**

In `src/components/organisms/DeviceCard/DeviceCard.tsx`, find the `cardBackgroundColor` useMemo (~line 237-242) and update:

```typescript
// Change from status-based coloring to neutral:
const cardBackgroundColor = useMemo(() => {
  return theme.colors.secondarySystemBackground;
}, [theme.colors]);

// Also update borderColor to neutral:
const borderColor = useMemo(() => {
  return theme.colors.separator;
}, [theme.colors]);
```

**Step 2: Simplify the stats grid**

The current stats grid has icon circles and dividers. Simplify to a cleaner inline format:

```typescript
// Replace the statsGrid section with a cleaner row:
<View style={styles.statsRow}>
  <Text variant="subheadline" color="secondaryLabel">
    {batteryLevel}%
  </Text>
  <Text variant="subheadline" color="tertiaryLabel"> · </Text>
  <Text variant="subheadline" color="secondaryLabel">
    {signalStrength}
  </Text>
  <Text variant="subheadline" color="tertiaryLabel"> · </Text>
  <Text variant="subheadline" color="secondaryLabel">
    {device.detectionCount || 0} detections
  </Text>
</View>
```

**Step 3: Update styles**

Add the new stats row style and remove the complex grid styles:

```typescript
statsRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 4,
  marginBottom: 8,
},
```

**Step 4: Verify Devices screen renders correctly**

Run: `npx expo start --clear`
Navigate to Devices screen
Expected: Neutral card backgrounds, simpler metrics display

**Step 5: Commit**

```bash
git add src/components/organisms/DeviceCard/DeviceCard.tsx
git commit -m "refactor(DeviceCard): neutral background and simplified metrics

- Removes status-based colored backgrounds
- Inline metrics: battery · signal · detections
- Cleaner, less busy appearance"
```

---

### Task 4.3: Refactor DeviceDetailScreen with Grouped Lists

**Files:**

- Modify: `src/screens/devices/DeviceDetailScreen.tsx`

**Step 1: Read current DeviceDetailScreen**

Understand the current structure before refactoring.

**Step 2: Update imports and refactor to grouped lists**

Apply the same grouped list pattern:

- Screen title: Device name
- Subtitle: Status dot + Online/Offline + last seen time
- STATUS section: Battery, Signal, Detections
- DEVICE INFO section: Firmware, Device ID
- LOCATION section: Coordinates + View on Map
- Remove Device action (separate, destructive)

**Step 3: Verify Device Detail screen renders correctly**

Expected: Grouped list layout matching design spec

**Step 4: Commit**

```bash
git add src/screens/devices/DeviceDetailScreen.tsx
git commit -m "refactor(DeviceDetail): apply grouped list design

- Device name as screen title
- Status in subtitle
- Grouped sections: Status, Device Info, Location
- Remove Device action at bottom"
```

---

## Phase 5: Map Screen (P3)

### Task 5.1: Simplify ProximityHeatmapScreen Header

**Files:**

- Modify: `src/screens/radar/ProximityHeatmapScreen.tsx`

**Step 1: Update header to use device name as title**

In the ScreenLayout header prop, change from static "Proximity Heatmap" to device name:

```typescript
<ScreenLayout
  header={{
    title: selectedDevice?.name || 'Map',
    largeTitle: false, // Use regular title for detail screens
    showBackButton: true,
  }}
  variant="map"
>
```

**Step 2: Replace compactHeader card with subtitle**

Remove the separate compactHeader Card and integrate status into the screen header or a simple subtitle row:

```typescript
{/* Simple status subtitle */}
<View style={styles.statusSubtitle}>
  <View style={[styles.statusDot, { backgroundColor: selectedDevice?.online ? colors.systemGreen : colors.systemRed }]} />
  <Text variant="subheadline" color="secondaryLabel">
    {selectedDevice?.online ? 'Online' : 'Offline'} · {selectedDevice?.batteryPercent || 0}% · {formatCoordinates(deviceCoordinates)}
  </Text>
</View>
```

**Step 3: Add page dots for multi-device swipe**

If multiple devices, add page indicator dots below the map.

**Step 4: Verify Map screen renders correctly**

Expected: Device name as title, compact status subtitle, cleaner layout

**Step 5: Commit**

```bash
git add src/screens/radar/ProximityHeatmapScreen.tsx
git commit -m "refactor(ProximityHeatmap): device name as title, simplified header

- Device name replaces generic 'Proximity Heatmap' title
- Status integrated into compact subtitle
- Cleaner visual hierarchy"
```

---

### Task 5.2: Enhance PositionListItem with More Details

**Files:**

- Modify: `src/components/molecules/PositionListItem/PositionListItem.tsx`

**Step 1: Add two-line format with accuracy**

Update the component to show:

- Line 1: Signal type label + fingerprint
- Line 2: Confidence + accuracy

```typescript
<View style={styles.content}>
  <View style={styles.titleRow}>
    <Text variant="body" weight="medium" color="label">
      {SIGNAL_TYPE_LABELS[position.signalType]} Device
    </Text>
  </View>
  <Text variant="footnote" color="secondaryLabel">
    {position.fingerprintHash} · {position.confidence}% · ±{position.accuracyMeters?.toFixed(1)}m
  </Text>
</View>
<Icon name="chevron-forward" size={16} color={colors.tertiaryLabel} />
```

**Step 2: Add chevron for navigation affordance**

Indicate that tapping will center on the map.

**Step 3: Commit**

```bash
git add src/components/molecules/PositionListItem/PositionListItem.tsx
git commit -m "refactor(PositionListItem): two-line format with accuracy

- Signal type label instead of just icon
- Fingerprint + confidence + accuracy on second line
- Navigation chevron added"
```

---

## Phase 6: Analytics Screen (P3)

### Task 6.1: Refactor DashboardScreen with Grouped Lists

**Files:**

- Modify: `src/screens/analytics/DashboardScreen.tsx`

**Step 1: Replace stat cards with grouped list sections**

- OVERVIEW section: Detections row, Active Devices row
- DETECTION TREND section: Chart
- BY TYPE section: Breakdown list

**Step 2: Use native segmented control for time period**

Replace custom time period buttons with iOS-style segmented control appearance.

**Step 3: Commit**

```bash
git add src/screens/analytics/DashboardScreen.tsx
git commit -m "refactor(Dashboard): apply grouped list design

- Overview stats in grouped list format
- Segmented control for time period
- Detection types as list with percentages"
```

---

## Phase 7: Settings Screen (P4)

### Task 7.1: Refine SettingsScreen Styling

**Files:**

- Modify: `src/screens/settings/SettingsScreen.tsx`

**Step 1: Ensure consistent use of GroupedListSection/Row**

Settings is already close to iOS style. Verify it uses:

- Grouped sections with proper headers
- Consistent icon sizing
- Right-aligned values in muted color

**Step 2: Add app version footer**

```typescript
<Text variant="footnote" color="tertiaryLabel" style={styles.versionFooter}>
  TrailSense v1.0.0
</Text>
```

**Step 3: Commit**

```bash
git add src/screens/settings/SettingsScreen.tsx
git commit -m "refactor(Settings): minor polish and version footer

- Consistent grouped list styling
- App version footer added"
```

---

## Phase 8: Tab Bar (P4)

### Task 8.1: Update Tab Bar Selected Color

**Files:**

- Modify: Navigation configuration file (likely `app/_layout.tsx` or similar)

**Step 1: Update tab bar tint color to brand accent**

```typescript
tabBarActiveTintColor: colors.brandAccent,
tabBarInactiveTintColor: colors.secondaryLabel,
```

**Step 2: Rename TrailSense tab to "AI"**

Prevent truncation by shortening the label.

**Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "refactor(navigation): brand accent tab bar, rename AI tab

- Selected tab uses golden tan accent
- 'TrailSens...' renamed to 'AI' to prevent truncation"
```

---

## Phase 9: Final Polish (P4)

### Task 9.1: Update EmptyState Component

**Files:**

- Modify: `src/components/templates/EmptyState/EmptyState.tsx`

**Step 1: Ensure outline-style icons**

Use `*-outline` icon variants for empty states.

**Step 2: Center text and limit to 2 lines**

**Step 3: Commit**

```bash
git add src/components/templates/EmptyState/
git commit -m "refactor(EmptyState): polish with outline icons

- Outline-style icons (not filled)
- Centered text, max 2 lines
- Optional CTA button support"
```

---

### Task 9.2: Final Review and Cleanup

**Step 1: Run full app test**

Navigate through all screens verifying:

- Consistent card backgrounds (neutral)
- Brand accent used for primary actions
- Filter chips instead of colored boxes
- Grouped list sections where appropriate

**Step 2: Remove any unused imports or dead code**

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: UI/UX redesign cleanup

Remove unused imports and dead code from refactor."
```

---

## Summary

| Phase   | Tasks                                     | Priority |
| ------- | ----------------------------------------- | -------- |
| Phase 1 | Design tokens (brand accent)              | P0       |
| Phase 2 | Core components (FilterChip, GroupedList) | P2       |
| Phase 3 | Alert screens                             | P1       |
| Phase 4 | Device screens                            | P1       |
| Phase 5 | Map screen                                | P3       |
| Phase 6 | Analytics screen                          | P3       |
| Phase 7 | Settings screen                           | P4       |
| Phase 8 | Tab bar                                   | P4       |
| Phase 9 | Final polish                              | P4       |

**Total Tasks:** 15 main tasks with ~45 individual steps

**Execution Order:** P0 → P2 → P1 → P3 → P4 (tokens first, then components, then screens)
