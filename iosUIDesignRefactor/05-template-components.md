# Phase 5: Template Components

**Duration:** 4-6 hours
**Status:** ✅ Complete

## Overview

This phase updates template components (ScreenLayout, EmptyState, LoadingState, ErrorState) to use iOS patterns and the updated component system.

## Prerequisites

- [x] Phase 1 complete (design system)
- [x] Phase 2 complete (atom components)
- [x] Phase 3 complete (molecule components)
- [x] Phase 4 complete (organism components)

## Tasks

### 5.1 ScreenLayout Component

**File:** `src/components/templates/ScreenLayout.tsx`

#### Update Background Colors

- [x] **Use semantic background colors:**
  ```typescript
  backgroundColor: colors.systemBackground; // Not hardcoded white/black
  ```

#### Add Large Title Support

- [x] **Add largeTitle prop:**

  ```typescript
  interface ScreenLayoutProps {
    children: React.ReactNode;
    header?: {
      title: string;
      subtitle?: string;
      showBack?: boolean;
      onBackPress?: () => void;
      rightActions?: React.ReactNode;
      largeTitle?: boolean; // NEW
    };
    scrollable?: boolean;
    keyboardAvoiding?: boolean;
    style?: ViewStyle;
  }
  ```

- [x] **Implement large title:**
  - When largeTitle=true, add large title text below nav bar
  - On scroll, animate to collapse into nav bar title
  - iOS 11+ pattern

#### Verify Safe Area Handling

- [x] Ensure using SafeAreaView correctly
- [x] Background extends to edges
- [x] Content respects safe areas

#### Update Header Integration

- [x] Pass header props to Header component
- [x] Ensure Header uses updated API from Phase 4

#### Testing

- [x] Test with header
- [x] Test without header
- [x] Test scrollable mode
- [x] Test with keyboard (keyboard avoiding)
- [x] Test large title mode
- [x] Test safe areas on iPhone with notch
- [x] Test in light and dark mode

---

### 5.2 EmptyState Component

**File:** `src/components/templates/EmptyState.tsx`

#### Update to Use New Components

- [x] **Update Icon:**
  - Use Icon component with iOS sizes
  - Size: 48-64pt (large)
  - Color: tertiaryLabel (subtle)

- [x] **Update Title:**
  - Text variant: title2 (22pt)
  - Color: label
  - Center aligned

- [x] **Update Message:**
  - Text variant: body (17pt)
  - Color: secondaryLabel
  - Center aligned
  - Max width: 300pt for readability

- [x] **Update Action Button:**
  - Use Button component with new API
  - buttonStyle: "tinted"
  - role: "default"
  - Not too prominent

#### Update Layout

- [x] **Vertical spacing:**
  - Icon to title: 16pt
  - Title to message: 8pt
  - Message to button: 24pt

#### Update Props Interface

- [x] **Update EmptyStateProps:**
  ```typescript
  interface EmptyStateProps {
    icon?: string; // Ionicon name
    title: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    style?: ViewStyle;
  }
  ```

#### Testing

- [x] Test with all props
- [x] Test without action button
- [x] Test without message
- [x] Test in light and dark mode
- [x] Verify centered layout

---

### 5.3 LoadingState Component

**File:** `src/components/templates/LoadingState.tsx`

#### Update to Use New Components

- [x] **ActivityIndicator:**
  - Size: "large"
  - Color: systemGray (or systemBlue for branded loading)

- [x] **Message Text:**
  - Text variant: body
  - Color: secondaryLabel
  - Center aligned

#### Update Layout

- [x] **Vertical spacing:**
  - ActivityIndicator to text: 16pt
  - Center everything vertically

#### Update Props Interface

- [x] **Update LoadingStateProps:**
  ```typescript
  interface LoadingStateProps {
    message?: string;
    style?: ViewStyle;
  }
  ```

#### Testing

- [x] Test with message
- [x] Test without message
- [x] Test in light and dark mode
- [x] Verify centered layout
- [x] Verify ActivityIndicator color adapts to theme

---

### 5.4 ErrorState Component

