# Phase 3: Molecule Components

**Duration:** 10-12 hours
**Status:** ⬜ Not Started

## Overview

This phase refactors molecule components to use iOS design patterns and the new atom component APIs from Phase 2. This includes Card, ListItem, SearchBar, StatCard, ChartCard, and new iOS-specific list components.

## Prerequisites

- [x] Phase 1 complete (design system)
- [x] Phase 2 complete (atom components)
- [ ] Understand iOS list patterns (inset grouped)
- [ ] Understand iOS card design
- [ ] Reference iOS Settings app for patterns

## Tasks

### 3.1 Card Component

**File:** `src/components/molecules/Card.tsx`

#### Implement iOS Inset Grouped Card Style

- [ ] **Update base styling:**
  - [ ] Corner radius: 12pt (from spacing constants)
  - [ ] Background: secondarySystemGroupedBackground
  - [ ] Shadow: subtle iOS shadow (sm from Phase 1)
  - [ ] Margin: 16pt from screen edges
  - [ ] Padding: 16pt internal

- [ ] **Remove press feedback**
  - [ ] iOS cards typically don't have press states
  - [ ] If pressable needed, use plain tap (no visual feedback)

- [ ] **Add `grouped` variant prop**
  ```typescript
  variant?: 'default' | 'grouped';
  ```
  - default: White background, shadow
  - grouped: secondarySystemGroupedBackground, no shadow

- [ ] **Update shadow logic**
  - Use shadow only for 'default' variant
  - No shadow for 'grouped' variant
  - Ensure shadow adapts to dark mode

#### Update Props Interface

- [ ] **Remove/update incompatible props:**
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

- [ ] Test default variant with shadow
- [ ] Test grouped variant without shadow
- [ ] Test in light and dark mode
- [ ] Verify 12pt corner radius
- [ ] Verify 16pt internal padding

---

### 3.2 New: iOS List Components

#### 3.2.1 ListRow Component

**File:** `src/components/molecules/ListRow.tsx` (NEW)

- [ ] **Create iOS-style list row component**

- [ ] **Add accessory type support:**
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

- [ ] **Implement layout:**
  ```
  [Icon/Image] [Title]              [RightText] [Accessory]
               [Subtitle]
  ```

- [ ] **Styling:**
  - Height: minimum 44pt
  - Padding: 16pt horizontal, 12pt vertical (for subtitles)
  - Background: clear (row is in list/section container)
  - Separator: hairline at bottom (using separator color)

- [ ] **Title styling:**
  - Text variant: 'body'
  - Color: 'label'

- [ ] **Subtitle styling:**
  - Text variant: 'footnote'
  - Color: 'secondaryLabel'

- [ ] **Left icon/image:**
  - Size: 29pt × 29pt (iOS standard)
  - Margin right: 12pt
  - Border radius: 6pt (for images)

- [ ] **Right text:**
  - Text variant: 'body'
  - Color: 'tertiaryLabel'
  - Margin right: 8pt

- [ ] **Accessory rendering:**
  - Chevron: Icon name="chevron-forward" size={20} color="tertiaryLabel"
  - Detail button: Icon name="information-circle-outline" size={22}
  - Checkmark: Icon name="checkmark" size={22} color="systemBlue"

- [ ] **Press state:**
  - Subtle background highlight on press
  - Haptic feedback

#### 3.2.2 ListSection Component

**File:** `src/components/molecules/ListSection.tsx` (NEW)

- [ ] **Create iOS-style list section with header/footer**

- [ ] **Props interface:**
  ```typescript
  interface ListSectionProps {
    children: React.ReactNode;
    header?: string;
    footer?: string;
    style?: ViewStyle;
  }
  ```

- [ ] **Layout:**
  ```
  [HEADER TEXT]
  ┌─────────────────────────────┐
  │ ListRow                      │
  ├─────────────────────────────┤
  │ ListRow                      │
  └─────────────────────────────┘
  [Footer text]
  ```

- [ ] **Styling:**
  - Header: variant='footnote', color='secondaryLabel', uppercase, padding 16pt sides, 8pt top
  - Container: background secondarySystemGroupedBackground, rounded 12pt
  - Footer: variant='footnote', color='secondaryLabel', padding 16pt sides, 8pt bottom

- [ ] **Add separators between rows**
  - Hairline separator using separator color
  - Inset 16pt from left (aligns with title text)

