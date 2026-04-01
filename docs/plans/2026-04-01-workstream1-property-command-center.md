# Workstream 1: Property Command Center Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a new "My Property" home screen tab that answers "is my property secure right now?" at a glance, and restructure navigation from 6 tabs to 5 tabs + More.

**Architecture:** New HomeStack with PropertyCommandCenter screen as the first tab. Analytics, Settings, and AI collapse under a new MoreStack tab. All home screen data derived client-side from existing React Query caches (useAlerts, useDevices) via a new usePropertyStatus hook. Mini map uses Mapbox Static Images API for performance. Each home section degrades independently on error.

**Tech Stack:** React Native 0.76, Expo SDK 52, TypeScript strict, React Navigation 7.x, @rnmapbox/maps (Static Images API), @tanstack/react-query, existing atomic component system

## Autoplan Decisions Incorporated

| Decision | Source | Task |
|----------|--------|------|
| Stats Row above Mini Map | Design D1 | Task 4 |
| Mapbox Static Images API for mini map | Design D14, Eng E11 | Task 5 |
| Each section degrades independently on error | Design D4 | Task 4 |
| First-run onboarding for zero detections | Design D5 | Task 4 |
| Client-side status via usePropertyStatus() | Design D13 | Task 3 |
| Status precedence: threat > offline > stale > clear | Design D19 | Task 3 |
| AI insight slot on home screen | Design D9 | Task 7 |
| Deep links updated atomically with nav restructure | Eng E3 | Task 2 |
| 24h timeline tappable to deep-link into Replay Radar | Design D18 | Task 6 (nav stub only; full time-based params added in WS2) |
| Analytics buried under More loses discoverability | CEO acknowledged | Task 2 |

---

### Task 1: Navigation Restructure — Types and Stacks

**Files:**
- Create: `src/navigation/stacks/HomeStack.tsx`
- Create: `src/navigation/stacks/MoreStack.tsx`
- Modify: `src/navigation/types.ts`

**Step 1: Update navigation types**

Add HomeStack and MoreStack types, update MainTabParamList:

```typescript
// In src/navigation/types.ts, replace MainTabParamList:
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  AlertsTab: NavigatorScreenParams<AlertsStackParamList>;
  RadarTab: NavigatorScreenParams<RadarStackParamList>;
  DevicesTab: NavigatorScreenParams<DevicesStackParamList>;
  MoreTab: NavigatorScreenParams<MoreStackParamList>;
};

// Add new param lists:
export type HomeStackParamList = {
  PropertyCommandCenter: undefined;
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  // Analytics screens
  Dashboard: undefined;
  Heatmap: undefined;
  Reports: undefined;
  // AI screen
  TrailSenseAI: undefined;
  // Settings screens (all from SettingsStackParamList)
  Settings: undefined;
  Profile: undefined;
  Whitelist: undefined;
  NotificationSettings: undefined;
  Theme: undefined;
  AlertSound: undefined;
  Biometric: undefined;
  Security: undefined;
  Sensitivity: undefined;
  QuietHours: undefined;
  VacationMode: undefined;
  AddWhitelist: undefined;
};
```

Remove `AnalyticsTab`, `AITab`, `SettingsTab` from `MainTabParamList`. Keep `AnalyticsStackParamList`, `AIStackParamList`, and `SettingsStackParamList` for now (other files may import them), but they will no longer be used as top-level tabs.

**Step 2: Create HomeStack**

```typescript
// src/navigation/stacks/HomeStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@navigation/types';
// PropertyCommandCenter screen will be created in Task 4
// For now, use a placeholder
import { View } from 'react-native';
import { Text } from '@components/atoms';

const PlaceholderHome = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text variant="title1">Home</Text>
  </View>
);

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PropertyCommandCenter" component={PlaceholderHome} />
    </Stack.Navigator>
  );
};

export default HomeStack;
```

**Step 3: Create MoreStack**

```typescript
// src/navigation/stacks/MoreStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreStackParamList } from '@navigation/types';
import { MoreMenuScreen } from '@screens/more/MoreMenuScreen';
// Re-use existing screen components
import {
  DashboardScreen,
  HeatmapScreen,
  ReportsScreen,
} from '@screens/analytics';
import { AIAssistantScreen } from '@screens/ai';
import {
  SettingsScreen,
  ProfileScreen,
  WhitelistScreen,
  NotificationSettingsScreen,
  ThemeScreen,
  AlertSoundScreen,
  BiometricScreen,
  SecurityScreen,
  SensitivityScreen,
  QuietHoursScreen,
  VacationModeScreen,
  AddWhitelistScreen,
} from '@screens/settings';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export const MoreStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreMenu" component={MoreMenuScreen} />
      {/* Analytics */}
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Heatmap" component={HeatmapScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      {/* AI */}
      <Stack.Screen name="TrailSenseAI" component={AIAssistantScreen} />
      {/* Settings */}
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Whitelist" component={WhitelistScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Theme" component={ThemeScreen} />
      <Stack.Screen name="AlertSound" component={AlertSoundScreen} />
      <Stack.Screen name="Biometric" component={BiometricScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="Sensitivity" component={SensitivityScreen} />
      <Stack.Screen name="QuietHours" component={QuietHoursScreen} />
      <Stack.Screen name="VacationMode" component={VacationModeScreen} />
      <Stack.Screen name="AddWhitelist" component={AddWhitelistScreen} />
    </Stack.Navigator>
  );
};

export default MoreStack;
```

