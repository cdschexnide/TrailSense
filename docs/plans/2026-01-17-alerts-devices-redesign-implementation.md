# Alerts & Devices UI/UX Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Alerts and Devices screens to Tesla/Rivian dashboard aesthetic with activity graph hero, scannable cards, tabbed detail screens, and floating action bars.

**Architecture:** Build foundation components first (GlowContainer, MetricsBar, ActivityChart, FloatingActionBar, TabSegment), then update list screens (AlertsHeaderHero, AlertCard, DevicesHeaderHero, DeviceCard), finally refactor detail screens with tabs pattern.

**Tech Stack:** React Native, Expo, TypeScript, React Native Animated API, react-native-skia for charts

---

## Phase 1: Foundation Components

### Task 1.1: Create GlowContainer Component

A wrapper component that adds a subtle colored glow behind its children. Used for critical alerts and offline devices.

**Files:**

- Create: `src/components/molecules/GlowContainer/GlowContainer.tsx`
- Create: `src/components/molecules/GlowContainer/index.ts`
- Modify: `src/components/molecules/index.ts`

**Step 1: Create GlowContainer component**

```typescript
// src/components/molecules/GlowContainer/GlowContainer.tsx
/**
 * GlowContainer Component
 *
 * Wraps children with a subtle animated glow effect.
 * Used for critical alerts and offline devices.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ViewStyle } from 'react-native';

interface GlowContainerProps {
  children: React.ReactNode;
  glowColor: string;
  intensity?: 'subtle' | 'medium' | 'strong';
  pulse?: boolean;
  style?: ViewStyle;
}

export const GlowContainer: React.FC<GlowContainerProps> = ({
  children,
  glowColor,
  intensity = 'subtle',
  pulse = true,
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  const intensityMap = {
    subtle: { blur: 8, opacity: 0.15 },
    medium: { blur: 12, opacity: 0.25 },
    strong: { blur: 16, opacity: 0.35 },
  };

  const config = intensityMap[intensity];

  useEffect(() => {
    if (pulse) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: config.opacity + 0.1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: config.opacity - 0.05,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [pulse, config.opacity]);

  return (
    <View style={[styles.container, style]}>
      {/* Glow layer */}
      <Animated.View
        style={[
          styles.glowLayer,
          {
            backgroundColor: glowColor,
            opacity: pulse ? pulseAnim : config.opacity,
            // Shadow for additional glow effect
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: config.blur,
          },
        ]}
      />
      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});

export default GlowContainer;
```

**Step 2: Create barrel export**

```typescript
// src/components/molecules/GlowContainer/index.ts
export { GlowContainer } from './GlowContainer';
export default GlowContainer;
```

**Step 3: Add to molecules index**

Add to `src/components/molecules/index.ts`:

```typescript
export { GlowContainer } from './GlowContainer';
```

**Step 4: Verify compilation**

Run: `npx expo start --clear`
Expected: App launches without errors

**Step 5: Commit**

```bash
git add src/components/molecules/GlowContainer/
git add src/components/molecules/index.ts
git commit -m "feat(components): add GlowContainer molecule

Animated glow wrapper for critical alerts and offline devices.
Supports pulse animation and intensity levels."
```

---

### Task 1.2: Create MetricsBar Component

Horizontal bar displaying metrics with subtle dividers, Tesla dashboard style.

**Files:**

- Create: `src/components/molecules/MetricsBar/MetricsBar.tsx`
- Create: `src/components/molecules/MetricsBar/index.ts`
- Modify: `src/components/molecules/index.ts`

**Step 1: Create MetricsBar component**

```typescript
// src/components/molecules/MetricsBar/MetricsBar.tsx
/**
 * MetricsBar Component
 *
 * Horizontal row of metrics with subtle dividers.
 * Tesla dashboard style for device cards.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface Metric {
  value: string | number;
  label: string;
}

interface MetricsBarProps {
  metrics: Metric[];
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ metrics }) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View style={styles.container}>
      {metrics.map((metric, index) => (
        <React.Fragment key={metric.label}>
          <View style={styles.metricItem}>
            <Text variant="headline" color="label" style={styles.value}>
              {metric.value}
            </Text>
            <Text variant="caption2" color="tertiaryLabel" style={styles.label}>
              {metric.label}
            </Text>
          </View>
          {index < metrics.length - 1 && (
            <View
              style={[styles.divider, { backgroundColor: colors.separator }]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontWeight: '600',
    fontSize: 16,
  },
  label: {
    marginTop: 2,
    textTransform: 'lowercase',
  },
  divider: {
    width: 1,
    height: 28,
    opacity: 0.5,
  },
});

export default MetricsBar;
```

**Step 2: Create barrel export**

```typescript
// src/components/molecules/MetricsBar/index.ts
export { MetricsBar } from './MetricsBar';
export default MetricsBar;
```

**Step 3: Add to molecules index**

Add to `src/components/molecules/index.ts`:

```typescript
export { MetricsBar } from './MetricsBar';
```

**Step 4: Commit**

```bash
git add src/components/molecules/MetricsBar/
git add src/components/molecules/index.ts
git commit -m "feat(components): add MetricsBar molecule

Horizontal metrics display with dividers for device cards.
Tesla dashboard style layout."
```

---

### Task 1.3: Create ActivityChart Component

Area chart with gradient fill for the Alerts hero section.

**Files:**

- Create: `src/components/molecules/ActivityChart/ActivityChart.tsx`
- Create: `src/components/molecules/ActivityChart/index.ts`
- Modify: `src/components/molecules/index.ts`

**Step 1: Create ActivityChart component**

