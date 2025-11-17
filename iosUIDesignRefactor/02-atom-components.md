# Phase 2: Atom Components - iOS Native APIs

**Duration:** 12-15 hours
**Status:** ⬜ Not Started

## Overview

This phase refactors all atom components to use iOS-native design patterns and APIs. This includes breaking API changes to Button, Text, Icon, Badge, and Input components.

**⚠️ WARNING: This phase introduces BREAKING CHANGES that will require updates in ~80+ files.**

## Prerequisites

- [ ] Phase 1 complete (design system foundation)
- [ ] Understand iOS button roles and styles
- [ ] Understand iOS text style hierarchy
- [ ] Understand iOS semantic color usage
- [ ] Have example iOS apps for reference (Settings, Health, etc.)

## Tasks

### 2.1 Button Component

**File:** `src/components/atoms/Button.tsx`

#### Remove Old API

- [ ] Remove `variant` prop: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- [ ] Remove current styling logic

#### Implement iOS Button API

- [ ] **Add `buttonStyle` prop:** 'filled' | 'tinted' | 'gray' | 'plain'

  ```typescript
  type ButtonStyle = 'filled' | 'tinted' | 'gray' | 'plain';
  ```

- [ ] **Add `role` prop:** 'default' | 'cancel' | 'destructive'

  ```typescript
  type ButtonRole = 'default' | 'cancel' | 'destructive';
  ```

- [ ] **Update `size` prop:** 'small' | 'medium' | 'large'
  - Small: 36pt height
  - Medium: 44pt height
  - Large: 50pt height
  - All sizes must meet 44pt minimum touch target (padding if needed)

- [ ] **Add `prominent` boolean prop**
  - When true, this is the primary action
  - Visually emphasized

#### Implement Button Styles

- [ ] **Filled Button Style**
  - Background: systemBlue (default role)
  - Background: systemGray (cancel role)
  - Background: systemRed (destructive role)
  - Text: white
  - Border radius: 10pt
  - Most prominent visual style

- [ ] **Tinted Button Style**
  - Background: systemBlue with 15% opacity (default)
  - Background: systemGray with 15% opacity (cancel)
  - Background: systemRed with 15% opacity (destructive)
  - Text color matches background base color
  - Border radius: 10pt

- [ ] **Gray Button Style**
  - Background: systemGray4 (light), systemGray3 (dark)
  - Text: label color
  - Border radius: 10pt
  - Neutral appearance

- [ ] **Plain Button Style**
  - No background
  - Text: systemBlue (default)
  - Text: systemGray (cancel)
  - Text: systemRed (destructive)
  - No border
  - Minimal visual presence

#### Add Features

- [ ] **Haptic Feedback**

  ```typescript
  import * as Haptics from 'expo-haptics';

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };
  ```

- [ ] **Press State**
  - Reduce opacity to 0.5 when pressed
  - Use Pressable component

- [ ] **Disabled State**
  - Reduce opacity to 0.4
  - Prevent interaction
  - No haptic feedback

- [ ] **Loading State**
  - Show ActivityIndicator
  - Disable interaction
  - Keep button dimensions

- [ ] **Icon Support**
  - leftIcon prop
  - rightIcon prop
  - Proper spacing (8pt) between icon and text

#### Update Type Definitions

- [ ] **Update ButtonProps Interface**

  ```typescript
  interface ButtonProps {
    // Text content
    children: React.ReactNode;

    // Styling
    buttonStyle?: 'filled' | 'tinted' | 'gray' | 'plain';
    role?: 'default' | 'cancel' | 'destructive';
    size?: 'small' | 'medium' | 'large';
    prominent?: boolean;

    // State
    disabled?: boolean;
    loading?: boolean;

    // Layout
    fullWidth?: boolean;

    // Icons
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;

    // Actions
    onPress?: () => void;

    // Style override (use sparingly)
    style?: ViewStyle;
    textStyle?: TextStyle;
  }
  ```

- [ ] Remove old variant-related types

#### Testing

- [ ] Create test file `Button.test.tsx` (or update existing)
- [ ] Test all button styles render correctly
- [ ] Test all roles render correctly
- [ ] Test all sizes render correctly
- [ ] Test disabled state
- [ ] Test loading state
- [ ] Test haptic feedback triggers

---

### 2.2 Text Component

**File:** `src/components/atoms/Text.tsx`

#### Remove Old API

