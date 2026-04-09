# Alerts & Devices UI/UX Redesign: Tesla/Rivian Dashboard Style

**Date:** 2026-01-17
**Status:** Design Complete - Ready for Implementation

## Overview

Transform the Alerts and Devices screens from utilitarian to Tesla/Rivian dashboard aesthetic - dark mode dominant, data-visualization forward, technical but elegant.

### Goals

- FAANG-level professional polish
- Tesla/Rivian dashboard DNA
- Glanceable health checks
- Progressive disclosure (summary → detail)
- Consistent patterns across both flows

### Non-Goals

- Changing navigation structure
- Modifying business logic
- Adding new features

---

## Design Principles

1. **Glanceable health** - Every screen answers "is everything okay?" in under 2 seconds
2. **Progressive disclosure** - List shows summary, detail screen shows depth
3. **Consistent patterns** - Both flows use: Hero → List → Detail (Hero + Tabs + Bottom Bar)
4. **Visual hierarchy through subtlety** - No screaming badges; use glow, accent lines, and typography weight
5. **Tesla dashboard DNA** - Metrics displayed like instrument clusters, area charts for trends, floating action bars

---

## Color Language

| Element               | Treatment                           |
| --------------------- | ----------------------------------- |
| Critical alerts       | Subtle red background glow          |
| High alerts           | Thin 3px orange left accent line    |
| Medium alerts         | Thin 3px yellow left accent line    |
| Low alerts            | Thin 3px green left accent line     |
| Online devices        | Green status dot                    |
| Offline devices       | Red status dot + subtle red glow    |
| Interactive elements  | Brand accent (golden tan `#C9B896`) |
| Selected filter chips | Brand accent background tint        |

---

## Alerts List Screen

### Hero Section (Collapsible on Scroll)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│     ▂▃▅▇█▇▅▃▂▁▁▂▃▅▆▄▂▁▂▃▄▅▃▂▁                 │  ← Area chart (24h)
│     ░░░░░░░░░░░░░░░░░░░░░░░░░░                 │  ← Gradient fade
│                                                 │
│  ● 6 Critical   ● 2 High   ● 0 Medium   ● 0 Low│  ← Filter chips
│                                                 │
└─────────────────────────────────────────────────┘
```

**Specifications:**

- **Area chart:** 24-hour detection volume with gradient fill fading downward
- **Chart interaction:** Tap a time segment to jump to that period in the timeline
- **Filter chips:** Tap to filter list, tap again to clear. Selected chip gets subtle brand accent background
- **Collapse behavior:** Hero shrinks to just filter chips row when scrolling down, expands on scroll up

### Alert Cards

**Critical alert (with glow):**

```
┌─────────────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ ← Subtle red glow
│                                                 │
│   Cellular Detection                    3:37p   │ ← Title + time
│   Nearby · Front Gate                         › │ ← Proximity + source + chevron
│                                                 │
└─────────────────────────────────────────────────┘
```

**Non-critical alert (with accent line):**

```
▌                                                 │
▌  Bluetooth Detection                    1:41p   │ ← Orange/yellow/green accent
▌  Nearby · Front Gate                          › │
▌                                                 │
```

**Card specifications:**

- No borders, no badges, no MAC addresses at list level
- Severity conveyed through glow (critical) or thin 3px left accent (others)
- Title: Detection type in medium weight
- Metadata: Proximity + source device, muted color
- Timestamp: Right-aligned, caption size
- Chevron: Subtle, indicates tappable
- Card height: ~60px (reduced from current ~80px)

---

## Alert Detail Screen

### Hero Summary (Fixed at top)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   ●  Bluetooth Detection                        │  ← Severity dot + type (large)
│      High Priority · Jan 16, 3:37 PM            │  ← Severity label + timestamp
│                                                 │
│      -59 dBm  ·  Nearby  ·  Front Gate          │  ← Key metrics inline
│                                                 │
└─────────────────────────────────────────────────┘
│    Signal    │    Location    │    History      │  ← Segmented tabs
└─────────────────────────────────────────────────┘
```

