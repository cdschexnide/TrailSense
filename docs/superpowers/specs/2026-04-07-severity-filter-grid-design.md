# Severity Filter 2×2 Grid Layout

## Problem

The alert severity filter chips (Critical, High, Medium, Low) are rendered in a single horizontal row. On small screens or devices with large font sizes, the rightmost chips overflow off-screen with no way to access them.

## Solution

Replace the single-row horizontal layout in `InlineFilterBar` with a 2-column wrapped layout, producing a consistent 2×2 grid of severity chips.

## Design

### Layout

- The `InlineFilterBar` container uses `flexWrap: 'wrap'` with `flexDirection: 'row'`
- Each `FilterChip` gets a flex-basis of ~48% so exactly 2 chips fit per row
- The existing 6px gap between chips is preserved
- Result: a 2×2 grid that never overflows regardless of screen size or font scale

### Chip Behavior

- Single-select toggle (unchanged from current behavior)
- Full labels preserved: count + severity name (e.g., "16 CRITICAL")
- Chips stretch to fill their grid cell for uniform appearance

## Files to Change

### `src/components/molecules/InlineFilterBar/InlineFilterBar.tsx`

- Change container style from single-row horizontal to wrapped 2-column layout
- Add `flexWrap: 'wrap'` to the container
- Set child width to approximately 48% of container width

### `src/components/molecules/FilterChip/FilterChip.tsx`

- Accept an optional `style` prop (or use `flex: 1`) so chips stretch to fill their grid cell

## Files NOT Changed

- `FilterChip` visual design (colors, dot, count, border, selection state)
- Haptic feedback behavior
- Filter state management (route params)
- `AlertsHeaderHero` structure
- `AlertFilterScreen` (full filter modal)
- Accessibility attributes

## Testing

- Verify 2×2 layout renders correctly on standard screen sizes
- Verify layout holds on small screens (iPhone SE) and with large Dynamic Type
- Verify tap targets remain accessible at all sizes
- Verify selection/deselection behavior unchanged
