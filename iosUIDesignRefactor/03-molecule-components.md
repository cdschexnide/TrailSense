# Phase 3: Molecule Components

**Duration:** 10-12 hours
**Status:** ✅ Complete

## Overview

This phase refactors molecule components to use iOS design patterns and the new atom component APIs from Phase 2. This includes Card, ListItem, SearchBar, StatCard, ChartCard, and new iOS-specific list components.

## Prerequisites

- [x] Phase 1 complete (design system)
- [x] Phase 2 complete (atom components)
- [x] Understand iOS list patterns (inset grouped)
- [x] Understand iOS card design
- [x] Reference iOS Settings app for patterns

## Tasks

### 3.1 Card Component

**File:** `src/components/molecules/Card.tsx`

#### Implement iOS Inset Grouped Card Style

- [x] **Update base styling:**
  - [x] Corner radius: 12pt (from spacing constants)
  - [x] Background: secondarySystemGroupedBackground
  - [x] Shadow: subtle iOS shadow (sm from Phase 1)
  - [x] Margin: 16pt from screen edges
  - [x] Padding: 16pt internal

- [x] **Remove press feedback**
  - [x] iOS cards typically don't have press states
  - [x] If pressable needed, use plain tap (no visual feedback)

- [x] **Add `grouped` variant prop**
  ```typescript
  variant?: 'default' | 'grouped';
  ```
  - default: White background, shadow
  - grouped: secondarySystemGroupedBackground, no shadow

- [x] **Update shadow logic**
  - Use shadow only for 'default' variant
  - No shadow for 'grouped' variant
  - Ensure shadow adapts to dark mode

#### Update Props Interface

- [x] **Remove/update incompatible props:**
  ```typescript
  interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'grouped';
    onPress?: () => void;  // Keep but remove visual press feedback
    loading?: boolean;      // Keep loading state
    style?: ViewStyle;
  }
  ```

#### Testing

- [x] Test default variant with shadow
- [x] Test grouped variant without shadow
- [x] Test in light and dark mode
- [x] Verify 12pt corner radius
- [x] Verify 16pt internal padding

---

### 3.2 New: iOS List Components

#### 3.2.1 ListRow Component

**File:** `src/components/molecules/ListRow.tsx` (NEW)

- [x] **Create iOS-style list row component**

- [x] **Add accessory type support:**
  ```typescript
  type AccessoryType =
    | 'none'
    | 'disclosureIndicator'      // Chevron >
    | 'detailButton'             // Info icon (i)
    | 'checkmark'                // Checkmark ✓
    | 'detailDisclosureButton';  // Info icon + chevron

  interface ListRowProps {
    // Content
    title: string;
    subtitle?: string;

    // Left side
    leftIcon?: React.ReactNode;
    leftImage?: ImageSourcePropType;

    // Right side
    rightText?: string;
    accessoryType?: AccessoryType;

    // Interaction
    onPress?: () => void;
    onAccessoryPress?: () => void;  // For detail buttons

    // State
    disabled?: boolean;

    // Style
    style?: ViewStyle;
  }
  ```

- [x] **Implement layout:**
  ```
  [Icon/Image] [Title]              [RightText] [Accessory]
               [Subtitle]
  ```

- [x] **Styling:**
  - Height: minimum 44pt
  - Padding: 16pt horizontal, 12pt vertical (for subtitles)
  - Background: clear (row is in list/section container)
  - Separator: hairline at bottom (using separator color)

- [x] **Title styling:**
  - Text variant: 'body'
  - Color: 'label'

- [x] **Subtitle styling:**
  - Text variant: 'footnote'
  - Color: 'secondaryLabel'

- [x] **Left icon/image:**
  - Size: 29pt × 29pt (iOS standard)
  - Margin right: 12pt
  - Border radius: 6pt (for images)

- [x] **Right text:**
  - Text variant: 'body'
  - Color: 'tertiaryLabel'
  - Margin right: 8pt

- [x] **Accessory rendering:**
  - Chevron: Icon name="chevron-forward" size={20} color="tertiaryLabel"
  - Detail button: Icon name="information-circle-outline" size={22}
  - Checkmark: Icon name="checkmark" size={22} color="systemBlue"

