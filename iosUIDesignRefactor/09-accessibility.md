# Phase 9: Accessibility

**Duration:** 6-8 hours
**Status:** ⬜ Not Started

## Overview

This phase ensures the app is accessible to all users by implementing Dynamic Type support, VoiceOver labels, color contrast verification, and proper touch target sizing.

## Prerequisites

- [x] Phase 1-8 complete (all features implemented)
- [ ] Have iOS device for testing VoiceOver
- [ ] Understand WCAG accessibility standards
- [ ] Reference iOS Settings app for accessibility patterns

## Tasks

### 9.1 Dynamic Type Support

#### 9.1.1 Verify Text Component Scales

- [ ] **Ensure Text component supports Dynamic Type:**
  ```typescript
  import { Text as RNText } from 'react-native';

  // Text component should use allowFontScaling={true} (default)
  <RNText
    allowFontScaling={true}
    style={textStyle}
  >
    {children}
  </RNText>
  ```

- [ ] **Test at all accessibility sizes:**
  - Settings > Accessibility > Display & Text Size > Larger Text
  - Test at: Default, Large, XL, XXL, XXXL, AX1, AX2, AX3, AX4, AX5

#### 9.1.2 Test All Screens at Largest Size

- [ ] **Alert Screens:**
  - [ ] AlertListScreen - cards don't break
  - [ ] AlertDetailScreen - info rows scale properly
  - [ ] AlertFilterScreen - options readable

- [ ] **Device Screens:**
  - [ ] DeviceListScreen - cards maintain layout
  - [ ] DeviceDetailScreen - sections scale well
  - [ ] DeviceHistoryScreen - history items readable

- [ ] **Analytics Screens:**
  - [ ] DashboardScreen - stats and charts visible
  - [ ] Chart labels scale appropriately
  - [ ] Summary cards don't overflow

- [ ] **Radar Screens:**
  - [ ] LiveRadarScreen - text doesn't overlap
  - [ ] Legend remains readable

- [ ] **Settings Screens:**
  - [ ] SettingsScreen - list rows scale
  - [ ] All settings detail screens scale

- [ ] **Auth Screens:**
  - [ ] LoginScreen - form remains usable
  - [ ] RegisterScreen - all fields accessible
  - [ ] ForgotPasswordScreen - text readable

#### 9.1.3 Fix Layout Issues

- [ ] **Common fixes needed:**
  - [ ] Replace fixed heights with flexible layouts
  - [ ] Use numberOfLines with ellipsis for long text
  - [ ] Add ScrollView where content might overflow
  - [ ] Increase touch targets at large sizes
  - [ ] Adjust spacing to accommodate larger text

- [ ] **Example fix for card overflow:**
  ```typescript
  // Before:
  <View style={{ height: 100 }}>
    <Text variant="title2">{longTitle}</Text>
  </View>

  // After:
  <View style={{ minHeight: 100 }}>
    <Text variant="title2" numberOfLines={2}>
      {longTitle}
    </Text>
  </View>
  ```

#### 9.1.4 Test Chart Accessibility

- [ ] **Ensure chart labels scale:**
  - X-axis labels
  - Y-axis labels
  - Legend text
  - Data point labels

- [ ] **Provide text alternatives for charts:**
  ```typescript
  <ChartWrapper
    title="Detections Over Time"
    subtitle={`Total: ${total}, Average: ${avg} per day`}
  >
    <IOSLineChart data={data} />
  </ChartWrapper>
  ```

---

### 9.2 VoiceOver Support

#### 9.2.1 Add Accessibility Labels

##### Button Accessibility

- [ ] **Ensure all buttons have labels:**
  ```typescript
  <Button
    accessibilityLabel="Mark alert as reviewed"
    accessibilityHint="Marks this alert as reviewed and updates its status"
    onPress={handleMarkReviewed}
  >
    Mark as Reviewed
  </Button>
  ```

- [ ] **Add labels to icon-only buttons:**
  ```typescript
  <Button
    buttonStyle="plain"
    leftIcon={<Icon name="filter" />}
    accessibilityLabel="Filter alerts"
    accessibilityHint="Opens filter options"
  >
  </Button>
  ```

##### ListRow Accessibility

- [ ] **Add accessibility labels to list rows:**
  ```typescript
  <ListRow
    title="Detection Sensitivity"
    rightText="Medium"
    accessibilityLabel="Detection Sensitivity setting, currently set to Medium"
    accessibilityHint="Tap to change detection sensitivity"
    accessibilityRole="button"
    onPress={handlePress}
  />
  ```

##### Icon Accessibility

- [ ] **Add accessibility labels to standalone icons:**
  ```typescript
  <Icon
    name="alert-circle"
    accessibilityLabel="Alert icon"
    accessibilityRole="image"
  />
  ```

##### Card Accessibility

- [ ] **Add accessibility to AlertCard:**
  ```typescript
  <Pressable
    accessibilityLabel={`${threatLevel} threat alert, ${detectionType} detection, device ${deviceName}, ${formatDate(timestamp)}`}
    accessibilityHint="Tap to view alert details, swipe left for actions"
    accessibilityRole="button"
    onPress={handlePress}
  >
  ```

