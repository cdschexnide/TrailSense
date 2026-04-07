# Severity Filter 2×2 Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the horizontal filter chip row on the Alerts screen with a 2×2 grid layout so all 4 severity levels are always visible on any screen size.

**Architecture:** The `InlineFilterBar` container switches from a single-row flex layout to a wrapped 2-column layout. Each `FilterChip` stretches to fill its grid cell. No state management changes — only layout styles.

**Tech Stack:** React Native StyleSheet, `@testing-library/react-native`, Jest

---

### Task 1: Add flexWrap grid layout to InlineFilterBar

**Files:**
- Modify: `src/components/molecules/InlineFilterBar/InlineFilterBar.tsx`
- Create: `__tests__/components/molecules/InlineFilterBar.test.tsx`

- [ ] **Step 1: Write the failing test for 2×2 grid layout**

Create `__tests__/components/molecules/InlineFilterBar.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { InlineFilterBar } from '@components/molecules/InlineFilterBar/InlineFilterBar';

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        brandAccentBackground: 'rgba(251, 191, 36, 0.12)',
        brandAccent: '#fbbf24',
        separator: '#2a2a1a',
        primary: '#fbbf24',
        tertiaryLabel: '#8a887a',
      },
    },
    colorScheme: 'dark',
  }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const mockOptions = [
  { key: 'critical', label: 'CRITICAL', count: 16, color: '#ef4444' },
  { key: 'high', label: 'HIGH', count: 16, color: '#f59e0b' },
  { key: 'medium', label: 'MEDIUM', count: 22, color: '#fbbf24' },
  { key: 'low', label: 'LOW', count: 22, color: '#4ade80' },
];

describe('InlineFilterBar', () => {
  it('renders all 4 filter chips', () => {
    const { getByText } = render(
      <InlineFilterBar
        options={mockOptions}
        selectedKey={null}
        onSelect={jest.fn()}
      />
    );

    expect(getByText('CRITICAL')).toBeTruthy();
    expect(getByText('HIGH')).toBeTruthy();
    expect(getByText('MEDIUM')).toBeTruthy();
    expect(getByText('LOW')).toBeTruthy();
  });

  it('renders chips with width styling for 2-column grid', () => {
    const { getAllByRole } = render(
      <InlineFilterBar
        options={mockOptions}
        selectedKey={null}
        onSelect={jest.fn()}
      />
    );

    const chips = getAllByRole('button');
    expect(chips).toHaveLength(4);

    // Each chip should have a width style that constrains it to ~half the row
    chips.forEach(chip => {
      const flatStyle = Array.isArray(chip.props.style)
        ? Object.assign({}, ...chip.props.style.flat(Infinity).filter(Boolean))
        : chip.props.style;
      expect(flatStyle).toHaveProperty('width');
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/components/molecules/InlineFilterBar.test.tsx -v`

Expected: The first test passes (chips render), the second test fails because chips don't have a `width` style yet.

- [ ] **Step 3: Update InlineFilterBar to use 2-column wrapped layout**

Modify `src/components/molecules/InlineFilterBar/InlineFilterBar.tsx` — replace the entire file:

```tsx
/**
 * InlineFilterBar Component
 *
 * 2×2 grid of FilterChips for quick filtering.
 * Supports single selection with clear option.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FilterChip } from '../FilterChip';

interface FilterOption {
  key: string;
  label: string;
  count: number;
  color: string;
}

interface InlineFilterBarProps {
  options: FilterOption[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}

const COLUMN_GAP = 6;
const ROW_GAP = 6;

export const InlineFilterBar: React.FC<InlineFilterBarProps> = ({
  options,
  selectedKey,
  onSelect,
}) => {
  const handlePress = (key: string) => {
    // Toggle selection - tap again to clear
    onSelect(selectedKey === key ? null : key);
  };

  return (
    <View style={styles.container}>
      {options.map(option => (
        <FilterChip
          key={option.key}
          label={option.label}
          count={option.count}
          color={option.color}
          isSelected={selectedKey === option.key}
          onPress={() => handlePress(option.key)}
          style={styles.chip}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
    columnGap: COLUMN_GAP,
    rowGap: ROW_GAP,
  },
  chip: {
    width: '48.5%',
  },
});

export default InlineFilterBar;
```

