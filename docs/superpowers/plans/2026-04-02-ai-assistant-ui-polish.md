# AI Assistant Screen UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three UI issues in the AI Assistant welcome screen: excessive branding spacing, simulator keyboard documentation, and suggestion chips clipped by tab bar.

**Architecture:** All changes are in a single file (`AIAssistantScreen.tsx`). The welcome state gets wrapped in a ScrollView, the branding section is trimmed to just the subtitle, and SafeAreaView edges change from `['top', 'bottom']` to `['top']` since the tab bar handles the bottom inset.

**Tech Stack:** React Native, react-native-safe-area-context, ScrollView

---

### Task 1: Add ScrollView import and wrap welcome content

**Files:**

- Modify: `src/screens/ai/AIAssistantScreen.tsx:19` (import), `src/screens/ai/AIAssistantScreen.tsx:306-344` (renderWelcome)

- [ ] **Step 1: Add ScrollView to the import**

In `src/screens/ai/AIAssistantScreen.tsx`, change the `react-native` import at line 19 from:

```typescript
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  Image,
} from 'react-native';
```

to:

```typescript
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  Image,
} from 'react-native';
```

- [ ] **Step 2: Wrap renderWelcome content in ScrollView**

Replace the `renderWelcome` function (lines 306-344) from:

```tsx
const renderWelcome = () => (
  <View style={styles.welcomeContainer}>
    {/* Security Status */}
    {!securityContext.isLoading && (
      <SecurityStatusCard context={securityContext} />
    )}

    {/* AI Branding */}
    <View style={styles.brandingContainer}>
      <Image
        source={logoSource}
        style={styles.aiIconLarge}
        resizeMode="contain"
      />
      <Text
        variant="largeTitle"
        weight="bold"
        color="label"
        style={styles.brandTitle}
      >
        TrailSense AI
      </Text>
      <Text
        variant="body"
        style={[styles.brandSubtitle, { color: colors.secondaryLabel }]}
      >
        Your on-device security assistant. Ask about alerts, detection patterns,
        sensor status, and more.
      </Text>
    </View>

    {/* Suggestions */}
    <SuggestionChips
      suggestions={allSuggestions}
      onSelect={handleSuggestionSelect}
      title="Try asking"
    />
  </View>
);
```

with:

```tsx
const renderWelcome = () => (
  <ScrollView
    style={styles.welcomeContainer}
    contentContainerStyle={styles.welcomeContent}
    showsVerticalScrollIndicator={false}
  >
    {/* Security Status */}
    {!securityContext.isLoading && (
      <SecurityStatusCard context={securityContext} />
    )}

    {/* AI Branding — subtitle only; title is already in the header */}
    <View style={styles.brandingContainer}>
      <Text
        variant="body"
        style={[styles.brandSubtitle, { color: colors.secondaryLabel }]}
      >
        Your on-device security assistant. Ask about alerts, detection patterns,
        sensor status, and more.
      </Text>
    </View>

    {/* Suggestions */}
    <SuggestionChips
      suggestions={allSuggestions}
      onSelect={handleSuggestionSelect}
      title="Try asking"
    />
  </ScrollView>
);
```

- [ ] **Step 3: Verify the app compiles**

Run: `npx tsc --noEmit 2>&1 | grep AIAssistantScreen`
Expected: No new errors from this file (pre-existing errors elsewhere are fine).

- [ ] **Step 4: Commit**

```bash
git add src/screens/ai/AIAssistantScreen.tsx
git commit -m "fix(ai): wrap welcome content in ScrollView and shrink branding

Remove redundant logo and title from welcome branding section (already
shown in header). Wrap welcome content in ScrollView so all suggestion
chips are reachable.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Update styles for compact branding and scroll content

**Files:**

- Modify: `src/screens/ai/AIAssistantScreen.tsx:789-810` (styles)

- [ ] **Step 1: Update brandingContainer and add welcomeContent style**

In the `StyleSheet.create` block, replace these styles:

```typescript
  welcomeContainer: {
    flex: 1,
  },
  brandingContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 32,
  },
  aiIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandTitle: {
    marginBottom: 8,
  },
  brandSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
```

with:

```typescript
  welcomeContainer: {
    flex: 1,
  },
  welcomeContent: {
    paddingBottom: 16,
  },
  brandingContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  brandSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