- [x] **Press state:**
  - Subtle background highlight on press
  - Haptic feedback

#### 3.2.2 ListSection Component

**File:** `src/components/molecules/ListSection.tsx` (NEW)

- [x] **Create iOS-style list section with header/footer**

- [x] **Props interface:**
  ```typescript
  interface ListSectionProps {
    children: React.ReactNode;
    header?: string;
    footer?: string;
    style?: ViewStyle;
  }
  ```

- [x] **Layout:**
  ```
  [HEADER TEXT]
  ┌─────────────────────────────┐
  │ ListRow                      │
  ├─────────────────────────────┤
  │ ListRow                      │
  └─────────────────────────────┘
  [Footer text]
  ```

- [x] **Styling:**
  - Header: variant='footnote', color='secondaryLabel', uppercase, padding 16pt sides, 8pt top
  - Container: background secondarySystemGroupedBackground, rounded 12pt
  - Footer: variant='footnote', color='secondaryLabel', padding 16pt sides, 8pt bottom

- [x] **Add separators between rows**
  - Hairline separator using separator color
  - Inset 16pt from left (aligns with title text)

#### 3.2.3 SwipeableRow Component

**File:** `src/components/molecules/SwipeableRow.tsx` (NEW)

- [x] **Create swipeable row for iOS swipe actions**

- [x] **Install/verify dependency:**
  ```bash
  # react-native-gesture-handler already installed
  ```

- [x] **Props interface:**
  ```typescript
  interface SwipeAction {
    label: string;
    backgroundColor: string;
    onPress: () => void;
    icon?: React.ReactNode;
  }

  interface SwipeableRowProps {
    children: React.ReactNode;
    leftActions?: SwipeAction[];
    rightActions?: SwipeAction[];
  }
  ```

- [x] **Implement swipe gesture:**
  - Use react-native-gesture-handler
  - Swipe left reveals right actions (delete, etc.)
  - Swipe right reveals left actions (archive, etc.)
  - Haptic feedback when action revealed

- [x] **Common action presets:**
  ```typescript
  export const swipeActions = {
    delete: (onPress: () => void): SwipeAction => ({
      label: 'Delete',
      backgroundColor: systemRed,
      onPress,
      icon: <Icon name="trash-outline" size={20} color="white" />,
    }),

    archive: (onPress: () => void): SwipeAction => ({
      label: 'Archive',
      backgroundColor: systemOrange,
      onPress,
      icon: <Icon name="archive-outline" size={20} color="white" />,
    }),
  };
  ```

---

### 3.3 ListItem Component (Update Existing)

**File:** `src/components/molecules/ListItem.tsx`

#### Update to Use New iOS Patterns

- [x] **Refactor to use ListRow internally**
  - ListItem becomes a wrapper around ListRow
  - Maps old API to new ListRow API

- [x] **Or deprecate and replace with ListRow**
  - Add deprecation notice
  - Document migration path
  - Update all usage sites to ListRow

#### Decision Point
- [x] **Choose approach:** Refactor OR Deprecate
  - If refactor: update implementation to use ListRow
  - If deprecate: create migration guide, update usage sites
  - **Decision:** Deprecated and refactored to use ListRow internally for backward compatibility

---

### 3.4 SearchBar Component

**File:** `src/components/molecules/SearchBar.tsx`

#### Redesign for iOS Search Bar

- [x] **Update visual styling:**
  - Background: systemGray5 (light rounded background)
  - Corner radius: 10pt
  - Height: 36pt
  - Padding: 8pt horizontal

- [x] **Search icon on left:**
  - Icon name="search" size={18}
  - Color: secondaryLabel
  - Positioned inside input field

- [x] **Clear button on right:**
  - Icon name="close-circle" size={18}
  - Color: secondaryLabel
  - Only show when text entered
  - Tappable to clear

- [x] **Add cancel button:**
  ```typescript
  showCancelButton?: boolean;
  ```
  - Appears to right of search field when focused
  - Animated slide in/out
  - Text: "Cancel"
  - Plain button style
  - Clears input and dismisses keyboard on press

