# Workstream 4: Production Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add foundational polish infrastructure (skeleton loading, toasts, offline banner, reduced motion, feature flags, empty search, dark mode shadows, keyboard dismiss, demo mode) that every subsequent workstream builds on.

**Architecture:** New atoms/molecules/templates added to the existing atomic component system. ToastProvider wraps the app root in App.tsx. useReducedMotion hook gates all animations globally. Feature flags added to featureFlags.ts for rollback safety. Demo mode elevates existing mock mode to a user-facing feature.

**Tech Stack:** React Native 0.76, Expo SDK 52, TypeScript strict, expo-haptics, @react-native-community/netinfo (already in package.json), AccessibilityInfo API

---

### Task 1: Feature Flags for New Workstreams

**Files:**

- Modify: `src/config/featureFlags.ts`

**Step 1: Add new feature flag types**

Add to the `FeatureFlags` interface after the LLM Developer Features block:

```typescript
// Workstream Feature Flags
PROPERTY_COMMAND_CENTER: boolean;
REPLAY_RADAR: boolean;
BEHAVIORAL_PATTERNS: boolean;
KNOWN_DEVICE_SUGGESTIONS: boolean;
DEMO_MODE: boolean;
```

**Step 2: Add defaults**

Add to `DEFAULT_FEATURE_FLAGS` after the developer features:

```typescript
// Workstream Feature Flags - all enabled by default, can be disabled for rollback
PROPERTY_COMMAND_CENTER: true,
REPLAY_RADAR: true,
BEHAVIORAL_PATTERNS: true,
KNOWN_DEVICE_SUGGESTIONS: true,
DEMO_MODE: false, // Toggled by user in settings or login screen
```

**Step 3: Verify type-check passes**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to featureFlags

**Step 4: Commit**

```bash
git add src/config/featureFlags.ts
git commit -m "feat(flags): add workstream feature flags for rollback safety"
```

---

### Task 2: useReducedMotion Hook

**Files:**

- Create: `src/hooks/useReducedMotion.ts`

**Step 1: Create the hook**

```typescript
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Hook to check if the user has enabled "Reduce Motion" in system settings.
 * When true, all animations should be disabled or use instant transitions.
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Check initial value
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
```

**Step 2: Commit**

```bash
git add src/hooks/useReducedMotion.ts
git commit -m "feat(a11y): add useReducedMotion hook"
```

---

### Task 3: SkeletonCard Atom

**Files:**

- Create: `src/components/atoms/SkeletonCard/SkeletonCard.tsx`
- Create: `src/components/atoms/SkeletonCard/index.ts`
- Modify: `src/components/atoms/index.ts`

**Step 1: Create SkeletonCard component**

```typescript
// src/components/atoms/SkeletonCard/SkeletonCard.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { useReducedMotion } from '@hooks/useReducedMotion';

interface SkeletonCardProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  width = '100%',
  height = 76,
  borderRadius = 12,
  style,
}) => {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      shimmer.setValue(0.5);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [reduceMotion, shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.16],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.colors.label,
          opacity,
        },
        style,
      ]}
    />
  );
};
```

**Step 2: Create index export**

```typescript
// src/components/atoms/SkeletonCard/index.ts
export { SkeletonCard } from './SkeletonCard';
```

**Step 3: Add to atoms barrel export**

Add to `src/components/atoms/index.ts`:

```typescript
export * from './SkeletonCard';
```

**Step 4: Verify type-check**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 5: Commit**

```bash
git add src/components/atoms/SkeletonCard/ src/components/atoms/index.ts
git commit -m "feat(atoms): add SkeletonCard with shimmer animation and reduced motion support"
```

---

### Task 4: Toast Molecule

**Files:**

- Create: `src/components/molecules/Toast/Toast.tsx`
- Create: `src/components/molecules/Toast/index.ts`
- Modify: `src/components/molecules/index.ts`

**Step 1: Create Toast component**

