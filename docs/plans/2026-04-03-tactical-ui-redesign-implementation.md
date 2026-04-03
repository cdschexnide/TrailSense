# Tactical UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the entire app's UI/UX to match the AI screen's tactical command center aesthetic — dark-only theme, amber accents, monospace tactical headers, tiered card system, contextual status indicators, and tactical tab bar with status dots.

**Architecture:** Promote the AI screen's scoped `tacticalTheme.ts` to the app-wide theme, replacing the current dual light/dark iOS semantic color system. Build a 3-tier card component system (Briefing/Data/Surface). Add tactical headers with per-screen status indicators and a status-aware tab bar.

**Tech Stack:** React Native (Expo SDK 54), TypeScript, React Navigation, React Query, Redux Toolkit, expo-haptics

**Design Spec:** `docs/plans/2026-04-03-tactical-ui-redesign-design.md`

---

## Phase 1: Theme Foundation

### Task 1: Rewrite colors.ts to tactical-only palette

**Files:**
- Modify: `src/constants/colors.ts` (entire file rewrite)

**Step 1: Replace the Colors export with a single tactical palette**

The current file has `Colors.light` (lines 12-401) and `Colors.dark` (lines 403-625). Replace the entire file with a single dark tactical palette that maintains the same property shape so all existing `theme.colors.X` references still resolve.

```typescript
/**
 * Tactical Color System
 *
 * Single dark tactical palette for the entire app.
 * Inspired by the AI Assistant command center aesthetic.
 * No light mode — dark-only.
 */

export const Colors = {
  dark: {
    // ======================
    // Tactical Base Colors
    // ======================

    label: '#e8e8e0',
    secondaryLabel: '#a8a898',
    tertiaryLabel: '#8a887a',
    quaternaryLabel: 'rgba(90, 90, 80, 0.38)',

    // ======================
    // Tactical Backgrounds
    // ======================

    systemBackground: '#111210',
    secondarySystemBackground: '#1a1a14',
    tertiarySystemBackground: '#222218',
    systemGroupedBackground: '#111210',
    secondarySystemGroupedBackground: '#1a1a14',
    tertiarySystemGroupedBackground: '#222218',

    // ======================
    // Tactical Fill Colors
    // ======================

    systemFill: 'rgba(90, 90, 80, 0.36)',
    secondarySystemFill: 'rgba(90, 90, 80, 0.32)',
    tertiarySystemFill: 'rgba(90, 90, 80, 0.24)',
    quaternarySystemFill: 'rgba(90, 90, 80, 0.18)',

    // ======================
    // Tactical Semantic Colors
    // ======================

    systemBlue: '#fbbf24',    // Amber replaces blue as primary action color
    systemGreen: '#4ade80',   // Tactical green
    systemOrange: '#f59e0b',  // Tactical amber-orange
    systemRed: '#ef4444',     // Tactical red
    systemYellow: '#fbbf24',  // Tactical amber
    systemPurple: '#a78bfa',  // Muted purple for detection type
    systemPink: '#f472b6',    // Muted pink
    systemTeal: '#2dd4bf',    // Muted teal
    systemIndigo: '#818cf8',  // Muted indigo

    // ======================
    // Tactical Gray Scale
    // ======================

    systemGray: '#8a887a',
    systemGray2: '#48483e',
    systemGray3: '#3a3a30',
    systemGray4: '#2a2a1a',
    systemGray5: '#1a1a14',
    systemGray6: '#141410',

    // ======================
    // Tactical Separator Colors
    // ======================

    separator: '#2a2a1a',
    opaqueSeparator: '#2a2a1a',

    // ======================
    // Threat Levels
    // ======================

    threat: {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#fbbf24',
      low: '#4ade80',
    },

    // ======================
    // Detection Types
    // ======================

    detection: {
      cellular: '#a78bfa',
      wifi: '#60a5fa',
      bluetooth: '#2dd4bf',
      multiband: '#818cf8',
      multi: '#818cf8',
    },

    // ======================
    // Semantic Aliases
    // ======================

    primary: '#fbbf24',
    success: '#4ade80',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#60a5fa',

    // ======================
    // Brand Accent (now tactical amber)
    // ======================

    brandAccent: '#fbbf24',
    brandAccentLight: '#fcd34d',
    brandAccentDark: '#f59e0b',
    brandAccentBackground: 'rgba(251, 191, 36, 0.12)',
    brandAccentBorder: 'rgba(251, 191, 36, 0.35)',

    // ======================
    // Status Colors
    // ======================

    online: '#4ade80',
    offline: '#8a887a',

    battery: {
      full: '#4ade80',
      medium: '#f59e0b',
      low: '#ef4444',
    },

    // ======================
    // Threat Backgrounds (Card Tints)
    // ======================

    threatBackground: {
      critical: '#3a1a1a',
      criticalBorder: 'rgba(239, 68, 68, 0.40)',
      high: '#3a2a1a',
      highBorder: 'rgba(245, 158, 11, 0.35)',
      medium: '#2a2a1a',
      mediumBorder: 'rgba(251, 191, 36, 0.30)',
      low: '#1a2a1a',
      lowBorder: 'rgba(74, 222, 128, 0.25)',
    },

    // ======================
    // Device Status Backgrounds
    // ======================

    deviceStatusBackground: {
      online: 'rgba(74, 222, 128, 0.08)',
      offline: 'rgba(239, 68, 68, 0.10)',
    },

    // ======================
    // Gradient Presets
    // ======================

    gradients: {
      cardHeader: ['rgba(251, 191, 36, 0.06)', 'rgba(251, 191, 36, 0)'],
      statsBackground: ['#1a1a14', '#222218'],
      shimmer: [
        'rgba(251, 191, 36, 0)',
        'rgba(251, 191, 36, 0.08)',
        'rgba(251, 191, 36, 0)',
      ],
      onlineStatus: ['rgba(74, 222, 128, 0.15)', 'rgba(74, 222, 128, 0)'],
      offlineStatus: ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0)'],
    },

    // ======================
    // Backward Compatibility
    // ======================

    background: '#111210',
    surface: '#1a1a14',
    surfaceVariant: '#222218',

    text: {
      primary: '#e8e8e0',
      secondary: '#a8a898',
      disabled: '#8a887a',
      inverse: '#111210',
    },

    border: '#2a2a1a',
    divider: '#2a2a1a',
  },

  // Light mode points to the same dark palette (dark-only app)
  get light() {
    return this.dark;
  },
};

// ======================
// TypeScript Type Definitions
// ======================

export type ColorMode = 'light' | 'dark';
export type ColorPalette = typeof Colors.dark;
export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';
export type DetectionType = 'cellular' | 'wifi' | 'bluetooth' | 'multiband';
export type BatteryLevel = 'full' | 'medium' | 'low';

export const getColors = (mode: ColorMode = 'dark'): ColorPalette => {
  return Colors.dark;
};
```

**Step 2: Run type-check to verify all color references still resolve**