- [ ] **Add accessibility to DeviceCard:**
  ```typescript
  <Pressable
    accessibilityLabel={`${deviceName}, ${online ? 'online' : 'offline'}, battery ${battery} percent, signal ${signal}, ${detectionCount} detections`}
    accessibilityHint="Tap to view device details"
    accessibilityRole="button"
  >
  ```

##### Input Accessibility

- [ ] **Ensure inputs have proper labels:**
  ```typescript
  <Input
    label="Email"
    accessibilityLabel="Email address"
    accessibilityHint="Enter your email address"
    accessibilityRole="text"
    value={email}
    onChangeText={setEmail}
  />
  ```

#### 9.2.2 Set Accessibility Roles

- [ ] **Apply correct roles:**
  - Buttons: `accessibilityRole="button"`
  - Links: `accessibilityRole="link"`
  - Headers: `accessibilityRole="header"`
  - Images: `accessibilityRole="image"`
  - Text inputs: `accessibilityRole="text"`
  - Search: `accessibilityRole="search"`
  - Switches: `accessibilityRole="switch"`

#### 9.2.3 Set Accessibility States

- [ ] **Add states to interactive elements:**
  ```typescript
  <Button
    disabled={isLoading}
    accessibilityState={{
      disabled: isLoading,
      busy: isLoading,
    }}
  >
    Save
  </Button>

  <ListRow
    selected={isSelected}
    accessibilityState={{
      selected: isSelected,
    }}
  />
  ```

#### 9.2.4 Group Related Elements

- [ ] **Use accessibilityViewIsModal for modals:**
  ```typescript
  <View accessibilityViewIsModal={true}>
    {/* Modal content */}
  </View>
  ```

- [ ] **Group card contents:**
  ```typescript
  <View accessible={true} accessibilityLabel="Alert card">
    {/* Card contents announced as one unit */}
  </View>
  ```

#### 9.2.5 Test with VoiceOver

- [ ] **Enable VoiceOver on iOS device:**
  - Settings > Accessibility > VoiceOver > On
  - Or triple-click home/side button

- [ ] **Test navigation through each screen:**
  - [ ] Can navigate to all elements
  - [ ] Elements announce correctly
  - [ ] Hints are helpful
  - [ ] Roles make sense
  - [ ] Focus order is logical
  - [ ] No elements are missed
  - [ ] No duplicate announcements

- [ ] **Test common actions:**
  - [ ] Tap buttons
  - [ ] Fill forms
  - [ ] Navigate lists
  - [ ] Use swipe actions
  - [ ] Switch tabs
  - [ ] Go back
  - [ ] Scroll content

---

### 9.3 Color Contrast

#### 9.3.1 Verify WCAG AA Compliance

- [ ] **Install color contrast checker:**
  - Chrome extension: "Color Contrast Analyzer"
  - Or online tool: WebAIM Contrast Checker

- [ ] **Check contrast ratios:**
  - Normal text: 4.5:1 minimum (WCAG AA)
  - Large text (18pt+): 3:1 minimum
  - UI components: 3:1 minimum

#### 9.3.2 Check Text Contrast in Light Mode

- [ ] **Primary text (label):**
  - [ ] On systemBackground
  - [ ] On secondarySystemBackground
  - [ ] On cards

- [ ] **Secondary text (secondaryLabel):**
  - [ ] On systemBackground
  - [ ] On secondarySystemBackground

- [ ] **Tertiary text (tertiaryLabel):**
  - [ ] Should meet 3:1 minimum

- [ ] **Colored text:**
  - [ ] systemBlue on white
  - [ ] systemRed on white
  - [ ] systemGreen on white

#### 9.3.3 Check Text Contrast in Dark Mode

- [ ] **Primary text (label):**
  - [ ] On systemBackground (black)
  - [ ] On secondarySystemBackground
  - [ ] On cards

- [ ] **Secondary text (secondaryLabel):**
  - [ ] On dark backgrounds

- [ ] **Tertiary text (tertiaryLabel):**
  - [ ] Verify visibility

#### 9.3.4 Check UI Component Contrast

- [ ] **Buttons:**
  - [ ] Filled buttons (text on background)
  - [ ] Tinted buttons
  - [ ] Gray buttons
  - [ ] Plain buttons (text only)

- [ ] **Icons:**
  - [ ] Icon color vs background
  - [ ] Interactive icons clearly visible

- [ ] **Borders and separators:**
  - [ ] Visible but not harsh
  - [ ] Meet 3:1 for important UI boundaries

#### 9.3.5 Fix Contrast Issues

- [ ] **Common fixes:**
  - Darken text colors
  - Lighten background colors
  - Increase border opacity
  - Add subtle backgrounds to low-contrast text

---

### 9.4 Touch Targets

#### 9.4.1 Verify 44pt Minimum

