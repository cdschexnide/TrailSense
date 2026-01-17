# Alert Card Redesign: Compact Card with Top Accent

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign AlertCard component to be sleek, modern, and professional - reducing visual noise and height by ~50%.

**Architecture:** Replace left stripe with top accent bar, inline icon with text, single-line metadata row.

**Tech Stack:** React Native, Animated API, existing theme system

---

## Design Specifications

### Visual Layout

**Standard Card (High/Medium/Low):**
```
┌─────────────────────────────────────────────┐
│▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀│  ← 3px top accent (threat color)
│                                             │
│  📶 Bluetooth Detection        Jan 16, 3:37 │  ← Row 1: icon + title + timestamp
│  -59 dBm · Nearby · device-01 · c002       │  ← Row 2: metadata inline
│                                          ▶  │  ← Chevron aligned right
└─────────────────────────────────────────────┘
```

**Critical Card (enhanced emphasis):**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ← 1px border (threat color)
┃▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀┃  ← 5px top accent
┃                                             ┃
┃  📶 Bluetooth Detection        Jan 16, 1:41 ┃
┃  -57 dBm · Nearby · device-01 · c001       ┃
┃                                          ▶  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Design Tokens

| Element | Specification |
|---------|---------------|
| Card height | ~76px (reduced from ~140px) |
| Top accent height | 3px standard, 5px critical |
| Border radius | 12px |
| Card background | `theme.colors.secondarySystemBackground` |
| Padding horizontal | 12px |
| Padding vertical | 10px |
| Icon size | 20px (inline with title) |
| Gap between icon and title | 8px |
| Row gap | 6px |

### Typography

| Element | Variant | Weight | Color |
|---------|---------|--------|-------|
| Detection title | headline | semibold | label |
| Timestamp | caption1 | regular | secondaryLabel |
| Metadata | caption1 | regular | secondaryLabel |
| Proximity badge | caption2 | semibold | rssiInfo.color |

### Metadata Format

Single line, dot-separated:
```
{rssi} dBm · {proximity pill} · {deviceId} · {macAddress last 4}
```

- Proximity remains as small colored pill badge
- MAC address shows last 4 characters only (e.g., "c002")
- If aggregated alert: append " · {count}x"

### Threat Level Styling

| Level | Accent Height | Border | Color |
|-------|---------------|--------|-------|
| Critical | 5px | 1px all around | systemRed |
| High | 3px | none | systemOrange |
| Medium | 3px | none | systemYellow |
| Low | 3px | none | systemGreen |

### Animations (preserved from current)

- Entrance: fade + translateX (30px → 0)
- Press: scale 0.98 spring
- Critical: No pulse animation (border provides emphasis)

### Elements Removed

- Large circular icon background (52px)
- Threat level badge (TOP-LEFT)
- Multiple metadata rows (vertical stack)
- Left stripe indicator
- Pulse glow animation for critical

---

## Implementation Tasks

### Task 1: Restructure Card Layout

**Files:**
- Modify: `src/components/organisms/AlertCard/AlertCard.tsx`

**Changes:**
1. Remove left stripe View
2. Add top accent View (absolute positioned)
3. Change icon from 52px circle to 20px inline
4. Restructure JSX to single primary row + metadata row

### Task 2: Implement Metadata Row

**Changes:**
1. Create single-line metadata format with dot separators
2. Keep proximity badge as inline pill
3. Truncate MAC to last 4 chars
4. Add aggregation count if present

### Task 3: Add Critical Border Treatment

**Changes:**
1. Add conditional 1px border for critical alerts
2. Increase top accent to 5px for critical
3. Remove pulse animation code

### Task 4: Update Styles

**Changes:**
1. Reduce vertical padding
2. Update border radius to 12px
3. Adjust spacing for compact layout
4. Remove unused styles (iconCircle, threatStripe left positioning)

### Task 5: Test and Verify

**Verification:**
- Cards should be ~76px tall
- Critical cards should have visible border
- All metadata displays correctly inline
- Animations still work smoothly
- Accessibility labels still accurate