**Step 4: Create MoreMenuScreen**

```typescript
// src/screens/more/MoreMenuScreen.tsx
import React from 'react';
import { ScreenLayout } from '@components/templates';
import { GroupedListSection } from '@components/molecules/GroupedListSection';
import { GroupedListRow } from '@components/molecules/GroupedListRow';

export const MoreMenuScreen = ({ navigation }: any) => {
  return (
    <ScreenLayout
      header={{ title: 'More', largeTitle: true }}
      scrollable={true}
    >
      <GroupedListSection title="INSIGHTS">
        <GroupedListRow
          title="Analytics"
          icon="analytics"
          iconBackground="#6B6B4E"
          showChevron
          onPress={() => navigation.navigate('Dashboard')}
        />
        <GroupedListRow
          title="AI Assistant"
          icon="sparkles-outline"
          iconBackground="#8A6090"
          showChevron
          onPress={() => navigation.navigate('TrailSenseAI')}
        />
      </GroupedListSection>

      <GroupedListSection title="PREFERENCES">
        <GroupedListRow
          title="Settings"
          icon="settings"
          iconBackground="#7A7A70"
          showChevron
          onPress={() => navigation.navigate('Settings')}
        />
      </GroupedListSection>
    </ScreenLayout>
  );
};
```

Also create `src/screens/more/index.ts`:

```typescript
export { MoreMenuScreen } from './MoreMenuScreen';
```

**Step 5: Commit**

```bash
git add src/navigation/types.ts src/navigation/stacks/HomeStack.tsx src/navigation/stacks/MoreStack.tsx src/screens/more/
git commit -m "feat(nav): add HomeStack, MoreStack, MoreMenuScreen, update navigation types"
```

---

### Task 2: Navigation Restructure — MainNavigator + Deep Links

**Files:**
- Modify: `src/navigation/MainNavigator.tsx`
- Modify: `src/navigation/linking.ts`

**Step 1: Update MainNavigator**

Replace the 6-tab layout with 5 tabs. Import HomeStack and MoreStack, remove AnalyticsStack/AIStack/SettingsStack imports:

```typescript
// src/navigation/MainNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { MainTabParamList } from './types';
import HomeStack from './stacks/HomeStack';
import AlertsStack from './stacks/AlertsStack';
import RadarStack from './stacks/RadarStack';
import DevicesStack from './stacks/DevicesStack';
import MoreStack from './stacks/MoreStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.brandAccent || theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondaryLabel,
        tabBarStyle: {
          backgroundColor: theme.colors.systemBackground,
          borderTopColor: theme.colors.separator,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Icon name="home" color={color} size="base" />
          ),
        }}
      />
      <Tab.Screen
        name="AlertsTab"
        component={AlertsStack}
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => (
            <Icon name="alert-circle" color={color} size="base" />
          ),
        }}
      />
      <Tab.Screen
        name="RadarTab"
        component={RadarStack}
        options={{
          title: 'Radar',
          tabBarIcon: ({ color }) => (
            <Icon name="radio-outline" color={color} size="base" />
          ),
        }}
      />
      <Tab.Screen
        name="DevicesTab"
        component={DevicesStack}
        options={{
          title: 'Devices',
          tabBarIcon: ({ color }) => (
            <Icon name="hardware-chip" color={color} size="base" />
          ),
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreStack}
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => (
            <Icon name="ellipsis-horizontal" color={color} size="base" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
```

**Step 2: Update deep links**

Update `src/navigation/linking.ts` to reflect the new tab structure. Old routes (`analytics`, `settings`) must still resolve via the MoreTab:

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
      Main: {
        screens: {
          HomeTab: {
            screens: {
              PropertyCommandCenter: 'home',
            },
          },
          AlertsTab: {
            screens: {
              AlertList: 'alerts',
              AlertDetail: 'alerts/:alertId',
              AlertFilter: 'alerts/filter',
            },
          },
          RadarTab: {
            screens: {
              LiveRadar: 'radar',
              RadarSettings: 'radar/settings',
            },
          },
          DevicesTab: {
            screens: {
              DeviceList: 'devices',
              DeviceDetail: 'devices/:deviceId',
              AddDevice: 'devices/add',
            },
          },
          MoreTab: {
            screens: {
              MoreMenu: 'more',
              // Analytics (old routes still work)
              Dashboard: 'analytics',
              Heatmap: 'analytics/heatmap',
              Reports: 'analytics/reports',
              // AI
              TrailSenseAI: 'ai',
              // Settings (old routes still work)
              Settings: 'settings',
              Profile: 'settings/profile',
              Whitelist: 'settings/whitelist',
              NotificationSettings: 'settings/notifications',
            },
          },
        },
      },
    },
  },
};
```

**Step 3: Verify type-check**

Run: `npx tsc --noEmit 2>&1 | grep -E "MainNavigator|linking|types" | head -20`
Expected: No NEW errors from the navigation changes (pre-existing errors in other files are expected)

**Step 4: Commit**

```bash
git add src/navigation/MainNavigator.tsx src/navigation/linking.ts
git commit -m "feat(nav): restructure to 5 tabs (Home, Alerts, Radar, Devices, More) with backward-compat deep links"
```

---

### Task 3: usePropertyStatus Hook

**Files:**
- Create: `src/hooks/usePropertyStatus.ts`

**Step 1: Create the hook**

This derives all home screen data from existing React Query caches. No new API calls.

```typescript
// src/hooks/usePropertyStatus.ts
import { useMemo } from 'react';
import { useAlerts } from '@hooks/api/useAlerts';
import { useDevices } from '@hooks/api/useDevices';
import { Alert, Device, ThreatLevel } from '@types';
import { isDeviceOnline } from '@utils/dateUtils';