- [ ] **Check all interactive elements:**
  - [ ] All buttons meet 44x44pt minimum
  - [ ] ListRow tap areas are 44pt tall minimum
  - [ ] Icons in navigation bars are 44x44pt
  - [ ] Swipe action buttons are tall enough
  - [ ] Input fields are 44pt tall minimum
  - [ ] Tab bar items are 44pt tall minimum

#### 9.4.2 Add Padding Where Needed

- [ ] **Example fix:**
  ```typescript
  // Before: Icon too small to tap
  <Icon name="close" size={20} onPress={handleClose} />

  // After: Add touchable padding
  <Pressable
    onPress={handleClose}
    style={{
      padding: 12, // Makes total tappable area 44x44
    }}
  >
    <Icon name="close" size={20} />
  </Pressable>
  ```

#### 9.4.3 Add Spacing Between Targets

- [ ] **Ensure adequate spacing:**
  - Minimum 8pt between adjacent tap targets
  - More spacing preferred (16pt)

#### 9.4.4 Test Touch Targets

- [ ] **Manual testing:**
  - [ ] Can tap all buttons easily
  - [ ] Don't accidentally tap adjacent elements
  - [ ] Works well with larger fingers

---

### 9.5 Reduce Motion

#### 9.5.1 Detect Reduce Motion Setting

- [ ] **Check for reduce motion preference:**
  ```typescript
  import { AccessibilityInfo } from 'react-native';

  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotionEnabled);

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotionEnabled
    );

    return () => subscription.remove();
  }, []);
  ```

#### 9.5.2 Simplify Animations When Enabled

- [ ] **Radar sweep animation:**
  ```typescript
  const shouldAnimate = !reduceMotionEnabled;

  {shouldAnimate ? (
    <AnimatedRadarSweep />
  ) : (
    <StaticRadarDisplay />
  )}
  ```

- [ ] **Button press animations:**
  - Instant state change instead of fade
  - No scale animations

- [ ] **Transitions:**
  - Reduce transition duration
  - Use crossfade instead of slide

- [ ] **Charts:**
  - Instant render instead of animated
  - No entrance animations

---

### 9.6 Additional Accessibility Features

#### 9.6.1 Keyboard Support (if applicable)

- [ ] **Ensure tab navigation works**
- [ ] **Proper focus indicators**

#### 9.6.2 Alternative Text for Images

- [ ] **Add alt text to all images:**
  ```typescript
  <Image
    source={require('./icon.png')}
    accessibilityLabel="App logo"
    accessibilityRole="image"
  />
  ```

#### 9.6.3 Meaningful Focus Order

- [ ] **Test tab order is logical**
- [ ] **Group related items**
- [ ] **Skip decorative elements**

---

## Testing Checklist

### Dynamic Type Testing

- [ ] All text scales correctly
- [ ] No layout breaks at largest size
- [ ] All content remains accessible
- [ ] Charts scale appropriately

### VoiceOver Testing

- [ ] All elements have labels
- [ ] All elements have roles
- [ ] Navigation is logical
- [ ] Hints are helpful
- [ ] No duplicate announcements
- [ ] Actions work with VoiceOver

### Contrast Testing

- [ ] Text meets WCAG AA in light mode
- [ ] Text meets WCAG AA in dark mode
- [ ] UI components meet 3:1 minimum
- [ ] Important information is visible

### Touch Target Testing

- [ ] All targets meet 44pt minimum
- [ ] Adequate spacing between targets
- [ ] Easy to tap with finger
- [ ] No accidental taps

### Reduce Motion Testing

- [ ] Animations simplify when enabled
- [ ] App remains functional
- [ ] No jarring motion

---

## Success Criteria

- ✅ All text supports Dynamic Type
- ✅ All screens tested at largest accessibility size
- ✅ All interactive elements have VoiceOver labels
- ✅ All accessibility roles set correctly
- ✅ App fully navigable with VoiceOver
- ✅ All text meets WCAG AA contrast (4.5:1)
- ✅ All UI components meet 3:1 contrast
- ✅ All touch targets meet 44pt minimum
- ✅ Reduce Motion supported
- ✅ App is fully accessible to all users

## Commit Messages

```bash
git commit -m "feat: add comprehensive Dynamic Type support

- All text components scale correctly
- Fixed layout issues at large sizes
- Charts remain readable
- All screens tested at AX5 size"

git commit -m "feat: add complete VoiceOver support

- All elements have accessibility labels
- All roles and states set correctly
- Logical focus order throughout
- Tested and verified with VoiceOver enabled"

git commit -m "fix: ensure WCAG AA color contrast compliance

- Verified all text contrast ratios
- Fixed low-contrast text
- Improved button visibility
- Works in both light and dark modes"

git commit -m "fix: ensure all touch targets meet 44pt minimum

- Increased button padding where needed
- Fixed small tap targets
- Added spacing between adjacent targets"

git commit -m "feat: add Reduce Motion support

- Detect reduce motion preference
- Simplify animations when enabled
- Crossfade transitions instead of slides
- Instant chart renders"
```

---

**Status:** ⬜ Not Started → ⬜ In Progress → ✅ Complete

**Next Phase:** `10-documentation-cleanup.md`
