# Tactical UI Redesign — Design Spec

**Date:** 2026-04-03
**Status:** Approved
**Scope:** App-wide UI/UX redesign to match AI screen's tactical command center aesthetic

## Design Philosophy

"Tactical framework, screen-appropriate content" — every screen shares the command center DNA (dark backgrounds, monospace headers, amber accents, bordered cards) but adapts density and layout to its purpose. Security-focused screens are data-dense; utility screens stay comfortable and scannable.

---

## 1. Color Palette (Dark-Only)

Light mode is removed. Single dark tactical theme app-wide.

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#111210` | Primary screen background |
| `surface` | `#1a1a14` | Cards, containers, input fields |
| `surfaceDark` | `#141410` | Nested cards, recessed areas |
| `border` | `#2a2a1a` | Card borders, dividers |
| `accentPrimary` | `#fbbf24` | Interactive elements, active states, CTAs |
| `accentSuccess` | `#4ade80` | Online, success, secure status |
| `accentDanger` | `#ef4444` | Critical alerts, offline, errors |
| `accentWarning` | `#f59e0b` | High-priority, amber warnings |
| `textPrimary` | `#e8e8e0` | Primary text |
| `textSecondary` | `#a8a898` | Secondary/descriptive text |
| `textTertiary` | `#8a887a` | Hints, placeholders, disabled |

### Severity Colors

| Level | Text (on severity bg) | Border | Background |
|-------|-----------------------|--------|------------|
| Critical | `#f87171` | `#ef4444` | `#3a1a1a` |
| High | `#fbbf24` | `#f59e0b` | `#3a2a1a` |
| Medium | `#fcd34d` | `#fbbf24` | `#2a2a1a` |
| Low | `#86efac` | `#4ade80` | `#1a2a1a` |

Text colors are lightened variants of the border color to meet WCAG AA (4.5:1) contrast against their severity backgrounds at 10pt sizes. Border/standalone usage keeps the original saturated color.

### Interactive States

- **User bubbles/selections:** `#2a3a2a` background, `#3a4a3a` border
- **Focus state:** `#fbbf24` border
- **Disabled:** 50% opacity
- **Pressed:** 80% opacity

---

## 2. Typography

Split into two systems used together:

### Tactical Typography (headers, labels, data)
- **Font:** Menlo (iOS) / monospace (Android)
- **Transform:** uppercase
- **Letter-spacing:** +0.5pt to +1pt
- **Usage:** Screen titles, section headers, card labels, data values, timestamps, metrics, badges, filter chips, tab labels

| Token | Size | Weight | Letter-spacing |
|-------|------|--------|----------------|
| `headerLabel` | 10pt | Bold | +1pt |
| `sectionLabel` | 10pt | Bold | +0.5pt |
| `screenTitle` | 15pt | Bold | +0.5pt |
| `metric` | 20pt | Bold | 0 |
| `metricCaption` | 9pt | Regular | +0.5pt |
| `dataValue` | 10pt | Regular | 0 |
| `timestamp` | 10pt | Regular | 0 |
| `badge` | 10pt | Bold | +1pt |
| `tabLabel` | 10pt | Regular | +0.5pt |

### Readable Typography (body text, descriptions)
- **Font:** System (San Francisco on iOS)
- **Transform:** natural case
- **Letter-spacing:** standard
- **Usage:** Alert descriptions, assessment paragraphs, settings explanations, body copy

Existing system font scale (body 17pt, subheadline 15pt, footnote 13pt, caption 12pt) is retained for readable text.

---

## 3. Card Tier System

Three tiers based on content importance:

### Tier 1 — Briefing Cards
- Vertical amber accent bar (`#fbbf24`, 3px wide) on left side of header
- Header row: monospace uppercase label (e.g., "SITUATION OVERVIEW")
- `surface` background with `border` outline
- 10pt border-radius
- 10-12pt padding
- **Used for:** Dashboard summaries, alert briefings, device fleet status, radar detection panels
- Can contain nested Tier 2 cards

### Tier 2 — Data Cards
- `surface` background with `border` outline, no accent bar
- 10pt border-radius
- 10-12pt padding
- Optional severity-colored left border (2px) for threat-level items
- **Used for:** Alert list items, device list items, detection rows, analytics entries

### Tier 3 — Surface Cards
- Subtle background shift (`surfaceDark`) or slight opacity change
- Minimal or no visible border
- 10pt border-radius
- 16pt padding (comfortable touch targets)
- **Used for:** Settings rows, More menu items, form sections, metadata

### Nesting Rules
- Briefing cards may contain Data cards
- Data cards do not nest
- Surface cards never nest
- No shadows — borders replace shadows in tactical dark UI

---

## 4. Screen Headers

