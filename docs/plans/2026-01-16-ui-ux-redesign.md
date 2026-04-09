# TrailSense UI/UX Redesign

**Date:** 2026-01-16
**Status:** Design Complete - Ready for Implementation

## Overview

A comprehensive UI/UX refactor of the TrailSense mobile app focused on achieving Apple-native polish. The underlying business logic, navigation logic, and core functionality remain unchanged. This refactor is purely visual design, user interface components, and overall user experience.

### Goals

- Modern, sleek, professional appearance
- Consistent feel across all screens
- Apple Human Interface Guidelines alignment
- Support for both light and dark modes

### Non-Goals

- Changing navigation structure
- Modifying business logic
- Adding new features

---

## Design Decisions

| Decision      | Choice                                                                     |
| ------------- | -------------------------------------------------------------------------- |
| Visual style  | Apple-native polish (Home, Wallet, Health apps)                            |
| Color modes   | Both light and dark                                                        |
| Status colors | Apple semantic colors (systemRed, systemOrange, systemGreen, systemYellow) |
| Brand accent  | Warm golden tan from logo (`#C9B896`)                                      |
| Summary cards | Interactive filter chips + scannable status                                |
| Primary goal  | Professional, modern, consistent feel                                      |

---

## Color System

### Brand Accent

Replace cyan/teal accent with warm golden tan derived from the TrailSense logo trail element.

```typescript
// Primary brand accent
brandAccent: '#C9B896'; // Golden tan (primary)
brandAccentLight: '#D4C9A8'; // Lighter variant
brandAccentDark: '#B5A682'; // Darker variant
```

### Status Colors

Adopt Apple's semantic colors for all status indicators:

```typescript
// Threat levels (use Apple semantic colors)
critical: systemRed; // #FF3B30 (light) / #FF453A (dark)
high: systemOrange; // #FF9500 (light) / #FF9F0A (dark)
medium: systemYellow; // #FFCC00 (light) / #FFD60A (dark)
low: systemGreen; // #34C759 (light) / #30D158 (dark)

// Device status
online: systemGreen;
offline: systemRed;
```

### Background Philosophy

- **Backgrounds are neutral** (system grays, grouped backgrounds)
- **Color indicates meaning** (status, alerts, interactive elements)
- **Accent color highlights actions** (buttons, links, selected states)

No more colored card backgrounds. Color is used only for:

- Status indicator dots
- Tinted icons
- Interactive element highlights
- Brand accent on primary buttons

---

## Component Patterns

### Cards & Containers

**Before:** Colored backgrounds and borders creating visual heaviness

**After:**

- `secondarySystemBackground` fill
- Subtle shadow (`shadowSm`) OR hairline border (never both)
- Consistent `12pt` corner radius
- `16pt` internal padding
- Color only for status indicators

### Summary Stat Cards

**Before:** Chunky colored boxes (Critical/High/Low)

**After:** Inline filter chips or minimal stat row

```
Option A - Filter Chips:
┌──────────┐ ┌──────────┐ ┌──────────┐
│ ● 6      │ │ ● 2      │ │ ● 0      │
│ Critical │ │ High     │ │ Low      │
└──────────┘ └──────────┘ └──────────┘

Option B - Inline Stats:
● 6 Critical    ● 2 High    ● 0 Low
```

- Neutral background
- Small colored dot indicates severity
- Selected state uses brand accent as subtle background tint
- Count is prominent, label is secondary

### List Items & Rows

Follow Apple's grouped inset list style:

```
┌─────────────────────────────────────┐
│  SECTION HEADER                     │  ← Muted, uppercase, small
├─────────────────────────────────────┤
│ ◉ Icon   Title                    › │  ← Row with chevron
│          Subtitle text              │
├─────────────────────────────────────┤
│ ◉ Icon   Title                    › │
│          Subtitle text              │
└─────────────────────────────────────┘
```

- Grouped container with rounded corners
- Inset separators (not full-width)
- Chevron `›` indicates navigation
- Consistent icon sizing (SF Symbols)

---

## Header & Navigation

### Screen Headers

**Before:** Cyan accent line + large title

**After:**

- Remove accent line entirely
- Native iOS large title style
- Action buttons use brand accent tint
- Summary stats integrated into header area

### Bottom Tab Bar

Current 6 tabs remain, with refinements:

- Rename "TrailSens..." to "AI" (prevents truncation)
- Selected state: brand accent (golden tan)
- Unselected: `secondaryLabel` gray
- SF Symbols with consistent weights

```
  ⚠️        📱        🗺️        📊       ✨        ⚙️
Alerts   Devices    Map    Analytics   AI    Settings
```

---

## Screen Designs

### Alerts List Screen