```typescript
// src/components/molecules/Toast/Toast.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { Ionicons } from '@expo/vector-icons';

type ToastVariant = 'success' | 'error' | 'info';
type IconName = keyof typeof Ionicons.glyphMap;

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: IconName; bgColor: string; iconColor: string }
> = {
  success: {
    icon: 'checkmark-circle',
    bgColor: 'rgba(90, 138, 90, 0.95)',
    iconColor: '#FFFFFF',
  },
  error: {
    icon: 'alert-circle',
    bgColor: 'rgba(184, 74, 66, 0.95)',
    iconColor: '#FFFFFF',
  },
  info: {
    icon: 'information-circle',
    bgColor: 'rgba(107, 107, 78, 0.95)',
    iconColor: '#FFFFFF',
  },
};

export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'success',
  visible,
  onDismiss,
  duration = 3000,
}) => {
  const reduceMotion = useReducedMotion();
  const translateY = useRef(new Animated.Value(-100)).current;
  const config = VARIANT_CONFIG[variant];

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(
        variant === 'error'
          ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Success
      );

      if (reduceMotion) {
        translateY.setValue(0);
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 300,
          useNativeDriver: true,
        }).start();
      }

      const timer = setTimeout(() => {
        if (reduceMotion) {
          translateY.setValue(-100);
          onDismiss();
        } else {
          Animated.timing(translateY, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
          }).start(onDismiss);
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, variant, duration, onDismiss, reduceMotion, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: config.bgColor, transform: [{ translateY }] },
      ]}
    >
      <Icon
        name={config.icon as any}
        size={20}
        color="white"
      />
      <Text
        variant="subheadline"
        weight="semibold"
        style={styles.message}
        numberOfLines={2}
      >
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 9999,
    gap: 10,
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
  },
});
```

**Step 2: Create index export**

```typescript
// src/components/molecules/Toast/index.ts
export { Toast } from './Toast';
export type { default as ToastVariant } from './Toast';
```

**Step 3: Add to molecules barrel export**

Add to `src/components/molecules/index.ts`:

```typescript
export { Toast } from './Toast';
```

**Step 4: Commit**

```bash
git add src/components/molecules/Toast/ src/components/molecules/index.ts
git commit -m "feat(molecules): add Toast component with haptics and reduced motion support"
```

---

### Task 5: ToastProvider Template

**Files:**

- Create: `src/components/templates/ToastProvider/ToastProvider.tsx`
- Create: `src/components/templates/ToastProvider/index.ts`
- Modify: `src/components/templates/index.ts`
- Modify: `src/App.tsx`

**Step 1: Create ToastProvider with context**

```typescript
// src/components/templates/ToastProvider/ToastProvider.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from '@components/molecules/Toast';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  variant: ToastVariant;
  visible: boolean;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    variant: 'success',
    visible: false,
  });

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      setToast({ message, variant, visible: true });
    },
    []
  );

  const handleDismiss = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onDismiss={handleDismiss}
      />
    </ToastContext.Provider>
  );
};
```

**Step 2: Create index**

```typescript
// src/components/templates/ToastProvider/index.ts
export { ToastProvider, useToast } from './ToastProvider';
```

**Step 3: Add to templates barrel**

Add to `src/components/templates/index.ts`:

```typescript
export { ToastProvider, useToast } from './ToastProvider';
```

**Step 4: Wrap App.tsx with ToastProvider**

In `src/App.tsx`, import and wrap. Inside the existing provider stack (after `<ThemeProvider>` and before `<RootNavigator />`), add `<ToastProvider>`:

Find the return block that starts around line 82 and wrap `<RootNavigator />`:

```tsx
import { ToastProvider } from '@components/templates';

// Inside the return, wrap RootNavigator:
<ToastProvider>
  <RootNavigator />
</ToastProvider>;
```

**Step 5: Verify app still compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 6: Commit**

```bash
git add src/components/templates/ToastProvider/ src/components/templates/index.ts src/App.tsx
git commit -m "feat(templates): add ToastProvider context, wrap App root"
```

---