- [ ] Remove variants: 'h1' | 'h2' | 'h3' | 'h4' | 'bodyLarge' | 'bodySmall' | 'overline'

#### Implement iOS Text API

- [ ] **Update `variant` prop with iOS text styles:**

  ```typescript
  type TextVariant =
    | 'largeTitle'
    | 'title1'
    | 'title2'
    | 'title3'
    | 'headline'
    | 'body'
    | 'callout'
    | 'subheadline'
    | 'footnote'
    | 'caption1'
    | 'caption2';
  ```

- [ ] **Update `color` prop to use semantic colors:**
  ```typescript
  type TextColor =
    | 'label' // Primary text
    | 'secondaryLabel' // Secondary text
    | 'tertiaryLabel' // Tertiary text
    | 'quaternaryLabel' // Disabled/watermark text
    | 'systemBlue' // Interactive elements
    | 'systemGreen' // Success
    | 'systemOrange' // Warning
    | 'systemRed' // Error/Destructive
    | 'white'; // Inverse (on dark backgrounds)
  ```

#### Implement Text Styles

- [ ] Map each variant to typography constants from Phase 1
- [ ] Map each color to iOS semantic colors
- [ ] Apply proper line heights
- [ ] Support Dynamic Type (respect user font size settings)

#### Add Features

- [ ] **numberOfLines Support**
  - Truncate with ellipsis when needed

- [ ] **Weight Override**

  ```typescript
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  ```

- [ ] **Alignment Support**
  ```typescript
  align?: 'left' | 'center' | 'right' | 'justify';
  ```

#### Update Type Definitions

- [ ] **Update TextProps Interface**
  ```typescript
  interface TextProps {
    children: React.ReactNode;
    variant?: TextVariant;
    color?: TextColor;
    weight?: 'regular' | 'medium' | 'semibold' | 'bold';
    align?: 'left' | 'center' | 'right' | 'justify';
    numberOfLines?: number;
    style?: TextStyle;
    onPress?: () => void;
  }
  ```

#### Testing

- [ ] Test all text variants render with correct sizes
- [ ] Test all color options work in light/dark mode
- [ ] Test weight overrides work
- [ ] Test alignment works
- [ ] Test numberOfLines truncation works

---

### 2.3 Icon Component

**File:** `src/components/atoms/Icon.tsx`

#### Update Size Scale

- [ ] **Update sizes to iOS standard:**

  ```typescript
  type IconSize = 20 | 22 | 24 | 28 | 32;

  const sizeMap = {
    xs: 20,
    sm: 22,
    base: 24,
    lg: 28,
    xl: 32,
  };
  ```

#### Add Symbol Weight

- [ ] **Add `weight` prop:**
  ```typescript
  weight?: 'ultralight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';
  ```

  - Note: Ionicons don't have variable weights, but document this for future SF Symbols migration
  - Use 'regular' weight icons from Ionicons

#### Update Color Support

- [ ] **Use semantic colors:**

  ```typescript
  color?: 'label' | 'secondaryLabel' | 'tertiaryLabel' | 'systemBlue' | 'systemRed' | ...
  ```

- [ ] Map color prop to theme semantic colors
- [ ] Support custom color via style prop

#### Update Type Definitions

- [ ] **Update IconProps Interface**
  ```typescript
  interface IconProps {
    name: string; // Ionicons name
    size?: IconSize | number;
    color?: SemanticColor | string;
    weight?: IconWeight; // Documented for future
    style?: ViewStyle;
  }
  ```

#### Testing

- [ ] Test icon renders at all sizes
- [ ] Test color prop works
- [ ] Test custom colors work
- [ ] Test icons match adjacent text size

---

### 2.4 Badge Component

**File:** `src/components/atoms/Badge.tsx`

#### Redesign for iOS Subtlety

- [ ] **Reduce visual prominence**
  - Smaller corner radius (6pt)
  - Lighter background colors
  - Subtle borders

- [ ] **Update variant system:**
  ```typescript
  type BadgeVariant =
    // Threat levels
    | 'critical'
    | 'high'
    | 'medium'
    | 'low'
    // Detection types
    | 'cellular'
    | 'wifi'
    | 'bluetooth'
    | 'multiband'
    // Semantic
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    // Status
    | 'online'
    | 'offline';
  ```

#### Implement Badge Styles

- [ ] **Threat Level Badges**
  - critical: systemRed background (15% opacity), systemRed text
  - high: systemOrange background (15% opacity), systemOrange text
  - medium: systemYellow background (20% opacity), dark yellow text
  - low: systemGreen background (15% opacity), systemGreen text