export type PropertyStatusLevel = 'clear' | 'warning' | 'critical';

export interface PropertyStatus {
  level: PropertyStatusLevel;
  title: string;
  subtitle: string;
  // Stats
  activeAlertCount: number;
  visitorsToday: number;
  knownVisitorsToday: number;
  // Devices
  devicesOnline: number;
  devicesOffline: number;
  devicesTotal: number;
  onlineDeviceNames: string[];
  offlineDeviceNames: string[];
  // Raw data (for MiniPropertyMap and ActivitySparkline)
  allAlerts: Alert[];
  allDevices: Device[];
  // Recent alerts (top 2)
  recentAlerts: Alert[];
  // Threat counts
  threatCounts: Record<ThreatLevel, number>;
  // Loading/error states
  isLoading: boolean;
  alertsError: Error | null;
  devicesError: Error | null;
  refetchAlerts: () => void;
  refetchDevices: () => void;
}

/**
 * Status precedence (autoplan D19):
 * active threat > device offline > stale data > all clear
 */
export function usePropertyStatus(): PropertyStatus {
  const {
    data: alerts,
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
  } = useAlerts();
  const {
    data: devices,
    isLoading: devicesLoading,
    error: devicesError,
    refetch: refetchDevices,
  } = useDevices();

  return useMemo(() => {
    const allAlerts = alerts || [];
    const allDevices = devices || [];

    // Threat counts
    const threatCounts: Record<ThreatLevel, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    const unreviewedAlerts = allAlerts.filter((a: Alert) => !a.isReviewed);
    unreviewedAlerts.forEach((a: Alert) => {
      if (a.threatLevel in threatCounts) {
        threatCounts[a.threatLevel]++;
      }
    });

    const activeAlertCount = unreviewedAlerts.length;
    const recentAlerts = allAlerts.slice(0, 2);

    // Device stats
    const onlineDevices = allDevices.filter((d: Device) =>
      isDeviceOnline(d.lastSeen)
    );
    const offlineDevices = allDevices.filter(
      (d: Device) => !isDeviceOnline(d.lastSeen)
    );

    // Visitors today (unique MACs from today's alerts)
    // Use local midnight, not UTC, to match ActivitySparkline's local-time bucketing
    const localMidnight = new Date();
    localMidnight.setHours(0, 0, 0, 0);
    const todayAlerts = allAlerts.filter(
      (a: Alert) => new Date(a.timestamp) >= localMidnight
    );
    const uniqueMacs = new Set(todayAlerts.map((a: Alert) => a.macAddress));
    const visitorsToday = uniqueMacs.size;
    // TODO: Known visitors will come from Workstream 3 (Known Devices)
    const knownVisitorsToday = 0;

    // Status precedence (autoplan D19):
    // active critical/high threat > active medium/low alert > device offline > stale data > all clear
    //
    // "Stale" = last detection was >24h ago (data may be outdated)
    const lastAlert = allAlerts[0];
    const lastDetectionAge = lastAlert
      ? Date.now() - new Date(lastAlert.timestamp).getTime()
      : Infinity;
    const isStale = lastDetectionAge > 24 * 60 * 60 * 1000; // >24h

    let level: PropertyStatusLevel = 'clear';
    let title = 'All Clear';
    let subtitle = 'No active threats';

    const critHighCount = threatCounts.critical + threatCounts.high;

    if (critHighCount > 0) {
      // Critical/high threats → red status
      level = 'critical';
      title = `${critHighCount} Active Threat${critHighCount > 1 ? 's' : ''}`;
      subtitle = `${activeAlertCount} unreviewed alert${activeAlertCount > 1 ? 's' : ''}`;
    } else if (activeAlertCount > 0) {
      // Medium/low unreviewed alerts → warning, not critical
      level = 'warning';
      title = `${activeAlertCount} Alert${activeAlertCount > 1 ? 's' : ''}`;
      subtitle = `${activeAlertCount} unreviewed (medium/low)`;
    } else if (offlineDevices.length > 0) {
      level = 'warning';
      title = `${offlineDevices.length} Device${offlineDevices.length > 1 ? 's' : ''} Offline`;
      subtitle = offlineDevices.map((d: Device) => d.name).join(', ');
    } else if (isStale) {
      level = 'warning';
      title = 'Data May Be Stale';
      subtitle = lastAlert
        ? `Last detection ${_relativeTime(lastAlert.timestamp)}`
        : 'No detections recorded';
    } else {
      // All clear
      if (lastAlert) {
        subtitle = `Last detection ${_relativeTime(lastAlert.timestamp)}`;
      }
    }

    return {
      level,
      title,
      subtitle,
      activeAlertCount,
      visitorsToday,
      knownVisitorsToday,
      devicesOnline: onlineDevices.length,
      devicesOffline: offlineDevices.length,
      devicesTotal: allDevices.length,
      onlineDeviceNames: onlineDevices.map((d: Device) => d.name),
      offlineDeviceNames: offlineDevices.map((d: Device) => d.name),
      allAlerts,
      allDevices,
      recentAlerts,
      threatCounts,
      isLoading: alertsLoading || devicesLoading,
      alertsError: alertsError as Error | null,
      devicesError: devicesError as Error | null,
      refetchAlerts,
      refetchDevices,
    };
  }, [alerts, devices, alertsLoading, devicesLoading, alertsError, devicesError, refetchAlerts, refetchDevices]);
}

