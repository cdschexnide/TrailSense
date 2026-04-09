# AI Tab Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the AI Assistant to a dedicated center tab and restructure the tab bar to 6 tabs with a label-less gear icon for settings.

**Architecture:** Add `AITab` to `MainTabParamList`, register it in `MainNavigator` at position 3 using the existing `AIStack`. Remove the `TrailSenseAI` screen from `MoreStack` and its menu entry. Move the deep link from `MoreTab` to `AITab`.

**Tech Stack:** React Navigation 7.x bottom tabs, Ionicons

---

### Task 1: Add AITab to navigation types

**Files:**

- Modify: `src/navigation/types.ts:20-26`

- [ ] **Step 1: Add AITab to MainTabParamList**

In `src/navigation/types.ts`, change the `MainTabParamList` type from:

```typescript
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  AlertsTab: NavigatorScreenParams<AlertsStackParamList>;
  RadarTab: NavigatorScreenParams<RadarStackParamList>;
  DevicesTab: NavigatorScreenParams<DevicesStackParamList>;
  MoreTab: NavigatorScreenParams<MoreStackParamList>;
};
```

to:

```typescript
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  AlertsTab: NavigatorScreenParams<AlertsStackParamList>;
  AITab: NavigatorScreenParams<AIStackParamList>;
  RadarTab: NavigatorScreenParams<RadarStackParamList>;
  DevicesTab: NavigatorScreenParams<DevicesStackParamList>;
  MoreTab: NavigatorScreenParams<MoreStackParamList>;
};
```

- [ ] **Step 2: Remove TrailSenseAI from MoreStackParamList**

In the same file, change `MoreStackParamList` (line 60-79) by removing the `TrailSenseAI` entry:

```typescript
export type MoreStackParamList = {
  MoreMenu: undefined;
  Dashboard: undefined;
  Heatmap: undefined;
  Reports: undefined;
  Settings: undefined;
  Profile: undefined;
  KnownDevices: undefined;
  NotificationSettings: undefined;
  Theme: undefined;
  AlertSound: undefined;
  Biometric: undefined;
  Security: undefined;
  Sensitivity: undefined;
  QuietHours: undefined;
  VacationMode: undefined;
  AddKnownDevice: { macAddress?: string; deviceId?: string } | undefined;
  DeviceFingerprint: { macAddress: string };
};
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep -E "types.ts|MainNavigator|MoreStack|linking" | head -20`
Expected: Errors in `MainNavigator.tsx` (AITab not registered yet) and `linking.ts` (TrailSenseAI still under MoreTab). These are expected and will be fixed in subsequent tasks.

- [ ] **Step 4: Commit**

```bash
git add src/navigation/types.ts
git commit -m "refactor(nav): add AITab to MainTabParamList, remove AI from MoreStack types

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Register AITab in MainNavigator and convert More to gear icon

**Files:**

- Modify: `src/navigation/MainNavigator.tsx:1-83`

- [ ] **Step 1: Add AIStack import and register all 6 tabs**

Replace the entire content of `src/navigation/MainNavigator.tsx` with:

```typescript
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { MainTabParamList } from './types';
import HomeStack from './stacks/HomeStack';
import AlertsStack from './stacks/AlertsStack';
import AIStack from './stacks/AIStack';
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
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? "home" : "home-outline"} color={color} size="base" />
          ),
        }}
      />
      <Tab.Screen
        name="AlertsTab"
        component={AlertsStack}
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? "alert-circle" : "alert-circle-outline"} color={color} size="base" />
          ),
        }}
      />
      <Tab.Screen
        name="AITab"
        component={AIStack}
        options={{
          title: 'AI',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? "sparkles" : "sparkles-outline"} color={color} size="base" />
          ),
        }}
      />
      <Tab.Screen
        name="RadarTab"
        component={RadarStack}
        options={{
          title: 'Radar',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? "radio" : "radio-outline"} color={color} size="base" />
          ),
        }}
      />
      <Tab.Screen
        name="DevicesTab"
        component={DevicesStack}
        options={{
          title: 'Devices',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? "hardware-chip" : "hardware-chip-outline"} color={color} size="base" />
          ),
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreStack}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? "settings-sharp" : "settings-outline"} color={color} size="base" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
```

- [ ] **Step 2: Verify the sparkles icon exists in the Icon component**

Run: `grep -r "sparkles" src/components/atoms/Icon/ src/constants/iconMapping.ts 2>/dev/null | head -10`

If `sparkles-outline` is not mapped, it will still work — Ionicons includes `sparkles-outline` natively. The `Icon` component passes unknown names through to Ionicons.

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep "MainNavigator" | head -5`
Expected: No errors from this file.

- [ ] **Step 4: Commit**