- [ ] **Detection Type Badges**
  - cellular: systemPurple background (15% opacity), systemPurple text
  - wifi: systemBlue background (15% opacity), systemBlue text
  - bluetooth: systemTeal background (15% opacity), systemTeal text
  - multiband: systemIndigo background (15% opacity), systemIndigo text

- [ ] **Size System**
  - sm: caption2 text, 4pt padding vertical, 8pt padding horizontal
  - base: caption1 text, 6pt padding vertical, 10pt padding horizontal
  - lg: footnote text, 8pt padding vertical, 12pt padding horizontal

#### Update Type Definitions

- [ ] **Update BadgeProps Interface**
  ```typescript
  interface BadgeProps {
    children: React.ReactNode;
    variant: BadgeVariant;
    size?: 'sm' | 'base' | 'lg';
    style?: ViewStyle;
  }
  ```

#### Testing

- [ ] Test all badge variants
- [ ] Test all sizes
- [ ] Test in light and dark mode
- [ ] Verify subtlety (not too prominent)

---

### 2.5 Input Component

**File:** `src/components/atoms/Input.tsx`

#### Redesign for iOS Patterns

- [ ] **Update visual styling:**
  - Border: 1pt solid systemGray4 (unfocused)
  - Border: 2pt solid systemBlue (focused)
  - Background: secondarySystemBackground
  - Corner radius: 10pt
  - Height: minimum 44pt
  - Padding: 12pt horizontal

#### Add iOS Features

- [ ] **Add `textContentType` support**

  ```typescript
  textContentType?:
    | 'none'
    | 'emailAddress'
    | 'password'
    | 'username'
    | 'name'
    | 'telephoneNumber'
    | 'newPassword'
    | 'oneTimeCode'
    | ...
  ```

- [ ] **Add `clearButtonMode`**

  ```typescript
  clearButtonMode?: 'never' | 'while-editing' | 'unless-editing' | 'always';
  ```

  - Show iOS-style clear button (×) on right side
  - Clear input when pressed

- [ ] **Add `returnKeyType`**
  ```typescript
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  ```

#### Improve States

- [ ] **Focus State**
  - Blue border (2pt)
  - Subtle glow/shadow
  - Haptic feedback on focus

- [ ] **Error State**
  - Red border
  - Error message in systemRed
  - Error icon (optional)

- [ ] **Disabled State**
  - Reduced opacity (0.5)
  - Gray background
  - No interaction

#### Update Icons

- [ ] **Left Icon**
  - Position inside input (left side)
  - 8pt spacing from text
  - secondaryLabel color

- [ ] **Right Icon/Clear Button**
  - Position inside input (right side)
  - 8pt spacing from text
  - Interactive for clear

#### Update Type Definitions

- [ ] **Update InputProps Interface**

  ```typescript
  interface InputProps {
    // Value
    value: string;
    onChangeText: (text: string) => void;

    // Appearance
    label?: string;
    placeholder?: string;
    helperText?: string;
    error?: string;

    // Type
    secureTextEntry?: boolean;
    keyboardType?: KeyboardTypeOptions;
    textContentType?: TextContentType;
    returnKeyType?: ReturnKeyTypeOptions;

    // Icons
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    clearButtonMode?: 'never' | 'while-editing' | 'unless-editing' | 'always';

    // State
    disabled?: boolean;
    editable?: boolean;

    // Actions
    onFocus?: () => void;
    onBlur?: () => void;
    onSubmitEditing?: () => void;

    // Style
    style?: ViewStyle;
    inputStyle?: TextStyle;
  }
  ```

#### Testing

- [ ] Test input renders correctly
- [ ] Test focus state
- [ ] Test error state
- [ ] Test disabled state
- [ ] Test clear button works
- [ ] Test with left/right icons
- [ ] Test password visibility toggle
- [ ] Test keyboard types
- [ ] Test on iOS simulator

---

## Update All Usage Sites

**This is the most time-consuming part. All files using these components must be updated.**

### Files to Update (Estimated ~80+ files)

#### Button Usage Sites

- [ ] Find all Button imports: `grep -r "from '@components/atoms/Button'" src/`
- [ ] Update each file:
  - [ ] Change `variant="primary"` to `buttonStyle="filled" role="default"`
  - [ ] Change `variant="secondary"` to `buttonStyle="tinted"`
  - [ ] Change `variant="danger"` to `buttonStyle="filled" role="destructive"`
  - [ ] Change `variant="outline"` to `buttonStyle="gray"`
  - [ ] Change `variant="ghost"` to `buttonStyle="plain"`
  - [ ] Update size props if needed
  - [ ] Add prominent={true} to primary actions