```typescript
// src/components/molecules/ActivityChart/ActivityChart.tsx
/**
 * ActivityChart Component
 *
 * Area chart with gradient fill showing detection activity over time.
 * Tesla-style visualization for Alerts hero.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Canvas, Path, LinearGradient, vec } from '@shopify/react-native-skia';
import { useTheme } from '@hooks/useTheme';

interface ActivityChartProps {
  data: number[];
  height?: number;
  onSegmentPress?: (index: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ActivityChart: React.FC<ActivityChartProps> = ({
  data,
  height = 80,
  onSegmentPress,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const chartWidth = SCREEN_WIDTH - 32; // Account for padding

  // Generate smooth path from data
  const { path, maxValue } = useMemo(() => {
    if (!data.length) return { path: '', maxValue: 1 };

    const max = Math.max(...data, 1);
    const segmentWidth = chartWidth / (data.length - 1 || 1);
    const padding = 4;
    const chartHeight = height - padding * 2;

    // Build SVG path
    let pathStr = `M 0 ${height}`;

    // Start from bottom-left
    data.forEach((value, index) => {
      const x = index * segmentWidth;
      const y = padding + chartHeight - (value / max) * chartHeight;

      if (index === 0) {
        pathStr += ` L ${x} ${y}`;
      } else {
        // Smooth curve using quadratic bezier
        const prevX = (index - 1) * segmentWidth;
        const cpX = (prevX + x) / 2;
        pathStr += ` Q ${cpX} ${y} ${x} ${y}`;
      }
    });

    // Close the path
    pathStr += ` L ${chartWidth} ${height} Z`;

    return { path: pathStr, maxValue: max };
  }, [data, chartWidth, height]);

  // Handle segment press for navigation
  const handlePress = (event: any) => {
    if (!onSegmentPress || !data.length) return;

    const { locationX } = event.nativeEvent;
    const segmentWidth = chartWidth / data.length;
    const index = Math.floor(locationX / segmentWidth);
    onSegmentPress(Math.min(index, data.length - 1));
  };

  if (!data.length) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyState} />
      </View>
    );
  }

  return (
    <Pressable onPress={handlePress} style={[styles.container, { height }]}>
      <Canvas style={{ width: chartWidth, height }}>
        <Path path={path} color={colors.brandAccent}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, height)}
            colors={[`${colors.brandAccent}60`, `${colors.brandAccent}05`]}
          />
        </Path>
        {/* Top line for definition */}
        <Path
          path={path.replace(/ L \d+ \d+ Z$/, '')} // Remove close path
          color={colors.brandAccent}
          style="stroke"
          strokeWidth={2}
        />
      </Canvas>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyState: {
    flex: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
  },
});

export default ActivityChart;
```

**Step 2: Create barrel export**

```typescript
// src/components/molecules/ActivityChart/index.ts
export { ActivityChart } from './ActivityChart';
export default ActivityChart;
```

**Step 3: Add to molecules index**

Add to `src/components/molecules/index.ts`:

```typescript
export { ActivityChart } from './ActivityChart';
```

**Step 4: Commit**

```bash
git add src/components/molecules/ActivityChart/
git add src/components/molecules/index.ts
git commit -m "feat(components): add ActivityChart molecule

Area chart with gradient fill for Alerts hero.
Uses Skia for smooth rendering."
```

---

### Task 1.4: Create FloatingActionBar Component

Bottom action bar with primary button and secondary icons.

**Files:**

- Create: `src/components/molecules/FloatingActionBar/FloatingActionBar.tsx`
- Create: `src/components/molecules/FloatingActionBar/index.ts`
- Modify: `src/components/molecules/index.ts`

**Step 1: Create FloatingActionBar component**

```typescript
// src/components/molecules/FloatingActionBar/FloatingActionBar.tsx
/**
 * FloatingActionBar Component
 *
 * Bottom action bar with primary button and secondary icon actions.
 * Used on detail screens for quick actions.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Text, Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface ActionItem {
  icon: string;
  label: string;
  onPress: () => void;
}

interface FloatingActionBarProps {
  primaryAction: {
    label: string;
    icon?: string;
    onPress: () => void;
  };
  secondaryActions?: ActionItem[];
  moreActions?: ActionItem[];
  onMorePress?: () => void;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  primaryAction,
  secondaryActions = [],
  onMorePress,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  const handlePrimaryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    primaryAction.onPress();
  };

  const handleSecondaryPress = (action: ActionItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action.onPress();
  };

  const handleMorePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMorePress?.();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.secondarySystemBackground,
          borderTopColor: colors.separator,
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      {/* Primary Action Button */}
      <Pressable
        onPress={handlePrimaryPress}
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor: colors.brandAccent },
          pressed && styles.pressed,
        ]}
      >
        {primaryAction.icon && (
          <Icon
            name={primaryAction.icon as any}
            size={20}
            color="#FFFFFF"
            style={styles.primaryIcon}
          />
        )}
        <Text variant="headline" style={styles.primaryLabel}>
          {primaryAction.label}
        </Text>
      </Pressable>

      {/* Secondary Actions */}
      <View style={styles.secondaryContainer}>
        {secondaryActions.map((action, index) => (
          <Pressable
            key={index}
            onPress={() => handleSecondaryPress(action)}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Icon
              name={action.icon as any}
              size={24}
              color={colors.secondaryLabel}
            />
          </Pressable>
        ))}
        {onMorePress && (
          <Pressable
            onPress={handleMorePress}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Icon
              name="ellipsis-horizontal"
              size={24}
              color={colors.secondaryLabel}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryIcon: {
    marginRight: 4,
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  pressed: {
    opacity: 0.7,
  },
});

export default FloatingActionBar;
```

**Step 2: Create barrel export**

```typescript
// src/components/molecules/FloatingActionBar/index.ts
export { FloatingActionBar } from './FloatingActionBar';
export default FloatingActionBar;
```

**Step 3: Add to molecules index**

Add to `src/components/molecules/index.ts`:

```typescript
export { FloatingActionBar } from './FloatingActionBar';
```

**Step 4: Commit**

```bash
git add src/components/molecules/FloatingActionBar/
git add src/components/molecules/index.ts
git commit -m "feat(components): add FloatingActionBar molecule

Bottom action bar with primary button and secondary icons.
Used on detail screens for quick actions."
```

---

### Task 1.5: Create TabSegment Component

Segmented control for switching between tabs in detail screens.

**Files:**

- Create: `src/components/molecules/TabSegment/TabSegment.tsx`
- Create: `src/components/molecules/TabSegment/index.ts`
- Modify: `src/components/molecules/index.ts`

**Step 1: Create TabSegment component**

```typescript
// src/components/molecules/TabSegment/TabSegment.tsx
/**
 * TabSegment Component
 *
 * iOS-style segmented control for switching between tabs.
 * Used in detail screens for Signal/Location/History tabs.
 */

import React from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface Tab {
  key: string;
  label: string;
}

interface TabSegmentProps {
  tabs: Tab[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

export const TabSegment: React.FC<TabSegmentProps> = ({
  tabs,
  selectedKey,
  onSelect,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const handleSelect = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(key);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.tertiarySystemFill },
      ]}
    >
      {tabs.map((tab) => {
        const isSelected = tab.key === selectedKey;

        return (
          <Pressable
            key={tab.key}
            onPress={() => handleSelect(tab.key)}
            style={[
              styles.tab,
              isSelected && [
                styles.selectedTab,
                { backgroundColor: colors.secondarySystemBackground },
              ],
            ]}
          >
            <Text
              variant="subheadline"
              weight={isSelected ? 'semibold' : 'regular'}
              color={isSelected ? 'label' : 'secondaryLabel'}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 3,
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default TabSegment;
```