- [x] **Placeholder styling:**
  - Text: "Search"
  - Color: tertiaryLabel
  - Variant: body

- [x] **Update debounce timing:**
  - Keep 300ms default
  - Make configurable

#### Update Props Interface

- [x] **Update SearchBarProps:**
  ```typescript
  interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    showCancelButton?: boolean;
    onCancel?: () => void;
    debounceMs?: number;
    style?: ViewStyle;
  }
  ```

#### Testing

- [x] Test search icon appears
- [x] Test clear button appears when typing
- [x] Test clear button clears text
- [x] Test cancel button appears when focused (if enabled)
- [x] Test cancel button clears and dismisses keyboard
- [x] Test debouncing works
- [x] Test in light and dark mode

---

### 3.5 StatCard Component

**File:** `src/components/molecules/StatCard.tsx`

#### Remove All Hardcoded Colors

- [x] **Replace hardcoded colors with semantic colors:**
  - Background: `#1E1E1E` → `secondarySystemGroupedBackground`
  - Text: `#FFFFFF` → `label`
  - Secondary text: `#999` → `secondaryLabel`

- [x] **Use theme colors:**
  ```typescript
  const { colors } = useTheme();
  ```

#### Redesign to Match Apple Health

- [x] **Layout:**
  ```
  ┌─────────────────────────┐
  │ TITLE                   │
  │ 55                      │
  │ +12%  ↑                │
  └─────────────────────────┘
  ```

- [x] **Styling:**
  - Title: caption1, secondaryLabel, uppercase
  - Value: title1, label, bold
  - Change: footnote, colored by positive/negative
  - Padding: 16pt
  - Corner radius: 12pt
  - Background: secondarySystemGroupedBackground

- [x] **Trend indicator:**
  - Positive: systemGreen, up arrow ↑
  - Negative: systemRed, down arrow ↓
  - Neutral: secondaryLabel, horizontal dash —

#### Update Props Interface

- [x] **Update StatCardProps:**
  ```typescript
  interface StatCardProps {
    title: string;
    value: string | number;
    change?: {
      value: string;
      trend: 'positive' | 'negative' | 'neutral';
    };
    style?: ViewStyle;
  }
  ```

#### Testing

- [x] Test with positive change (green, up arrow)
- [x] Test with negative change (red, down arrow)
- [x] Test with neutral change
- [x] Test without change
- [x] Test in light and dark mode
- [x] Verify no hardcoded colors

---

### 3.6 ChartCard Component

**File:** `src/components/molecules/ChartCard.tsx`

#### Remove All Hardcoded Colors

- [x] **Replace hardcoded colors:**
  - Background: `#1E1E1E` → `secondarySystemGroupedBackground`
  - Title: `#FFFFFF` → `label`
  - Subtitle: `#999` → `secondaryLabel`

- [x] **Use theme colors:**
  ```typescript
  const { colors } = useTheme();
  ```

#### Redesign for iOS

- [x] **Layout:**
  ```
  ┌─────────────────────────────┐
  │ Chart Title                  │
  │                              │
  │ [Chart Content]              │
  │                              │
  └─────────────────────────────┘
  ```

- [x] **Styling:**
  - Title: headline, label
  - Padding: 16pt
  - Background: secondarySystemGroupedBackground
  - Corner radius: 12pt
  - Shadow: subtle (sm)

#### Update Props Interface

- [x] **Update ChartCardProps:**
  ```typescript
  interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;  // Chart component
    style?: ViewStyle;
  }
  ```

#### Testing

- [x] Test with chart content
- [x] Test title rendering
- [x] Test subtitle rendering
- [x] Test in light and dark mode
- [x] Verify no hardcoded colors

---

### 3.7 FormField Component

**File:** `src/components/molecules/FormField.tsx`

#### Update for iOS

- [x] **Verify uses updated Input component**
  - Should automatically get iOS styling from Phase 2

- [x] **Update spacing:**
  - Margin bottom: 16pt (8pt grid)

- [x] **Ensure label styling:**
  - Use caption1 or footnote variant
  - Color: secondaryLabel

#### Testing

- [x] Test FormField with new Input component
- [x] Test label styling
- [x] Test spacing
- [x] Test error state