### Task 6: OfflineBanner Molecule

**Files:**

- Create: `src/components/molecules/OfflineBanner/OfflineBanner.tsx`
- Create: `src/components/molecules/OfflineBanner/index.ts`
- Modify: `src/components/molecules/index.ts`
- Modify: `src/App.tsx`

**Step 1: Create OfflineBanner component**

```typescript
// src/components/molecules/OfflineBanner/OfflineBanner.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Text, Icon } from '@components/atoms';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.container}>
      <Icon name="cloud-offline-outline" size={14} color="white" />
      <Text variant="caption1" weight="semibold" style={styles.text}>
        Offline — showing cached data
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(107, 107, 78, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  text: {
    color: '#FFFFFF',
  },
});
```

**Step 2: Create index and add to barrel**

```typescript
// src/components/molecules/OfflineBanner/index.ts
export { OfflineBanner } from './OfflineBanner';
```

Add to `src/components/molecules/index.ts`:

```typescript
export { OfflineBanner } from './OfflineBanner';
```

**Step 3: Add to App.tsx**

In `src/App.tsx`, add the OfflineBanner right above the ToastProvider (so it sits above everything). Inside the SafeAreaProvider, before the main content:

```tsx
import { OfflineBanner } from '@components/molecules/OfflineBanner';

// Inside the return, above ToastProvider:
<OfflineBanner />
<ToastProvider>
  <RootNavigator />
</ToastProvider>
```

**Step 4: Commit**

```bash
git add src/components/molecules/OfflineBanner/ src/components/molecules/index.ts src/App.tsx
git commit -m "feat(molecules): add OfflineBanner with NetInfo connectivity detection"
```

---

### Task 7: Empty Search Results in AlertListScreen and DeviceListScreen

**Files:**

- Modify: `src/screens/alerts/AlertListScreen.tsx`
- Modify: `src/screens/devices/DeviceListScreen.tsx`
- Modify: `src/components/templates/ScreenLayout/ScreenLayout.tsx`

**Step 1: Update AlertListScreen**

The AlertListScreen already has a `ListEmptyComponent` on its FlatList (line ~210) that handles empty state for threat filter. We need to differentiate between "no alerts at all" and "search returned no results."

Find the `ListEmptyComponent` prop (around line 210) and update:

```tsx
ListEmptyComponent={
  <EmptyState
    icon={
      search
        ? 'search-outline'
        : selectedThreatFilter
          ? 'notifications-off-outline'
          : 'notifications-off-outline'
    }
    title={
      search
        ? 'No Results'
        : selectedThreatFilter
          ? `No ${THREAT_LABELS[selectedThreatFilter]} Alerts`
          : 'No Alerts'
    }
    message={
      search
        ? `No alerts matching "${search}"`
        : selectedThreatFilter
          ? 'Try selecting a different filter'
          : 'You have no security alerts'
    }
  />
}
```

**Step 2: Update DeviceListScreen**

Read the DeviceListScreen's FlatList section and add/update the `ListEmptyComponent` to handle search if a search bar exists, or verify the existing empty state. The current DeviceListScreen does not have a search bar, so ensure its existing EmptyState is intact. No change needed here if it already has one.

**Step 3: Add keyboardDismissMode to ScreenLayout and screen FlatLists**

The `ScreenLayout` template wraps most screens with an `Animated.ScrollView` (line 133 of `ScreenLayout.tsx`). Adding `keyboardDismissMode` there covers all scrollable screens at once.

In `src/components/templates/ScreenLayout/ScreenLayout.tsx`, add to the `Animated.ScrollView` props (around line 133):

```tsx
keyboardDismissMode = 'on-drag';
```

Also add to AlertListScreen's `Animated.FlatList` (around line 179) and DeviceListScreen's FlatList, since those use `scrollable={false}` on ScreenLayout and manage their own FlatList:

```tsx
keyboardDismissMode = 'on-drag';
```

**Step 4: Commit**