**Step 2: Create barrel export**

```typescript
// src/components/molecules/TabSegment/index.ts
export { TabSegment } from './TabSegment';
export default TabSegment;
```

**Step 3: Add to molecules index**

Add to `src/components/molecules/index.ts`:

```typescript
export { TabSegment } from './TabSegment';
```

**Step 4: Commit**

```bash
git add src/components/molecules/TabSegment/
git add src/components/molecules/index.ts
git commit -m "feat(components): add TabSegment molecule

iOS-style segmented control for detail screen tabs.
Signal/Location/History navigation."
```

---

### Task 1.6: Create DetailHero Component

Hero summary section for detail screens showing key metrics.

**Files:**

- Create: `src/components/molecules/DetailHero/DetailHero.tsx`
- Create: `src/components/molecules/DetailHero/index.ts`
- Modify: `src/components/molecules/index.ts`

**Step 1: Create DetailHero component**

```typescript
// src/components/molecules/DetailHero/DetailHero.tsx
/**
 * DetailHero Component
 *
 * Hero summary section for detail screens.
 * Shows title, subtitle, and inline metrics.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface DetailHeroProps {
  statusColor?: string;
  title: string;
  subtitle: string;
  metrics?: string[];
}

export const DetailHero: React.FC<DetailHeroProps> = ({
  statusColor,
  title,
  subtitle,
  metrics = [],
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.secondarySystemBackground },
      ]}
    >
      {/* Title row with optional status dot */}
      <View style={styles.titleRow}>
        {statusColor && (
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        )}
        <Text variant="title2" weight="bold" color="label">
          {title}
        </Text>
      </View>

      {/* Subtitle */}
      <Text variant="subheadline" color="secondaryLabel" style={styles.subtitle}>
        {subtitle}
      </Text>

      {/* Inline metrics */}
      {metrics.length > 0 && (
        <View style={styles.metricsRow}>
          {metrics.map((metric, index) => (
            <React.Fragment key={index}>
              <Text variant="subheadline" color="secondaryLabel">
                {metric}
              </Text>
              {index < metrics.length - 1 && (
                <Text variant="subheadline" color="tertiaryLabel">
                  {' · '}
                </Text>
              )}
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 16,
    borderRadius: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  subtitle: {
    marginTop: 4,
    marginLeft: 22, // Align with title after dot
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginLeft: 22,
  },
});

export default DetailHero;
```

**Step 2: Create barrel export**

```typescript
// src/components/molecules/DetailHero/index.ts
export { DetailHero } from './DetailHero';
export default DetailHero;
```

**Step 3: Add to molecules index**

Add to `src/components/molecules/index.ts`:

```typescript
export { DetailHero } from './DetailHero';
```

**Step 4: Commit**

```bash
git add src/components/molecules/DetailHero/
git add src/components/molecules/index.ts
git commit -m "feat(components): add DetailHero molecule

Hero summary for detail screens with status dot,
title, subtitle, and inline metrics."
```

---

## Phase 2: Update Alerts List Screen

### Task 2.1: Update AlertsHeaderHero with Activity Chart

Replace current inline filter bar with activity chart + filter chips below.

**Files:**

- Modify: `src/components/organisms/HeaderHero/AlertsHeaderHero.tsx`

**Step 1: Update AlertsHeaderHero**

Replace the entire file content:

```typescript
// src/components/organisms/HeaderHero/AlertsHeaderHero.tsx
/**
 * AlertsHeaderHero - Tesla Dashboard Style
 *
 * Activity area chart showing detection volume over 24h,
 * with filter chips below for threat level filtering.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ActivityChart } from '@components/molecules/ActivityChart';
import { InlineFilterBar } from '@components/molecules/InlineFilterBar';
import { useTheme } from '@hooks/useTheme';
import { ThreatLevel, Alert } from '@types';

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
  alerts?: Alert[];
  scrollY?: Animated.Value;
}

export const AlertsHeaderHero: React.FC<AlertsHeaderHeroProps> = ({
  threatCounts,
  selectedFilter,
  onFilterSelect,
  alerts = [],
  scrollY,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  // Generate 24-hour activity data from alerts
  const activityData = useMemo(() => {
    const hourlyData = new Array(24).fill(0);
    const now = new Date();

    alerts.forEach((alert) => {
      const alertTime = new Date(alert.timestamp);
      const hoursAgo = Math.floor(
        (now.getTime() - alertTime.getTime()) / (1000 * 60 * 60)
      );

      if (hoursAgo >= 0 && hoursAgo < 24) {
        hourlyData[23 - hoursAgo]++;
      }
    });

    return hourlyData;
  }, [alerts]);

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

  // Collapse animation based on scroll
  const chartHeight = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [80, 0],
        extrapolate: 'clamp',
      })
    : 80;

  const chartOpacity = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      })
    : 1;

  return (
    <View style={styles.container}>
      {/* Activity Chart - collapses on scroll */}
      <Animated.View
        style={[
          styles.chartContainer,
          {
            height: chartHeight,
            opacity: chartOpacity,
          },
        ]}
      >
        <ActivityChart data={activityData} height={80} />
      </Animated.View>

      {/* Filter Chips */}
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
    paddingTop: 8,
    paddingBottom: 4,
  },
  chartContainer: {
    overflow: 'hidden',
    marginBottom: 8,
  },
});

export default AlertsHeaderHero;
```

**Step 2: Update AlertListScreen to pass alerts to hero**

In `src/screens/alerts/AlertListScreen.tsx`, update the hero component props:

Find this line (~line 131):

```typescript
<AlertsHeaderHero
  threatCounts={threatCounts}
  selectedFilter={selectedThreatFilter}
  onFilterSelect={handleFilterSelect}
/>
```

Replace with:

```typescript
<AlertsHeaderHero
  threatCounts={threatCounts}
  selectedFilter={selectedThreatFilter}
  onFilterSelect={handleFilterSelect}
  alerts={alerts || []}
  scrollY={scrollY}
/>
```

**Step 3: Verify the app compiles and displays the chart**

Run: `npx expo start --clear`
Navigate to Alerts screen
Expected: Area chart above filter chips, chart collapses on scroll

**Step 4: Commit**

```bash
git add src/components/organisms/HeaderHero/AlertsHeaderHero.tsx
git add src/screens/alerts/AlertListScreen.tsx
git commit -m "feat(AlertsHeaderHero): add activity chart

Tesla-style area chart showing 24h detection volume.
Chart collapses on scroll, filter chips remain visible."
```

---

### Task 2.2: Update AlertCard with Glow Effect