### Tactical Header Bar (every authenticated screen)
- **Left:** Screen title — monospace, uppercase, 15pt bold, +0.5pt letter-spacing
- **Right:** Contextual status indicator — colored dot (7px) + monospace status label
- **Background:** transparent, or `surface` on scroll (blur/opacity transition)
- **Height:** ~48pt + safe area

### Per-Screen Status Indicators

| Screen | Status Examples |
|--------|----------------|
| Home | `● SECURE` (green) / `● ELEVATED` (amber, medium/low alerts OR offline devices OR stale data) / `● CRITICAL` (red, critical/high alerts) — maps to `usePropertyStatus().level` |
| Alerts | `● 2 CRITICAL` (red) / `● ALL CLEAR` (green) |
| AI | `● READY` (green) — already implemented |
| Radar | `● 5 ACTIVE` (green) / `● SCANNING` (amber pulse) |
| Devices | `● 4/5 ONLINE` (green) / `● 1 OFFLINE` (red) |
| Settings | No indicator |
| More | No indicator |

---

## 5. Tab Bar

- **Background:** `surface` (`#1a1a14`) with top border (`#2a2a1a`)
- **Active tab:** Amber `#fbbf24` icon + monospace uppercase label (10pt)
- **Inactive tab:** `textTertiary` (`#8a887a`) icon + label
- **Labels:** Monospace, uppercase, 10pt

### Status Dots
Small (6px) colored dots overlaid on tab icons:
- **Alerts tab:** Red dot when unreviewed critical alerts exist
- **Devices tab:** Amber dot when any sensor is offline
- **AI tab:** Green dot when AI service is available (LLM feature flag enabled)
- Critical-state dots pulse subtly (opacity animation 0.4 → 1.0, 2s cycle)

---

## 6. Screen Designs

### Home — "Command Center Dashboard"
- Header: `HOME` + overall threat status
- **Situation Overview** (Briefing card): Metric row — Critical count, High count, Online count in 20pt bold monospace
- **Property Map** (Data card): Existing map wrapped in bordered card, monospace "PROPERTY MAP" label above
- **Recent Activity** (Briefing card): Data card rows per alert with severity-colored left borders, monospace timestamps, system font descriptions
- Remove large "My Property" title — replaced by tactical header

### Alerts
- Header: `ALERTS` + critical count
- **Search bar:** `surface` background, `border` outline, monospace placeholder "SEARCH ALERTS...", amber cursor/focus
- **Filter chips:** Horizontal scroll, bordered pills — monospace uppercase, `border` color, amber text + border when active. Severity dot indicators matching AI screen's SuggestionChips pattern
- **Alert list:** Data cards with severity-colored left borders. Monospace: detection type + timestamp. System font: descriptions. Chevron in `textTertiary`

### Alert Detail
- Briefing card: "ALERT BRIEFING" header with accent bar
- Nested Data cards for signal data, device info, location
- Assessment section with system font body text

### Radar
- Header: `RADAR` + active detection count
- **Live Map** (Briefing card): Map display wrapped in "LIVE MAP" briefing container
- **Segmented control:** Tactical toggle — `surface` background, `border` outline, amber fill on active, monospace uppercase labels ("LIVE MAP" / "REPLAY")
- **Detection list:** Data cards with monospace device names, signal values, distances

### Devices
- Header: `DEVICES` + online count
- **Fleet Status** (Briefing card): Warning when sensors offline, metric summary
- **Add button:** Amber-bordered tactical button in header area, monospace "ADD"
- **Device list:** Data cards with status-colored left borders (green/red). Monospace: name, status, metrics. System font: dates
- **Device detail:** Briefing card with nested Data cards for specs and history

### Settings
- Header: `SETTINGS` (no status indicator)
- **Profile:** Data card with avatar, monospace name, system font email
- **Section labels:** Monospace uppercase in `textSecondary` ("DETECTION", "NOTIFICATIONS", "APPEARANCE")
- **Setting rows:** Surface cards (Tier 3), system font descriptions, monospace values ("medium", "Off")
- Remove Theme toggle (dark-only)

### More
- Header: `MORE` (no status indicator)
- Menu items: Surface cards, monospace labels, chevrons in `textTertiary`

### Auth Screens — "Cinematic Entry"

**Login:**
- Logo with circular glow, tinted amber
- Title: "WELCOME BACK" — monospace, 22pt bold, +2pt letter-spacing
- Subtitle: System font, `textSecondary`
- **Input fields:** `surface` background, `border` outline, amber focus border. Monospace labels above ("EMAIL ADDRESS", "PASSWORD")
- **Sign In button:** `#fbbf24` amber background, dark text (`#111210`), monospace uppercase
- **Explore Demo:** Bordered tactical style, amber text, transparent background

**Register:** Same cinematic dark background and amber styling as Login. Monospace uppercase labels, amber focus, amber Sign Up button.

**Forgot Password:** Same cinematic styling. Monospace "RESET PASSWORD" header, amber submit button.

