# Header Redesign: Apple Native Style

> **For Claude:** Implement directly - this is a focused component update.

**Goal:** Simplify headers to match iOS native apps - remove visual noise, reduce height, improve consistency.

**File:** `src/components/organisms/Header/Header.tsx`

---

## Design Specifications

### Main Tab Screens (largeTitle = true)

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  Alerts                                   ⚙ Filter    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

- Large bold title (34pt, weight 700)
- Right action as plain text link with icon
- No accent stripe
- No pill background on actions
- 16px horizontal padding

### Detail/Sub Screens (largeTitle = false, showBack = true)

```
┌────────────────────────────────────────────────────────┐
│  ‹ Back              Front Gate Detector               │
│                      Online · 85% · 30.39°N            │
└────────────────────────────────────────────────────────┘
```

- Centered title (17pt semibold)
- Optional subtitle below
- Back button left-aligned

---

## Implementation Changes

### Remove:
1. `VARIANT_GRADIENTS` constant - no longer needed
2. `accentLine` View and `LinearGradient` - remove entirely
3. `actionPill` wrapper and its background styling
4. `variant` prop - no longer affects styling

### Simplify:
1. Right actions render directly without pill wrapper
2. Remove gradient import if no longer used elsewhere
3. Clean up unused styles

### Keep:
1. Scroll animations for large title collapse
2. Back button functionality
3. Subtitle support
4. testID prop

---

## Style Updates

```typescript
// Remove these styles:
- accentLine
- accentGradient
- actionPill

// Update these:
rightActionsContainer: {
  // Remove pill, just position the actions
}

largeTitleContent: {
  // Remove extra padding that was for accent stripe
}
```

---

## Affected Screens

All screens using Header component will automatically get the new style:
- AlertsListScreen
- DeviceListScreen
- AnalyticsDashboard
- SettingsScreen
- All detail screens