Add glow effect for critical alerts using GlowContainer.

**Files:**

- Modify: `src/components/organisms/AlertCard/AlertCard.tsx`

**Step 1: Update AlertCard to use GlowContainer for critical**

In `src/components/organisms/AlertCard/AlertCard.tsx`:

Add import at top:

```typescript
import { GlowContainer } from '@components/molecules/GlowContainer';
```

Update the return statement to wrap critical alerts with GlowContainer.

Find the return statement (~line 142) and update:

```typescript
  const cardContent = (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.secondarySystemBackground,
          opacity: opacityAnim,
          transform: [
            { translateX: translateXAnim },
            { scale: scaleAnim },
          ],
        },
        style,
      ]}
    >
      {/* Left accent line for non-critical */}
      {!isCritical && (
        <View
          style={[
            styles.leftAccent,
            { backgroundColor: threatColor },
          ]}
        />
      )}

      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardContent}
        accessibilityRole="button"
        accessibilityLabel={`${alert.threatLevel} ${alert.detectionType} alert`}
      >
        {/* Title row with inline icon */}
        <View style={styles.titleRow}>
          <Icon
            name={detectionConfig.icon as any}
            size={20}
            color={detectionConfig.color}
          />
          <Text variant="headline" color="label" style={styles.detectionTitle}>
            {detectionConfig.label}
          </Text>
          <Text variant="caption1" color="secondaryLabel" style={styles.timestamp}>
            {formatTimestamp(alert.timestamp)}
          </Text>
        </View>

        {/* Single-line metadata */}
        <View style={styles.metadataRow}>
          <View style={styles.metadataLine}>
            <View
              style={[
                styles.proximityPill,
                { backgroundColor: `${rssiInfo.color}20` },
              ]}
            >
              <Text
                variant="caption2"
                style={{ color: rssiInfo.color, fontWeight: '600' }}
              >
                {rssiInfo.label}
              </Text>
            </View>
            <Text variant="caption1" color="secondaryLabel" style={styles.dotSeparator}>
              {' · '}
            </Text>
            <Text variant="caption1" color="secondaryLabel">
              {alert.deviceId}
            </Text>
          </View>
          <Icon
            name="chevron-forward"
            size={18}
            color={theme.colors.tertiaryLabel}
          />
        </View>
      </Pressable>
    </Animated.View>
  );

  // Wrap critical alerts with glow
  if (isCritical) {
    return (
      <GlowContainer
        glowColor={threatColor}
        intensity="subtle"
        pulse={true}
        style={[styles.glowWrapper, style]}
      >
        {cardContent}
      </GlowContainer>
    );
  }

  return cardContent;
```

Update styles:

```typescript
const styles = StyleSheet.create({
  glowWrapper: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  cardContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingLeft: 16, // Extra padding for non-critical to account for accent line
  },
  // ... rest of styles
});
```

**Step 2: Verify critical alerts have glow**

Run: `npx expo start --clear`
Navigate to Alerts screen
Expected: Critical alerts have subtle red glow, others have left accent line

**Step 3: Commit**

```bash
git add src/components/organisms/AlertCard/AlertCard.tsx
git commit -m "refactor(AlertCard): glow for critical, accent line for others

Critical alerts wrapped with GlowContainer for subtle pulse.
Non-critical alerts use thin left accent line (3px)."
```

---

## Phase 3: Update Devices List Screen

### Task 3.1: Update DevicesHeaderHero with Simple Status

Replace filter chips with simple status display.

**Files:**

- Modify: `src/components/organisms/HeaderHero/DevicesHeaderHero.tsx`

**Step 1: Update DevicesHeaderHero**

Replace the entire file:

```typescript
// src/components/organisms/HeaderHero/DevicesHeaderHero.tsx
/**
 * DevicesHeaderHero - Simple Status Display
 *
 * Shows "All Systems Online" or "X Device(s) Offline" status.
 * Quick health check at a glance.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface DevicesHeaderHeroProps {
  deviceCounts: {
    total: number;
    online: number;
    offline: number;
  };
  selectedFilter?: 'online' | 'offline' | null;
  onFilterSelect?: (status: 'online' | 'offline' | null) => void;
}

export const DevicesHeaderHero: React.FC<DevicesHeaderHeroProps> = ({
  deviceCounts,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const hasOffline = deviceCounts.offline > 0;
  const statusColor = hasOffline ? colors.systemRed : colors.systemGreen;
  const statusText = hasOffline
    ? `${deviceCounts.offline} Device${deviceCounts.offline > 1 ? 's' : ''} Offline`
    : 'All Systems Online';
  const subtitleText = hasOffline
    ? 'Needs attention'
    : `${deviceCounts.total} device${deviceCounts.total !== 1 ? 's' : ''} active`;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.secondarySystemBackground },
      ]}
    >
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text variant="title3" weight="semibold" color="label">
          {statusText}
        </Text>
      </View>
      <Text variant="subheadline" color="secondaryLabel" style={styles.subtitle}>
        {subtitleText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  subtitle: {
    marginTop: 4,
  },
});

export default DevicesHeaderHero;
```

**Step 2: Update DeviceListScreen to remove section grouping**

In `src/screens/devices/DeviceListScreen.tsx`:

1. Change from SectionList to FlatList
2. Remove section grouping logic
3. Sort offline devices to top

This is a larger refactor - replace the entire file:

```typescript
// src/screens/devices/DeviceListScreen.tsx
/**
 * DeviceListScreen - Tesla Dashboard Style
 *
 * Flat device list with:
 * - Simple status hero (All Online / X Offline)
 * - Flat list (no grouping)
 * - Offline devices sorted to top
 * - Glow effect on offline cards
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useDevices } from '@hooks/api/useDevices';
import { DeviceCard, DevicesHeaderHero } from '@components/organisms';
import {
  ScreenLayout,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@components/templates';
import { Button } from '@components/atoms/Button';
import { Icon } from '@components/atoms/Icon';
import { useTheme } from '@hooks/useTheme';
import { Device } from '@types';

export const DeviceListScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { data: devices, isLoading, error, refetch } = useDevices();
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Sort devices: offline first, then by name
  const sortedDevices = useMemo(() => {
    if (!devices) return [];

    return [...devices].sort((a: Device, b: Device) => {
      // Offline devices first
      if (!a.online && b.online) return -1;
      if (a.online && !b.online) return 1;
      // Then alphabetical
      return a.name.localeCompare(b.name);
    });
  }, [devices]);

  const stats = useMemo(() => {
    if (!devices) return { total: 0, online: 0, offline: 0 };

    return {
      total: devices.length,
      online: devices.filter((d: Device) => d.online).length,
      offline: devices.filter((d: Device) => !d.online).length,
    };
  }, [devices]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load devices" />;

  const handleDevicePress = (deviceId: string) => {
    navigation.navigate('DeviceDetail', { deviceId });
  };

  const handleAddDevice = () => {
    navigation.navigate('AddDevice');
  };

  const handleRefresh = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderListHeader = () => (
    <View>
      {stats.total > 0 && <DevicesHeaderHero deviceCounts={stats} />}
    </View>
  );

  return (
    <ScreenLayout
      header={{
        title: 'Devices',
        largeTitle: true,
        rightActions: (
          <Button
            buttonStyle="plain"
            onPress={handleAddDevice}
            leftIcon={<Icon name="add" size={20} color="systemBlue" />}
          >
            Add
          </Button>
        ),
      }}
      scrollable={false}
    >
      <FlatList
        data={sortedDevices}
        renderItem={({ item, index }) => (
          <DeviceCard
            device={item}
            onPress={() => handleDevicePress(item.id)}
            index={index}
            animateEntrance={true}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderListHeader}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.systemGray}
            titleColor={colors.secondaryLabel}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="hardware-chip-outline"
            title="No Devices"
            message="Add your first TrailSense detector to start monitoring."
            action={{
              label: 'Add Device',
              onPress: handleAddDevice,
            }}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
});
```

**Step 3: Commit**

```bash
git add src/components/organisms/HeaderHero/DevicesHeaderHero.tsx
git add src/screens/devices/DeviceListScreen.tsx
git commit -m "refactor(Devices): simple status hero, flat list

- Hero shows 'All Systems Online' or 'X Offline'
- Flat list (no section grouping)
- Offline devices sorted to top"
```

---

### Task 3.2: Update DeviceCard with Metrics Bar

Replace current stats display with horizontal MetricsBar and add glow for offline.

**Files:**

- Modify: `src/components/organisms/DeviceCard/DeviceCard.tsx`

**Step 1: Update DeviceCard**

Replace the entire file with the new design:

```typescript
// src/components/organisms/DeviceCard/DeviceCard.tsx
/**
 * DeviceCard Component - Tesla Dashboard Style
 *
 * Clean device card with:
 * - Name + status dot on top line
 * - Status + last seen on second line
 * - Horizontal metrics bar (battery | signal | detections | location)
 * - Glow effect for offline devices
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Device } from '@types';
import { Text } from '@components/atoms';
import { MetricsBar } from '@components/molecules/MetricsBar';
import { GlowContainer } from '@components/molecules/GlowContainer';
import { useTheme } from '@hooks/useTheme';

interface DeviceCardProps {
  device: Device;
  onPress?: (deviceId: string) => void;
  style?: ViewStyle;
  index?: number;
  animateEntrance?: boolean;
}

const formatLastSeen = (lastSeen?: string): string => {
  if (!lastSeen) return 'Never';

  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString();
};

const formatCoordinate = (lat?: number, lon?: number): string => {
  if (lat == null || lon == null) return '--';
  return `${Math.abs(lat).toFixed(2)}°`;
};

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onPress,
  style,
  index = 0,
  animateEntrance = true,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(animateEntrance ? 0 : 1)).current;
  const translateYAnim = useRef(new Animated.Value(animateEntrance ? 20 : 0)).current;

  useEffect(() => {
    if (animateEntrance) {
      const delay = index * 50;

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      }, delay);
    }
  }, [animateEntrance, index]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 8,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(device.id);
  };

  const batteryLevel = device.batteryPercent || device.battery || 0;
  const signalStrength = device.signalStrength || '--';
  const isOnline = device.online;

  const metrics = [
    { value: `${batteryLevel}%`, label: 'batt' },
    { value: typeof signalStrength === 'string' ? signalStrength : `${signalStrength}%`, label: 'signal' },
    { value: (device.detectionCount || 0).toLocaleString(), label: 'detections' },
    { value: formatCoordinate(device.latitude, device.longitude), label: 'loc' },
  ];

  const cardContent = (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.secondarySystemBackground,
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${device.name}, ${isOnline ? 'online' : 'offline'}`}
      >
        {/* Header: Name + Status Dot */}
        <View style={styles.header}>
          <Text variant="headline" weight="semibold" color="label" style={styles.name}>
            {device.name}
          </Text>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? colors.systemGreen : colors.systemRed },
            ]}
          />
        </View>

        {/* Status + Last Seen */}
        <Text variant="subheadline" color="secondaryLabel" style={styles.statusLine}>
          {isOnline ? 'Online' : 'Offline'} · {formatLastSeen(device.lastSeen)}
        </Text>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.separator }]} />

        {/* Metrics Bar */}
        <MetricsBar metrics={metrics} />
      </Pressable>
    </Animated.View>
  );

  // Wrap offline devices with glow
  if (!isOnline) {
    return (
      <GlowContainer
        glowColor={colors.systemRed}
        intensity="subtle"
        pulse={false}
        style={[styles.glowWrapper, style]}
      >
        {cardContent}
      </GlowContainer>
    );
  }

  return <View style={[styles.cardWrapper, style]}>{cardContent}</View>;
};

const styles = StyleSheet.create({
  glowWrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
  },
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLine: {
    marginTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
});

export default DeviceCard;
```

**Step 2: Verify device cards render with metrics bar**

Run: `npx expo start --clear`
Navigate to Devices screen
Expected: Cards show horizontal metrics, offline cards have red glow

**Step 3: Commit**

```bash
git add src/components/organisms/DeviceCard/DeviceCard.tsx
git commit -m "refactor(DeviceCard): metrics bar layout, glow for offline

