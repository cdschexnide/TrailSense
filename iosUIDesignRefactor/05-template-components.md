# Phase 5: Template Components

**Duration:** 4-6 hours
**Status:** ⬜ Not Started

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

- [ ] **Use semantic background colors:**
  ```typescript
  backgroundColor: colors.systemBackground  // Not hardcoded white/black
  ```

#### Add Large Title Support

- [ ] **Add largeTitle prop:**
  ```typescript
  interface ScreenLayoutProps {
    children: React.ReactNode;
    header?: {
      title: string;
      subtitle?: string;
      showBack?: boolean;
      onBackPress?: () => void;
      rightActions?: React.ReactNode;
      largeTitle?: boolean;  // NEW
    };
    scrollable?: boolean;
    keyboardAvoiding?: boolean;
    style?: ViewStyle;
  }
  ```

- [ ] **Implement large title:**
  - When largeTitle=true, add large title text below nav bar
  - On scroll, animate to collapse into nav bar title
  - iOS 11+ pattern

#### Verify Safe Area Handling

- [ ] Ensure using SafeAreaView correctly
- [ ] Background extends to edges
- [ ] Content respects safe areas

#### Update Header Integration

- [ ] Pass header props to Header component
- [ ] Ensure Header uses updated API from Phase 4

#### Testing

- [ ] Test with header
- [ ] Test without header
- [ ] Test scrollable mode
- [ ] Test with keyboard (keyboard avoiding)
- [ ] Test large title mode
- [ ] Test safe areas on iPhone with notch
- [ ] Test in light and dark mode

---

### 5.2 EmptyState Component

**File:** `src/components/templates/EmptyState.tsx`

#### Update to Use New Components

- [ ] **Update Icon:**
  - Use Icon component with iOS sizes
  - Size: 48-64pt (large)
  - Color: tertiaryLabel (subtle)

- [ ] **Update Title:**
  - Text variant: title2 (22pt)
  - Color: label
  - Center aligned

- [ ] **Update Message:**
  - Text variant: body (17pt)
  - Color: secondaryLabel
  - Center aligned
  - Max width: 300pt for readability

- [ ] **Update Action Button:**
  - Use Button component with new API
  - buttonStyle: "tinted"
  - role: "default"
  - Not too prominent

#### Update Layout

- [ ] **Vertical spacing:**
  - Icon to title: 16pt
  - Title to message: 8pt
  - Message to button: 24pt

#### Update Props Interface

- [ ] **Update EmptyStateProps:**
  ```typescript
  interface EmptyStateProps {
    icon?: string;  // Ionicon name
    title: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    style?: ViewStyle;
  }
  ```

#### Testing

- [ ] Test with all props
- [ ] Test without action button
- [ ] Test without message
- [ ] Test in light and dark mode
- [ ] Verify centered layout

---

### 5.3 LoadingState Component

**File:** `src/components/templates/LoadingState.tsx`

#### Update to Use New Components

- [ ] **ActivityIndicator:**
  - Size: "large"
  - Color: systemGray (or systemBlue for branded loading)

- [ ] **Message Text:**
  - Text variant: body
  - Color: secondaryLabel
  - Center aligned

#### Update Layout

- [ ] **Vertical spacing:**
  - ActivityIndicator to text: 16pt
  - Center everything vertically

#### Update Props Interface

- [ ] **Update LoadingStateProps:**
  ```typescript
  interface LoadingStateProps {
    message?: string;
    style?: ViewStyle;
  }
  ```

#### Testing

- [ ] Test with message
- [ ] Test without message
- [ ] Test in light and dark mode
- [ ] Verify centered layout
- [ ] Verify ActivityIndicator color adapts to theme

---

### 5.4 ErrorState Component

**File:** `src/components/templates/ErrorState.tsx`

#### Update to Use New Components

- [ ] **Error Icon:**
  - Icon name: "alert-circle" or "warning"
  - Size: 48-64pt
  - Color: systemRed

- [ ] **Title Text:**
  - Text variant: title2
  - Color: label
  - Center aligned

- [ ] **Message Text:**
  - Text variant: body
  - Color: secondaryLabel
  - Center aligned
  - Max width: 300pt

- [ ] **Retry Button:**
  - Use Button component
  - buttonStyle: "filled"
  - role: "default"
  - Label: "Try Again" or custom

#### Update Layout

- [ ] **Vertical spacing:**
  - Icon to title: 16pt
  - Title to message: 8pt
  - Message to button: 24pt

#### Update Props Interface

- [ ] **Update ErrorStateProps:**
  ```typescript
  interface ErrorStateProps {
    title?: string;  // Default: "Something went wrong"
    message?: string;
    retryLabel?: string;  // Default: "Try Again"
    onRetry?: () => void;
    style?: ViewStyle;
  }
  ```

#### Testing

- [ ] Test with all props
- [ ] Test with defaults
- [ ] Test without retry button
- [ ] Test in light and dark mode
- [ ] Verify error styling

---

## Update All Usage Sites

### ScreenLayout Usage

- [ ] Find all ScreenLayout imports
- [ ] Update header props to match new interface
- [ ] Add largeTitle where appropriate (main screens)

**Key files:**
- [ ] All screen files that use ScreenLayout
- [ ] Most screens in src/screens/

### EmptyState Usage

- [ ] Find all EmptyState imports
- [ ] Update icon names if needed
- [ ] Update action button handlers

**Key files:**
- [ ] AlertListScreen (when no alerts)
- [ ] DeviceListScreen (when no devices)
- [ ] Any other screens with empty states

### LoadingState Usage

- [ ] Find all LoadingState imports
- [ ] Verify usage is correct

**Key files:**
- [ ] Screens with loading states
- [ ] Usually used conditionally

### ErrorState Usage

- [ ] Find all ErrorState imports
- [ ] Update retry handlers
- [ ] Verify error messages

**Key files:**
- [ ] Screens with error handling
- [ ] API call error states

---

## TypeScript Error Resolution

- [ ] Run type check: `npm run type-check`
- [ ] Fix all type errors related to template changes
- [ ] Update prop types where needed

---

## Testing Checklist

- [ ] **Visual Testing:**
  - [ ] ScreenLayout backgrounds use semantic colors
  - [ ] EmptyState has iOS styling
  - [ ] LoadingState is centered and themed
  - [ ] ErrorState has proper error styling

- [ ] **Layout Testing:**
  - [ ] Large titles work on main screens
  - [ ] Safe areas handled correctly
  - [ ] Empty states centered properly
  - [ ] Loading states centered properly

- [ ] **Mode Testing:**
  - [ ] All templates work in light mode
  - [ ] All templates work in dark mode
  - [ ] ActivityIndicator colors adapt

- [ ] **Build Testing:**
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

**Status:** ⬜ Not Started → ⬜ In Progress → ✅ Complete

**Next Phase:** `06-screen-implementations.md`