Run: `npm run type-check`
Expected: PASS — all `theme.colors.X` references still work because the property shape is identical.

**Step 3: Commit**

```bash
git add src/constants/colors.ts
git commit -m "refactor: replace dual color palette with tactical-only dark theme"
```

---

### Task 2: Add tactical typography tokens

**Files:**
- Modify: `src/constants/typography.ts`
- Modify: `src/constants/tacticalTheme.ts`

**Step 1: Add tactical text styles to typography.ts**

Add the following after the existing `TextStyles` object (after the closing `}`around line 423). These are the monospace tactical styles that will be used app-wide alongside the existing system font styles:

```typescript
// ======================
// Tactical Typography (Monospace)
// ======================

const monoFont = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

export const TacticalTextStyles = {
  /** Screen title: 15pt bold monospace */
  screenTitle: {
    fontFamily: monoFont,
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },

  /** Section/card header label: 10pt bold monospace */
  headerLabel: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },

  /** Briefing section label (ASSESSMENT, etc.) */
  sectionLabel: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },

  /** Large metric numbers */
  metric: {
    fontFamily: monoFont,
    fontSize: 20,
    fontWeight: '700' as const,
  },

  /** Metric captions below numbers */
  metricCaption: {
    fontFamily: monoFont,
    fontSize: 9,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },

  /** Data values (signal, MAC, coordinates) */
  dataValue: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: '400' as const,
  },

  /** Severity badge text */
  severityBadge: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },

  /** Device/sensor names in cards */
  deviceName: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: '400' as const,
  },

  /** Timestamps */
  timestamp: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: '400' as const,
  },

  /** Tab bar labels */
  tabLabel: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },

  /** Filter chip / quick action text */
  chipLabel: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: '400' as const,
    textTransform: 'uppercase' as const,
  },

  /** Status indicator label (READY, CRITICAL, etc.) */
  statusLabel: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
} as const;

export type TacticalTextStyleVariant = keyof typeof TacticalTextStyles;
```

Also add the `Platform` import at the top of the file if not present:
```typescript
import { Platform } from 'react-native';
```

And export `TacticalTextStyles` alongside `Typography`:
```typescript
export { TacticalTextStyles };
```

**Step 2: Update tacticalTheme.ts to import from typography.ts instead of defining its own**

Replace the typography section of `src/constants/tacticalTheme.ts` to re-export from the shared constants, so AI components can gradually migrate:

```typescript
import { Platform } from 'react-native';
import { TacticalTextStyles } from './typography';

/**
 * Tactical Theme — Now app-wide. Kept for backward compatibility
 * with existing AI components that import from here.
 */

const monoFont = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

export const tacticalColors = {
  background: '#111210',
  surface: '#1a1a14',
  surfaceDark: '#141410',
  border: '#2a2a1a',

  accentPrimary: '#fbbf24',
  accentSuccess: '#4ade80',
  accentDanger: '#ef4444',
  accentWarning: '#f59e0b',

  textPrimary: '#e8e8e0',
  textSecondary: '#a8a898',
  textTertiary: '#8a887a',

  userBubble: '#2a3a2a',
  userBubbleBorder: '#3a4a3a',

  severityCritical: '#3a1a1a',
  severityHigh: '#3a2a1a',
  severityMedium: '#1a2a3a',
  severityLow: '#1a2a1a',
} as const;

export const tacticalTypography = {
  mono: monoFont,
  ...TacticalTextStyles,
  // AI-specific styles not in the shared set
  body: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 17,
  },
  quickAction: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: '400' as const,
  },
  promptChar: {
    fontFamily: monoFont,
    fontSize: 14,
    fontWeight: '700' as const,
  },
} as const;

export const tacticalSpacing = {
  cardPadding: 10,
  cardRadius: 10,
  innerCardRadius: 6,
  messageGap: 14,
  sectionGap: 8,
} as const;
```

**Step 3: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add src/constants/typography.ts src/constants/tacticalTheme.ts
git commit -m "feat: add tactical typography tokens to shared constants"
```

---

### Task 3: Update spacing constants for card tiers

**Files:**
- Modify: `src/constants/spacing.ts`

**Step 1: Add card tier spacing to the Layout object**

Add the following to the `Layout` object (after existing card layout constants around line 150):

```typescript
    // ======================
    // Tactical Card Tier Spacing
    // ======================

    /** Tier 1 - Briefing cards (primary security content) */
    briefingCardPadding: 10,
    briefingCardRadius: 10,

    /** Tier 2 - Data cards (list items, secondary content) */
    dataCardPadding: 10,
    dataCardRadius: 10,

    /** Tier 3 - Surface cards (settings, configuration) */
    surfaceCardPadding: 16,
    surfaceCardRadius: 10,

    /** Inner card radius for nested elements */
    innerCardRadius: 6,

    /** Accent bar width for briefing card headers */
    accentBarWidth: 3,

    /** Severity border width for data cards */
    severityBorderWidth: 2,
```

**Step 2: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/constants/spacing.ts
git commit -m "feat: add card tier spacing constants"
```

---

### Task 4: Simplify theme provider to dark-only

**Files:**
- Modify: `src/theme/provider.tsx`
- Modify: `src/theme/types.ts`
- Delete: `src/theme/light.ts`
- Modify: `src/theme/themes.ts`
- Modify: `src/theme/index.ts`

**Step 1: Rewrite theme/types.ts**

```typescript
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants/index';
import { TacticalTextStyles } from '@constants/typography';

export type ColorScheme = 'dark';

export interface Theme {
  colors: typeof Colors.dark;
  typography: typeof Typography;
  tacticalTypography: typeof TacticalTextStyles;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  shadows: typeof Shadows;
  colorScheme: ColorScheme;
}
```

**Step 2: Rewrite theme/dark.ts**

```typescript
import { Theme } from './types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants/index';
import { TacticalTextStyles } from '@constants/typography';

export const darkTheme: Theme = {
  colors: Colors.dark,
  typography: Typography,
  tacticalTypography: TacticalTextStyles,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  colorScheme: 'dark',
};
```

**Step 3: Delete light.ts and update themes.ts**

Delete `src/theme/light.ts`.

Rewrite `src/theme/themes.ts`:
```typescript
export { darkTheme } from './dark';
// Light theme removed — app is dark-only
export { darkTheme as lightTheme } from './dark';
```

Note: We keep the `lightTheme` alias to avoid breaking imports that reference it. It just points to darkTheme.

**Step 4: Simplify provider.tsx**

```typescript
import React, { createContext, useContext } from 'react';
import { Theme, ColorScheme } from './types';
import { darkTheme } from './dark';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  /** @deprecated Dark-only app. No-op. Kept for API compat. */
  setColorScheme: (scheme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const theme = darkTheme;

  const setColorScheme = () => {
    // No-op: dark-only app
  };

  return (
    <ThemeContext.Provider
      value={{ theme, colorScheme: 'dark', setColorScheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export * from './types';
export { darkTheme };
// Keep lightTheme export for compatibility
export { darkTheme as lightTheme } from './dark';
```

