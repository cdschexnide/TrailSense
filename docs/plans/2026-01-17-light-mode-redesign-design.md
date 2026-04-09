# Light Mode Redesign: Olive-Grey Earthy

> **For Claude:** Implement directly - this is a focused color constants update.

**Goal:** Replace harsh white/gray light mode with olive-grey earthy tones that align with TrailSense brand identity.

**File:** `src/constants/colors.ts` (light mode section only)

---

## Brand Color Reference

From TrailSense logo:

- Background olive/khaki: `#6B6B4E`
- Icon charcoal: `#2D2A24`
- Trail tan/sand: `#C9B896`

---

## Design Decisions

1. **Mood:** Olive-Grey Earthy (natural outdoor feel)
2. **Background intensity:** Olive-grey tones, not cream/off-white
3. **Accent colors:** Earthy replacements - brand olive for primary, muted versions of red/green/etc.
4. **Text colors:** Warm charcoal (matches logo icon)

---

## Color Changes

### Backgrounds (Olive-Grey)

| Token                              | Old       | New       |
| ---------------------------------- | --------- | --------- |
| `systemBackground`                 | `#FFFFFF` | `#E9E8E3` |
| `secondarySystemBackground`        | `#F2F2F7` | `#DFDDD7` |
| `tertiarySystemBackground`         | `#FFFFFF` | `#D5D3CC` |
| `systemGroupedBackground`          | `#F2F2F7` | `#E4E3DD` |
| `secondarySystemGroupedBackground` | `#FFFFFF` | `#EBEAE5` |
| `tertiarySystemGroupedBackground`  | `#F2F2F7` | `#D9D7D0` |

### Labels (Text)

| Token             | Old                      | New                      |
| ----------------- | ------------------------ | ------------------------ |
| `label`           | `#000000`                | `#2D2A24`                |
| `secondaryLabel`  | `rgba(60, 60, 67, 0.6)`  | `rgba(45, 42, 36, 0.60)` |
| `tertiaryLabel`   | `rgba(60, 60, 67, 0.3)`  | `rgba(45, 42, 36, 0.38)` |
| `quaternaryLabel` | `rgba(60, 60, 67, 0.18)` | `rgba(45, 42, 36, 0.22)` |

### Fills

| Token                  | Old                         | New                      |
| ---------------------- | --------------------------- | ------------------------ |
| `systemFill`           | `rgba(120, 120, 128, 0.2)`  | `rgba(90, 82, 70, 0.15)` |
| `secondarySystemFill`  | `rgba(120, 120, 128, 0.16)` | `rgba(90, 82, 70, 0.12)` |
| `tertiarySystemFill`   | `rgba(118, 118, 128, 0.12)` | `rgba(90, 82, 70, 0.09)` |
| `quaternarySystemFill` | `rgba(116, 116, 128, 0.08)` | `rgba(90, 82, 70, 0.06)` |

### Separators

| Token             | Old                      | New                      |
| ----------------- | ------------------------ | ------------------------ |
| `separator`       | `rgba(60, 60, 67, 0.29)` | `rgba(90, 90, 80, 0.25)` |
| `opaqueSeparator` | `#C6C6C8`                | `#C5C5BB`                |

### Gray Scale (Olive-Shifted)

| Token         | Old       | New       |
| ------------- | --------- | --------- |
| `systemGray`  | `#8E8E93` | `#7A7A70` |
| `systemGray2` | `#AEAEB2` | `#9A9A90` |
| `systemGray3` | `#C7C7CC` | `#B5B5AB` |
| `systemGray4` | `#D1D1D6` | `#C5C5BB` |
| `systemGray5` | `#E5E5EA` | `#D5D5CB` |
| `systemGray6` | `#F2F2F7` | `#E4E3DD` |

### Gradients

| Token                       | Old                                                      | New                                                               |
| --------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| `gradients.cardHeader`      | `['rgba(0,0,0,0.02)', 'rgba(0,0,0,0)']`                  | `['rgba(90,90,80,0.04)', 'rgba(90,90,80,0)']`                     |
| `gradients.statsBackground` | `['#F2F2F7', '#E5E5EA']`                                 | `['#E4E3DD', '#D5D5CB']`                                          |
| `gradients.shimmer`         | `['rgba(0,0,0,0)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0)']` | `['rgba(90,90,80,0)', 'rgba(90,90,80,0.06)', 'rgba(90,90,80,0)']` |

### Accent Colors (Earthy Replacements)

| Token          | Old (iOS) | New (Earthy)                   |
| -------------- | --------- | ------------------------------ |
| `systemBlue`   | `#007AFF` | `#6B6B4E` (Brand Olive)        |
| `systemGreen`  | `#34C759` | `#5A8A5A` (Muted Olive-Green)  |
| `systemRed`    | `#FF3B30` | `#B84A42` (Muted Dusty Red)    |
| `systemOrange` | `#FF9500` | `#C47F30` (Muted Burnt Orange) |
| `systemYellow` | `#FFCC00` | `#C9A030` (Muted Ochre)        |
| `systemPurple` | `#AF52DE` | `#8A6090` (Muted Dusty Purple) |
| `systemPink`   | `#FF2D55` | `#A85060` (Muted Dusty Rose)   |
| `systemTeal`   | `#5AC8FA` | `#5A9090` (Muted Sage)         |
| `systemIndigo` | `#5856D6` | `#5A5A80` (Muted Slate)        |

### Status & Threat Colors (Muted)

| Token             | Old       | New       |
| ----------------- | --------- | --------- |
| `threat.critical` | `#FF3B30` | `#B84A42` |
| `threat.high`     | `#FF9500` | `#C47F30` |
| `threat.medium`   | `#FFCC00` | `#C9A030` |
| `threat.low`      | `#34C759` | `#5A8A5A` |
| `online`          | `#34C759` | `#5A8A5A` |
| `offline`         | `#8E8E93` | `#7A7A70` |

### Backward Compatibility Aliases

| Token            | New Value                |
| ---------------- | ------------------------ |
| `background`     | `#E9E8E3`                |
| `surface`        | `#DFDDD7`                |
| `surfaceVariant` | `#D5D3CC`                |
| `text.primary`   | `#2D2A24`                |
| `text.secondary` | `rgba(45, 42, 36, 0.60)` |
| `text.disabled`  | `rgba(45, 42, 36, 0.38)` |
| `text.inverse`   | `#FFFFFF` (unchanged)    |
| `border`         | `rgba(90, 90, 80, 0.25)` |
| `divider`        | `rgba(90, 90, 80, 0.25)` |

---

## Unchanged

- `brandAccent*` colors (already brand-aligned)
- `primary` semantic alias (already brand tan)
- Dark mode (all colors remain as-is)

---

## Implementation

Single file update: `src/constants/colors.ts`

Update only the `Colors.light` object with the new values above. Dark mode remains unchanged.