**File:** `src/components/templates/ErrorState.tsx`

#### Update to Use New Components

- [x] **Error Icon:**
  - Icon name: "alert-circle" or "warning"
  - Size: 48-64pt
  - Color: systemRed

- [x] **Title Text:**
  - Text variant: title2
  - Color: label
  - Center aligned

- [x] **Message Text:**
  - Text variant: body
  - Color: secondaryLabel
  - Center aligned
  - Max width: 300pt

- [x] **Retry Button:**
  - Use Button component
  - buttonStyle: "filled"
  - role: "default"
  - Label: "Try Again" or custom

#### Update Layout

- [x] **Vertical spacing:**
  - Icon to title: 16pt
  - Title to message: 8pt
  - Message to button: 24pt

#### Update Props Interface

- [x] **Update ErrorStateProps:**
  ```typescript
  interface ErrorStateProps {
    title?: string; // Default: "Something went wrong"
    message?: string;
    retryLabel?: string; // Default: "Try Again"
    onRetry?: () => void;
    style?: ViewStyle;
  }
  ```

#### Testing

- [x] Test with all props
- [x] Test with defaults
- [x] Test without retry button
- [x] Test in light and dark mode
- [x] Verify error styling

---

## Update All Usage Sites

### ScreenLayout Usage

- [x] Find all ScreenLayout imports
- [x] Update header props to match new interface
- [x] Add largeTitle where appropriate (main screens)

**Key files:**

- [x] All screen files that use ScreenLayout
- [x] Most screens in src/screens/

### EmptyState Usage

- [x] Find all EmptyState imports
- [x] Update icon names if needed
- [x] Update action button handlers

**Key files:**

- [x] AlertListScreen (when no alerts)
- [x] DeviceListScreen (when no devices)
- [x] Any other screens with empty states

### LoadingState Usage

- [x] Find all LoadingState imports
- [x] Verify usage is correct

**Key files:**

- [x] Screens with loading states
- [x] Usually used conditionally

### ErrorState Usage

- [x] Find all ErrorState imports
- [x] Update retry handlers
- [x] Verify error messages

**Key files:**

- [x] Screens with error handling
- [x] API call error states

---

## TypeScript Error Resolution

- [x] Run type check: `npm run type-check`
- [x] Fix all type errors related to template changes
- [x] Update prop types where needed

---

## Testing Checklist

- [x] **Visual Testing:**
  - [x] ScreenLayout backgrounds use semantic colors
  - [x] EmptyState has iOS styling
  - [x] LoadingState is centered and themed
  - [x] ErrorState has proper error styling

- [x] **Layout Testing:**
  - [x] Large titles work on main screens
  - [x] Safe areas handled correctly
  - [x] Empty states centered properly
  - [x] Loading states centered properly

- [x] **Mode Testing:**
  - [x] All templates work in light mode
  - [x] All templates work in dark mode
  - [x] ActivityIndicator colors adapt

- [x] **Build Testing:**
  ```bash
  npm run type-check
  npm run lint
  npm start
  ```

---

## Success Criteria

- ✅ ScreenLayout uses semantic background colors
- ✅ ScreenLayout supports large titles
- ✅ EmptyState uses updated components and iOS styling
- ✅ LoadingState uses themed ActivityIndicator
- ✅ ErrorState has proper iOS error styling
- ✅ All templates use semantic colors
- ✅ All usage sites updated
- ✅ No TypeScript errors
- ✅ No linting errors

## Commit Messages

```bash
git commit -m "feat: update ScreenLayout with large title support

- Add large title prop and implementation
- Use semantic background colors
- Update header integration"

git commit -m "refactor: update EmptyState to iOS styling

- Use updated Icon, Text, Button components
- Apply iOS spacing and typography
- Use semantic colors"

git commit -m "refactor: update LoadingState and ErrorState

- Use themed ActivityIndicator
- Apply iOS typography and spacing
- Use semantic colors throughout"

git commit -m "refactor: update all template component usage sites"
```

---

**Status:** ✅ Complete

**Completion Date:** 2025-11-17

**Next Phase:** `06-screen-implementations.md`
