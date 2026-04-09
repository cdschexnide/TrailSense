# AI Tab Navigation

**Date:** 2026-04-02
**Status:** Approved
**Scope:** Promote AI Assistant to a dedicated tab, restructure tab bar to 6 tabs

## Problem

The AI Assistant screen lives inside `MoreStack`, creating two issues:

1. No back button — the screen has `headerShown: false` and no native back navigation
2. Tapping the "More" tab while on the AI screen does nothing (already in that stack)
3. The AI feature is buried 2 taps deep, reducing discoverability

## Design

### Tab bar: 6 tabs

| Position | Tab      | Icon (Ionicons)                           | Label        |
| -------- | -------- | ----------------------------------------- | ------------ |
| 1        | Home     | `home-outline` / `home`                   | Home         |
| 2        | Alerts   | `alert-circle-outline` / `alert-circle`   | Alerts       |
| 3        | **AI**   | `sparkles-outline` / `sparkles`           | AI           |
| 4        | Radar    | `radio-outline` / `radio`                 | Radar        |
| 5        | Devices  | `hardware-chip-outline` / `hardware-chip` | Devices      |
| 6        | Settings | `settings-outline` / `settings-sharp`     | _(no label)_ |

AI sits center (position 3) as the hero feature. Settings uses a gear icon with no label, saving horizontal space and establishing visual hierarchy: 5 primary features + settings.

### Navigation type changes

The existing `AIStack` (`src/navigation/stacks/AIStack.tsx`) becomes the tab's stack navigator. It already wraps `AIAssistantScreen` with `headerShown: false`.

## Changes

### `src/navigation/MainNavigator.tsx`

- Add `AIStack` import and register as `AITab` at position 3 (between AlertsTab and RadarTab)
- Icon: `sparkles-outline` (inactive) / `sparkles` (active), label: "AI"
- Keep route key as `MoreTab` (stack contains non-settings screens like Dashboard, Heatmap)
- Change MoreTab icon from `ellipsis-horizontal` to `settings-outline` (inactive) / `settings-sharp` (active)
- Remove the label for MoreTab: set `tabBarLabel` to `() => null`
- All tabs must branch on `focused` to switch between outline (inactive) and filled (active) icon variants

### `src/navigation/stacks/MoreStack.tsx`

- Remove the `TrailSenseAI` screen registration (line 40)
- Remove the `AIAssistantScreen` import (line 10)

### `src/navigation/types.ts`

- Add `AITab` to `MainTabParamList`

### `src/navigation/linking.ts`

- Move the `TrailSenseAI` deep link from inside `MoreTab` to `AITab`

### `src/screens/more/MoreMenuScreen.tsx`

- Remove the "AI Assistant" `GroupedListRow` entry (lines 19-25) since AI is now a top-level tab

### Files not changed

- `src/navigation/stacks/AIStack.tsx` — already exists, no changes needed
- `src/screens/ai/AIAssistantScreen.tsx` — no changes needed
- `src/components/ai/*` — no changes needed

## Testing

- Verify all 6 tabs render and are tappable
- Verify AI tab loads AIAssistantScreen
- Verify Settings gear icon loads MoreMenuScreen
- Verify tapping each tab switches between stacks (no navigation traps)
- Verify the AI tab sparkles icon renders in both active/inactive states
- Verify deep link `ai` routes to the AI tab
- Verify the More/Settings menu no longer shows an AI entry