#### 3.2.3 SwipeableRow Component

**File:** `src/components/molecules/SwipeableRow.tsx` (NEW)

- [ ] **Create swipeable row for iOS swipe actions**

- [ ] **Install/verify dependency:**
  ```bash
  # react-native-gesture-handler already installed
  ```

- [ ] **Props interface:**
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

- [ ] **Implement swipe gesture:**
  - Use react-native-gesture-handler
  - Swipe left reveals right actions (delete, etc.)
  - Swipe right reveals left actions (archive, etc.)
  - Haptic feedback when action revealed

- [ ] **Common action presets:**
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

- [ ] **Refactor to use ListRow internally**
  - ListItem becomes a wrapper around ListRow
  - Maps old API to new ListRow API

- [ ] **Or deprecate and replace with ListRow**
  - Add deprecation notice
  - Document migration path
  - Update all usage sites to ListRow

#### Decision Point
- [ ] **Choose approach:** Refactor OR Deprecate
  - If refactor: update implementation to use ListRow
  - If deprecate: create migration guide, update usage sites

---

### 3.4 SearchBar Component

**File:** `src/components/molecules/SearchBar.tsx`

#### Redesign for iOS Search Bar

- [ ] **Update visual styling:**
  - Background: systemGray5 (light rounded background)
  - Corner radius: 10pt
  - Height: 36pt
  - Padding: 8pt horizontal

- [ ] **Search icon on left:**
  - Icon name="search" size={18}
  - Color: secondaryLabel
  - Positioned inside input field

- [ ] **Clear button on right:**
  - Icon name="close-circle" size={18}
  - Color: secondaryLabel
  - Only show when text entered
  - Tappable to clear

- [ ] **Add cancel button:**
  ```typescript
  showCancelButton?: boolean;
  ```
  - Appears to right of search field when focused
  - Animated slide in/out
  - Text: "Cancel"
  - Plain button style
  - Clears input and dismisses keyboard on press

- [ ] **Placeholder styling:**
  - Text: "Search"
  - Color: tertiaryLabel
  - Variant: body

- [ ] **Update debounce timing:**
  - Keep 300ms default
  - Make configurable

#### Update Props Interface

- [ ] **Update SearchBarProps:**
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

- [ ] Test search icon appears
- [ ] Test clear button appears when typing
- [ ] Test clear button clears text
- [ ] Test cancel button appears when focused (if enabled)
- [ ] Test cancel button clears and dismisses keyboard
- [ ] Test debouncing works
- [ ] Test in light and dark mode

---

### 3.5 StatCard Component

**File:** `src/components/molecules/StatCard.tsx`

#### Remove All Hardcoded Colors

- [ ] **Replace hardcoded colors with semantic colors:**
  - Background: `#1E1E1E` → `secondarySystemGroupedBackground`
  - Text: `#FFFFFF` → `label`
  - Secondary text: `#999` → `secondaryLabel`

- [ ] **Use theme colors:**
  ```typescript
  const { colors } = useTheme();
  ```

#### Redesign to Match Apple Health

- [ ] **Layout:**
  ```
  ┌─────────────────────────┐
  │ TITLE                   │
  │ 55                      │
  │ +12%  ↑                │
  └─────────────────────────┘
  ```

- [ ] **Styling:**
  - Title: caption1, secondaryLabel, uppercase
  - Value: title1, label, bold
  - Change: footnote, colored by positive/negative
  - Padding: 16pt
  - Corner radius: 12pt
  - Background: secondarySystemGroupedBackground

- [ ] **Trend indicator:**
  - Positive: systemGreen, up arrow ↑
  - Negative: systemRed, down arrow ↓
  - Neutral: secondaryLabel, horizontal dash —

#### Update Props Interface

- [ ] **Update StatCardProps:**
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

- [ ] Test with positive change (green, up arrow)
- [ ] Test with negative change (red, down arrow)
- [ ] Test with neutral change
- [ ] Test without change
- [ ] Test in light and dark mode
- [ ] Verify no hardcoded colors

---

### 3.6 ChartCard Component

**File:** `src/components/molecules/ChartCard.tsx`

#### Remove All Hardcoded Colors

- [ ] **Replace hardcoded colors:**
  - Background: `#1E1E1E` → `secondarySystemGroupedBackground`
  - Title: `#FFFFFF` → `label`
  - Subtitle: `#999` → `secondaryLabel`

