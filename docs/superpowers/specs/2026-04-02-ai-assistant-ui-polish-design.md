# AI Assistant Screen UI Polish

**Date:** 2026-04-02
**Status:** Approved
**Scope:** Three targeted fixes to the AI Assistant welcome screen layout

## Context

The AI Assistant screen (`src/screens/ai/AIAssistantScreen.tsx`) has three UI issues in its welcome/empty state:

1. Excessive vertical spacing between SecurityStatusCard and branding
2. Tapping the text input doesn't bring up the keyboard in the simulator
3. Suggestion chips are partially clipped by the tab bar

The screen lives inside `MoreStack` (a bottom tab stack), so the tab bar is always visible. The welcome state is not scrollable, causing content overflow.

## Design Decisions

### Branding: shrink, don't remove

The header already shows "TrailSense AI" with a compact status line. The large branding block (80px logo + title + subtitle) is redundant and burns ~150px of vertical space. However, removing it entirely makes the welcome state feel like a bare list.

**Decision:** Remove the logo image and "TrailSense AI" title from the branding section. Keep only the single-line subtitle ("Your on-device security assistant...") as a lightweight visual anchor. Reduce `brandingContainer` padding from `paddingVertical: 32` to `paddingTop: 12, paddingBottom: 8`.

### Keyboard: simulator behavior, not a bug

The iOS simulator disables the software keyboard by default when a hardware keyboard is connected. Toggle with `I/O > Keyboard > Toggle Software Keyboard` or `Cmd+K`. The `TextInput` component is wired correctly — `editable`, `ref`, `onChangeText` all work. No code change needed.

**Decision:** No code change. Add a comment near the TextInput noting the simulator keyboard toggle for future developers.

### Scrollable welcome content

The welcome container is a plain `View` with `flex: 1`. When SecurityStatusCard + branding + 6 suggestion cards exceed the available height (screen minus header, input bar, and tab bar), the bottom chips are clipped with no way to reach them.

**Decision:** Wrap `renderWelcome()` content in a `ScrollView`. Add `contentContainerStyle` with bottom padding (16px) to ensure the last suggestion card clears the input area. Use `showsVerticalScrollIndicator={false}` to keep the clean aesthetic. Also change `SafeAreaView` edges from `['top', 'bottom']` to `['top']` since the tab bar already handles the bottom safe area inset — having both creates redundant bottom padding.

## Changes

### `src/screens/ai/AIAssistantScreen.tsx`

**Welcome section (`renderWelcome`):**

- Wrap content in `<ScrollView>` with `showsVerticalScrollIndicator={false}` and `contentContainerStyle={{ paddingBottom: 16 }}`
- Remove the `Image` (logo) and `Text` (title) from `brandingContainer`, keep only the subtitle
- Reduce `brandingContainer` style: `paddingVertical: 32` becomes `paddingTop: 12, paddingBottom: 8`; remove `paddingHorizontal: 32` (subtitle can use its own)
- Remove `aiIconLarge` and `brandTitle` references from the welcome section

**SafeAreaView edges:**

- Change `edges={['top', 'bottom']}` to `edges={['top']}` on all three render paths (main chat, enable prompt, not available). The tab bar handles the bottom inset; doubling it creates extra dead space.

**Keyboard comment:**

- Add a brief comment above the `TextInput` noting the simulator keyboard toggle (`Cmd+K`)

**Styles cleanup:**

- Update `brandingContainer` style values
- `welcomeContainer` keeps `flex: 1` (the ScrollView fills it)

### Files not changed

- `SecurityStatusCard.tsx` — no changes needed
- `SuggestionChips.tsx` — no changes needed
- `MainNavigator.tsx` — tab bar config unchanged

## Testing

- Verify all 6 suggestion chips are visible and tappable by scrolling
- Verify SecurityStatusCard renders correctly at the top of the scroll
- Verify subtitle text is visible and properly spaced below the status card
- Verify keyboard appears when tapping the TextInput (toggle software keyboard with Cmd+K in simulator)
- Verify the input bar stays fixed at the bottom (not inside the ScrollView)
- Verify the chat state (with messages) still works correctly — it uses FlatList, not the welcome ScrollView
- Test both light and dark themes