**Step 5: Update theme/index.ts**

```typescript
export * from './provider';
export * from './types';
export { darkTheme, lightTheme } from './themes';
```

**Step 6: Run type-check**

Run: `npm run type-check`
Expected: May have errors related to `tacticalTypography` not being used yet. Fix any import issues.

**Step 7: Run tests**

Run: `npm test -- --passWithNoTests 2>&1 | tail -20`
Expected: Tests pass (theme shape hasn't changed enough to break)

**Step 8: Commit**

```bash
git add src/theme/ src/constants/
git commit -m "refactor: simplify theme to dark-only with tactical typography"
```

---

### Task 5: Remove ThemeScreen, theme toggle, and theme routes

**Files:**
- Delete: `src/screens/settings/ThemeScreen.tsx`
- Modify: `src/screens/settings/SettingsScreen.tsx`
- Modify: `src/screens/settings/index.ts` (remove ThemeScreen export)
- Modify: `src/navigation/stacks/MoreStack.tsx` (remove Theme route)
- Modify: `src/navigation/stacks/SettingsStack.tsx` (remove Theme route)
- Modify: `src/navigation/types.ts` (remove Theme from param lists if present)

**Step 1: Delete ThemeScreen.tsx**

Delete `src/screens/settings/ThemeScreen.tsx` entirely. This screen models `'light' | 'dark' | 'auto'` options which conflict with the new `ColorScheme = 'dark'` type.

**Step 2: Remove ThemeScreen export from settings index**

In `src/screens/settings/index.ts`, remove the line:
```typescript
export { ThemeScreen } from './ThemeScreen';
```

**Step 3: Remove Theme route from MoreStack**

In `src/navigation/stacks/MoreStack.tsx`:
- Remove `ThemeScreen` from the imports (line 16)
- Remove `<Stack.Screen name="Theme" component={ThemeScreen} />` (line 46)

**Step 4: Remove Theme route from SettingsStack**

In `src/navigation/stacks/SettingsStack.tsx`:
- Remove `ThemeScreen` from the imports (line 9)
- Remove `<Stack.Screen name="Theme" component={ThemeScreen} />` (line 35)

**Step 5: Remove the Appearance section from SettingsScreen**

In `src/screens/settings/SettingsScreen.tsx`:
- Find the GroupedListSection with label "APPEARANCE" (or "Appearance") that contains the Theme toggle row and remove the entire section (around lines 230-250)
- Remove the `themePreference` state and `loadThemePreference` effect (around lines 47-64)
- Remove the `AsyncStorage` import if no longer needed by other code in this file

**Step 6: Remove Theme from navigation param list types**

In `src/navigation/types.ts`, remove `Theme: undefined;` from both `MoreStackParamList` and `SettingsStackParamList` if present.

**Step 7: Run type-check**

Run: `npm run type-check`
Expected: PASS — no more references to the deleted ThemeScreen or its light/dark/auto model

**Step 8: Commit**

```bash
git add -u src/screens/settings/ThemeScreen.tsx
git add src/screens/settings/SettingsScreen.tsx src/screens/settings/index.ts src/navigation/stacks/MoreStack.tsx src/navigation/stacks/SettingsStack.tsx src/navigation/types.ts
git commit -m "refactor: remove ThemeScreen and theme routes (dark-only app)"
```

---

## Phase 2: Shared Components

### Task 6: Add tier system to Card component

**Files:**
- Modify: `src/components/molecules/Card/Card.tsx`

**Step 1: Write the failing test**

Create `__tests__/components/molecules/Card.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { Card } from '@components/molecules/Card/Card';
import { Text } from 'react-native';

// Mock theme
jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        surface: '#1a1a14',
        secondarySystemGroupedBackground: '#1a1a14',
        systemBackground: '#111210',
        systemBlue: '#fbbf24',
        separator: '#2a2a1a',
        accentPrimary: '#fbbf24',
        label: '#e8e8e0',
      },
      shadows: { sm: {} },
    },
    colorScheme: 'dark',
  }),
}));

describe('Card tiers', () => {
  it('renders briefing tier with accent bar', () => {
    const { getByTestId } = render(
      <Card tier="briefing" headerLabel="SITUATION REPORT" testID="card">
        <Text>Content</Text>
      </Card>
    );
    expect(getByTestId('card')).toBeTruthy();
    expect(getByTestId('card-accent-bar')).toBeTruthy();
    expect(getByTestId('card-header-label')).toBeTruthy();
  });

  it('renders data tier without accent bar', () => {
    const { getByTestId, queryByTestId } = render(
      <Card tier="data" testID="card">
        <Text>Content</Text>
      </Card>
    );
    expect(getByTestId('card')).toBeTruthy();
    expect(queryByTestId('card-accent-bar')).toBeNull();
  });

  it('renders surface tier with subtle background', () => {
    const { getByTestId } = render(
      <Card tier="surface" testID="card">
        <Text>Content</Text>
      </Card>
    );
    expect(getByTestId('card')).toBeTruthy();
  });

  it('supports severity border on data tier', () => {
    const { getByTestId } = render(
      <Card tier="data" severity="critical" testID="card">
        <Text>Content</Text>
      </Card>
    );
    expect(getByTestId('card-severity-border')).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/components/molecules/Card.test.tsx -v`
Expected: FAIL — `tier` prop doesn't exist yet

**Step 3: Implement the tiered Card component**

Replace `src/components/molecules/Card/Card.tsx`:

```typescript
import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@hooks/useTheme';
import { Text } from '@components/atoms/Text';
import { ThreatLevel } from '@constants/colors';

export type CardTier = 'briefing' | 'data' | 'surface';

interface CardProps {
  children: React.ReactNode;
  /** Card visual tier. Default behavior if omitted for backward compat. */
  tier?: CardTier;
  /** @deprecated Use tier instead */
  variant?: 'default' | 'grouped';
  /** Header label for briefing tier (monospace uppercase) */
  headerLabel?: string;
  /** Severity-colored left border for data tier */
  severity?: ThreatLevel;
  onPress?: () => void;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const SEVERITY_COLORS: Record<ThreatLevel, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#fbbf24',
  low: '#4ade80',
};

export const Card: React.FC<CardProps> = ({
  children,
  tier,
  variant = 'default',
  headerLabel,
  severity,
  onPress,
  loading = false,
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  const getCardStyle = (): ViewStyle => {
    if (tier === 'briefing') {
      return {
        backgroundColor: colors.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.separator,
        overflow: 'hidden',
      };
    }
    if (tier === 'data') {
      return {
        backgroundColor: colors.surface,
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: colors.separator,
      };
    }
    if (tier === 'surface') {
      return {
        backgroundColor: colors.systemGray6 || '#141410',
        borderRadius: 10,
        padding: 16,
      };
    }
    // Legacy default/grouped
    return {
      backgroundColor:
        variant === 'grouped'
          ? colors.secondarySystemGroupedBackground
          : colors.surface,
      borderRadius: 12,
      padding: 16,
    };
  };

  const cardStyle = getCardStyle();

  const handlePress = async () => {
    if (!onPress) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  if (loading) {
    return (
      <View
        style={[cardStyle, styles.loadingContainer, style]}
        testID={testID}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const renderContent = () => (
    <>
      {tier === 'briefing' && headerLabel && (
        <View style={styles.briefingHeader} testID="card-header-container">
          <View
            style={styles.accentBar}
            testID={testID ? `${testID}-accent-bar` : 'card-accent-bar'}
          />
          <Text
            style={[
              styles.headerLabelText,
              { color: colors.primary },
            ]}
            testID={testID ? `${testID}-header-label` : 'card-header-label'}
          >
            {headerLabel}
          </Text>
        </View>
      )}
      {tier === 'data' && severity && (
        <View
          style={[
            styles.severityBorder,
            { backgroundColor: SEVERITY_COLORS[severity] },
          ]}
          testID={
            testID ? `${testID}-severity-border` : 'card-severity-border'
          }
        />
      )}
      <View
        style={
          tier === 'briefing'
            ? styles.briefingBody
            : tier === 'data' && severity
              ? styles.dataBodyWithSeverity
              : undefined
        }
      >
        {children}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          cardStyle,
          pressed && { opacity: 0.7 },
          style,
        ]}
        testID={testID}
        accessibilityRole="button"
      >
        {renderContent()}
      </Pressable>
    );
  }

  return (
    <View style={[cardStyle, style]} testID={testID}>
      {renderContent()}
    </View>
  );
};

const MONO_FONT =
  require('react-native').Platform.OS === 'ios' ? 'Menlo' : 'monospace';

const styles = StyleSheet.create({
  loadingContainer: {
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  briefingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141410',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a1a',
  },
  accentBar: {
    width: 3,
    height: 14,
    backgroundColor: '#fbbf24',
    borderRadius: 1,
    marginRight: 8,
  },
  headerLabelText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  briefingBody: {
    padding: 10,
  },
  severityBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  dataBodyWithSeverity: {
    paddingLeft: 6,
  },
});
```

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/components/molecules/Card.test.tsx -v`
Expected: PASS

**Step 5: Run full type-check**

Run: `npm run type-check`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/molecules/Card/Card.tsx __tests__/components/molecules/Card.test.tsx
git commit -m "feat: add tier system to Card component (briefing/data/surface)"
```

---

### Task 7: Create TacticalHeader component

**Files:**
- Create: `src/components/organisms/TacticalHeader/TacticalHeader.tsx`
- Create: `src/components/organisms/TacticalHeader/index.ts`
- Modify: `src/components/organisms/index.ts` (add export)

**Step 1: Write the component**

Create `src/components/organisms/TacticalHeader/TacticalHeader.tsx`:

```typescript
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text } from '@components/atoms/Text';
import { useTheme } from '@hooks/useTheme';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'neutral';

interface TacticalHeaderProps {
  title: string;
  statusLabel?: string;
  statusVariant?: StatusVariant;
  rightAction?: React.ReactNode;
}

const STATUS_COLORS: Record<StatusVariant, string> = {
  success: '#4ade80',
  warning: '#f59e0b',
  danger: '#ef4444',
  neutral: '#8a887a',
};

const MONO_FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

export const TacticalHeader: React.FC<TacticalHeaderProps> = ({
  title,
  statusLabel,
  statusVariant = 'neutral',
  rightAction,
}) => {
  const { theme } = useTheme();
  const statusColor = STATUS_COLORS[statusVariant];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.label }]}>
        {title}
      </Text>
      <View style={styles.rightSection}>
        {statusLabel && (
          <View style={styles.statusContainer}>
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        )}
        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  title: {
    fontFamily: MONO_FONT,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
```

Create `src/components/organisms/TacticalHeader/index.ts`:
```typescript
export { TacticalHeader } from './TacticalHeader';
export type { StatusVariant } from './TacticalHeader';
```

**Step 2: Add export to organisms/index.ts**

Add to `src/components/organisms/index.ts`:
```typescript
export * from './TacticalHeader';
```

**Step 3: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/organisms/TacticalHeader/ src/components/organisms/index.ts
git commit -m "feat: create TacticalHeader component with status indicators"
```

---

### Task 8: Restyle tab bar with tactical treatment

**Files:**
- Modify: `src/navigation/MainNavigator.tsx`

**Context:** Status data for tab dots must use the correct hooks:
- **Alert counts:** `useAlerts()` from `@hooks/api/useAlerts` returns `{ data: Alert[] }`. Filter by `threatLevel` and `!isReviewed` for critical count.
- **Device offline count:** `useDevices()` from `@hooks/api/useDevices` returns `{ data: Device[] }`. The `Device` type has `online: boolean` field, BUT screens also use `isDeviceOnline(device.lastSeen)` from `@utils/dateUtils`. Use `isDeviceOnline(d.lastSeen)` for consistency with the rest of the app.
- **Do NOT use `useAlertSummary`** — that hook takes a single `Alert` and generates an LLM summary. It is not an aggregate count hook.
- Hooks must be called unconditionally (Rules of Hooks). Use small wrapper components for each tab icon that calls the hook internally.

**Step 1: Rewrite MainNavigator.tsx**

```typescript
import React from 'react';
import { View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { useAlerts } from '@hooks/api/useAlerts';
import { useDevices } from '@hooks/api/useDevices';
import { isDeviceOnline } from '@utils/dateUtils';
import { MainTabParamList } from './types';
import HomeStack from './stacks/HomeStack';
import AlertsStack from './stacks/AlertsStack';
import AIStack from './stacks/AIStack';
import RadarStack from './stacks/RadarStack';
import DevicesStack from './stacks/DevicesStack';
import MoreStack from './stacks/MoreStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MONO_FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

const StatusDot = ({ color }: { color: string }) => (
  <View
    style={{
      position: 'absolute',
      top: 2,
      right: -4,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: color,
    }}
  />
);

/** Wrapper component so useAlerts is called unconditionally (Rules of Hooks) */
const AlertsTabIcon = ({ color }: { color: string }) => {
  const { data: alerts } = useAlerts();
  const criticalCount =
    alerts?.filter(
      (a) => !a.isReviewed && (a.threatLevel === 'critical' || a.threatLevel === 'high')
    ).length ?? 0;

  return (
    <View>
      <Icon name="alert-circle" color={color} size="base" />
      {criticalCount > 0 && <StatusDot color="#ef4444" />}
    </View>
  );
};

/** Wrapper component so useDevices is called unconditionally (Rules of Hooks) */
const DevicesTabIcon = ({ color }: { color: string }) => {
  const { data: devices } = useDevices();
  const offlineCount =
    devices?.filter((d) => !isDeviceOnline(d.lastSeen)).length ?? 0;

  return (
    <View>
      <Icon name="hardware-chip" color={color} size="base" />
      {offlineCount > 0 && <StatusDot color="#f59e0b" />}
    </View>
  );
};

const SimpleTabIcon = ({ name, color }: { name: string; color: string }) => (
  <View>
    <Icon name={name} color={color} size="base" />
  </View>
);

export const MainNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#fbbf24',
        tabBarInactiveTintColor: '#8a887a',
        tabBarLabelStyle: {
          fontFamily: MONO_FONT,
          fontSize: 10,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        tabBarStyle: {
          backgroundColor: '#1a1a14',
          borderTopColor: '#2a2a1a',
          borderTopWidth: 1,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <SimpleTabIcon name="home-outline" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AlertsTab"
        component={AlertsStack}
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <AlertsTabIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="AITab"
        component={AIStack}
        options={{
          title: 'AI',
          tabBarIcon: ({ color }) => (
            <SimpleTabIcon name="sparkles-outline" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RadarTab"
        component={RadarStack}
        options={{
          title: 'Radar',
          tabBarIcon: ({ color }) => (
            <SimpleTabIcon name="radio-outline" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DevicesTab"
        component={DevicesStack}
        options={{
          title: 'Devices',
          tabBarIcon: ({ color }) => <DevicesTabIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreStack}
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => (
            <SimpleTabIcon name="settings-outline" color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
```

**Step 2: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/navigation/MainNavigator.tsx
git commit -m "feat: restyle tab bar with tactical theme and status dots"
```

---

### Task 9: Update Text component with tactical variant

**Files:**
- Modify: `src/components/atoms/Text/Text.tsx`

**Step 1: Add 'tactical' as a TextVariant option**

Add a new prop `tactical` (boolean) that applies monospace + uppercase + letter-spacing:

In the `TextProps` interface, add:
```typescript
  /** Apply tactical monospace styling (uppercase, letter-spacing) */
  tactical?: boolean;
```

In the component's style computation, add after the existing weight/align logic:
```typescript
  const tacticalStyle = tactical
    ? {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
      }
    : {};
```

Add `Platform` to the react-native import if not present.

Apply it in the style array:
```typescript
  <RNText
    style={[baseStyle, colorStyle, weightStyle, alignStyle, tacticalStyle, style]}
    ...
  >
```

**Step 2: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/atoms/Text/Text.tsx
git commit -m "feat: add tactical prop to Text component"
```

---

### Task 10: Update Button component with tactical styling

**Files:**
- Modify: `src/components/atoms/Button/Button.tsx`

**Step 1: Update the filled button style**

In the `getBackgroundColor` function, change the default filled color from `systemBlue` to `primary` (which is now `#fbbf24`):

Find: `colors.systemBlue` in the filled background case
Replace with: `colors.primary`

In `getTextColor`, for the filled+default case, change the text from white to dark:
Find the white text return for filled buttons
Replace with: `'#111210'` (dark text on amber background)

Update the button text to use monospace for the label when `buttonStyle === 'filled'` or `'tinted'`:
Add to the text style: `fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'` and `textTransform: 'uppercase'` and `letterSpacing: 0.5`.

**Step 2: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/atoms/Button/Button.tsx
git commit -m "feat: update Button to tactical amber styling"
```

---

### Task 11: Update Input component with tactical styling

**Files:**
- Modify: `src/components/atoms/Input/Input.tsx`

**Step 1: Update input styling**

Key changes:
- Border color: Change from gray to `#2a2a1a` (tactical border)
- Focus border color: Change from blue/systemBlue to `#fbbf24` (amber)
- Background: Change from secondary system background to `#1a1a14` (surface)
- Label text: Apply monospace, uppercase, letter-spacing
- Focus glow: Change from blue glow to amber glow `rgba(251, 191, 36, 0.15)`

Find the border color logic (focused/error states) and update:
- Normal border: `#2a2a1a`
- Focused border: `#fbbf24`
- Error border: `#ef4444` (stays red)
- Background: `#1a1a14`
- Disabled background: `#141410`

Find the label style and add monospace:
```typescript
fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
textTransform: 'uppercase',
letterSpacing: 0.5,
fontSize: 10,
```

**Step 2: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/atoms/Input/Input.tsx
git commit -m "feat: update Input to tactical styling with amber focus"
```

---

### Task 12: Update Badge component with tactical styling

**Files:**
- Modify: `src/components/atoms/Badge/Badge.tsx`

**Step 1: Update badge to use monospace + tactical colors**

Key changes:
- Font: Change to monospace
- Text transform: uppercase
- Letter spacing: +1pt
- Threat colors: Map to tactical palette (`#ef4444`, `#f59e0b`, `#fbbf24`, `#4ade80`)
- Background colors: Use tactical severity backgrounds (`#3a1a1a`, `#3a2a1a`, etc.)

Update the color mapping function to use tactical colors:
```typescript
const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: '#3a1a1a', text: '#f87171' },
  high: { bg: '#3a2a1a', text: '#fbbf24' },
  medium: { bg: '#2a2a1a', text: '#fcd34d' },
  low: { bg: '#1a2a1a', text: '#86efac' },
  // ... other variants
};
```

Add monospace to the text style:
```typescript
fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
textTransform: 'uppercase',
letterSpacing: 1,
```

**Step 2: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/atoms/Badge/Badge.tsx
git commit -m "feat: update Badge to tactical monospace styling"
```

---

### Task 13: Update SearchBar, FilterChip, TabSegment

**Files:**
- Modify: `src/components/molecules/SearchBar/SearchBar.tsx`
- Modify: `src/components/molecules/FilterChip/FilterChip.tsx`
- Modify: `src/components/molecules/TabSegment/TabSegment.tsx`

**Step 1: Update SearchBar**

Key changes:
- Background: `#1a1a14` (surface)
- Border: Add 1px `#2a2a1a`
- Placeholder text: monospace, "SEARCH..." uppercase
- Input text: keep system font for readability
- Icon color: `#8a887a` (tertiary)
- Focus state: amber border `#fbbf24`

**Step 2: Update FilterChip**

Key changes:
- Background: transparent
- Border: 1px `#2a2a1a`
- Border radius: 8
- Text: monospace, uppercase, `#8a887a` inactive, `#fbbf24` active
- Selected state: `rgba(251, 191, 36, 0.12)` background, `#fbbf24` border
- Dot indicator: keep existing color prop

**Step 3: Update TabSegment**

Key changes:
- Container background: `#1a1a14` (surface)
- Container border: 1px `#2a2a1a`
- Active tab: `#fbbf24` background fill
- Active text: `#111210` dark text, monospace, uppercase
- Inactive text: `#8a887a`, monospace, uppercase

**Step 4: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/molecules/SearchBar/ src/components/molecules/FilterChip/ src/components/molecules/TabSegment/
git commit -m "feat: update SearchBar, FilterChip, TabSegment to tactical styling"
```

---

## Phase 3: Screen Rollout

### Task 14: Redesign Home screen

**Files:**
- Modify: `src/screens/home/PropertyCommandCenter.tsx`

**Step 1: Replace header with TacticalHeader**

Import `TacticalHeader` and replace the "My Property" large title with:
```typescript
<TacticalHeader
  title="HOME"
  statusLabel={overallStatus}
  statusVariant={statusVariant}
/>
```

The screen already uses `usePropertyStatus()` from `@hooks/usePropertyStatus` which computes `level: 'clear' | 'warning' | 'critical'` based on alert severity, offline devices, AND stale data. Use it directly — do NOT recompute from alert counts alone:

```typescript
import { usePropertyStatus } from '@hooks/usePropertyStatus';

// Inside component:
const propertyStatus = usePropertyStatus();

// Map usePropertyStatus levels to TacticalHeader variants
const STATUS_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  critical: { label: 'CRITICAL', variant: 'danger' },
  warning: { label: 'ELEVATED', variant: 'warning' },
  clear: { label: 'SECURE', variant: 'success' },
};
const { label: statusLabel, variant: statusVariant } =
  STATUS_MAP[propertyStatus.level] ?? STATUS_MAP.clear;
```

This preserves all existing warning states: critical/high alerts, medium/low alerts, offline devices, and stale telemetry data.

**Step 2: Wrap sections in Briefing and Data cards**

- Status summary → `<Card tier="briefing" headerLabel="SITUATION OVERVIEW">` with metric numbers in monospace
- Map section → `<Card tier="data">` with monospace "PROPERTY MAP" label
- Recent alerts → `<Card tier="briefing" headerLabel="RECENT ACTIVITY">` containing Data card rows
- Remove hard-coded status colors and use theme colors

**Step 3: Update StyleSheet**

- Background: Remove any explicit background colors (ScreenLayout handles it)
- Card margins: Use 10-12pt gaps
- Metric numbers: Apply `TacticalTextStyles.metric`
- Labels: Apply `TacticalTextStyles.headerLabel`

**Step 4: Run type-check and test**

Run: `npm run type-check && npm test -- --passWithNoTests 2>&1 | tail -20`
Expected: PASS

**Step 5: Commit**

```bash
git add src/screens/home/
git commit -m "feat: redesign Home screen with tactical command center layout"
```

---

### Task 15: Redesign Alerts list screen

**Files:**
- Modify: `src/screens/alerts/AlertListScreen.tsx`
- Modify: `src/components/organisms/HeaderHero/AlertsHeaderHero.tsx`
- Modify: `src/components/organisms/AlertCard/AlertCard.tsx`

**Step 1: Replace header with TacticalHeader**

```typescript
<TacticalHeader
  title="ALERTS"
  statusLabel={criticalCount > 0 ? `${criticalCount} CRITICAL` : 'ALL CLEAR'}
  statusVariant={criticalCount > 0 ? 'danger' : 'success'}
  rightAction={filterButton}
/>
```

**Step 2: Update AlertsHeaderHero filter chips**

Update the InlineFilterBar/FilterChip styling to use tactical chips (already done in Task 13, verify they render correctly).

**Step 3: Update AlertCard to tactical Data card style**

Key changes to AlertCard:
- Remove iOS card radius (16px → 10px)
- Background: `#1a1a14` (surface)
- Border: 1px `#2a2a1a`
- Keep severity-colored left accent (3px)
- Detection type text: monospace
- Timestamp: monospace, `#8a887a`
- Description: system font (readable)
- Remove shadows, use borders

**Step 4: Update search bar styling**

The SearchBar component was already updated in Task 13. Verify the placeholder reads "SEARCH ALERTS..." and uses monospace.

**Step 5: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 6: Commit**

```bash
git add src/screens/alerts/ src/components/organisms/AlertCard/ src/components/organisms/HeaderHero/AlertsHeaderHero.tsx
git commit -m "feat: redesign Alerts screen with tactical styling"
```

---

### Task 16: Redesign Alert detail screen

**Files:**
- Modify: `src/screens/alerts/AlertDetailScreen.tsx`

**Step 1: Apply Briefing card to main content**

Wrap the main alert details in `<Card tier="briefing" headerLabel="ALERT BRIEFING">`. Nest data sections as Data cards within.

**Step 2: Update TabSegment usage**

The TabSegment was already updated in Task 13 (amber active, monospace). Verify it renders correctly.

**Step 3: Update GroupedListSection labels to monospace uppercase**

Apply monospace styling to section headers. These are used in the Signal, Location, and History tabs.

**Step 4: Update FloatingActionBar**

Change the "Mark Reviewed" button to amber filled style.

**Step 5: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 6: Commit**

```bash
git add src/screens/alerts/AlertDetailScreen.tsx
git commit -m "feat: redesign Alert detail screen with briefing card layout"
```

---

### Task 17: Redesign Devices list screen

**Files:**
- Modify: `src/screens/devices/DeviceListScreen.tsx`
- Modify: `src/components/organisms/DeviceCard/DeviceCard.tsx`
- Modify: `src/components/organisms/HeaderHero/DevicesHeaderHero.tsx`

**Step 1: Replace header with TacticalHeader**

```typescript
<TacticalHeader
  title="DEVICES"
  statusLabel={`${onlineCount}/${totalCount} ONLINE`}
  statusVariant={offlineCount > 0 ? 'warning' : 'success'}
  rightAction={addButton}
/>
```

Style the Add button as amber-bordered tactical button.

**Step 2: Update DevicesHeaderHero as Briefing card**

Replace the simple status card with a Briefing card:
```typescript
<Card tier="briefing" headerLabel="FLEET STATUS">
  {/* Offline warning if any */}
  {/* Metric row: Total / Online / Offline */}
</Card>
```

**Step 3: Update DeviceCard to tactical Data card style**

Key changes:
- Background: `#1a1a14`
- Border: 1px `#2a2a1a`, radius 10
- Status-colored left border (green/red, 2px)
- Device name: monospace, 11pt
- Metrics (Signal, Detections, Temp): monospace data values
- Status text: monospace, uppercase
- Remove 16px card radius → 10px
- Remove shadows

**Step 4: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 5: Commit**

```bash
git add src/screens/devices/ src/components/organisms/DeviceCard/ src/components/organisms/HeaderHero/DevicesHeaderHero.tsx
git commit -m "feat: redesign Devices screen with tactical styling"
```

---

### Task 18: Redesign Device detail screen

**Files:**
- Modify: `src/screens/devices/DeviceDetailScreen.tsx`

**Step 1: Apply tactical styling**

- Wrap main content in Briefing card where appropriate
- Use Data cards for grouped info sections
- Update TabSegment (already styled in Task 13)
- Monospace for device name, coordinates, signal values
- System font for descriptions
- Update FloatingActionBar to amber

**Step 2: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/screens/devices/DeviceDetailScreen.tsx
git commit -m "feat: redesign Device detail screen with tactical layout"
```

---

### Task 19: Redesign Radar screen

**Files:**
- Modify: `src/screens/radar/ProximityHeatmapScreen.tsx`

**Step 1: Replace header with TacticalHeader**

```typescript
<TacticalHeader
  title="RADAR"
  statusLabel={activeCount > 0 ? `${activeCount} ACTIVE` : 'SCANNING'}
  statusVariant={activeCount > 0 ? 'success' : 'warning'}
/>
```

**Step 2: Wrap map in Data card**

Wrap the Mapbox MapView in a bordered Data card container.

**Step 3: Update segmented control**

The TabSegment component was updated in Task 13. The "Live Map" / "Replay" toggle should use it. If it uses a custom segmented control, update it to match: `#1a1a14` background, `#2a2a1a` border, amber active.

**Step 4: Style detection list as Data cards**

Update PositionListItem and detected device rows to use Data card styling.

**Step 5: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 6: Commit**

```bash
git add src/screens/radar/
git commit -m "feat: redesign Radar screen with tactical styling"
```

---

### Task 20: Redesign Settings and More screens

**Files:**
- Modify: `src/screens/settings/SettingsScreen.tsx`
- Modify: `src/screens/more/MoreMenuScreen.tsx`
- Modify: `src/components/molecules/GroupedListSection/GroupedListSection.tsx` (if exists)
- Modify: `src/components/molecules/GroupedListRow/GroupedListRow.tsx` (if exists)

**Step 1: Add TacticalHeader to Settings**

```typescript
<TacticalHeader title="SETTINGS" />
```

No status indicator for utility screens.

**Step 2: Update GroupedListSection labels**

Change section header labels to monospace uppercase styling:
```typescript
fontFamily: MONO_FONT,
fontSize: 10,
fontWeight: '700',
letterSpacing: 1,
textTransform: 'uppercase',
color: '#a8a898', // textSecondary
```

**Step 3: Update GroupedListRow to Surface card style**

- Background: `#141410` (surfaceDark)
- Remove rounded corners per-row (keep grouped radius on section container)
- Setting values (right side): monospace, `#a8a898`
- Setting descriptions: system font, smaller
- Separator color: `#2a2a1a`

**Step 4: Update profile card**

- Remove gradient avatar background — replace with amber tinted background
- Name: monospace, `#e8e8e0`
- Email: system font, `#a8a898`

**Step 5: Update logout button**

- Red bordered tactical button style

**Step 6: Add TacticalHeader to More screen**

```typescript
<TacticalHeader title="MORE" />
```

**Step 7: Update More menu items to Surface cards**

Apply Surface card (Tier 3) styling to Analytics and Settings rows.

**Step 8: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 9: Commit**

```bash
git add src/screens/settings/ src/screens/more/ src/components/molecules/GroupedListSection/ src/components/molecules/GroupedListRow/
git commit -m "feat: redesign Settings and More screens with tactical styling"
```

---

### Task 21: Redesign Auth screens (Login, Register, ForgotPassword)

**Files:**
- Modify: `src/screens/auth/LoginScreen.tsx`
- Modify: `src/screens/auth/RegisterScreen.tsx`
- Modify: `src/screens/auth/ForgotPasswordScreen.tsx`

**Step 1: Update LoginScreen color palette**

- Background gradient: Use darker tactical shades — `#0a0b0a` to `#111210`
- Orb colors: Amber-tinted `rgba(251, 191, 36, 0.08)` instead of olive
- Logo glow: Amber tint `rgba(251, 191, 36, 0.15)`

**Step 2: Update LoginScreen typography**

- "Welcome Back" → monospace, uppercase: "WELCOME BACK", 22pt bold, +2pt letter-spacing
- Subtitle: System font, `#a8a898`

**Step 3: Update LoginScreen form card**

- Background: `#1a1a14` (surface)
- Border: 1px `#2a2a1a`
- Border radius: 16 (slightly softer than tactical 10 for the cinematic entry feel)

**Step 4: Update LoginScreen input fields**

- Already updated globally in Task 11
- Labels above inputs: "EMAIL ADDRESS", "PASSWORD" — monospace uppercase
- Focus state: amber border

**Step 5: Update LoginScreen buttons**

- "Sign In" button: `#fbbf24` amber background, `#111210` dark text, monospace uppercase, no gradient
- "Explore Demo" button: Transparent background, 1px `#fbbf24` border, `#fbbf24` text, monospace uppercase

**Step 6: Remove gradient imports if no longer needed**

If LinearGradient was only used for button gradient, remove it.

**Step 7: Update RegisterScreen**

Apply the same cinematic tactical styling as LoginScreen:
- Same dark background with amber orbs
- Monospace uppercase title "CREATE ACCOUNT" (22pt bold, +2pt letter-spacing)
- System font subtitle
- `surface` background form card with `border` outline
- Monospace uppercase input labels
- Amber focus borders on inputs
- Amber "Sign Up" button, amber-bordered secondary actions

**Step 8: Update ForgotPasswordScreen**

Apply the same cinematic tactical styling:
- Same dark background
- Monospace uppercase title "RESET PASSWORD"
- System font instructions/subtitle
- Amber submit button, amber-bordered cancel/back button

**Step 9: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 10: Commit**

```bash
git add src/screens/auth/
git commit -m "feat: redesign all auth screens with cinematic tactical entry"
```

---

### Task 22: Redesign Analytics screens and Settings sub-screens

**Files:**
- Modify: `src/screens/analytics/DashboardScreen.tsx`
- Modify: `src/screens/analytics/HeatmapScreen.tsx`
- Modify: `src/screens/analytics/ReportsScreen.tsx`
- Modify: `src/screens/fingerprint/DeviceFingerprintScreen.tsx`
- Modify: All settings sub-screens in `src/screens/settings/` (ProfileScreen, KnownDevicesScreen, NotificationSettingsScreen, AlertSoundScreen, BiometricScreen, SecurityScreen, SensitivityScreen, QuietHoursScreen, VacationModeScreen, AddKnownDeviceScreen)

**Step 1: Update Analytics screens**

For each analytics screen (Dashboard, Heatmap, Reports):
- Add TacticalHeader with screen name (e.g., `ANALYTICS`, `HEATMAP`, `REPORTS`)
- Wrap data sections in Briefing cards with monospace headers
- Apply tactical color scheme to charts/graphs (amber/green/red data colors on dark backgrounds)
- Use Data cards for data tables/rows
- Monospace for data values and timestamps

**Step 2: Update Settings sub-screens**

For all settings sub-screens:
- Add TacticalHeader with screen name (e.g., `PROFILE`, `KNOWN DEVICES`, `NOTIFICATIONS`)
- Use Surface cards (Tier 3) for settings rows
- Monospace section labels in `textSecondary` (#a8a898)
- System font for descriptions
- Amber interactive elements (toggles, buttons, active states)
- Amber focus borders on inputs

**Step 3: Update DeviceFingerprintScreen**

- Add TacticalHeader: `DEVICE FINGERPRINT`
- Use Briefing cards for fingerprint data sections
- Monospace for technical data (MACs, signal values)

**Step 4: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 5: Commit**

```bash
git add src/screens/analytics/ src/screens/fingerprint/ src/screens/settings/
git commit -m "feat: redesign analytics, fingerprint, and settings sub-screens with tactical styling"
```

---

## Phase 4: Polish

### Task 23: Add pulse animation and AI tab dot to tab bar

**Files:**
- Modify: `src/navigation/MainNavigator.tsx`

**Context:** Task 8 already wired `AlertsTabIcon` (using `useAlerts`) and `DevicesTabIcon` (using `useDevices` + `isDeviceOnline`). This task adds:
1. Pulse animation for critical-state dots
2. AI tab status dot (green when AI service is available via LLM feature flag)

**Step 1: Add PulsingDot component**

```typescript
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

const PulsingDot = ({ color }: { color: string }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 2,
        right: -4,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: color,
        opacity,
      }}
    />
  );
};
```

**Step 2: Update AlertsTabIcon to use PulsingDot for critical alerts**

```typescript
const AlertsTabIcon = ({ color }: { color: string }) => {
  const { data: alerts } = useAlerts();
  const criticalCount =
    alerts?.filter(
      (a) => !a.isReviewed && a.threatLevel === 'critical'
    ).length ?? 0;
  const hasUnreviewed =
    alerts?.some((a) => !a.isReviewed && (a.threatLevel === 'critical' || a.threatLevel === 'high')) ?? false;

  return (
    <View>
      <Icon name="alert-circle" color={color} size="base" />
      {criticalCount > 0 ? (
        <PulsingDot color="#ef4444" />
      ) : hasUnreviewed ? (
        <StatusDot color="#ef4444" />
      ) : null}
    </View>
  );
};
```

**Step 3: Add AITabIcon with status dot**

The AI tab dot shows green when the AI service has available/ready status. Check how the AI screen determines its "READY" / "ELEVATED" / "CRITICAL" status (in `AIAssistantScreen.tsx`) and extract that logic or use a shared hook/store if available. If no shared state exists, a simple approach: show a static green dot when the LLM feature flag is enabled:

```typescript
import { FEATURE_FLAGS } from '@/config/featureFlags';

const AITabIcon = ({ color }: { color: string }) => {
  // Show green dot when AI is available
  const aiReady = FEATURE_FLAGS.LLM_ENABLED;
  return (
    <View>
      <Icon name="sparkles-outline" color={color} size="base" />
      {aiReady && <StatusDot color="#4ade80" />}
    </View>
  );
};
```

Update the AI tab screen to use `AITabIcon`:
```typescript
<Tab.Screen
  name="AITab"
  component={AIStack}
  options={{
    title: 'AI',
    tabBarIcon: ({ color }) => <AITabIcon color={color} />,
  }}
/>
```

**Step 4: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 5: Run the app**

Run: `npm start` and verify on simulator
Expected: Tab bar shows pulsing red dot on Alerts when critical, static amber on Devices when offline, green on AI when ready

**Step 6: Commit**

```bash
git add src/navigation/MainNavigator.tsx
git commit -m "feat: add pulse animation and AI tab status dot"
```

---

### Task 24: Wire header status indicators to real data

**Files:**
- Modify: `src/screens/home/PropertyCommandCenter.tsx`
- Modify: `src/screens/alerts/AlertListScreen.tsx`
- Modify: `src/screens/devices/DeviceListScreen.tsx`
- Modify: `src/screens/radar/ProximityHeatmapScreen.tsx`

**Step 1: Verify each screen's TacticalHeader**

Each screen should already have a TacticalHeader from Phase 3. Verify the status computations use real query data:

- **Home:** Use `usePropertyStatus().level` to derive status (preserves offline device and stale data warnings)
- **Alerts:** Critical count from `useAlerts()` filtered by `!isReviewed && threatLevel === 'critical'`
- **Devices:** Online/total from device query
- **Radar:** Active detection count from positions query

**Step 2: Test each screen**

Run the app and navigate between tabs. Verify status indicators update.

**Step 3: Commit (if any fixes needed)**

```bash
git add src/screens/
git commit -m "fix: ensure header status indicators reflect live data"
```

---

### Task 25: Clean up dead code and unused imports

**Files:**
- Multiple files across the codebase

**Step 1: Remove light theme references**

Search for imports of `lightTheme` and references to `colorScheme === 'light'`:
```bash
grep -r "lightTheme\|colorScheme === 'light'\|colorScheme !== 'dark'" src/ --include="*.ts" --include="*.tsx" -l
```

Remove or simplify any conditional logic that branches on light/dark — everything is dark now.

**Step 2: Remove unused color scheme detection**

Remove `useColorScheme()` imports from files that no longer need them.

**Step 3: Remove the old tacticalTheme.ts if fully migrated**

If all AI components now use the app-wide theme instead of importing from `tacticalTheme.ts`, delete the file. Otherwise keep it as a compat shim.

**Step 4: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 5: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 6: Run lint**

Run: `npm run lint:fix`
Expected: No errors

**Step 7: Commit**

```bash
git add -A
git commit -m "refactor: remove dead light-mode code and unused theme references"
```

---

### Task 26: Final visual verification

**Step 1: Run the app on simulator**

Run: `npm run ios`

**Step 2: Verify each screen visually**

Walk through every screen and check:
- [ ] Login: Cinematic entry, amber buttons, monospace labels
- [ ] Register: Same cinematic styling as Login
- [ ] Forgot Password: Same cinematic styling
- [ ] Home: Tactical header with status (including offline/stale warnings), Briefing cards, monospace metrics
- [ ] Alerts: Tactical header, search bar, filter chips, Data card list
- [ ] Alert Detail: Briefing card layout, tactical tab segment
- [ ] AI: Unchanged (was already tactical)
- [ ] Radar: Tactical header, map in Data card, tactical toggle
- [ ] Devices: Tactical header with online count, Data card list
- [ ] Device Detail: Briefing card, tactical tabs
- [ ] Settings: Tactical header, monospace section labels, Surface cards, NO theme toggle
- [ ] Settings sub-screens (Profile, KnownDevices, Notifications, etc.): TacticalHeader, Surface cards
- [ ] More: Tactical header, Surface card menu items
- [ ] Analytics (Dashboard, Heatmap, Reports): Briefing cards, tactical colors on charts
- [ ] Tab bar: Amber active, monospace labels, status dots (red pulse on Alerts, amber on Devices, green on AI)
- [ ] Contrast: Verify `textTertiary` (#8a887a) is legible on backgrounds

**Step 3: Fix any visual issues found**

Address spacing, alignment, or color issues discovered during visual QA.

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: visual polish from QA walkthrough"
```