Key changes:
- Added `flexWrap: 'wrap'` to container
- Split `gap` into `columnGap` and `rowGap` for clarity
- Added `styles.chip` with `width: '48.5%'` — passed to each FilterChip
- The percentage accounts for the 6px column gap between two chips

- [ ] **Step 4: Update FilterChip to accept a style prop**

Modify `src/components/molecules/FilterChip/FilterChip.tsx` — add `style` to the props interface and apply it to the outer `Pressable`:

Change the interface from:

```tsx
interface FilterChipProps {
  label: string;
  count: number;
  color: string;
  isSelected?: boolean;
  onPress?: () => void;
}
```

to:

```tsx
interface FilterChipProps {
  label: string;
  count: number;
  color: string;
  isSelected?: boolean;
  onPress?: () => void;
  style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
}
```

Then update the component to destructure the new prop:

```tsx
export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  count,
  color,
  isSelected = false,
  onPress,
  style,
}) => {
```

And apply it to the Pressable's style array — change:

```tsx
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isSelected
            ? colors.brandAccentBackground
            : 'transparent',
          borderColor: isSelected ? colors.brandAccent : colors.separator,
        },
        pressed && styles.pressed,
      ]}
```

to:

```tsx
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isSelected
            ? colors.brandAccentBackground
            : 'transparent',
          borderColor: isSelected ? colors.brandAccent : colors.separator,
        },
        pressed && styles.pressed,
        style,
      ]}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest __tests__/components/molecules/InlineFilterBar.test.tsx -v`

Expected: Both tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/molecules/InlineFilterBar/InlineFilterBar.tsx \
       src/components/molecules/FilterChip/FilterChip.tsx \
       __tests__/components/molecules/InlineFilterBar.test.tsx
git commit -m "feat: convert severity filter chips to 2×2 grid layout"
```

---

### Task 2: Add selection toggle test

**Files:**
- Modify: `__tests__/components/molecules/InlineFilterBar.test.tsx`

- [ ] **Step 1: Add test for selection toggle behavior**

Append to the `describe` block in `__tests__/components/molecules/InlineFilterBar.test.tsx`:

```tsx
  it('calls onSelect with key when chip is pressed', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <InlineFilterBar
        options={mockOptions}
        selectedKey={null}
        onSelect={onSelect}
      />
    );

    fireEvent.press(getByText('CRITICAL'));
    expect(onSelect).toHaveBeenCalledWith('critical');
  });

  it('calls onSelect with null when selected chip is pressed again', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <InlineFilterBar
        options={mockOptions}
        selectedKey="critical"
        onSelect={onSelect}
      />
    );

    fireEvent.press(getByText('CRITICAL'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });
```

Also add the `fireEvent` import at the top of the file:

```tsx
import { render, fireEvent } from '@testing-library/react-native';
```

- [ ] **Step 2: Run the tests to verify they pass**

Run: `npx jest __tests__/components/molecules/InlineFilterBar.test.tsx -v`

Expected: All 4 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add __tests__/components/molecules/InlineFilterBar.test.tsx
git commit -m "test: add selection toggle tests for InlineFilterBar"
```

---

### Task 3: Run full test suite and type-check

**Files:** None (verification only)

- [ ] **Step 1: Run type-check**

Run: `npm run type-check`

Expected: No type errors. If there are errors related to the `style` prop, fix the type in `FilterChip.tsx` to match what React Native expects.

- [ ] **Step 2: Run full test suite**

Run: `npm test`

Expected: All tests pass with no regressions.

- [ ] **Step 3: Run lint**

Run: `npm run lint:fix`

Expected: No lint errors in changed files.

- [ ] **Step 4: Commit any lint/type fixes if needed**

```bash
git add -u
git commit -m "fix: address lint/type issues from grid layout changes"
```

Only run this step if Step 1-3 required changes. Skip if everything passed cleanly.