```bash
git add src/screens/alerts/AlertListScreen.tsx src/screens/devices/DeviceListScreen.tsx src/components/templates/ScreenLayout/ScreenLayout.tsx
git commit -m "feat(screens): add empty search state and keyboard dismiss on scroll"
```

---

### Task 8: Reduced Motion in GlowContainer, AlertCard, and DeviceCard

**Files:**

- Modify: `src/components/molecules/GlowContainer/GlowContainer.tsx`
- Modify: `src/components/organisms/AlertCard/AlertCard.tsx`
- Modify: `src/components/organisms/DeviceCard/DeviceCard.tsx`

**Step 1: Update GlowContainer**

Import and use `useReducedMotion` to disable the pulse animation:

```typescript
import { useReducedMotion } from '@hooks/useReducedMotion';
```

Inside the component, before the useEffect:

```typescript
const reduceMotion = useReducedMotion();
```

Update the useEffect condition (around line 37):

```typescript
useEffect(() => {
  if (pulse && !reduceMotion) {
    // ... existing pulse animation code
  } else {
    animatedOpacity.setValue(1);
    return undefined;
  }
}, [pulse, reduceMotion, animatedOpacity]);
```

**Step 2: Update AlertCard**

Import `useReducedMotion` and disable the stagger entrance animation when reduced motion is on.

In AlertCard, import the hook and check it. Where the entrance animation fires (the useEffect with `Animated.timing` for opacity/translateX), wrap the animation in a reduce motion check:

```typescript
const reduceMotion = useReducedMotion();

useEffect(() => {
  if (animateEntrance && !reduceMotion) {
    // existing stagger animation
  } else {
    // Set final values immediately
    opacity.setValue(1);
    translateX.setValue(0);
  }
}, [animateEntrance, reduceMotion]);
```

**Step 3: Update DeviceCard**

DeviceCard also has `animateEntrance` with stagger animations (same pattern as AlertCard). Apply the same `useReducedMotion` check:

```typescript
import { useReducedMotion } from '@hooks/useReducedMotion';

const reduceMotion = useReducedMotion();

useEffect(() => {
  if (animateEntrance && !reduceMotion) {
    // existing stagger animation
  } else {
    opacity.setValue(1);
    translateX.setValue(0);
  }
}, [animateEntrance, reduceMotion]);
```

**Step 4: Commit**

```bash
git add src/components/molecules/GlowContainer/GlowContainer.tsx src/components/organisms/AlertCard/AlertCard.tsx src/components/organisms/DeviceCard/DeviceCard.tsx
git commit -m "feat(a11y): respect reduced motion in GlowContainer, AlertCard, and DeviceCard"
```

---

### Task 9: Permission Flows (Location + Notifications)

**Files:**

- Create: `src/components/templates/PermissionScreen/PermissionScreen.tsx`
- Create: `src/components/templates/PermissionScreen/index.ts`
- Modify: `src/components/templates/index.ts`