### Analytics Screens (Dashboard, Heatmap, Reports)
- Accessible from More → Analytics
- Apply Briefing card layout for data sections
- Monospace headers and data values
- Charts/graphs keep their existing rendering but with tactical color scheme (amber/green/red data colors on dark backgrounds)

### Settings Sub-Screens
All settings sub-screens reachable from Settings (Profile, KnownDevices, NotificationSettings, AlertSound, Biometric, Security, Sensitivity, QuietHours, VacationMode, AddKnownDevice) and from More (DeviceFingerprint):
- Apply TacticalHeader with screen name
- Use Surface cards (Tier 3) for settings rows
- Monospace section labels, system font descriptions
- Amber interactive elements (toggles, buttons)

### ThemeScreen — Removed
The Theme selection screen is removed entirely. Remove the route from both MoreStack and SettingsStack, and remove the navigation row from SettingsScreen. The app is dark-only.

---

## 7. Shared Component Updates

| Component | Change |
|-----------|--------|
| `Button` | Amber primary, bordered secondary, monospace uppercase labels |
| `Input` | `surface` bg, `border` outline, amber focus, monospace label above |
| `Badge` | Monospace, severity-colored, uppercase |
| `SearchBar` | Tactical styling matching Alerts search |
| `TabSegment` | Tactical toggle (amber active fill, monospace labels) |
| `FilterChip` | Bordered pill, monospace uppercase, amber when active |
| `ListItem` | Deprecated in favor of Data/Surface card patterns |
| `Text` | Add `tactical` variant that applies mono + uppercase + spacing |
| `Card` | Add `tier` prop: `"briefing"` / `"data"` / `"surface"` |
| `ScreenLayout` | Dark background default, tactical header integration |

---

## 8. Implementation Phases

### Phase 1 — Theme Foundation
- Promote tactical palette to app-wide dark theme in `colors.ts`
- Remove light mode from `ThemeProvider` and delete `light.ts`
- Add tactical typography tokens to `typography.ts`
- Update spacing constants for card tiers

### Phase 2 — Shared Components
- Build/extend Card with tier system (BriefingCard, DataCard, SurfaceCard)
- Build TacticalHeader component with status indicator slot
- Restyle tab bar with tactical treatment + status dots
- Update Button, Input, Badge, SearchBar, FilterChip, TabSegment
- Add `tactical` variant to Text component

### Phase 3 — Screen Rollout (one at a time)
1. Home — highest visibility, validates component system
2. Alerts — most data-dense, stress-tests card tiers
3. Devices — similar patterns to Alerts
4. Radar — map-heavy, lighter touch
5. Settings + More — utility screens, Surface cards
6. Login — standalone cinematic polish

### Phase 4 — Polish
- Wire tab bar status dots to real data (React Query)
- Wire header status indicators to real data
- Animation: subtle amber glows on critical states, pulse dots
- Remove dead light-mode code paths and unused theme tokens
- Accessibility pass: ensure contrast ratios meet WCAG AA on dark backgrounds

---

## 9. Files Affected

### Theme System
- `src/constants/colors.ts` — replace with tactical palette
- `src/constants/typography.ts` — add tactical tokens
- `src/constants/spacing.ts` — add card tier spacing
- `src/constants/tacticalTheme.ts` — promote to app-wide, then remove
- `src/theme/light.ts` — delete
- `src/theme/dark.ts` — rewrite with tactical palette
- `src/theme/types.ts` — update type definitions
- `src/theme/index.ts` — remove light mode exports

### Components
- `src/components/atoms/` — Button, Input, Badge, Text
- `src/components/molecules/` — Card, SearchBar, FilterChip, TabSegment
- `src/components/organisms/` — HeaderHero variants → TacticalHeader
- `src/components/templates/` — ScreenLayout

### Screens
- `src/screens/home/` — dashboard redesign
- `src/screens/alerts/` — list + detail redesign
- `src/screens/devices/` — list + detail redesign
- `src/screens/radar/` — tactical wrapper
- `src/screens/settings/` — surface card reskin + all sub-screens (Profile, KnownDevices, NotificationSettings, AlertSound, Biometric, Security, Sensitivity, QuietHours, VacationMode, AddKnownDevice)
- `src/screens/settings/ThemeScreen.tsx` — delete (dark-only app)
- `src/screens/more/` — surface card reskin
- `src/screens/analytics/` — Dashboard, Heatmap, Reports tactical reskin
- `src/screens/auth/` — LoginScreen, RegisterScreen, ForgotPasswordScreen cinematic polish
- `src/screens/fingerprint/` — DeviceFingerprintScreen tactical reskin

### Navigation
- `src/navigation/MainNavigator.tsx` — tab bar restyling + status dots
- `src/navigation/stacks/MoreStack.tsx` — remove Theme route
- `src/navigation/stacks/SettingsStack.tsx` — remove Theme route