- [ ] **Use theme colors:**
  ```typescript
  const { colors } = useTheme();
  ```

#### Redesign for iOS

- [ ] **Layout:**
  ```
  ┌─────────────────────────────┐
  │ Chart Title                  │
  │                              │
  │ [Chart Content]              │
  │                              │
  └─────────────────────────────┘
  ```

- [ ] **Styling:**
  - Title: headline, label
  - Padding: 16pt
  - Background: secondarySystemGroupedBackground
  - Corner radius: 12pt
  - Shadow: subtle (sm)

#### Update Props Interface

- [ ] **Update ChartCardProps:**
  ```typescript
  interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;  // Chart component
    style?: ViewStyle;
  }
  ```

#### Testing

- [ ] Test with chart content
- [ ] Test title rendering
- [ ] Test subtitle rendering
- [ ] Test in light and dark mode
- [ ] Verify no hardcoded colors

---

### 3.7 FormField Component

**File:** `src/components/molecules/FormField.tsx`

#### Update for iOS

- [ ] **Verify uses updated Input component**
  - Should automatically get iOS styling from Phase 2

- [ ] **Update spacing:**
  - Margin bottom: 16pt (8pt grid)

- [ ] **Ensure label styling:**
  - Use caption1 or footnote variant
  - Color: secondaryLabel

#### Testing

- [ ] Test FormField with new Input component
- [ ] Test label styling
- [ ] Test spacing
- [ ] Test error state

---

### 3.8 WhitelistItem Component

**File:** `src/components/molecules/WhitelistItem.tsx`

#### Remove Inline Styles and Hardcoded Values

- [ ] **Refactor to use new components:**
  - Use ListRow for base layout
  - Use Badge component for category
  - Use Text component with semantic colors

- [ ] **Add swipe-to-delete:**
  - Wrap in SwipeableRow
  - Add delete action

#### Updated Implementation

- [ ] **Use ListRow:**
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

- [ ] **Remove old inline styles**

- [ ] **Update props interface:**
  ```typescript
  interface WhitelistItemProps {
    name: string;
    macAddress: string;
    category: string;
    onDelete: () => void;
  }
  ```

#### Testing

- [ ] Test item renders correctly
- [ ] Test swipe-to-delete works
- [ ] Test delete action triggers
- [ ] Test haptic feedback

---

## Update All Usage Sites

### Card Usage
- [ ] Find all Card imports: `grep -r "from '@components/molecules/Card'" src/`
- [ ] Update each usage:
  - [ ] Verify variant prop (default or grouped)
  - [ ] Remove press feedback expectations
  - [ ] Verify styling matches iOS patterns

**Key files:**
- [ ] DashboardScreen (multiple cards)
- [ ] AlertListScreen
- [ ] DeviceListScreen
- [ ] Any other screens using cards

### SearchBar Usage
- [ ] Find all SearchBar imports
- [ ] Add cancel button where appropriate
- [ ] Update event handlers

**Key files:**
- [ ] AlertListScreen
- [ ] DeviceListScreen
- [ ] WhitelistScreen

### StatCard & ChartCard Usage
- [ ] Find all StatCard/ChartCard imports
- [ ] Verify data props match new interfaces
- [ ] Test rendering

**Key files:**
- [ ] DashboardScreen
- [ ] Analytics screens

---

## TypeScript Error Resolution

- [ ] Run type check: `npm run type-check`
- [ ] Fix all type errors related to molecule component changes
- [ ] Update prop types where needed

---

## Testing Checklist

- [ ] **Component Testing:**
  - [ ] All molecules render correctly
  - [ ] New iOS list components work
  - [ ] Swipeable rows work
  - [ ] Cards have correct iOS styling
  - [ ] SearchBar has iOS appearance
  - [ ] StatCard/ChartCard have no hardcoded colors

- [ ] **Integration Testing:**
  - [ ] Molecules work with updated atoms
  - [ ] ListRow integrates with ListSection
  - [ ] SwipeableRow wraps content correctly

- [ ] **Visual Testing:**
  - [ ] Test in iOS simulator
  - [ ] Test in light mode
  - [ ] Test in dark mode
  - [ ] Compare to reference iOS apps

- [ ] **Build Testing:**
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