- Horizontal metrics: batt | signal | detections | loc
- Status dot right-aligned
- Offline devices wrapped with red glow
- Cleaner, more compact design"
```

---

## Phase 4: Alert Detail Screen with Tabs

### Task 4.1: Refactor AlertDetailScreen

Add tabs (Signal | Location | History) and floating action bar.

**Files:**

- Modify: `src/screens/alerts/AlertDetailScreen.tsx`

**Step 1: Refactor AlertDetailScreen with tabs**

This is a significant refactor. Replace the entire file:

```typescript
// src/screens/alerts/AlertDetailScreen.tsx
/**
 * AlertDetailScreen - Tesla Dashboard Style
 *
 * Detail view with:
 * - DetailHero summary at top
 * - TabSegment for Signal/Location/History
 * - Content areas for each tab
 * - FloatingActionBar at bottom
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, Linking, ActionSheetIOS, Alert as RNAlert } from 'react-native';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { ScreenLayout, LoadingState, ErrorState } from '@components/templates';
import { GroupedListSection, GroupedListRow } from '@components/molecules';
import { DetailHero } from '@components/molecules/DetailHero';
import { TabSegment } from '@components/molecules/TabSegment';
import { FloatingActionBar } from '@components/molecules/FloatingActionBar';
import { AlertsStackParamList } from '@navigation/types';
import { useAlert } from '@hooks/api/useAlerts';
import { formatTime, formatDate } from '@utils/dateUtils';
import { useTheme } from '@hooks/useTheme';
import { getThreatColor } from '@utils/visualEffects';

type AlertDetailRouteProp = RouteProp<AlertsStackParamList, 'AlertDetail'>;

const TABS = [
  { key: 'signal', label: 'Signal' },
  { key: 'location', label: 'Location' },
  { key: 'history', label: 'History' },
];

const openInMaps = (latitude: number, longitude: number) => {
  const url = Platform.select({
    ios: `maps://app?daddr=${latitude},${longitude}`,
    android: `google.navigation:q=${latitude},${longitude}`,
  });
  if (url) Linking.openURL(url);
};

const getProximityLabel = (rssi: number): string => {
  if (rssi > -50) return 'Very Close';
  if (rssi > -60) return 'Nearby';
  if (rssi > -70) return 'Moderate';
  return 'Far';
};

const getPriorityLabel = (threatLevel: string): string => {
  return `${threatLevel.charAt(0).toUpperCase() + threatLevel.slice(1)} Priority`;
};

export const AlertDetailScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const colors = theme.colors;
  const route = useRoute<AlertDetailRouteProp>();
  const { alertId } = route.params;
  const { data: alert, isLoading, error } = useAlert(alertId);

  const [selectedTab, setSelectedTab] = useState('signal');
  const [isReviewed, setIsReviewed] = useState(false);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load alert" />;
  if (!alert) return <ErrorState message="Alert not found" />;

  const threatColor = getThreatColor(alert.threatLevel);

  const handleMarkReviewed = () => {
    setIsReviewed(true);
    // TODO: API call
    console.log('Marking alert as reviewed:', alertId);
  };

  const handleFlagFalsePositive = () => {
    console.log('Flagging as false positive:', alertId);
  };

  const handleExplainWithAI = () => {
    console.log('Explaining with AI:', alertId);
  };

  const handleMoreActions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Whitelist Device', 'Delete Alert'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            console.log('Whitelisting:', alert.macAddress);
          } else if (buttonIndex === 2) {
            RNAlert.alert(
              'Delete Alert',
              'Are you sure you want to delete this alert?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    navigation.goBack();
                  },
                },
              ]
            );
          }
        }
      );
    } else {
      // Android - use Alert
      RNAlert.alert(
        'More Actions',
        undefined,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Whitelist Device', onPress: () => console.log('Whitelisting') },
          {
            text: 'Delete Alert',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  // Hero metrics
  const heroMetrics = [
    `${alert.rssi} dBm`,
    getProximityLabel(alert.rssi),
    alert.deviceId,
  ];

  const renderSignalTab = () => (
    <>
      <GroupedListSection title="Signal Strength">
        <GroupedListRow
          icon="cellular"
          iconColor={colors.systemBlue}
          title="RSSI"
          value={`${alert.rssi} dBm`}
        />
        <GroupedListRow
          icon="radio-outline"
          iconColor={colors.systemGreen}
          title="Proximity"
          value={getProximityLabel(alert.rssi)}
        />
      </GroupedListSection>

      <GroupedListSection title="Device Fingerprint">
        {alert.macAddress && (
          <GroupedListRow
            icon="qr-code-outline"
            iconColor={colors.systemPurple}
            title="MAC Address"
            value={alert.macAddress}
          />
        )}
        <GroupedListRow
          icon="help-circle-outline"
          iconColor={colors.systemGray}
          title="Device Type"
          value="Unknown"
        />
        <GroupedListRow
          icon="time-outline"
          iconColor={colors.systemOrange}
          title="First Seen"
          value={formatDate(alert.timestamp)}
        />
      </GroupedListSection>
    </>
  );

  const renderLocationTab = () => (
    <>
      {alert.location && (
        <>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: alert.location.latitude,
                longitude: alert.location.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Circle
                center={alert.location}
                radius={50}
                fillColor={`${colors.brandAccent}30`}
                strokeColor={colors.brandAccent}
                strokeWidth={2}
              />
              <Marker coordinate={alert.location} />
            </MapView>
          </View>

          <GroupedListSection title="Coordinates">
            <GroupedListRow
              icon="location-outline"
              iconColor={colors.systemGreen}
              title="GPS"
              value={`${alert.location.latitude.toFixed(4)}°, ${alert.location.longitude.toFixed(4)}°`}
            />
            <GroupedListRow
              icon="open-outline"
              iconColor={colors.systemBlue}
              title="Open in Maps"
              showChevron
              onPress={() => openInMaps(alert.location!.latitude, alert.location!.longitude)}
            />
          </GroupedListSection>
        </>
      )}

      <GroupedListSection title="Source Device">
        <GroupedListRow
          icon="hardware-chip-outline"
          iconColor={colors.systemTeal}
          title={alert.deviceId}
          subtitle="Tap to view device"
          showChevron
          onPress={() =>
            (navigation as any).navigate('DevicesTab', {
              screen: 'DeviceDetail',
              params: { deviceId: alert.deviceId },
            })
          }
        />
      </GroupedListSection>
    </>
  );

  const renderHistoryTab = () => (
    <>
      <GroupedListSection title="This Fingerprint">
        <GroupedListRow
          icon="repeat-outline"
          iconColor={colors.systemIndigo}
          title="Times Seen"
          value="1" // TODO: Calculate from history
        />
        <GroupedListRow
          icon="calendar-outline"
          iconColor={colors.systemOrange}
          title="First Seen"
          value={formatDate(alert.timestamp)}
        />
        <GroupedListRow
          icon="time-outline"
          iconColor={colors.systemBlue}
          title="Last Seen"
          value={formatTime(alert.timestamp)}
        />
      </GroupedListSection>

      <GroupedListSection title="Recent Sightings">
        <GroupedListRow
          icon="alert-circle-outline"
          iconColor={threatColor}
          title={`Today, ${formatTime(alert.timestamp)}`}
          value={alert.deviceId}
          showChevron
        />
        {/* TODO: Add more history items when available */}
      </GroupedListSection>
    </>
  );

  return (
    <ScreenLayout
      header={{
        title: `${alert.detectionType} Detection`,
        showBack: true,
        onBackPress: () => navigation.goBack(),
      }}
      scrollable={false}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Summary */}
        <DetailHero
          statusColor={threatColor}
          title={`${alert.detectionType.charAt(0).toUpperCase() + alert.detectionType.slice(1)} Detection`}
          subtitle={`${getPriorityLabel(alert.threatLevel)} · ${formatTime(alert.timestamp)}`}
          metrics={heroMetrics}
        />

        {/* Tab Segment */}
        <TabSegment
          tabs={TABS}
          selectedKey={selectedTab}
          onSelect={setSelectedTab}
        />

        {/* Tab Content */}
        {selectedTab === 'signal' && renderSignalTab()}
        {selectedTab === 'location' && renderLocationTab()}
        {selectedTab === 'history' && renderHistoryTab()}

        {/* Bottom padding for action bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Bar */}
      <FloatingActionBar
        primaryAction={{
          label: isReviewed ? 'Reviewed' : 'Mark Reviewed',
          icon: 'checkmark-circle',
          onPress: handleMarkReviewed,
        }}
        secondaryActions={[
          { icon: 'flag-outline', label: 'Flag', onPress: handleFlagFalsePositive },
          { icon: 'sparkles', label: 'AI', onPress: handleExplainWithAI },
        ]}
        onMorePress={handleMoreActions}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for floating action bar
  },
  mapContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    height: 180,
  },
  map: {
    flex: 1,
  },
  bottomPadding: {
    height: 20,
  },
});