```
┌────────────────────────────────────┐
│ Alerts                    [Filter] │
│                                    │
│ 🔍 Search alerts...                │
│                                    │
│ ● 6 Critical  ● 2 High  ● 0 Low    │
├────────────────────────────────────┤
│ TODAY                              │
│ ┌────────────────────────────────┐ │
│ │ ●  Bluetooth Detection         │ │
│ │    -59 dBm · Nearby            │ │
│ │    trailsense-01             › │ │
│ └────────────────────────────────┘ │
│ ┌────────────────────────────────┐ │
│ │ ●  Cellular Detection          │ │
│ │    -72 dBm · Far               │ │
│ │    trailsense-01             › │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

Key changes:

- Inline filter chips (not colored boxes)
- Neutral card backgrounds with status dot
- Time-based grouping (Today, Yesterday, This Week)
- Swipe actions hidden until swipe gesture
- Clean hierarchy: Title → Metric → Source → Chevron

### Alert Detail Screen

```
┌────────────────────────────────────┐
│ ← Back                             │
│                                    │
│ Bluetooth Detection                │
│ High Priority · 3:37 PM            │
├────────────────────────────────────┤
│ SIGNAL                             │
│ ┌────────────────────────────────┐ │
│ │ ▁▂▃▅ -59 dBm                   │ │
│ │ Strong · Nearby                │ │
│ └────────────────────────────────┘ │
│                                    │
│ LOCATION                           │
│ ┌────────────────────────────────┐ │
│ │ 📍 30.3964, -94.3176           │ │
│ │    View on Map               › │ │
│ └────────────────────────────────┘ │
│                                    │
│ SOURCE DEVICE                      │
│ ┌────────────────────────────────┐ │
│ │ trailsense-01                › │ │
│ └────────────────────────────────┘ │
│                                    │
│ STATUS                             │
│ ┌────────────────────────────────┐ │
│ │ ✓ Mark Reviewed                │ │
│ │ ⚑ False Positive               │ │
│ ├────────────────────────────────┤ │
│ │ 🗑 Delete Alert                │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

Key changes:

- Detection type as screen title
- Priority as subtitle badge
- Grouped list sections
- GPS coordinates in LOCATION section
- Actions consolidated into single grouped list
- Delete visually distinct (red text)

### Devices List Screen

```
┌────────────────────────────────────┐
│ Devices                    [+ Add] │
│                                    │
│ ● 1 Online  ○ 0 Offline            │
├────────────────────────────────────┤
│ ONLINE                             │
│ ┌────────────────────────────────┐ │
│ │ ●  Front Gate Detector         │ │
│ │    85% · Good · 14,917         │ │
│ │    30.39, -94.31             › │ │
│ └────────────────────────────────┘ │
│                                    │
│ OFFLINE                            │
│ ┌────────────────────────────────┐ │
│ │    No offline devices          │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

Key changes:

- Inline status chips
- Simplified device cards
- Metrics inline: `85% · Good · 14,917`
- Grouped by status sections

### Device Detail Screen

```
┌────────────────────────────────────┐
│ ← Back                      [Edit] │
│                                    │
│ Front Gate Detector                │
│ ● Online · 3:37 PM                 │
├────────────────────────────────────┤
│ STATUS                             │
│ ┌────────────────────────────────┐ │
│ │ 🔋 Battery                 85% │ │
│ │ ▰▰▰▰▰▰▰▰▱▱                     │ │
│ ├────────────────────────────────┤ │
│ │ 📶 Signal                 Good │ │
│ │ ▁▂▃▅                           │ │
│ ├────────────────────────────────┤ │
│ │ 📊 Detections            14917 │ │
│ └────────────────────────────────┘ │
│                                    │
│ DEVICE INFO                        │
│ ┌────────────────────────────────┐ │
│ │ Firmware                 1.0.0 │ │
│ ├────────────────────────────────┤ │
│ │ Device ID             ts-d...  │ │
│ └────────────────────────────────┘ │
│                                    │
│ LOCATION                           │
│ ┌────────────────────────────────┐ │
│ │ 📍 30.3964, -94.3176           │ │
│ │    View on Map               › │ │
│ └────────────────────────────────┘ │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ 🗑 Remove Device               │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

### Map / Proximity Heatmap Screen