### Tab: Signal

```
┌─────────────────────────────────────────────────┐
│  SIGNAL STRENGTH                                │
│  ┌───────────────────────────────────────────┐  │
│  │  ▁▂▃▄▅▆▇█▇▆▅                    -59 dBm  │  │  ← Visual meter + value
│  │  Strong signal · Nearby                   │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  DEVICE FINGERPRINT                             │
│  ┌───────────────────────────────────────────┐  │
│  │  MAC Address              BB:15:1F:29:c002│  │
│  │  Device Type                      Unknown │  │
│  │  First Seen               Jan 14, 2:15 PM│  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Tab: Location

```
┌─────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────┐  │
│  │                                           │  │
│  │              [ Map Snippet ]              │  │  ← Interactive mini-map
│  │                   📍                      │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  COORDINATES                                    │
│  ┌───────────────────────────────────────────┐  │
│  │  30.3964°N, 94.3176°W                   › │  │  ← Tap to open in Maps
│  └───────────────────────────────────────────┘  │
│                                                 │
│  SOURCE DEVICE                                  │
│  ┌───────────────────────────────────────────┐  │
│  │  ●  Front Gate Detector                 › │  │  ← Tap to view device
│  │     Online · 85%                          │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Tab: History

```
┌─────────────────────────────────────────────────┐
│  THIS FINGERPRINT                               │
│  ┌───────────────────────────────────────────┐  │
│  │  Seen 12 times                            │  │
│  │  First: Jan 14 · Last: Jan 16             │  │
│  │                                           │  │
│  │  ▂▁▃▅▂▁▁▁▂▇█▃  ← Activity sparkline      │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  RECENT SIGHTINGS                               │
│  ┌───────────────────────────────────────────┐  │
│  │  Today, 3:37 PM          Front Gate     › │  │
│  │  Today, 1:41 PM          Front Gate     › │  │
│  │  Yesterday, 9:22 PM      Front Gate     › │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Floating Bottom Bar

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   ✓ Mark Reviewed              ⚑    ✦    ⋯    │
│                              (Flag)(AI)(More)   │
└─────────────────────────────────────────────────┘
```

| Button        | Action                                |
| ------------- | ------------------------------------- |
| Mark Reviewed | Primary action, large tappable button |
| Flag (⚑)      | Toggle false positive                 |
| AI (✦)        | Explain with AI                       |
| More (⋯)      | Whitelist, Delete, Share              |

---

## Devices List Screen

### Hero Section (Simple Status)

**All online:**

```
┌─────────────────────────────────────────────────┐
│                                                 │
│            ●  All Systems Online                │  ← Green dot + status
│               1 device active                   │  ← Subtext
│                                                 │
└─────────────────────────────────────────────────┘
```

**Some offline:**

```
┌─────────────────────────────────────────────────┐
│                                                 │
│            ●  1 Device Offline                  │  ← Red dot + status
│               Needs attention                   │  ← Urgent subtext
│                                                 │
└─────────────────────────────────────────────────┘
```

**Specifications:**

- Instant health check: One glance tells you if everything is okay
- No graph: Devices don't need the same visual weight as Alerts
- No filter chips or grouping: Flat list below
- Collapse behavior: Stays visible but shrinks slightly on scroll

### Device Cards (Flat List, No Grouping)

**Online device:**

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   Front Gate Detector                         ● │  ← Name + green dot
│   Online · 2 min ago                            │  ← Status + last seen
│─────────────────────────────────────────────────│
│   85%    │    Good    │   14,917    │   30.39°  │  ← Metrics bar
│   batt        signal     detections      loc    │  ← Muted labels
│                                                 │
└─────────────────────────────────────────────────┘
```

**Offline device (with glow):**

```
┌─────────────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ ← Subtle red glow
│                                                 │
│   Back Fence Sensor                           ● │  ← Name + red dot
│   Offline · 3 hours ago                         │  ← Status + last seen
│─────────────────────────────────────────────────│
│   12%    │    --      │   8,421     │   30.41°  │  ← Metrics (signal unknown)
│   batt        signal     detections      loc    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Card specifications:**