export default AlertDetailScreen;
```

**Step 2: Verify the detail screen renders with tabs**

Run: `npx expo start --clear`
Navigate to Alerts > Tap an alert
Expected: Hero summary, tabs, content, floating action bar

**Step 3: Commit**

```bash
git add src/screens/alerts/AlertDetailScreen.tsx
git commit -m "refactor(AlertDetail): tabs + floating action bar

- DetailHero with status dot and metrics
- TabSegment: Signal | Location | History
- FloatingActionBar with Mark Reviewed primary
- Grouped sections for tab content"
```

---

## Phase 5: Device Detail Screen with Tabs

### Task 5.1: Refactor DeviceDetailScreen

Add tabs (Status | Location | History) and floating action bar.

**Files:**

- Modify: `src/screens/devices/DeviceDetailScreen.tsx`

**Step 1: Refactor DeviceDetailScreen with tabs**

Replace the entire file:

```typescript
// src/screens/devices/DeviceDetailScreen.tsx
/**
 * DeviceDetailScreen - Tesla Dashboard Style
 *
 * Detail view with:
 * - DetailHero summary at top
 * - TabSegment for Status/Location/History
 * - Content areas for each tab
 * - FloatingActionBar at bottom
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, ActionSheetIOS, Alert } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Text } from '@components/atoms/Text';
import { ScreenLayout, LoadingState, ErrorState } from '@components/templates';
import { GroupedListSection, GroupedListRow } from '@components/molecules';
import { DetailHero } from '@components/molecules/DetailHero';
import { TabSegment } from '@components/molecules/TabSegment';
import { FloatingActionBar } from '@components/molecules/FloatingActionBar';
import { RouteProp, useRoute } from '@react-navigation/native';
import { DevicesStackParamList } from '@navigation/types';
import { useDevice } from '@hooks/api/useDevices';
import { useTheme } from '@hooks/useTheme';

type DeviceDetailRouteProp = RouteProp<DevicesStackParamList, 'DeviceDetail'>;

const TABS = [
  { key: 'status', label: 'Status' },
  { key: 'location', label: 'Location' },
  { key: 'history', label: 'History' },
];

const formatLastSeen = (lastSeen?: string): string => {
  if (!lastSeen) return 'Never';
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString();
};

const getSignalLabel = (strength: string | number | undefined): string => {
  const s = String(strength || '').toLowerCase();
  if (s === 'excellent' || s === 'strong' || Number(strength) > 75) return 'Excellent';
  if (s === 'good' || Number(strength) > 50) return 'Good';
  if (s === 'fair' || s === 'moderate' || Number(strength) > 25) return 'Fair';
  return 'Weak';
};

export const DeviceDetailScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const route = useRoute<DeviceDetailRouteProp>();
  const { deviceId } = route.params;
  const { data: device, isLoading, error } = useDevice(deviceId);

  const [selectedTab, setSelectedTab] = useState('status');

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load device" />;
  if (!device) return <ErrorState message="Device not found" />;

  const isOnline = device.online;
  const batteryPercent = device.batteryPercent || device.battery || 0;
  const signalLabel = getSignalLabel(device.signalStrength);

  const handleViewOnMap = () => {
    navigation.navigate('Map', {
      screen: 'LiveRadar',
      params: {
        focusLat: device.latitude,
        focusLng: device.longitude,
      },
    });
  };

  const handleEditDevice = () => {
    navigation.navigate('DeviceSettings', { id: deviceId });
  };

  const handleConfigDevice = () => {
    // TODO: Navigate to device config screen
    console.log('Configure device:', deviceId);
  };

  const handleMoreActions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Remove Device'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            Alert.alert(
              'Remove Device',
              `Are you sure you want to remove "${device.name}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          }
        }
      );
    } else {
      Alert.alert(
        'Remove Device',
        `Are you sure you want to remove "${device.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  // Hero metrics
  const heroMetrics = [
    `${batteryPercent}%`,
    signalLabel,
    `${(device.detectionCount || 0).toLocaleString()} detections`,
  ];

  const renderStatusTab = () => (
    <>
      <GroupedListSection title="Health">
        <GroupedListRow
          icon="battery-full"
          iconColor={batteryPercent > 20 ? colors.systemGreen : colors.systemRed}
          title="Battery"
          value={`${batteryPercent}%`}
        />
        <GroupedListRow
          icon="wifi"
          iconColor={colors.systemBlue}
          title="Signal Strength"
          value={signalLabel}
        />
        <GroupedListRow
          icon="time-outline"
          iconColor={colors.systemOrange}
          title="Uptime"
          value="--" // TODO: Calculate from device data
        />
      </GroupedListSection>

      <GroupedListSection title="Device Info">
        <GroupedListRow
          icon="code-slash-outline"
          iconColor={colors.systemPurple}
          title="Firmware"
          value={(device as any).firmwareVersion || '1.0.0'}
        />
        <GroupedListRow
          icon="finger-print-outline"
          iconColor={colors.systemIndigo}
          title="Device ID"
          value={deviceId.length > 15 ? `${deviceId.slice(0, 15)}...` : deviceId}
        />
      </GroupedListSection>
    </>
  );

  const renderLocationTab = () => (
    <>
      {device.latitude != null && device.longitude != null && (
        <>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: device.latitude,
                longitude: device.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              {/* Coverage circles */}
              <Circle
                center={{ latitude: device.latitude, longitude: device.longitude }}
                radius={243} // 800ft in meters (Cellular)
                fillColor={`${colors.systemPurple}10`}
                strokeColor={colors.systemPurple}
                strokeWidth={1}
              />
              <Circle
                center={{ latitude: device.latitude, longitude: device.longitude }}
                radius={91} // 300ft in meters (WiFi)
                fillColor={`${colors.systemBlue}15`}
                strokeColor={colors.systemBlue}
                strokeWidth={1}
              />
              <Circle
                center={{ latitude: device.latitude, longitude: device.longitude }}
                radius={30} // 100ft in meters (Bluetooth)
                fillColor={`${colors.systemTeal}20`}
                strokeColor={colors.systemTeal}
                strokeWidth={1}
              />
              <Marker
                coordinate={{ latitude: device.latitude, longitude: device.longitude }}
              />
            </MapView>
          </View>

          <GroupedListSection title="Coordinates">
            <GroupedListRow
              icon="location-outline"
              iconColor={colors.systemGreen}
              title="GPS"
              value={`${device.latitude.toFixed(4)}°, ${device.longitude.toFixed(4)}°`}
            />
          </GroupedListSection>
        </>
      )}

      <GroupedListSection title="Coverage">
        <GroupedListRow
          icon="bluetooth"
          iconColor={colors.systemTeal}
          title="Bluetooth"
          value="~100 ft"
        />
        <GroupedListRow
          icon="wifi"
          iconColor={colors.systemBlue}
          title="WiFi"
          value="~300 ft"
        />
        <GroupedListRow
          icon="cellular"
          iconColor={colors.systemPurple}
          title="Cellular"
          value="~800 ft"
        />
      </GroupedListSection>
    </>
  );

  const renderHistoryTab = () => (
    <>
      <GroupedListSection title="Activity Summary">
        <GroupedListRow
          icon="stats-chart-outline"
          iconColor={colors.systemIndigo}
          title="Total Detections"
          value={(device.detectionCount || 0).toLocaleString()}
        />
        <GroupedListRow
          icon="today-outline"
          iconColor={colors.systemOrange}
          title="Today"
          value="--" // TODO: Calculate
        />
        <GroupedListRow
          icon="calendar-outline"
          iconColor={colors.systemBlue}
          title="This Week"
          value="--" // TODO: Calculate
        />
      </GroupedListSection>

      <GroupedListSection title="Recent Detections">
        <GroupedListRow
          icon="alert-circle-outline"
          iconColor={colors.secondaryLabel}
          title="No recent detections"
          subtitle="Activity will appear here"
        />
        {/* TODO: Add detection history items */}
      </GroupedListSection>
    </>
  );

  return (
    <ScreenLayout
      header={{
        title: device.name,
        showBack: true,
        onBackPress: () => navigation.goBack(),
      }}
      scrollable={false}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Summary */}
        <DetailHero
          statusColor={isOnline ? colors.systemGreen : colors.systemRed}
          title={device.name}
          subtitle={`${isOnline ? 'Online' : 'Offline'} · Last seen ${formatLastSeen(device.lastSeen)}`}
          metrics={heroMetrics}
        />

        {/* Tab Segment */}
        <TabSegment
          tabs={TABS}
          selectedKey={selectedTab}
          onSelect={setSelectedTab}
        />

        {/* Tab Content */}
        {selectedTab === 'status' && renderStatusTab()}
        {selectedTab === 'location' && renderLocationTab()}
        {selectedTab === 'history' && renderHistoryTab()}

        {/* Bottom padding for action bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Bar */}
      <FloatingActionBar
        primaryAction={{
          label: 'View on Map',
          icon: 'location',
          onPress: handleViewOnMap,
        }}
        secondaryActions={[
          { icon: 'create-outline', label: 'Edit', onPress: handleEditDevice },
          { icon: 'settings-outline', label: 'Config', onPress: handleConfigDevice },
        ]}
        onMorePress={handleMoreActions}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  mapContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
  },
  map: {
    flex: 1,
  },
  bottomPadding: {
    height: 20,
  },
});