```
┌────────────────────────────────────┐
│ ← Back                             │
│                                    │
│ Front Gate Detector                │
│ ● Online · 85% · 30.39, -94.31     │
├────────────────────────────────────┤
│ ┌────────────────────────────────┐ │
│ │                                │ │
│ │        ((( ● )))               │ │
│ │                                │ │
│ │  ○ ○                           │ │
│ │                   [📍] [🗺️]    │ │
│ └────────────────────────────────┘ │
│                                    │
│ DETECTED DEVICES · 3               │
│ ┌────────────────────────────────┐ │
│ │ 📶  WiFi Device                │ │
│ │     ab3f...c821 · 94% · ±2.1m› │ │
│ ├────────────────────────────────┤ │
│ │ 📱  Cellular Device            │ │
│ │     f7a2...9e11 · 87% · ±5.3m› │ │
│ ├────────────────────────────────┤ │
│ │ 🔷  Bluetooth Device           │ │
│ │     c912...4a77 · 72% · ±8.7m› │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

Key changes:

- Device name as screen title
- Status as compact subtitle
- Device switching via horizontal swipe (page dots)
- Floating pill controls for recenter + map style
- Richer list items with accuracy
- Tap list item to center map on marker

### Analytics Screen

```
┌────────────────────────────────────┐
│ Analytics               [Reports]  │
│                                    │
│ ┌────────────────────────────────┐ │
│ │  24h   7d   30d   1y           │ │
│ └────────────────────────────────┘ │
├────────────────────────────────────┤
│ OVERVIEW                           │
│ ┌────────────────────────────────┐ │
│ │ Detections                   0 │ │
│ │ ↑ 12% vs last week             │ │
│ ├────────────────────────────────┤ │
│ │ Active Devices               1 │ │
│ │ ✓ All online                   │ │
│ └────────────────────────────────┘ │
│                                    │
│ DETECTION TREND                    │
│ ┌────────────────────────────────┐ │
│ │      📈                        │ │
│ │ No data for period             │ │
│ └────────────────────────────────┘ │
│                                    │
│ BY TYPE                            │
│ ┌────────────────────────────────┐ │
│ │ Bluetooth                  45% │ │
│ │ Cellular                   30% │ │
│ │ WiFi                       25% │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

Key changes:

- Segmented control for time period (native iOS style)
- Stats in grouped list format
- Trend indicators inline with metrics

### Settings Screen

Minor refinements only (already closest to iOS style):

- Remove icons from rows OR ensure consistent SF Symbol weights
- Current values right-aligned in muted color
- Profile card slightly elevated
- Add version footer

---

## Interaction & Polish

### Animations

| Interaction      | Animation                    |
| ---------------- | ---------------------------- |
| List item tap    | Subtle highlight fade (0.1s) |
| Card press       | Scale to 0.98 + dim          |
| Status changes   | Fade crossfade (0.3s)        |
| Filter selection | Spring animation             |
| Pull to refresh  | Native iOS rubber-band       |
| Swipe actions    | Velocity-based spring        |

### Haptic Feedback

- `impact(light)` - Button taps, filter selections
- `impact(medium)` - Swipe action triggers
- `notification(success)` - Mark as reviewed, whitelist added
- `notification(warning)` - Delete confirmation appears
- `notification(error)` - Failed action

### Empty States

```
┌────────────────────────────────────┐
│           ○                        │  ← SF Symbol, 48pt, tertiaryLabel
│                                    │
│      No Alerts Yet                 │  ← title3, label color
│                                    │
│   When threats are detected,       │  ← body, secondaryLabel
│   they'll appear here              │
└────────────────────────────────────┘
```

- Outline-style icon
- Short, clear title
- Helpful description (max 2 lines)
- Optional action button

### Loading States

Skeleton screens matching content shape with shimmer animation (1-2s cycle).

---

## Implementation Priority

| Priority | Scope                                | Rationale                    |
| -------- | ------------------------------------ | ---------------------------- |
| **P0**   | Design tokens (colors, brand accent) | Foundation for everything    |
| **P1**   | Alerts List + Alert Detail           | Most-used, high visibility   |
| **P1**   | Devices List + Device Detail         | Second most-used             |
| **P2**   | Summary stat components              | Used across multiple screens |
| **P2**   | Card & ListSection components        | Core building blocks         |
| **P3**   | Map/Proximity Heatmap                | Already partially updated    |
| **P3**   | Analytics Dashboard                  | Lower frequency usage        |
| **P4**   | Settings screens                     | Already closest to iOS style |
| **P4**   | Empty/Loading states                 | Polish layer                 |

---

## Files to Modify

### Core Design System

- `src/constants/colors.ts` - Add brand accent, refine threat colors
- `src/theme/dark.ts` - Update with new palette
- `src/theme/light.ts` - Create proper light mode palette

### Components (Atoms)

- `src/components/atoms/Badge/` - Update color usage
- `src/components/atoms/Button/` - Brand accent as primary

### Components (Molecules)

- `src/components/molecules/StatCard.tsx` - Redesign as filter chips
- `src/components/molecules/Card/` - Neutral backgrounds
- `src/components/molecules/ListSection/` - Grouped inset style

### Components (Organisms)

- `src/components/organisms/AlertCard/` - Remove colored bg, add status dot
- `src/components/organisms/DeviceCard/` - Simplify, neutral bg
- `src/components/organisms/HeaderHero/` - Remove accent line

### Screens

- `src/screens/alerts/*` - Apply new patterns
- `src/screens/devices/*` - Apply new patterns
- `src/screens/radar/*` - Apply new patterns
- `src/screens/analytics/*` - Apply new patterns
- `src/screens/settings/*` - Minor refinements

---

## Design Principles

1. **Color = meaning** - Never decorative, only for status/actions
2. **Neutral containers** - Cards use system backgrounds
3. **Consistent spacing** - 8pt grid, 20pt margins, 16pt card padding
4. **Typography hierarchy** - Font weight and size, not color
5. **Subtle depth** - Light shadows or hairline borders, never both
6. **Native patterns** - When in doubt, reference Apple's Settings or Health app