```

Note: `aiIconLarge` and `brandTitle` styles are removed from here since they are no longer used in the welcome section. However, `aiIconLarge` is still used by `renderEnablePrompt` and `renderNotAvailable`, so it must be kept. Only `brandTitle` can be fully removed.

**Correction:** Keep `aiIconLarge` in the stylesheet. Only remove `brandTitle`:

```typescript
  welcomeContainer: {
    flex: 1,
  },
  welcomeContent: {
    paddingBottom: 16,
  },
  brandingContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  aiIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
```

- [ ] **Step 2: Verify the app compiles**

Run: `npx tsc --noEmit 2>&1 | grep AIAssistantScreen`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/screens/ai/AIAssistantScreen.tsx
git commit -m "fix(ai): update styles for compact branding and scroll padding

Reduce brandingContainer padding, add welcomeContent padding for scroll
clearance, remove unused brandTitle style.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Change SafeAreaView edges and add keyboard comment

**Files:**

- Modify: `src/screens/ai/AIAssistantScreen.tsx:492-517` (SafeAreaView edges), `src/screens/ai/AIAssistantScreen.tsx:645` (keyboard comment)

- [ ] **Step 1: Change SafeAreaView edges on all three render paths**

There are three `SafeAreaView` elements that need `edges` changed from `['top', 'bottom']` to `['top']`:

**First (not available state, ~line 494):**

Change:

```tsx
<SafeAreaView
  style={[styles.container, { backgroundColor: colors.systemBackground }]}
  edges={['top', 'bottom']}
>
  {renderNotAvailable()}
</SafeAreaView>
```

to:

```tsx
<SafeAreaView
  style={[styles.container, { backgroundColor: colors.systemBackground }]}
  edges={['top']}
>
  {renderNotAvailable()}
</SafeAreaView>
```

**Second (enable prompt state, ~line 505):**

Change:

```tsx
<SafeAreaView
  style={[styles.container, { backgroundColor: colors.systemBackground }]}
  edges={['top', 'bottom']}
>
  {renderEnablePrompt()}
</SafeAreaView>
```

to:

```tsx
<SafeAreaView
  style={[styles.container, { backgroundColor: colors.systemBackground }]}
  edges={['top']}
>
  {renderEnablePrompt()}
</SafeAreaView>
```

**Third (main chat state, ~line 515):**

Change:

```tsx
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.systemBackground }]}
        edges={['top', 'bottom']}
      >
```

to:

```tsx
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.systemBackground }]}
        edges={['top']}
      >
```

- [ ] **Step 2: Add keyboard comment above TextInput**

Above the `<TextInput` element (~line 645), add a comment:

```tsx
              {/* NOTE: In iOS Simulator, toggle software keyboard with Cmd+K
                  or I/O > Keyboard > Toggle Software Keyboard */}
              <TextInput
```

- [ ] **Step 3: Verify the app compiles**

Run: `npx tsc --noEmit 2>&1 | grep AIAssistantScreen`
Expected: No new errors.

- [ ] **Step 4: Commit**

```bash
git add src/screens/ai/AIAssistantScreen.tsx
git commit -m "fix(ai): use top-only SafeAreaView edges, add keyboard note

Tab bar handles bottom safe area inset; having both SafeAreaView bottom
edge and tab bar creates redundant spacing. Add comment documenting
simulator keyboard toggle for future developers.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Manual verification

- [ ] **Step 1: Run type check**

Run: `npm run type-check 2>&1 | grep -E "(error TS|AIAssistantScreen)" | head -20`
Expected: No new errors from `AIAssistantScreen.tsx`.

- [ ] **Step 2: Run linter**

Run: `npm run lint:fix -- --quiet 2>&1 | head -20`
Expected: No lint errors in `AIAssistantScreen.tsx`.

- [ ] **Step 3: Visual verification checklist**

If running on simulator (`npx expo run:ios --device "iPhone 16 Pro"`), verify:

- All 6 suggestion chips visible by scrolling the welcome content
- SecurityStatusCard renders at the top
- Subtitle text ("Your on-device security assistant...") appears below status card with tight spacing
- Input bar stays fixed at the bottom (not inside ScrollView)
- Tapping TextInput focuses it (toggle software keyboard with Cmd+K)
- Chat state with messages still works (FlatList, not ScrollView)
- No extra dead space at the bottom of the screen
