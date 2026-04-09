# iOS UI Design Refactor - Component Migration Guide

## Overview

This guide documents the API changes for all atom components and provides patterns for updating usage sites throughout the codebase.

## Completed Components

### ✅ Atom Components (All 5 Updated)

- Button
- Text
- Icon
- Badge
- Input

### ✅ Example Implementations

- LoginScreen (complete example)
- ListItem (molecule)
- WhitelistItem (molecule)
- Card (molecule)

## API Changes Reference

### Button Component

**OLD API:**

```tsx
<Button title="Sign In" variant="primary" size="base" onPress={handlePress} />
```

**NEW API:**

```tsx
<Button
  buttonStyle="filled"
  role="default"
  size="medium"
  prominent
  onPress={handlePress}
>
  Sign In
</Button>
```

**Migration Mapping:**

- `title` prop → use `children` instead
- `variant="primary"` → `buttonStyle="filled" role="default"`
- `variant="secondary"` → `buttonStyle="tinted"`
- `variant="outline"` → `buttonStyle="gray"`
- `variant="ghost"` → `buttonStyle="plain"`
- `variant="danger"` → `buttonStyle="filled" role="destructive"`
- `size="sm"` → `size="small"`
- `size="base"` → `size="medium"`
- `size="lg"` → `size="large"`

### Text Component

**OLD API:**

```tsx
<Text variant="h1" color="primary">
  Title
</Text>
```

**NEW API:**

```tsx
<Text variant="largeTitle" color="label" weight="bold">
  Title
</Text>
```

**Variant Migration:**

- `h1` → `largeTitle`
- `h2` → `title1`
- `h3` → `title2`
- `h4` → `title3`
- `bodyLarge` → `body`
- `bodySmall` → `callout` or `footnote`
- `caption` → `caption1` or `caption2`
- `overline` → `caption2` with `weight="semibold"`

**Color Migration:**

- `primary` → `label`
- `secondary` → `secondaryLabel`
- `disabled` → `quaternaryLabel`
- `error` → `systemRed`
- `success` → `systemGreen`
- `warning` → `systemOrange`
- `info` → `systemBlue`

### Icon Component

**OLD API:**

```tsx
<Icon name="heart" size="base" color="#FF0000" />
```

**NEW API:**

```tsx
<Icon name="heart" size="base" color="systemRed" />
```

**Size Migration:**

- `xs` → `xs` (20pt)
- `sm` → `sm` (22pt)
- `base` → `base` (24pt)
- `lg` → `lg` (28pt)
- `xl` → `xl` (32pt)
- `2xl` → `xl` or use number `40`

**Color Migration:**

- Use semantic colors: `label`, `secondaryLabel`, `systemBlue`, etc.
- Or use custom colors directly

### Badge Component

**OLD API:**

```tsx
<Badge label="Critical" variant="threat-critical" size="base" />
```

**NEW API:**

```tsx
<Badge variant="critical" size="base">
  Critical
</Badge>
```

**Changes:**

- `label` prop → use `children` instead
- Variant names simplified:
  - `threat-low` → `low`
  - `threat-medium` → `medium`
  - `threat-high` → `high`
  - `threat-critical` → `critical`
  - `detection-cellular` → `cellular`
  - `detection-wifi` → `wifi`
  - `detection-bluetooth` → `bluetooth`
  - `detection-multi` → `multiband`

### Input Component

**OLD API:**

```tsx
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
/>
```

**NEW API (Enhanced):**

```tsx
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  textContentType="emailAddress"
  returnKeyType="next"
  clearButtonMode="while-editing"
/>
```

**New Props:**

- `textContentType` - iOS autofill hints
- `returnKeyType` - keyboard return key
- `clearButtonMode` - when to show clear button
- Haptic feedback on focus (automatic)

## Theme Hook Changes

**OLD:**

```tsx
const { theme, isDark } = useTheme();
const colors = isDark ? theme.colors.dark : theme.colors.light;
```

**NEW:**

```tsx
const { theme, colorScheme } = useTheme();
const colors = theme.colors;
const isDark = colorScheme === 'dark';
```

**Note:** `theme.colors` already contains the correct colors for the current mode.

## Common Patterns

### Pattern 1: Updating Auth Screens

See `src/screens/auth/LoginScreen.tsx` for complete example.

### Pattern 2: Updating List Items

See `src/components/molecules/ListItem/ListItem.tsx` for pattern.

### Pattern 3: Updating Cards with Badges

See `src/components/molecules/WhitelistItem/WhitelistItem.tsx` for pattern.

## Remaining Files to Update

Based on type check, the following files still need updates:

### Organism Components (3 files)

- `src/components/organisms/AlertCard/AlertCard.tsx`
- `src/components/organisms/DeviceCard/DeviceCard.tsx`
- `src/components/organisms/Header/Header.tsx`

### Template Components (3 files)

- `src/components/templates/EmptyState/EmptyState.tsx`
- `src/components/templates/ErrorState/ErrorState.tsx`
- `src/components/templates/LoadingState/LoadingState.tsx`

### Screen Components (~15 files)

- `src/screens/alerts/AlertDetailScreen.tsx`
- `src/screens/alerts/AlertFilterScreen.tsx`
- `src/screens/devices/DeviceDetailScreen.tsx`
- `src/screens/devices/AddDeviceScreen.tsx`
- `src/screens/settings/*` (multiple files)
- `src/screens/auth/RegisterScreen.tsx`
- `src/screens/auth/ForgotPasswordScreen.tsx`
- `src/screens/analytics/ReportsScreen.tsx`
- `src/screens/radar/RadarSettingsScreen.tsx`

## Quick Fix Commands

### Find all Button usage with old API:

```bash
grep -r "title=" src/ | grep Button
grep -r 'variant="primary"' src/
grep -r 'size="sm"' src/ | grep Button
```

### Find all Text usage with old variants:

```bash
grep -r 'variant="h[0-9]"' src/
grep -r 'variant="caption"' src/
grep -r 'color="primary"' src/ | grep Text
```

### Find all Badge usage with label prop:

```bash
grep -r '<Badge label=' src/
```

## Testing After Migration

1. **Type Check:** `npm run type-check`
2. **Lint:** `npm run lint`
3. **Build:** `npm start`
4. **Visual Test:** Check all screens in both light and dark mode
5. **Interaction Test:** Test buttons, inputs, haptic feedback

## Tips

1. **Batch Updates:** Update all files of the same type together (e.g., all auth screens)
2. **Test Incrementally:** Run type-check after each batch
3. **Use Examples:** Refer to LoginScreen and updated molecules
4. **Search & Replace:** Use your IDE's search/replace for common patterns
5. **Theme Colors:** Always use semantic colors, never hardcoded values

## Success Criteria

- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] All buttons have haptic feedback
- [ ] All inputs have iOS-appropriate textContentType
- [ ] All text uses iOS semantic variants
- [ ] All colors are semantic (no hardcoded values)
- [ ] App builds and runs successfully
- [ ] Visual testing in light and dark modes passes