**Key files:**

- [ ] All screens in `src/screens/alerts/`
- [ ] All screens in `src/screens/devices/`
- [ ] All screens in `src/screens/analytics/`
- [ ] All screens in `src/screens/settings/`
- [ ] All screens in `src/screens/auth/`
- [ ] All organism components using buttons
- [ ] All molecule components using buttons

#### Text Usage Sites

- [ ] Find all Text imports: `grep -r "from '@components/atoms/Text'" src/`
- [ ] Update each file:
  - [ ] Change `variant="h1"` to `variant="largeTitle"`
  - [ ] Change `variant="h2"` to `variant="title1"`
  - [ ] Change `variant="h3"` to `variant="title2"`
  - [ ] Change `variant="h4"` to `variant="title3"`
  - [ ] Change `variant="bodyLarge"` to `variant="body"`
  - [ ] Change `variant="bodySmall"` to `variant="callout"` or `variant="footnote"`
  - [ ] Update color props to semantic colors

**All screen and component files use Text - systematic update required**

#### Icon Usage Sites

- [ ] Find all Icon imports
- [ ] Update size values to new scale
- [ ] Update color props to semantic colors

#### Badge Usage Sites

- [ ] Find all Badge imports
- [ ] Verify variants still valid
- [ ] Update deprecated variants

#### Input Usage Sites

- [ ] Find all Input imports
- [ ] Add textContentType where appropriate
- [ ] Add returnKeyType where appropriate
- [ ] Update styling if custom styles used

---

## TypeScript Error Resolution

After updating all imports and usage:

- [ ] Run type check: `npm run type-check`
- [ ] Fix all type errors related to component prop changes
- [ ] Update any type assertions
- [ ] Update any prop spreading that might break

---

## Testing Checklist

- [ ] **Visual Testing**
  - [ ] All buttons render with correct iOS styles
  - [ ] All text renders with correct sizes and weights
  - [ ] All icons are properly sized
  - [ ] All badges are subtle and iOS-like
  - [ ] All inputs have iOS styling

- [ ] **Interaction Testing**
  - [ ] Buttons respond to press with haptics
  - [ ] Buttons show press state
  - [ ] Inputs focus correctly
  - [ ] Clear buttons work
  - [ ] Password toggle works

- [ ] **Mode Testing**
  - [ ] Test all components in light mode
  - [ ] Test all components in dark mode
  - [ ] Verify color transitions

- [ ] **Build Testing**
  ```bash
  npm run type-check
  npm run lint
  npm start
  ```

  - [ ] No TypeScript errors
  - [ ] No linting errors
  - [ ] App builds successfully
  - [ ] App runs on iOS simulator

---

## Success Criteria

- ✅ All atom components use iOS-native APIs
- ✅ Button component implements iOS button styles and roles
- ✅ Text component uses iOS text style hierarchy
- ✅ Icon component uses iOS sizing
- ✅ Badge component is subtle and iOS-like
- ✅ Input component has iOS styling and features
- ✅ All usage sites updated (no compilation errors)
- ✅ All components tested in light and dark mode
- ✅ Haptic feedback works
- ✅ No TypeScript errors
- ✅ No linting errors

## Commit Messages

```bash
# Commit after updating each atom component

git commit -m "feat: update Button component to iOS native API

- Add buttonStyle prop (filled, tinted, gray, plain)
- Add role prop (default, cancel, destructive)
- Update sizes to iOS standards (44pt minimum)
- Add haptic feedback
- Add prominent prop for primary actions

BREAKING CHANGE: variant prop replaced with buttonStyle and role"

git commit -m "feat: update Text component to iOS text styles

- Replace old variants with iOS text styles
- Add largeTitle, title1-3, headline, body, callout, etc.
- Update color prop to use semantic colors
- Add Dynamic Type support

BREAKING CHANGE: variant values changed to iOS text styles"

# ... similar for Icon, Badge, Input

git commit -m "refactor: update all Button usage sites to new API"
git commit -m "refactor: update all Text usage sites to new API"
```

---

**Status:** ⬜ Not Started → ⬜ In Progress → ✅ Complete

**Next Phase:** `03-molecule-components.md`