> **Autoplan decision (D6, Codex #6):** Camera permission deferred until QR scanner is actually implemented. Only Location and Notifications for now. Uses Expo cross-platform APIs (`expo-location`, `expo-notifications`).

**Step 1: Create reusable PermissionScreen template**

```typescript
// src/components/templates/PermissionScreen/PermissionScreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

interface PermissionScreenProps {
  icon: IconName;
  title: string;
  description: string;
  onAllow: () => void;
  onSkip?: () => void;
}

export const PermissionScreen: React.FC<PermissionScreenProps> = ({
  icon,
  title,
  description,
  onAllow,
  onSkip,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.systemBackground }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.secondarySystemBackground }]}>
          <Icon name={icon} size={48} color="systemBlue" />
        </View>
        <Text variant="title1" weight="bold" align="center" style={styles.title}>
          {title}
        </Text>
        <Text variant="body" color="secondaryLabel" align="center" style={styles.description}>
          {description}
        </Text>
      </View>
      <View style={styles.buttons}>
        <Button buttonStyle="filled" onPress={onAllow}>
          Allow
        </Button>
        {onSkip && (
          <Button buttonStyle="plain" onPress={onSkip}>
            Maybe Later
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
  },
  description: {
    maxWidth: 300,
    marginBottom: 24,
  },
  buttons: {
    gap: 12,
    paddingBottom: 16,
  },
});
```

**Step 2: Create index and add to barrel**

```typescript
// src/components/templates/PermissionScreen/index.ts
export { PermissionScreen } from './PermissionScreen';
```

Add to `src/components/templates/index.ts`:

```typescript
export { PermissionScreen } from './PermissionScreen';
```

**Step 3: Commit**

```bash
git add src/components/templates/PermissionScreen/ src/components/templates/index.ts
git commit -m "feat(templates): add reusable PermissionScreen for location and notifications"
```

---

### Task 10: Toast/OfflineBanner Stacking

**Files:**

- Modify: `src/components/molecules/Toast/Toast.tsx`

> **Autoplan decision (Design D16):** OfflineBanner is persistent and sits below the safe area. Toasts animate in below the OfflineBanner. Use a shared top offset so they never overlap.

**Step 1: Make Toast top position dynamic**

The OfflineBanner is ~28px tall when visible. The Toast needs to account for this. The simplest approach: increase the Toast's `top` value to clear the banner. Since OfflineBanner renders independently, use a safe fixed offset:

In `src/components/molecules/Toast/Toast.tsx`, change the container style:

```typescript
container: {
  position: 'absolute',
  top: 90, // 60 (safe area) + 30 (room for OfflineBanner)
  left: 16,
  right: 16,
  // ... rest unchanged
},
```

This gives 30px of clearance. When the OfflineBanner is hidden, the toast sits slightly lower than the minimum safe area, which is fine. When the banner is showing, it doesn't overlap.

**Step 2: Commit**

```bash
git add src/components/molecules/Toast/Toast.tsx
git commit -m "fix(Toast): offset top position to avoid OfflineBanner overlap"
```

---

### Task 11: Dark Mode Shadow Adaptation

**Files:**

- Modify: `src/constants/shadows.ts`

**Step 1: Add dark mode shadow variants**

Add a helper function and dark mode overrides at the bottom of `shadows.ts`, before the `Shadows` collection export:

```typescript
/**
 * Dark mode shadow adaptation
 *
 * Shadows are invisible on dark backgrounds. In dark mode,
 * use subtle borders instead for visual hierarchy.
 */
export const darkModeBorder = {
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: 'rgba(255, 255, 255, 0.1)',
};

/**
 * Get shadow or border based on color scheme
 * Usage: getShadow('sm', colorScheme)
 */
export function getShadow(
  size: 'none' | 'sm' | 'md' | 'lg',
  colorScheme: 'light' | 'dark'
) {
  if (colorScheme === 'dark') {
    return size === 'none' ? shadowNone : { ...shadowNone, ...darkModeBorder };
  }
  return Shadows[size];
}
```

Add the import at the top of the file:

```typescript
import { StyleSheet } from 'react-native';
```

**Step 2: Commit**

```bash
git add src/constants/shadows.ts
git commit -m "feat(theme): add dark mode shadow-to-border adaptation"
```

---

### Task 12: Demo Mode (User-Facing Mock Mode)

**Files:**

- Modify: `src/config/mockConfig.ts`
- Modify: `src/config/featureFlags.ts`
- Modify: `src/screens/settings/SettingsScreen.tsx`

**Step 1: Read the current mockConfig.ts**

Read `src/config/mockConfig.ts` to understand how mock mode is currently toggled.

**Step 2: Add a runtime demo mode toggle**

The existing mock mode is compile-time (`USE_MOCK_API` env var). Demo mode needs to be runtime-toggleable. Add a Zustand store or a simple state module:

Create `src/config/demoMode.ts`:

```typescript
// src/config/demoMode.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_MODE_KEY = 'trailsense_demo_mode';

let _isDemoMode = false;

export async function initDemoMode(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(DEMO_MODE_KEY);
  _isDemoMode = stored === 'true';
  return _isDemoMode;
}

export function isDemoMode(): boolean {
  return _isDemoMode;
}

export async function setDemoMode(enabled: boolean): Promise<void> {
  _isDemoMode = enabled;
  await AsyncStorage.setItem(DEMO_MODE_KEY, String(enabled));
}
```

**Step 3: Add Demo Mode toggle to SettingsScreen**

In `src/screens/settings/SettingsScreen.tsx`, add a new row in the App section (or a new "Developer" section at the bottom). This will be a `GroupedListRow` that toggles demo mode. The exact implementation depends on the current SettingsScreen structure, which should be read first.

Add a toggle row:

```tsx
<GroupedListRow
  title="Demo Mode"
  subtitle="Show sample data for demonstrations"
  value={isDemoEnabled ? 'On' : 'Off'}
  onPress={handleToggleDemo}
  icon="flask-outline"
  iconBackground="#6B6B4E"
/>
```

The toggle handler:

```typescript
const handleToggleDemo = async () => {
  const newValue = !isDemoEnabled;
  await setDemoMode(newValue);
  setIsDemoEnabled(newValue);
  showToast(
    newValue
      ? 'Demo mode enabled. Restart app to load sample data.'
      : 'Demo mode disabled. Restart app.',
    'info'
  );
};
```

**Step 4: Commit**

```bash
git add src/config/demoMode.ts src/screens/settings/SettingsScreen.tsx
git commit -m "feat(config): add user-facing demo mode toggle in settings"
```

---

### Task 13: Wire Skeleton Loading into AlertListScreen

**Files:**

- Modify: `src/screens/alerts/AlertListScreen.tsx`

**Step 1: Replace LoadingState with skeleton cards**

Currently at line 117: `if (isLoading) return <LoadingState />;`

Replace with a skeleton variant:

```tsx
import { SkeletonCard } from '@components/atoms';

// Replace the isLoading early return:
if (isLoading) {
  return (
    <ScreenLayout
      header={{ title: 'Alerts', largeTitle: true }}
      scrollable={true}
    >
      <View style={styles.skeletonContainer}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard
            key={i}
            height={76}
            borderRadius={12}
            style={{ marginBottom: 8, marginHorizontal: 4 }}
          />
        ))}
      </View>
    </ScreenLayout>
  );
}
```

Add to styles:

```typescript
skeletonContainer: {
  paddingHorizontal: 4,
  paddingTop: 16,
},
```

**Step 2: Do the same for DeviceListScreen**

Replace `if (isLoading) return <LoadingState />;` with skeleton cards sized to match DeviceCard dimensions.

**Step 3: Commit**

```bash
git add src/screens/alerts/AlertListScreen.tsx src/screens/devices/DeviceListScreen.tsx
git commit -m "feat(screens): replace spinner with skeleton loading cards"
```

---

### Task 14: Analytics Events for New Features

**Files:**

- Create: `src/services/analyticsEvents.ts`

> **Autoplan decision (CEO Section 4):** Add analytics events for key new interactions. Existing Firebase analytics infrastructure handles this.

**Step 1: Create analytics event definitions**

```typescript
// src/services/analyticsEvents.ts
/**
 * Analytics events for new workstream features.
 * These hook into the existing Firebase analytics via expo-firebase-analytics
 * or can be logged to console in dev mode.
 */

export const AnalyticsEvents = {
  // Workstream 1: Home Screen
  HOME_SCREEN_LOADED: 'home_screen_loaded',
  HOME_STATUS_TAPPED: 'home_status_tapped',
  HOME_MAP_EXPANDED: 'home_map_expanded',
  HOME_VISITOR_TAPPED: 'home_visitor_tapped',

  // Workstream 2: Replay Radar
  REPLAY_RADAR_OPENED: 'replay_radar_opened',
  REPLAY_RADAR_SCRUBBED: 'replay_radar_scrubbed',
  REPLAY_AUTOPLAY_STARTED: 'replay_autoplay_started',
  REPLAY_SPEED_CHANGED: 'replay_speed_changed',

  // Workstream 3: Fingerprints
  FINGERPRINT_VIEWED: 'fingerprint_viewed',
  DEVICE_ADDED_TO_KNOWN: 'device_added_to_known',
  DEVICE_BLOCKED: 'device_blocked',

  // Workstream 4: Polish
  DEMO_MODE_TOGGLED: 'demo_mode_toggled',
  OFFLINE_BANNER_SHOWN: 'offline_banner_shown',
} as const;

export type AnalyticsEvent =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

/**
 * Log an analytics event. Uses console.log in dev, Firebase in production.
 * Implementers should wire this to Firebase Analytics when ready.
 */
export function logEvent(event: AnalyticsEvent, params?: Record<string, any>) {
  if (__DEV__) {
    console.log(`[Analytics] ${event}`, params || '');
  }
  // TODO: Wire to Firebase Analytics
  // analytics().logEvent(event, params);
}
```

**Step 2: Commit**

```bash
git add src/services/analyticsEvents.ts
git commit -m "feat(analytics): add event definitions for new workstream features"
```

---

### Task 15: Final Verification

**Step 1: Run type-check**

Run: `npx tsc --noEmit`
Expected: Zero errors

**Step 2: Run tests**

Run: `npm test`
Expected: All existing tests pass

**Step 3: Run lint**

Run: `npm run lint`
Expected: No new errors (fix any lint issues from new files)

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve lint and type errors from production polish"
```

---

## Autoplan Decisions Incorporated

These decisions were made during the `/autoplan` review (CEO, Design, Eng phases) and are reflected in the tasks above:

| Decision                                                      | Source              | Task                       |
| ------------------------------------------------------------- | ------------------- | -------------------------- |
| Feature flags for rollback safety                             | Eng E14             | Task 1                     |
| Permission flows: Location + Notifications only, defer Camera | Design D6, Codex #6 | Task 9                     |
| Toast/OfflineBanner stacking: toast offsets below banner      | Design D16          | Task 10                    |
| Analytics events for new features                             | CEO Section 4       | Task 14                    |
| Status precedence: threat > offline > stale > clear           | Design D19          | Workstream 1 (not this WS) |
| Block device is UI-only suppression, push still arrives       | Codex Eng #2        | Workstream 3 (not this WS) |

## Summary of Deliverables

| Component         | Type                | Path                                                              |
| ----------------- | ------------------- | ----------------------------------------------------------------- |
| Feature flags     | Config              | `src/config/featureFlags.ts`                                      |
| useReducedMotion  | Hook                | `src/hooks/useReducedMotion.ts`                                   |
| SkeletonCard      | Atom                | `src/components/atoms/SkeletonCard/`                              |
| Toast             | Molecule            | `src/components/molecules/Toast/`                                 |
| ToastProvider     | Template            | `src/components/templates/ToastProvider/`                         |
| OfflineBanner     | Molecule            | `src/components/molecules/OfflineBanner/`                         |
| PermissionScreen  | Template            | `src/components/templates/PermissionScreen/`                      |
| Analytics events  | Service             | `src/services/analyticsEvents.ts`                                 |
| Demo Mode         | Config              | `src/config/demoMode.ts`                                          |
| Dark mode shadows | Constants           | `src/constants/shadows.ts`                                        |
| Skeleton loading  | Screen mod          | `AlertListScreen.tsx`, `DeviceListScreen.tsx`                     |
| Empty search      | Screen mod          | `AlertListScreen.tsx`                                             |
| Keyboard dismiss  | Screen/Template mod | `ScreenLayout.tsx`, `AlertListScreen.tsx`, `DeviceListScreen.tsx` |
| Reduced motion    | Component mod       | `GlowContainer.tsx`, `AlertCard.tsx`, `DeviceCard.tsx`            |
| Toast stacking    | Component mod       | `Toast.tsx`                                                       |

**15 tasks, ~15 commits, estimated ~2 sessions with Claude Code.**
