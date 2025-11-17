# Phase 1: Foundation - Design System Overhaul

**Duration:** 8-10 hours
**Status:** ⬜ Not Started

## Overview

This phase establishes the foundational design system that all other components will use. This includes iOS semantic colors, typography, spacing, shadows, and utility functions.

**⚠️ CRITICAL: This phase MUST be completed first. All other phases depend on these changes.**

## Prerequisites

- [ ] Read `/docs/APPLE-DESIGN-PRINCIPLES.md` thoroughly
- [ ] Understand iOS semantic color system
- [ ] Understand iOS typography scale (SF font)
- [ ] Understand 8pt grid spacing system
- [ ] Have iOS simulator or device ready for testing

## Tasks

### 1.1 iOS Color System

**File:** `src/constants/colors.ts`

- [ ] **Remove Material Design color palette**
  - [ ] Remove green primary palette (#4CAF50 variants)
  - [ ] Remove current brand color definitions

- [ ] **Add iOS System Colors - Label**
  - [ ] `label`: Black in light (#000000), White in dark (#FFFFFF)
  - [ ] `secondaryLabel`: rgba(60, 60, 67, 0.6) light, rgba(235, 235, 245, 0.6) dark
  - [ ] `tertiaryLabel`: rgba(60, 60, 67, 0.3) light, rgba(235, 235, 245, 0.3) dark
  - [ ] `quaternaryLabel`: rgba(60, 60, 67, 0.18) light, rgba(235, 235, 245, 0.18) dark

- [ ] **Add iOS System Colors - Backgrounds**
  - [ ] `systemBackground`: #FFFFFF light, #000000 dark
  - [ ] `secondarySystemBackground`: #F2F2F7 light, #1C1C1E dark
  - [ ] `tertiarySystemBackground`: #FFFFFF light, #2C2C2E dark
  - [ ] `systemGroupedBackground`: #F2F2F7 light, #000000 dark
  - [ ] `secondarySystemGroupedBackground`: #FFFFFF light, #1C1C1E dark
  - [ ] `tertiarySystemGroupedBackground`: #F2F2F7 light, #2C2C2E dark

- [ ] **Add iOS System Colors - Fill**
  - [ ] `systemFill`: rgba(120, 120, 128, 0.2) light, rgba(120, 120, 128, 0.36) dark
  - [ ] `secondarySystemFill`: rgba(120, 120, 128, 0.16) light, rgba(120, 120, 128, 0.32) dark
  - [ ] `tertiarySystemFill`: rgba(118, 118, 128, 0.12) light, rgba(118, 118, 128, 0.24) dark
  - [ ] `quaternarySystemFill`: rgba(116, 116, 128, 0.08) light, rgba(118, 118, 128, 0.18) dark

- [ ] **Add iOS System Colors - Semantic**
  - [ ] `systemBlue`: #007AFF light, #0A84FF dark (NEW PRIMARY)
  - [ ] `systemGreen`: #34C759 light, #30D158 dark
  - [ ] `systemOrange`: #FF9500 light, #FF9F0A dark
  - [ ] `systemRed`: #FF3B30 light, #FF453A dark
  - [ ] `systemYellow`: #FFCC00 light, #FFD60A dark
  - [ ] `systemPurple`: #AF52DE light, #BF5AF2 dark
  - [ ] `systemPink`: #FF2D55 light, #FF375F dark
  - [ ] `systemTeal`: #5AC8FA light, #64D2FF dark
  - [ ] `systemIndigo`: #5856D6 light, #5E5CE6 dark
  - [ ] `systemGray`: #8E8E93 light, #8E8E93 dark
  - [ ] `systemGray2`: #AEAEB2 light, #636366 dark
  - [ ] `systemGray3`: #C7C7CC light, #48484A dark
  - [ ] `systemGray4`: #D1D1D6 light, #3A3A3C dark
  - [ ] `systemGray5`: #E5E5EA light, #2C2C2E dark
  - [ ] `systemGray6`: #F2F2F7 light, #1C1C1E dark

- [ ] **Add iOS Separator Colors**
  - [ ] `separator`: rgba(60, 60, 67, 0.29) light, rgba(84, 84, 88, 0.6) dark
  - [ ] `opaqueSeparator`: #C6C6C8 light, #38383A dark

- [ ] **Map Threat Levels to iOS Colors**
  - [ ] `critical`: systemRed
  - [ ] `high`: systemOrange
  - [ ] `medium`: systemYellow
  - [ ] `low`: systemGreen

- [ ] **Map Detection Types to iOS Colors**
  - [ ] `cellular`: systemPurple
  - [ ] `wifi`: systemBlue
  - [ ] `bluetooth`: systemTeal
  - [ ] `multiband`: systemIndigo

- [ ] **Update Color Type Definitions**
  - [ ] Update TypeScript interfaces for new color system
  - [ ] Remove old color type references
  - [ ] Add JSDoc comments explaining iOS color usage

### 1.2 iOS Typography System

**File:** `src/constants/typography.ts`

- [ ] **Update Font Family to System Font**
  - [ ] Change from 'Inter' to 'System' (or '-apple-system' fallback)
  - [ ] Remove web font imports if any

- [ ] **Define iOS Font Weights**
  - [ ] `regular`: '400'
  - [ ] `medium`: '500'
  - [ ] `semibold`: '600'
  - [ ] `bold`: '700'
  - [ ] Remove: ultralight, thin, light, heavy, black (not iOS standard)

- [ ] **Define iOS Text Styles**
  - [ ] `largeTitle`: size 34, weight regular, lineHeight 41
  - [ ] `title1`: size 28, weight regular, lineHeight 34
  - [ ] `title2`: size 22, weight regular, lineHeight 28
  - [ ] `title3`: size 20, weight regular, lineHeight 25
  - [ ] `headline`: size 17, weight semibold, lineHeight 22
  - [ ] `body`: size 17, weight regular, lineHeight 22
  - [ ] `callout`: size 16, weight regular, lineHeight 21
  - [ ] `subheadline`: size 15, weight regular, lineHeight 20
  - [ ] `footnote`: size 13, weight regular, lineHeight 18
  - [ ] `caption1`: size 12, weight regular, lineHeight 16
  - [ ] `caption2`: size 11, weight regular, lineHeight 13

- [ ] **Remove Non-iOS Text Styles**
  - [ ] Remove: h1, h2, h3, h4 (replace with iOS titles)
  - [ ] Remove: bodyLarge, bodySmall (use body, callout, footnote)
  - [ ] Remove: overline (not iOS pattern)

- [ ] **Update Typography Type Definitions**
  - [ ] Update TextVariant type to new iOS text styles
  - [ ] Update FontWeight type to remove non-iOS weights
  - [ ] Add JSDoc comments with iOS usage guidelines

### 1.3 iOS Spacing System

**File:** `src/constants/spacing.ts`

- [ ] **Implement 8pt Grid System**
  - [ ] Update spacing scale to strict 8pt multiples:
    - `xxs`: 4 (half unit for tight adjustments)
    - `xs`: 8
    - `sm`: 16
    - `md`: 24
    - `lg`: 32
    - `xl`: 40
    - `2xl`: 48
    - `3xl`: 56
    - `4xl`: 64

- [ ] **Add iOS-Specific Layout Constants**
  - [ ] `minTouchTarget`: 44 (iOS minimum interactive element size)
  - [ ] `screenMargin`: 20 (iOS standard screen margin)
  - [ ] `cardPadding`: 16 (iOS card internal padding)
  - [ ] `cardMargin`: 16 (spacing between cards)
  - [ ] `listItemHeight`: 44 (minimum list row height)
  - [ ] `listItemPaddingVertical`: 12
  - [ ] `listItemPaddingHorizontal`: 16
  - [ ] `sectionSpacing`: 32 (spacing between major sections)
  - [ ] `buttonHeight`: 50 (iOS standard button height)
  - [ ] `buttonPaddingHorizontal`: 16
  - [ ] `inputHeight`: 44 (minimum input height)

- [ ] **Update Border Radius**
  - [ ] `cardRadius`: 12 (iOS card corner radius)
  - [ ] `buttonRadius`: 10 (iOS button corner radius)
  - [ ] `inputRadius`: 10 (iOS input corner radius)
  - [ ] `badgeRadius`: 6 (iOS badge corner radius)

- [ ] **Remove Non-8pt Values**
  - [ ] Check for any spacing values not multiples of 4/8
  - [ ] Update to nearest 8pt multiple

- [ ] **Update Type Definitions**
  - [ ] Update spacing types
  - [ ] Add JSDoc comments explaining 8pt grid

### 1.4 iOS Shadows & Elevation

**File:** `src/constants/shadows.ts`

- [ ] **Update Shadow Definitions to iOS Style**
  - [ ] `none`: No shadow
  - [ ] `sm`: Subtle shadow for cards
    - iOS: shadowColor #000, shadowOffset {0, 1}, shadowOpacity 0.1, shadowRadius 2
    - Android: elevation 1
  - [ ] `md`: Standard shadow for elevated elements
    - iOS: shadowColor #000, shadowOffset {0, 2}, shadowOpacity 0.15, shadowRadius 4
    - Android: elevation 2
  - [ ] `lg`: Prominent shadow for modals
    - iOS: shadowColor #000, shadowOffset {0, 4}, shadowOpacity 0.2, shadowRadius 8
    - Android: elevation 4

- [ ] **Remove Heavy Shadows**
  - [ ] Remove `xl` shadow (too heavy for iOS)
  - [ ] iOS uses lighter, more subtle shadows

- [ ] **Add Card-Specific Shadow Preset**
  - [ ] `cardShadow`: Optimized for iOS card pattern

- [ ] **Update Type Definitions**
  - [ ] Update shadow types
  - [ ] Add JSDoc comments

### 1.5 Create iOS Style Utilities

**File:** `src/utils/iosStyles.ts` (NEW FILE)

- [ ] **Create Flex Utilities**
  ```typescript
  export const flex = {
    row: { flexDirection: 'row' as const },
    column: { flexDirection: 'column' as const },
    center: { justifyContent: 'center', alignItems: 'center' },
    rowCenter: { flexDirection: 'row' as const, alignItems: 'center' },
    spaceBetween: { justifyContent: 'space-between' },
    alignCenter: { alignItems: 'center' },
    alignStart: { alignItems: 'flex-start' },
    alignEnd: { alignItems: 'flex-end' },
    justifyCenter: { justifyContent: 'center' },
    justifyStart: { justifyContent: 'flex-start' },
    justifyEnd: { justifyContent: 'flex-end' },
    flex1: { flex: 1 },
  };
  ```

- [ ] **Create Spacing Helper Functions**
  ```typescript
  export const spacing = {
    p: (value: number) => ({ padding: value }),
    px: (value: number) => ({ paddingHorizontal: value }),
    py: (value: number) => ({ paddingVertical: value }),
    pt: (value: number) => ({ paddingTop: value }),
    pb: (value: number) => ({ paddingBottom: value }),
    pl: (value: number) => ({ paddingLeft: value }),
    pr: (value: number) => ({ paddingRight: value }),
    m: (value: number) => ({ margin: value }),
    mx: (value: number) => ({ marginHorizontal: value }),
    my: (value: number) => ({ marginVertical: value }),
    mt: (value: number) => ({ marginTop: value }),
    mb: (value: number) => ({ marginBottom: value }),
    ml: (value: number) => ({ marginLeft: value }),
    mr: (value: number) => ({ marginRight: value }),
  };
  ```

- [ ] **Create Border Radius Helpers**
  ```typescript
  export const rounded = {
    none: { borderRadius: 0 },
    sm: { borderRadius: 6 },
    md: { borderRadius: 10 },
    lg: { borderRadius: 12 },
    xl: { borderRadius: 16 },
    full: { borderRadius: 9999 },
  };
  ```

- [ ] **Create iOS Divider Utility**
  ```typescript
  export const divider = (theme: Theme) => ({
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.separator,
  });
  ```

- [ ] **Add TypeScript Types**
  - [ ] Type all utility functions properly
  - [ ] Export types for reuse

### 1.6 Update Theme Provider

**File:** `src/theme/provider.tsx`

- [ ] **Verify Theme Context Includes New Colors**
  - [ ] Ensure all new iOS colors are in theme object
  - [ ] Verify dark mode variants work correctly

- [ ] **Test Theme Switching**
  - [ ] Test light mode
  - [ ] Test dark mode
  - [ ] Test auto mode (system preference)

- [ ] **Add Theme Type Definitions**
  - [ ] Update Theme interface with new color properties
  - [ ] Ensure type safety for new colors

### 1.7 Create Iconicons → SF Symbols Mapping

**File:** `src/constants/iconMapping.ts` (NEW FILE)

- [ ] **Document Ionicons → SF Symbols Visual Equivalents**
  ```typescript
  /**
   * Maps Ionicons to their SF Symbols visual equivalents
   * Use these mappings to ensure icons match iOS design patterns
   */
  export const iosIconMapping = {
    // Navigation
    'chevron-back': 'chevron.left',
    'chevron-forward': 'chevron.right',
    'chevron-down': 'chevron.down',
    'chevron-up': 'chevron.up',

    // Actions
    'add': 'plus',
    'close': 'xmark',
    'checkmark': 'checkmark',
    'trash': 'trash',

    // Common
    'search': 'magnifyingglass',
    'settings': 'gearshape',
    'person': 'person',
    'home': 'house',

    // Alerts & Detection
    'alert-circle': 'exclamationmark.circle',
    'warning': 'exclamationmark.triangle',
    'notifications': 'bell',

    // Add more as needed...
  };
  ```

- [ ] **Add Icon Usage Guidelines**
  - [ ] Document recommended icon sizes for different contexts
  - [ ] Document icon weight matching with text

## Testing Checklist

After completing all tasks:

- [ ] **Color System Test**
  - [ ] All colors defined in both light and dark mode
  - [ ] Theme switching works correctly
  - [ ] No TypeScript errors with new color types

- [ ] **Typography Test**
  - [ ] All text styles defined correctly
  - [ ] System font loads properly
  - [ ] Text sizes match iOS specifications

- [ ] **Spacing Test**
  - [ ] All spacing values are 4pt or 8pt multiples
  - [ ] Layout constants are correct

- [ ] **Shadow Test**
  - [ ] Shadows render correctly on iOS
  - [ ] Shadows are subtle and iOS-like

- [ ] **Utilities Test**
  - [ ] Import iosStyles utilities successfully
  - [ ] Utilities produce correct style objects

- [ ] **TypeScript Check**
  ```bash
  npm run type-check
  ```
  - [ ] No type errors

- [ ] **Linter Check**
  ```bash
  npm run lint
  ```
  - [ ] No linting errors

## Success Criteria

- ✅ All iOS system colors defined with light/dark variants
- ✅ Typography system matches iOS text styles exactly
- ✅ Spacing system uses 8pt grid throughout
- ✅ Shadows are subtle and iOS-appropriate
- ✅ Style utilities created and working
- ✅ All TypeScript types updated
- ✅ No build errors
- ✅ Theme provider works with new system

## Notes for Next Phase

Once this phase is complete:
- All color, typography, and spacing constants are iOS-native
- Components can now be refactored to use these new constants
- Phase 2 (Atom Components) can begin

## Commit Message

```
feat: Phase 1 - Implement iOS design system foundation

- Replace Material Design colors with iOS semantic colors
- Update typography to match iOS text styles (SF font)
- Implement 8pt grid spacing system
- Update shadows to iOS-style subtle shadows
- Create iOS style utilities
- Add Ionicons to SF Symbols mapping

BREAKING CHANGE: Color, typography, and spacing constants completely refactored
```

---

**Status:** ⬜ Not Started → ⬜ In Progress → ✅ Complete

**Next Phase:** `02-atom-components.md`