```bash
git add src/navigation/MainNavigator.tsx
git commit -m "feat(nav): add AI as center tab, convert More to gear icon

6-tab layout: Home, Alerts, AI (sparkles), Radar, Devices, Settings (gear).
Settings tab has no label to save horizontal space.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Remove AI screen from MoreStack and MoreMenuScreen

**Files:**

- Modify: `src/navigation/stacks/MoreStack.tsx:10,40`
- Modify: `src/screens/more/MoreMenuScreen.tsx:19-25`

- [ ] **Step 1: Remove AIAssistantScreen from MoreStack**

In `src/navigation/stacks/MoreStack.tsx`, remove the import on line 10:

```typescript
import { AIAssistantScreen } from '@screens/ai';
```

And remove the screen registration on line 40:

```tsx
<Stack.Screen name="TrailSenseAI" component={AIAssistantScreen} />
```

- [ ] **Step 2: Remove AI entry from MoreMenuScreen**

In `src/screens/more/MoreMenuScreen.tsx`, remove the AI Assistant menu item (lines 19-25):

```tsx
<GroupedListRow
  title="AI Assistant"
  icon="sparkles-outline"
  iconColor="#8A6090"
  showChevron
  onPress={() => navigation.navigate('TrailSenseAI')}
/>
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep -E "MoreStack|MoreMenu" | head -10`
Expected: No errors from these files.

- [ ] **Step 4: Commit**

```bash
git add src/navigation/stacks/MoreStack.tsx src/screens/more/MoreMenuScreen.tsx
git commit -m "refactor(nav): remove AI screen from MoreStack and More menu

AI is now accessible via its own tab; no longer nested under More.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Move AI deep link to AITab

**Files:**

- Modify: `src/navigation/linking.ts:46-52`

- [ ] **Step 1: Move TrailSenseAI deep link from MoreTab to AITab**

In `src/navigation/linking.ts`, remove the `TrailSenseAI: 'ai',` line from inside `MoreTab.screens` (line 52), and add a new `AITab` section between `AlertsTab` and `RadarTab`.

Replace lines 30-67 (from `RadarTab` opening through end of `MoreTab`) with:

```typescript
          AITab: {
            screens: {
              TrailSenseAI: 'ai',
            },
          },
          RadarTab: {
            screens: {
              LiveRadar: 'radar',
              RadarSettings: 'radar/settings',
              DeviceFingerprint: 'radar/fingerprint/:macAddress',
            },
          },
          DevicesTab: {
            screens: {
              DeviceList: 'devices',
              DeviceDetail: 'devices/:deviceId',
              AddDevice: 'devices/add',
              DeviceFingerprint: 'devices/fingerprint/:macAddress',
            },
          },
          MoreTab: {
            screens: {
              MoreMenu: 'more',
              Dashboard: 'analytics',
              Heatmap: 'analytics/heatmap',
              Reports: 'analytics/reports',
              Settings: 'settings',
              Profile: 'settings/profile',
              KnownDevices: 'settings/known-devices',
              NotificationSettings: 'settings/notifications',
              Theme: 'settings/theme',
              AlertSound: 'settings/alert-sound',
              Biometric: 'settings/biometric',
              Security: 'settings/security',
              Sensitivity: 'settings/sensitivity',
              QuietHours: 'settings/quiet-hours',
              VacationMode: 'settings/vacation-mode',
              AddKnownDevice: 'settings/known-devices/add',
              DeviceFingerprint: 'more/fingerprint/:macAddress',
            },
          },
```

Note: `TrailSenseAI: 'ai'` is now gone from `MoreTab` and lives under `AITab`.

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep "linking" | head -5`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/navigation/linking.ts
git commit -m "refactor(nav): move AI deep link to AITab

The 'ai' deep link now routes to AITab instead of MoreTab.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Full verification

- [ ] **Step 1: Run type check**

Run: `npx tsc --noEmit 2>&1 | grep -E "MainNavigator|MoreStack|MoreMenu|linking|types.ts" | head -20`
Expected: No new errors from any of the changed files.

- [ ] **Step 2: Run linter**

Run: `npx eslint src/navigation/MainNavigator.tsx src/navigation/stacks/MoreStack.tsx src/navigation/types.ts src/navigation/linking.ts src/screens/more/MoreMenuScreen.tsx --quiet 2>&1 | head -20`
Expected: No lint errors.

- [ ] **Step 3: Visual verification checklist (on simulator)**

If running on simulator (`npx expo run:ios --device "iPhone 16 Pro"`):

- 6 tabs visible: Home, Alerts, AI (sparkles), Radar, Devices, ⚙️ (no label)
- Tapping AI tab loads AIAssistantScreen
- Tapping gear icon loads MoreMenuScreen (no AI entry in the list)
- Tapping "More"/"Settings" tab while on AI screen switches to the More/Settings stack (no navigation trap)
- AI tab sparkles icon shows active color when selected
- Deep link `trailsense://ai` opens the AI tab