export default DeviceDetailScreen;
```

**Step 2: Verify the device detail screen renders with tabs**

Run: `npx expo start --clear`
Navigate to Devices > Tap a device
Expected: Hero summary, tabs, content, floating action bar

**Step 3: Commit**

```bash
git add src/screens/devices/DeviceDetailScreen.tsx
git commit -m "refactor(DeviceDetail): tabs + floating action bar

- DetailHero with status dot and metrics
- TabSegment: Status | Location | History
- FloatingActionBar with View on Map primary
- Coverage circles on map in Location tab"
```

---

## Final Step: Verify All Changes

### Task 6.1: Full App Verification

**Step 1: Run the full app test**

```bash
npx expo start --clear
```

Navigate through:

1. Alerts List - Verify activity chart hero, filter chips, card glow/accents
2. Alert Detail - Verify hero, tabs, floating action bar
3. Devices List - Verify simple status hero, metrics bar cards, no grouping
4. Device Detail - Verify hero, tabs, floating action bar

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat: complete Alerts & Devices Tesla/Rivian redesign

Phase 1: Foundation components
- GlowContainer, MetricsBar, ActivityChart
- FloatingActionBar, TabSegment, DetailHero

Phase 2: Alerts list
- Activity chart hero with 24h data
- Alert cards with glow (critical) and accent lines

Phase 3: Devices list
- Simple status hero
- Metrics bar cards, flat list

Phase 4: Alert detail
- Tabs: Signal | Location | History
- Floating action bar

Phase 5: Device detail
- Tabs: Status | Location | History
- Floating action bar with View on Map"
```

---

## Summary

| Phase | Components/Files   | Status |
| ----- | ------------------ | ------ |
| 1.1   | GlowContainer      | Create |
| 1.2   | MetricsBar         | Create |
| 1.3   | ActivityChart      | Create |
| 1.4   | FloatingActionBar  | Create |
| 1.5   | TabSegment         | Create |
| 1.6   | DetailHero         | Create |
| 2.1   | AlertsHeaderHero   | Modify |
| 2.2   | AlertCard          | Modify |
| 3.1   | DevicesHeaderHero  | Modify |
| 3.2   | DeviceCard         | Modify |
| 3.3   | DeviceListScreen   | Modify |
| 4.1   | AlertDetailScreen  | Modify |
| 5.1   | DeviceDetailScreen | Modify |

**Total: 13 tasks, ~6 new components, 7 file modifications**
