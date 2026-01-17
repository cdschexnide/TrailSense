# Light Mode Redesign: Warm & Earthy

> **For Claude:** Implement directly - this is a focused color constants update.

**Goal:** Replace harsh white/gray light mode with warm, earthy tones that align with TrailSense brand identity.

**File:** `src/constants/colors.ts` (light mode section only)

---

## Brand Color Reference

From TrailSense logo:
- Background olive/khaki: `#6B6B4E`
- Icon charcoal: `#2D2A24`
- Trail tan/sand: `#C9B896`

---

## Design Decisions

1. **Mood:** Warm & Earthy (parchment/natural materials feel)
2. **Background intensity:** Noticeable warmth - distinct cream/parchment
3. **Accent colors:** Keep iOS standard (blue, green, red, etc.)
4. **Text colors:** Soften to warm charcoal (matches logo icon)

---

## Color Changes

### Backgrounds

| Token | Old | New |
|-------|-----|-----|
| `systemBackground` | `#FFFFFF` | `#F8F6F1` |
| `secondarySystemBackground` | `#F2F2F7` | `#F2EDE4` |
| `tertiarySystemBackground` | `#FFFFFF` | `#EDE7DB` |
| `systemGroupedBackground` | `#F2F2F7` | `#F5F2EB` |
| `secondarySystemGroupedBackground` | `#FFFFFF` | `#FAF8F4` |
| `tertiarySystemGroupedBackground` | `#F2F2F7` | `#F0EBE2` |

### Labels (Text)

| Token | Old | New |
|-------|-----|-----|
| `label` | `#000000` | `#2D2A24` |
| `secondaryLabel` | `rgba(60, 60, 67, 0.6)` | `rgba(45, 42, 36, 0.60)` |
| `tertiaryLabel` | `rgba(60, 60, 67, 0.3)` | `rgba(45, 42, 36, 0.38)` |
| `quaternaryLabel` | `rgba(60, 60, 67, 0.18)` | `rgba(45, 42, 36, 0.22)` |

### Fills

| Token | Old | New |
|-------|-----|-----|
| `systemFill` | `rgba(120, 120, 128, 0.2)` | `rgba(90, 82, 70, 0.15)` |
| `secondarySystemFill` | `rgba(120, 120, 128, 0.16)` | `rgba(90, 82, 70, 0.12)` |
| `tertiarySystemFill` | `rgba(118, 118, 128, 0.12)` | `rgba(90, 82, 70, 0.09)` |
| `quaternarySystemFill` | `rgba(116, 116, 128, 0.08)` | `rgba(90, 82, 70, 0.06)` |

### Separators

| Token | Old | New |
|-------|-----|-----|
| `separator` | `rgba(60, 60, 67, 0.29)` | `rgba(45, 42, 36, 0.18)` |
| `opaqueSeparator` | `#C6C6C8` | `#DDD8CE` |

### Gray Scale (Warm-Shifted)

| Token | Old | New |
|-------|-----|-----|
| `systemGray` | `#8E8E93` | `#8A8579` |
| `systemGray2` | `#AEAEB2` | `#ACA69A` |
| `systemGray3` | `#C7C7CC` | `#C5BFAE` |
| `systemGray4` | `#D1D1D6` | `#D0CABF` |
| `systemGray5` | `#E5E5EA` | `#E3DED3` |
| `systemGray6` | `#F2F2F7` | `#F0EBE2` |

### Gradients

| Token | Old | New |
|-------|-----|-----|
| `gradients.cardHeader` | `['rgba(0,0,0,0.02)', 'rgba(0,0,0,0)']` | `['rgba(45,42,36,0.03)', 'rgba(45,42,36,0)']` |
| `gradients.statsBackground` | `['#F2F2F7', '#E5E5EA']` | `['#F5F2EB', '#E8E2D6']` |
| `gradients.shimmer` | `['rgba(0,0,0,0)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0)']` | `['rgba(45,42,36,0)', 'rgba(45,42,36,0.04)', 'rgba(45,42,36,0)']` |

### Backward Compatibility Aliases

| Token | New Value |
|-------|-----------|
| `background` | `#F8F6F1` |
| `surface` | `#F2EDE4` |
| `surfaceVariant` | `#E3DED3` |
| `text.primary` | `#2D2A24` |
| `text.secondary` | `rgba(45, 42, 36, 0.60)` |
| `text.disabled` | `rgba(45, 42, 36, 0.38)` |
| `text.inverse` | `#FFFFFF` (unchanged) |
| `border` | `rgba(45, 42, 36, 0.18)` |
| `divider` | `rgba(45, 42, 36, 0.18)` |

---

## Unchanged (Keep iOS Standard)

- `systemBlue`, `systemGreen`, `systemRed`, `systemOrange`, `systemYellow`
- `systemPurple`, `systemPink`, `systemTeal`, `systemIndigo`
- `threat.*` colors
- `detection.*` colors
- `battery.*` colors
- `online`/`offline` status colors
- `primary`, `success`, `warning`, `error`, `info` semantic aliases
- `brandAccent*` colors
- `threatBackground.*` colors
- `deviceStatusBackground.*` colors

---

## Implementation

Single file update: `src/constants/colors.ts`

Update only the `Colors.light` object with the new values above. Dark mode remains unchanged.