function _relativeTime(timestamp: string): string {
  try {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return '';
  }
}
```

**Step 2: Commit**

```bash
git add src/hooks/usePropertyStatus.ts
git commit -m "feat(hooks): add usePropertyStatus for home screen data derivation"
```

---

### Task 4: PropertyCommandCenter Screen — Layout and Status Banner

**Files:**
- Create: `src/screens/home/PropertyCommandCenter.tsx`
- Create: `src/screens/home/index.ts`
- Modify: `src/navigation/stacks/HomeStack.tsx`

**Step 1: Create PropertyCommandCenter screen**

This is the main home screen. It uses `usePropertyStatus` for all data. Each section renders independently (autoplan D4: partial failure strategy).

The layout order (autoplan D1: Stats Row above map):
1. PropertyStatusBanner
2. Stats Row
3. Mini Property Map (Task 5)
4. Recent Alerts
5. Recent Visitors (placeholder for WS3)
6. 24h Activity Timeline (Task 6)
7. AI Insight slot (Task 7)

```typescript
// src/screens/home/PropertyCommandCenter.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, Icon, SkeletonCard } from '@components/atoms';
import { ScreenLayout, EmptyState } from '@components/templates';
import { usePropertyStatus, PropertyStatusLevel } from '@hooks/usePropertyStatus';
import { useTheme } from '@hooks/useTheme';
import { AlertCard } from '@components/organisms';
import { GlowContainer } from '@components/molecules';
import { useReducedMotion } from '@hooks/useReducedMotion';

const STATUS_COLORS: Record<PropertyStatusLevel, { bg: string; dot: string }> = {
  clear: {
    bg: 'rgba(90, 138, 90, 0.12)',
    dot: '#5A8A5A',
  },
  warning: {
    bg: 'rgba(196, 127, 48, 0.12)',
    dot: '#C47F30',
  },
  critical: {
    bg: 'rgba(184, 74, 66, 0.12)',
    dot: '#B84A42',
  },
};