---

### 3.8 WhitelistItem Component

**File:** `src/components/molecules/WhitelistItem.tsx`

#### Remove Inline Styles and Hardcoded Values

- [x] **Refactor to use new components:**
  - Use ListRow for base layout
  - Use Badge component for category
  - Use Text component with semantic colors

- [x] **Add swipe-to-delete:**
  - Wrap in SwipeableRow
  - Add delete action

#### Updated Implementation

- [x] **Use ListRow:**
  ```typescript
  <SwipeableRow
    rightActions={[swipeActions.delete(onDelete)]}
  >
    <ListRow
      title={name}
      subtitle={macAddress}
      rightText={category}
      accessoryType="none"
    />
  </SwipeableRow>
  ```

- [x] **Remove old inline styles**

- [x] **Update props interface:**
  ```typescript
  interface WhitelistItemProps {
    name: string;
    macAddress: string;
    category: string;
    onDelete: () => void;
  }
  ```

#### Testing

- [x] Test item renders correctly
- [x] Test swipe-to-delete works
- [x] Test delete action triggers
- [x] Test haptic feedback

---

## Update All Usage Sites

### Card Usage
- [x] Find all Card imports: `grep -r "from '@components/molecules/Card'" src/`
- [x] Update each usage:
  - [x] Verify variant prop (default or grouped)
  - [x] Remove press feedback expectations
  - [x] Verify styling matches iOS patterns

**Key files:**
- [x] DashboardScreen (multiple cards) - No usage found
- [x] AlertListScreen - No usage found
- [x] DeviceListScreen - No usage found
- [x] Any other screens using cards - No usage found

### SearchBar Usage
- [x] Find all SearchBar imports
- [x] Add cancel button where appropriate
- [x] Update event handlers

**Key files:**
- [x] AlertListScreen - No usage found
- [x] DeviceListScreen - No usage found
- [x] WhitelistScreen - No usage found

### StatCard & ChartCard Usage
- [x] Find all StatCard/ChartCard imports
- [x] Verify data props match new interfaces
- [x] Test rendering

**Key files:**
- [x] DashboardScreen - No usage found
- [x] Analytics screens - No usage found

---

## TypeScript Error Resolution

- [x] Run type check: `npm run type-check`
- [x] Fix all type errors related to molecule component changes
- [x] Update prop types where needed

---

## Testing Checklist

- [x] **Component Testing:**
  - [x] All molecules render correctly
  - [x] New iOS list components work
  - [x] Swipeable rows work
  - [x] Cards have correct iOS styling
  - [x] SearchBar has iOS appearance
  - [x] StatCard/ChartCard have no hardcoded colors

- [x] **Integration Testing:**
  - [x] Molecules work with updated atoms
  - [x] ListRow integrates with ListSection
  - [x] SwipeableRow wraps content correctly

- [x] **Visual Testing:**
  - [x] Test in iOS simulator
  - [x] Test in light mode
  - [x] Test in dark mode
  - [x] Compare to reference iOS apps

- [x] **Build Testing:**
  ```bash
  npm run type-check
  npm run lint
  npm start
  ```

---

## Success Criteria

- ✅ Card component has iOS inset grouped styling
- ✅ New ListRow, ListSection, SwipeableRow components created
- ✅ SearchBar has iOS appearance with cancel button
- ✅ StatCard and ChartCard have no hardcoded colors
- ✅ All molecules use theme semantic colors
- ✅ All molecules use updated atom components
- ✅ Swipe actions work on iOS
- ✅ All usage sites updated
- ✅ No TypeScript errors
- ✅ No linting errors

## Commit Messages

```bash
git commit -m "feat: update Card component to iOS inset grouped style"

git commit -m "feat: create iOS list components (ListRow, ListSection, SwipeableRow)"

git commit -m "feat: update SearchBar to iOS style with cancel button"

git commit -m "refactor: remove hardcoded colors from StatCard and ChartCard"

git commit -m "refactor: update all molecule component usage sites"
```

---

**Status:** ⬜ Not Started → ⬜ In Progress → ✅ Complete

**Next Phase:** `04-organism-components.md`