- Status dot: Right-aligned, green (online) or red (offline)
- Last seen: Critical for knowing if device is actually responsive
- Metrics bar: Horizontal layout with subtle dividers, Tesla dashboard style
- Labels: Small, muted, below each metric
- Offline treatment: Red glow (same as critical alerts)
- Sorting: Offline devices sort to top (problems first), then alphabetical

---

## Device Detail Screen

### Hero Summary (Fixed at top)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   ●  Front Gate Detector                        │  ← Status dot + name (large)
│      Online · Last seen 2 min ago               │  ← Status + recency
│                                                 │
│      85%  ·  Good  ·  14,917 detections         │  ← Key metrics inline
│                                                 │
└─────────────────────────────────────────────────┘
│    Status    │    Location    │    History      │  ← Segmented tabs
└─────────────────────────────────────────────────┘
```

### Tab: Status

```
┌─────────────────────────────────────────────────┐
│  HEALTH                                         │
│  ┌───────────────────────────────────────────┐  │
│  │  Battery                                  │  │
│  │  ████████████████████░░░░          85%   │  │  ← Visual bar + value
│  │                                           │  │
│  │  Signal Strength                          │  │
│  │  ▁▂▃▄▅▆▇█                          Good  │  │  ← Visual meter + label
│  │                                           │  │
│  │  Uptime                          14 days  │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  DEVICE INFO                                    │
│  ┌───────────────────────────────────────────┐  │
│  │  Firmware                           1.0.0 │  │
│  │  Device ID               trailsense-d-01  │  │
│  │  Installed                    Jan 2, 2026 │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Tab: Location

```
┌─────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────┐  │
│  │                                           │  │
│  │              [ Map Snippet ]              │  │  ← Interactive mini-map
│  │            (((   📍   )))                 │  │  ← Device + coverage radius
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  COORDINATES                                    │
│  ┌───────────────────────────────────────────┐  │
│  │  30.3964°N, 94.3176°W                   › │  │  ← Tap to open in Maps
│  └───────────────────────────────────────────┘  │
│                                                 │
│  COVERAGE                                       │
│  ┌───────────────────────────────────────────┐  │
│  │  Bluetooth                         100 ft │  │
│  │  WiFi                              300 ft │  │
│  │  Cellular                          800 ft │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Tab: History

```
┌─────────────────────────────────────────────────┐
│  ACTIVITY SUMMARY                               │
│  ┌───────────────────────────────────────────┐  │
│  │  Total Detections                  14,917 │  │
│  │  Today                                 47 │  │
│  │  This Week                            312 │  │
│  │                                           │  │
│  │  ▂▃▅▇█▇▅▃▂▁▂▃▅▆  ← 7-day sparkline       │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  RECENT DETECTIONS                              │
│  ┌───────────────────────────────────────────┐  │
│  │  ●  Bluetooth · Nearby          3:37 PM › │  │
│  │  ●  Cellular · Far              3:35 PM › │  │
│  │  ●  WiFi · Nearby               3:22 PM › │  │
│  │  ●  Bluetooth · Nearby          3:18 PM › │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  View All Detections ›                          │
└─────────────────────────────────────────────────┘
```

### Floating Bottom Bar

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   📍 View on Map               ✏️    ⚙️    ⋯   │
│                              (Edit)(Cfg)(More)  │
└─────────────────────────────────────────────────┘
```

| Button      | Action                                                |
| ----------- | ----------------------------------------------------- |
| View on Map | Primary action, opens Map tab centered on this device |
| Edit (✏️)   | Rename device                                         |
| Config (⚙️) | Detection sensitivity, notification settings          |
| More (⋯)    | Remove Device (with confirmation)                     |

---

## Interactions & Polish

### Animations