export const PropertyCommandCenter = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const status = usePropertyStatus();
  const reduceMotion = useReducedMotion();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await Promise.all([status.refetchAlerts(), status.refetchDevices()]);
    setRefreshing(false);
  };

  // First-run empty state (autoplan D5)
  // Triggers when: no devices at all, OR devices exist but zero detections ever
  const isFirstRun =
    !status.isLoading &&
    !status.alertsError &&
    !status.devicesError &&
    (status.devicesTotal === 0 || status.allAlerts.length === 0);

  if (isFirstRun) {
    const hasDevices = status.devicesTotal > 0;
    return (
      <ScreenLayout header={{ title: 'My Property', largeTitle: true }}>
        <EmptyState
          icon={hasDevices ? 'radio-outline' : 'shield-checkmark-outline'}
          title={hasDevices ? 'Monitoring Active' : 'Welcome to TrailSense'}
          message={
            hasDevices
              ? 'Your devices are online and scanning. Detections will appear here as devices are found nearby.'
              : 'Your property is being set up. Add a device to start monitoring.'
          }
          actionLabel={hasDevices ? undefined : 'Add Device'}
          onActionPress={
            hasDevices
              ? undefined
              : () => navigation.navigate('DevicesTab', { screen: 'AddDevice' })
          }
        />
      </ScreenLayout>
    );
  }

  // Skeleton loading
  if (status.isLoading) {
    return (
      <ScreenLayout header={{ title: 'My Property', largeTitle: true }}>
        <View style={styles.skeletons}>
          <SkeletonCard height={60} borderRadius={16} style={styles.skeletonItem} />
          <View style={styles.statsRowSkeleton}>
            <SkeletonCard height={80} borderRadius={12} style={{ flex: 1 }} />
            <SkeletonCard height={80} borderRadius={12} style={{ flex: 1 }} />
            <SkeletonCard height={80} borderRadius={12} style={{ flex: 1 }} />
          </View>
          <SkeletonCard height={200} borderRadius={16} style={styles.skeletonItem} />
          <SkeletonCard height={76} borderRadius={12} style={styles.skeletonItem} />
          <SkeletonCard height={76} borderRadius={12} style={styles.skeletonItem} />
        </View>
      </ScreenLayout>
    );
  }

  const statusColors = STATUS_COLORS[status.level];

  return (
    <ScreenLayout
      header={{ title: 'My Property', largeTitle: true }}
      scrollable={false}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.systemGray}
          />
        }
      >
        {/* 1. Property Status Banner */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: statusColors.bg,
              borderColor: statusColors.dot + '33',
            },
          ]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: statusColors.dot }]}
          />
          <View style={styles.statusText}>
            <Text variant="headline" weight="semibold">
              {status.title}
            </Text>
            <Text variant="footnote" color="secondaryLabel">
              {status.subtitle}
            </Text>
          </View>
        </View>

        {/* 2. Stats Row (above map per autoplan D1) */}
        <View style={styles.statsRow}>
          <Pressable
            style={[styles.statCard, { backgroundColor: colors.secondarySystemBackground }]}
            onPress={() => navigation.navigate('AlertsTab')}
          >
            <View style={[styles.statIcon, { backgroundColor: 'rgba(184, 74, 66, 0.12)' }]}>
              <Icon name="alert-circle" size={16} color="systemRed" />
            </View>
            <Text variant="title2" weight="bold">
              {status.activeAlertCount}
            </Text>
            <Text variant="caption1" color="secondaryLabel">
              Active Alerts
            </Text>
          </Pressable>

          <Pressable
            style={[styles.statCard, { backgroundColor: colors.secondarySystemBackground }]}
            onPress={() => {/* WS3: navigate to visitors */}}
          >
            <View style={[styles.statIcon, { backgroundColor: 'rgba(107, 107, 78, 0.12)' }]}>
              <Icon name="people" size={16} color="label" />
            </View>
            <Text variant="title2" weight="bold">
              {status.visitorsToday}
            </Text>
            <Text variant="caption1" color="secondaryLabel">
              Visitors Today
            </Text>
          </Pressable>

          <Pressable
            style={[styles.statCard, { backgroundColor: colors.secondarySystemBackground }]}
            onPress={() => navigation.navigate('DevicesTab')}
          >
            <View style={[styles.statIcon, { backgroundColor: 'rgba(90, 138, 90, 0.12)' }]}>
              <Icon name="checkmark-circle" size={16} color="systemGreen" />
            </View>
            <Text variant="title2" weight="bold">
              {status.devicesOnline}/{status.devicesTotal}
            </Text>
            <Text variant="caption1" color="secondaryLabel">
              Online
            </Text>
          </Pressable>
        </View>

        {/* 3. Mini Property Map — placeholder for Task 5 */}
        <View
          style={[
            styles.mapPlaceholder,
            { backgroundColor: colors.secondarySystemBackground },
          ]}
        >
          <Text variant="footnote" color="tertiaryLabel" align="center">
            Map loads in Task 5
          </Text>
        </View>

        {/* 4. Recent Alerts */}
        {!status.alertsError && status.recentAlerts.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text variant="title3" weight="bold">
                Recent Alerts
              </Text>
              <Pressable onPress={() => navigation.navigate('AlertsTab')}>
                <Text variant="subheadline" color="secondaryLabel">
                  See All ›
                </Text>
              </Pressable>
            </View>
            {status.recentAlerts.map((alert, index) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onPress={() =>
                  navigation.navigate('AlertsTab', {
                    screen: 'AlertDetail',
                    params: { alertId: alert.id },
                  })
                }
                index={index}
                animateEntrance={!reduceMotion}
              />
            ))}
          </View>
        )}
        {status.alertsError && (
          <View style={styles.inlineError}>
            <Text variant="footnote" color="systemRed">
              Couldn't load alerts
            </Text>
            <Pressable onPress={status.refetchAlerts}>
              <Text variant="footnote" color="systemBlue">
                Retry
              </Text>
            </Pressable>
          </View>
        )}

        {/* 5. Recent Visitors — placeholder for WS3 */}
        {/* Will be a horizontal scroll of VisitorChip molecules */}

        {/* 6. 24h Activity Timeline — placeholder for Task 6 */}

        {/* 7. Device Status */}
        {!status.devicesError && (
          <View>
            <View style={styles.sectionHeader}>
              <Text variant="title3" weight="bold">
                Devices
              </Text>
              <Pressable onPress={() => navigation.navigate('DevicesTab')}>
                <Text variant="subheadline" color="secondaryLabel">
                  Manage ›
                </Text>
              </Pressable>
            </View>
            <View style={styles.deviceStatusRow}>
              <View
                style={[
                  styles.deviceStatusCard,
                  { backgroundColor: colors.secondarySystemBackground },
                ]}
              >
                <Text variant="title2" weight="bold" color="systemGreen">
                  {status.devicesOnline}
                </Text>
                <Text variant="caption1" color="secondaryLabel">
                  Online
                </Text>
                <Text variant="caption2" color="tertiaryLabel" numberOfLines={1}>
                  {status.onlineDeviceNames.join(', ') || '—'}
                </Text>
              </View>
              {status.devicesOffline > 0 && (
                <View
                  style={[
                    styles.deviceStatusCard,
                    { backgroundColor: colors.secondarySystemBackground },
                  ]}
                >
                  <Text variant="title2" weight="bold" color="secondaryLabel">
                    {status.devicesOffline}
                  </Text>
                  <Text variant="caption1" color="secondaryLabel">
                    Offline
                  </Text>
                  <Text variant="caption2" color="tertiaryLabel" numberOfLines={1}>
                    {status.offlineDeviceNames.join(', ') || '—'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
        {status.devicesError && (
          <View style={styles.inlineError}>
            <Text variant="footnote" color="systemRed">
              Couldn't load devices
            </Text>
            <Pressable onPress={status.refetchDevices}>
              <Text variant="footnote" color="systemBlue">
                Retry
              </Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  skeletons: { padding: 20, gap: 12 },
  skeletonItem: { marginBottom: 0 },
  statsRowSkeleton: { flexDirection: 'row', gap: 10 },
  statusBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statusText: { flex: 1 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
    gap: 4,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  mapPlaceholder: {
    marginHorizontal: 20,
    marginBottom: 16,
    height: 200,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 8,
  },
  deviceStatusRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  deviceStatusCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  inlineError: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});
```

**Step 2: Create barrel export**

```typescript
// src/screens/home/index.ts
export { PropertyCommandCenter } from './PropertyCommandCenter';
```

**Step 3: Wire into HomeStack**

Replace the placeholder in `src/navigation/stacks/HomeStack.tsx`:

```typescript
import { PropertyCommandCenter } from '@screens/home';

// Replace PlaceholderHome component with PropertyCommandCenter:
<Stack.Screen name="PropertyCommandCenter" component={PropertyCommandCenter} />
```

Remove the placeholder View/Text imports.

**Step 4: Commit**

```bash
git add src/screens/home/ src/navigation/stacks/HomeStack.tsx
git commit -m "feat(home): add PropertyCommandCenter screen with status banner, stats, alerts, devices"
```

---

### Task 5: MiniPropertyMap Component

**Files:**
- Create: `src/components/organisms/MiniPropertyMap/MiniPropertyMap.tsx`
- Create: `src/components/organisms/MiniPropertyMap/index.ts`
- Modify: `src/screens/home/PropertyCommandCenter.tsx`

> **Autoplan decision (Design D14, Eng E11):** Use Mapbox Static Images API for the home screen thumbnail. On tap, navigate to full Radar/Map screen. This avoids GPU allocation issues with live Mapbox in a ScrollView.

**Step 1: Create MiniPropertyMap**

This component fetches a static map image showing device locations with coverage circles. Since Mapbox Static Images API requires a server-side call or direct URL construction, we build the URL from device coordinates and render it as an Image.

```typescript
// src/components/organisms/MiniPropertyMap/MiniPropertyMap.tsx
import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Text, Icon } from '@components/atoms';
import { Device } from '@types';
import { isDeviceOnline } from '@utils/dateUtils';
import { useTheme } from '@hooks/useTheme';

interface MiniPropertyMapProps {
  devices: Device[];
  onPress: () => void;
}

/**
 * Builds a Mapbox Static Images API URL showing device markers.
 * Falls back to a placeholder if no devices have GPS coordinates.
 */
function buildStaticMapUrl(devices: Device[]): string | null {
  const devicesWithCoords = devices.filter(
    d => d.latitude != null && d.longitude != null
  );
  if (devicesWithCoords.length === 0) return null;

  // Calculate center and zoom from device positions
  const lats = devicesWithCoords.map(d => d.latitude!);
  const lngs = devicesWithCoords.map(d => d.longitude!);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

  // Build pin markers
  const pins = devicesWithCoords
    .map(d => {
      const color = isDeviceOnline(d.lastSeen) ? '5A8A5A' : '7A7A70';
      return `pin-s+${color}(${d.longitude},${d.latitude})`;
    })
    .join(',');

  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';
  // Use outdoors style for property/terrain context
  return `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/${pins}/${centerLng},${centerLat},14,0/370x180@2x?access_token=${token}`;
}

export const MiniPropertyMap: React.FC<MiniPropertyMapProps> = ({
  devices,
  onPress,
}) => {
  const { theme } = useTheme();
  const mapUrl = buildStaticMapUrl(devices);
  const devicesWithCoords = devices.filter(
    d => d.latitude != null && d.longitude != null
  );

  return (
    <Pressable
      style={[
        styles.container,
        { backgroundColor: theme.colors.secondarySystemBackground },
      ]}
      onPress={onPress}
    >
      {mapUrl ? (
        <Image
          source={{ uri: mapUrl }}
          style={styles.mapImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <Icon name="map-outline" size={32} color="tertiaryLabel" />
          <Text variant="footnote" color="tertiaryLabel">
            No device locations available
          </Text>
        </View>
      )}
      <View style={styles.footer}>
        <Text variant="footnote" color="secondaryLabel" weight="medium">
          {devicesWithCoords.length} device{devicesWithCoords.length !== 1 ? 's' : ''} on map
        </Text>
        <Text variant="footnote" color="secondaryLabel">
          View Full Map ›
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: 180,
  },
  placeholder: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
```

**Step 2: Create index and add to organisms**

```typescript
// src/components/organisms/MiniPropertyMap/index.ts
export { MiniPropertyMap } from './MiniPropertyMap';
```

**Step 3: Wire into PropertyCommandCenter**

In `src/screens/home/PropertyCommandCenter.tsx`, replace the map placeholder with:

```tsx
import { MiniPropertyMap } from '@components/organisms/MiniPropertyMap';

// Inside the component, after Stats Row (uses status.allDevices from usePropertyStatus):
{/* 3. Mini Property Map */}
<MiniPropertyMap
  devices={status.allDevices}
  onPress={() => navigation.navigate('RadarTab')}
/>
```

Remove the `mapPlaceholder` View and its style. The `status.allDevices` array from `usePropertyStatus()` provides the device data.

**Step 4: Commit**

```bash
git add src/components/organisms/MiniPropertyMap/ src/screens/home/PropertyCommandCenter.tsx
git commit -m "feat(home): add MiniPropertyMap using Mapbox Static Images API"
```

---

### Task 6: ActivitySparkline Component

**Files:**
- Create: `src/components/molecules/ActivitySparkline/ActivitySparkline.tsx`
- Create: `src/components/molecules/ActivitySparkline/index.ts`
- Modify: `src/components/molecules/index.ts`
- Modify: `src/screens/home/PropertyCommandCenter.tsx`

> **Autoplan decision (Design D18):** 24h timeline tappable to deep-link into Replay Radar at that hour.

**Step 1: Create ActivitySparkline**

```typescript
// src/components/molecules/ActivitySparkline/ActivitySparkline.tsx
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { Alert, ThreatLevel } from '@types';

interface ActivitySparklineProps {
  alerts: Alert[];
  onHourPress?: (hour: number) => void;
}

const THREAT_BAR_COLORS: Record<ThreatLevel, string> = {
  critical: 'rgba(184, 74, 66, 0.7)',
  high: 'rgba(196, 127, 48, 0.6)',
  medium: 'rgba(201, 160, 48, 0.5)',
  low: 'rgba(90, 138, 90, 0.3)',
};

const EMPTY_COLOR = 'rgba(0, 0, 0, 0.05)';
const MAX_BAR_HEIGHT = 40;

export const ActivitySparkline: React.FC<ActivitySparklineProps> = ({
  alerts,
  onHourPress,
}) => {
  const { theme } = useTheme();

  // Bucket alerts into 24 hourly slots
  const hourlyData = React.useMemo(() => {
    const buckets: { count: number; maxThreat: ThreatLevel }[] = Array.from(
      { length: 24 },
      () => ({ count: 0, maxThreat: 'low' as ThreatLevel })
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threatPriority: Record<ThreatLevel, number> = {
      low: 0,
      medium: 1,
      high: 2,
      critical: 3,
    };

    alerts.forEach(alert => {
      const alertDate = new Date(alert.timestamp);
      // Only include today's alerts
      if (alertDate >= today) {
        const hour = alertDate.getHours();
        buckets[hour].count++;
        if (
          threatPriority[alert.threatLevel] >
          threatPriority[buckets[hour].maxThreat]
        ) {
          buckets[hour].maxThreat = alert.threatLevel;
        }
      }
    });

    return buckets;
  }, [alerts]);

  const maxCount = Math.max(...hourlyData.map(b => b.count), 1);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.secondarySystemBackground },
      ]}
    >
      <View style={styles.header}>
        <Text
          variant="caption1"
          weight="semibold"
          color="secondaryLabel"
          style={styles.headerTitle}
        >
          TODAY'S ACTIVITY
        </Text>
        <Text variant="caption2" color="tertiaryLabel">
          Since midnight
        </Text>
      </View>
      <View style={styles.sparkline}>
        {hourlyData.map((bucket, i) => {
          const height =
            bucket.count === 0
              ? 2
              : Math.max(4, (bucket.count / maxCount) * MAX_BAR_HEIGHT);
          const color =
            bucket.count === 0
              ? EMPTY_COLOR
              : THREAT_BAR_COLORS[bucket.maxThreat];

          return (
            <Pressable
              key={i}
              style={styles.barContainer}
              onPress={() => onHourPress?.(i)}
            >
              <View
                style={[
                  styles.bar,
                  { height, backgroundColor: color },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.timeLabels}>
        <Text variant="caption2" color="tertiaryLabel">12am</Text>
        <Text variant="caption2" color="tertiaryLabel">6am</Text>
        <Text variant="caption2" color="tertiaryLabel">12pm</Text>
        <Text variant="caption2" color="tertiaryLabel">6pm</Text>
        <Text variant="caption2" color="tertiaryLabel">Now</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    letterSpacing: 0.3,
  },
  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: MAX_BAR_HEIGHT,
    gap: 2,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    borderRadius: 2,
    minHeight: 2,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
});
```

**Step 2: Create index and barrel export**

```typescript
// src/components/molecules/ActivitySparkline/index.ts
export { ActivitySparkline } from './ActivitySparkline';
```

Add to `src/components/molecules/index.ts`:
```typescript
export { ActivitySparkline } from './ActivitySparkline';
```

**Step 3: Wire into PropertyCommandCenter**

Add the sparkline between Recent Alerts and Device Status sections. Pass `alerts` from the hook and wire `onHourPress` to navigate to the Radar tab:

```tsx
import { ActivitySparkline } from '@components/molecules';

// After Recent Alerts section:
<ActivitySparkline
  alerts={status.allAlerts}
  onHourPress={(hour) => {
    // Autoplan D18: tappable to deep-link into Replay Radar at that hour.
    // NOTE: Full time-based replay navigation requires WS2 (Replay Radar)
    // which adds a `replayHour` param to RadarStackParamList.
    // For now, navigate to LiveRadar. WS2 will update this to:
    // navigation.navigate('RadarTab', { screen: 'ReplayRadar', params: { startHour: hour } })
    navigation.navigate('RadarTab', { screen: 'LiveRadar' });
  }}
/>
```

**Step 4: Commit**

```bash
git add src/components/molecules/ActivitySparkline/ src/components/molecules/index.ts src/screens/home/PropertyCommandCenter.tsx
git commit -m "feat(home): add ActivitySparkline with hourly threat-colored bars"
```

---

### Task 7: AI Insight Slot on Home Screen

**Files:**
- Modify: `src/screens/home/PropertyCommandCenter.tsx`

> **Autoplan decision (Design D9):** Surface AI proactively through the home screen. Shows a weekly insight to keep AI visible without a dedicated tab.

**Step 1: Add AI insight section**

Add a simple insight card between Recent Alerts and Activity Timeline. For now, this uses static pattern-based text (LLM integration deferred to Expo SDK 54+). The text is derived from alert data.

```tsx
// Inside PropertyCommandCenter, after Recent Alerts section:
{/* AI Insight slot (autoplan D9) */}
{status.activeAlertCount > 0 || status.visitorsToday > 0 ? (
  <Pressable
    style={[
      styles.insightCard,
      { borderColor: colors.brandAccentBorder || 'rgba(201,184,150,0.25)' },
    ]}
    onPress={() =>
      navigation.navigate('MoreTab', { screen: 'TrailSenseAI' })
    }
  >
    <View style={styles.insightHeader}>
      <Text variant="caption1" weight="semibold" color="secondaryLabel">
        ✦ AI INSIGHT
      </Text>
    </View>
    <Text variant="subheadline" color="label">
      {status.visitorsToday > 0
        ? `${status.visitorsToday} device${status.visitorsToday > 1 ? 's' : ''} detected today. Tap for pattern analysis.`
        : `${status.activeAlertCount} unreviewed alert${status.activeAlertCount > 1 ? 's' : ''} need attention.`}
    </Text>
  </Pressable>
) : null}
```

Add styles:

```typescript
insightCard: {
  marginHorizontal: 20,
  marginBottom: 16,
  padding: 16,
  borderRadius: 12,
  borderWidth: 1,
  backgroundColor: 'rgba(201, 184, 150, 0.06)',
},
insightHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginBottom: 8,
},
```

**Step 2: Commit**

```bash
git add src/screens/home/PropertyCommandCenter.tsx
git commit -m "feat(home): add AI insight slot with pattern-based text"
```

---

### Task 8: Final Verification and Cleanup

**Step 1: Remove unused stack files (optional cleanup)**

The old `AIStack.tsx`, `AnalyticsStack.tsx`, and `SettingsStack.tsx` are no longer imported by `MainNavigator.tsx`. However, they may still be imported elsewhere. Check:

```bash
grep -rn "AIStack\|AnalyticsStack\|SettingsStack" src/ --include="*.ts" --include="*.tsx" | grep -v stacks/ | grep -v node_modules
```

If nothing imports them, they can be deleted. If other files reference them, leave them for now.

**Step 2: Run type-check**

Run: `npx tsc --noEmit 2>&1 | grep -v "AlertSummaryCard\|MapHeaderHero\|PositionInfoPopup\|PositionListItem\|DetectedDeviceMarker\|SwipeableRow\|SuggestionChips\|TrailSenseDeviceMarker\|useAlerts.ts\|endpoints/positions" | head -20`

Expected: No NEW errors from WS1 changes

**Step 3: Run tests**

Run: `npm test 2>&1 | tail -20`
Expected: All existing tests pass

**Step 4: Run lint**

Run: `npm run lint 2>&1 | head -30`
Expected: No new errors

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve lint and type errors from property command center"
```

---

## Summary of Deliverables

| Component | Type | Path |
|-----------|------|------|
| HomeStack | Nav stack | `src/navigation/stacks/HomeStack.tsx` |
| MoreStack | Nav stack | `src/navigation/stacks/MoreStack.tsx` |
| MoreMenuScreen | Screen | `src/screens/more/MoreMenuScreen.tsx` |
| MainNavigator (5 tabs) | Nav mod | `src/navigation/MainNavigator.tsx` |
| Navigation types | Type mod | `src/navigation/types.ts` |
| Deep links (backward compat) | Config mod | `src/navigation/linking.ts` |
| usePropertyStatus | Hook | `src/hooks/usePropertyStatus.ts` |
| PropertyCommandCenter | Screen | `src/screens/home/PropertyCommandCenter.tsx` |
| MiniPropertyMap | Organism | `src/components/organisms/MiniPropertyMap/` |
| ActivitySparkline | Molecule | `src/components/molecules/ActivitySparkline/` |
| AI Insight slot | Screen mod | (inline in PropertyCommandCenter) |

**8 tasks, ~8 commits, estimated ~2-3 sessions with Claude Code.**

## Placeholders for Future Workstreams

These are explicitly left as placeholders in the PropertyCommandCenter screen:
- **Recent Visitors** (horizontal VisitorChip scroll) — Workstream 3
- **Today's Activity timeline → Replay Radar** — ActivitySparkline navigates to RadarTab (generic). Hour-specific deep-link with `replayHour` param is a Workstream 2 deliverable, not WS1. WS2 will update the sparkline's `onHourPress` and add the route param to `RadarStackParamList`.
- **Known visitors count** — `knownVisitorsToday` hardcoded to 0 until Workstream 3 Known Devices
- **AI Insight Card with real LLM** — Uses pattern-based text until Expo SDK 54+ upgrade