| Element                      | Animation                                 | Duration     |
| ---------------------------- | ----------------------------------------- | ------------ |
| Hero collapse                | Smooth shrink on scroll, spring on expand | 250ms        |
| Card tap                     | Scale to 0.98 + slight dim                | 100ms        |
| Card glow (critical/offline) | Subtle pulse, very slow                   | 3s cycle     |
| Tab switch                   | Crossfade content                         | 200ms        |
| Bottom bar                   | Slide up on screen load                   | 300ms spring |
| Filter chip select           | Background fade in + slight scale         | 150ms        |
| Chart segment tap            | Highlight glow + list scroll              | 200ms        |

### Haptic Feedback

| Action                 | Haptic                    |
| ---------------------- | ------------------------- |
| Card tap               | Light impact              |
| Filter chip tap        | Light impact              |
| Mark Reviewed          | Success notification      |
| Flag as False Positive | Medium impact             |
| Delete confirm         | Warning notification      |
| Pull to refresh        | Light impact at threshold |

### Empty States

**Alerts (no alerts):**

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                     ○                           │  ← Outline icon, muted
│                                                 │
│              All Clear                          │  ← Title
│                                                 │
│      No alerts in the selected period.          │  ← Subtitle, muted
│      Your property is secure.                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Devices (no devices):**

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                     ○                           │
│                                                 │
│              No Devices                         │
│                                                 │
│      Add your first TrailSense detector         │
│      to start monitoring.                       │
│                                                 │
│            [ + Add Device ]                     │  ← Primary button
│                                                 │
└─────────────────────────────────────────────────┘
```

### Loading States

- Skeleton screens matching card shapes
- Shimmer animation (subtle, 1.5s cycle)
- Hero area loads first, then cards cascade in

### Error States

- Connection lost: Subtle banner below hero "Offline - Last updated 5 min ago"
- Device unreachable: Red glow treatment (same as offline device card)
- Action failed: Toast notification with retry option

---

## Component Summary

### New Components to Create

| Component           | Description                                       |
| ------------------- | ------------------------------------------------- |
| `AlertsHero`        | Area chart + filter chips, collapsible            |
| `DevicesHero`       | Simple status display                             |
| `AlertCard`         | Scannable card with glow/accent treatment         |
| `DeviceCard`        | Metrics bar layout                                |
| `DetailHero`        | Summary header for detail screens                 |
| `TabSegment`        | Signal/Location/History tabs                      |
| `FloatingActionBar` | Bottom action bar                                 |
| `GlowContainer`     | Wrapper for glow effect on critical/offline items |
| `MetricsBar`        | Horizontal metrics with dividers                  |
| `ActivitySparkline` | Mini chart for history tabs                       |

### Components to Modify

| Component            | Changes                      |
| -------------------- | ---------------------------- |
| `FilterChip`         | Restyle for Tesla aesthetic  |
| `GroupedListSection` | Use for tab content sections |
| `GroupedListRow`     | Use for detail screen rows   |

---

## Design Patterns Summary

| Screen  | Hero                          | List/Content                     | Detail Pattern                                     |
| ------- | ----------------------------- | -------------------------------- | -------------------------------------------------- |
| Alerts  | Activity graph + filter chips | Scannable cards with glow/accent | Hero + Tabs (Signal/Location/History) + Bottom bar |
| Devices | Simple status ("All Online")  | Metrics bar cards                | Hero + Tabs (Status/Location/History) + Bottom bar |

---

## Files to Modify

### Screens

- `src/screens/alerts/AlertsListScreen.tsx`
- `src/screens/alerts/AlertDetailScreen.tsx`
- `src/screens/devices/DeviceListScreen.tsx`
- `src/screens/devices/DeviceDetailScreen.tsx`

### Components

- `src/components/organisms/AlertCard/AlertCard.tsx`
- `src/components/organisms/DeviceCard/DeviceCard.tsx`
- `src/components/organisms/HeaderHero/AlertsHeaderHero.tsx`
- `src/components/organisms/HeaderHero/DevicesHeaderHero.tsx`

### New Components

- `src/components/molecules/FloatingActionBar/`
- `src/components/molecules/MetricsBar/`
- `src/components/molecules/ActivitySparkline/`
- `src/components/molecules/GlowContainer/`
- `src/components/molecules/DetailHero/`
- `src/components/molecules/TabSegment/`
