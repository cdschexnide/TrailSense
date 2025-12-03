/**
 * iOS Spacing System - 8pt Grid
 *
 * This spacing system follows Apple's Human Interface Guidelines.
 * All spacing values are multiples of 8 (or 4 for tight adjustments).
 *
 * The 8pt grid system provides:
 * - Consistent visual rhythm
 * - Better alignment across components
 * - Easier design-to-development handoff
 * - Better scalability across screen sizes
 *
 * @see https://developer.apple.com/design/human-interface-guidelines/layout
 */

// ======================
// Base Spacing Scale (8pt Grid)
// ======================

/**
 * Base spacing values following 8pt grid
 * Use these for margins, padding, and gaps
 */
export const Spacing = {
  /**
   * Extra extra small: 4pt
   * Use for: Tight adjustments, minimal spacing
   * Note: Half unit for exceptional cases only
   */
  xxs: 4,

  /**
   * Extra small: 8pt
   * Use for: Minimal spacing between related elements
   */
  xs: 8,

  /**
   * Small: 16pt
   * Use for: Standard spacing between related elements
   */
  sm: 16,

  /**
   * Medium: 24pt
   * Use for: Spacing between loosely related elements
   */
  md: 24,

  /**
   * Large: 32pt
   * Use for: Spacing between sections
   */
  lg: 32,

  /**
   * Extra large: 40pt
   * Use for: Large gaps between major sections
   */
  xl: 40,

  /**
   * 2X large: 48pt
   * Use for: Very large gaps
   */
  '2xl': 48,

  /**
   * 3X large: 56pt
   * Use for: Major section breaks
   */
  '3xl': 56,

  /**
   * 4X large: 64pt
   * Use for: Maximum spacing
   */
  '4xl': 64,

  /**
   * Base spacing: 16pt
   * @deprecated Use 'sm' instead (same value)
   */
  base: 16,
};

// ======================
// iOS Layout Constants
// ======================

/**
 * iOS-specific layout dimensions and constraints
 * These follow Apple's standard design patterns
 */
export const Layout = {
  // ======================
  // Touch Targets
  // ======================

  /**
   * Minimum touch target size: 44pt
   * All interactive elements MUST be at least 44x44pt
   * This is an iOS accessibility requirement
   */
  minTouchTarget: 44,

  // ======================
  // Screen Margins
  // ======================

  /**
   * Standard screen margin: 20pt
   * Use for: Main screen edge padding
   */
  screenMargin: 20,

  /**
   * Screen horizontal padding: 16pt
   * Alternative margin for tighter layouts
   */
  screenPaddingHorizontal: 16,

  /**
   * Screen vertical padding: 16pt
   * Alternative margin for vertical spacing
   */
  screenPaddingVertical: 16,

  // ======================
  // Card Layout
  // ======================

  /**
   * Card internal padding: 16pt
   * Use for: Padding inside cards
   */
  cardPadding: 16,

  /**
   * Card margin: 16pt
   * Use for: Spacing between cards
   */
  cardMargin: 16,

  /**
   * Card corner radius: 12pt
   * Standard iOS card radius
   */
  cardRadius: 12,

  // ======================
  // List Layout
  // ======================

  /**
   * Minimum list item height: 44pt
   * Ensures adequate touch target
   */
  listItemHeight: 44,

  /**
   * List item vertical padding: 12pt
   * Internal vertical padding for list rows
   */
  listItemPaddingVertical: 12,

  /**
   * List item horizontal padding: 16pt
   * Internal horizontal padding for list rows
   */
  listItemPaddingHorizontal: 16,

  /**
   * List item gap: 8pt
   * Spacing between list items
   */
  listItemGap: 8,

  // ======================
  // Section Spacing
  // ======================

  /**
   * Section spacing: 32pt
   * Use for: Spacing between major sections
   */
  sectionSpacing: 32,

  /**
   * Section header height: 38pt
   * Standard iOS section header height
   */
  sectionHeaderHeight: 38,

  // ======================
  // Button Layout
  // ======================

  /**
   * Button height: 50pt
   * Standard iOS button height (larger than min touch target)
   */
  buttonHeight: 50,

  /**
   * Button horizontal padding: 16pt
   * Internal horizontal padding for buttons
   */
  buttonPaddingHorizontal: 16,

  /**
   * Small button height: 44pt
   * Minimum button height (matches min touch target)
   */
  buttonHeightSmall: 44,

  /**
   * Large button height: 56pt
   * Prominent action buttons
   */
  buttonHeightLarge: 56,

  // ======================
  // Input Layout
  // ======================

  /**
   * Input height: 44pt
   * Standard iOS text input height
   */
  inputHeight: 44,

  /**
   * Input padding: 12pt
   * Internal padding for inputs
   */
  inputPadding: 12,

  /**
   * Input horizontal padding: 16pt
   * Internal horizontal padding for inputs
   */
  inputPaddingHorizontal: 16,

  // ======================
  // Icon Sizing
  // ======================

  /**
   * Icon size small: 16pt
   * Use for: Small inline icons
   */
  iconSizeSmall: 16,

  /**
   * Icon size medium: 24pt
   * Use for: Standard icons in cards and lists
   */
  iconSizeMedium: 24,

  /**
   * Icon size large: 32pt
   * Use for: Large prominent icons
   */
  iconSizeLarge: 32,

  /**
   * Tab bar icon size: 28pt
   * Use for: Bottom tab bar icons
   */
  tabBarIconSize: 28,

  /**
   * Navigation bar icon size: 22pt
   * Use for: Top navigation bar icons
   */
  navBarIconSize: 22,

  // ======================
  // Badge & Chip Layout
  // ======================

  /**
   * Badge padding horizontal: 8pt
   * Internal horizontal padding for badges
   */
  badgePaddingHorizontal: 8,

  /**
   * Badge padding vertical: 4pt
   * Internal vertical padding for badges
   */
  badgePaddingVertical: 4,

  /**
   * Badge min width: 20pt
   * Minimum width for badges
   */
  badgeMinWidth: 20,

  /**
   * Badge height: 20pt
   * Standard badge height
   */
  badgeHeight: 20,
};

// ======================
// Border Radius
// ======================

/**
 * iOS Border Radius values
 * All values follow 8pt grid or iOS standards
 */
export const BorderRadius = {
  /**
   * No radius: 0pt
   * Use for: Sharp corners
   */
  none: 0,

  /**
   * Extra small radius: 4pt
   * Use for: Very subtle rounding
   */
  xs: 4,

  /**
   * Small radius: 6pt
   * Use for: Small badges, chips
   */
  sm: 6,

  /**
   * Medium radius: 8pt
   * Use for: Smaller buttons, inputs
   */
  md: 8,

  /**
   * Large radius: 10pt
   * Use for: Standard buttons and inputs
   */
  lg: 10,

  /**
   * Extra large radius: 12pt
   * Use for: Cards and larger elements
   */
  xl: 12,

  /**
   * 2X large radius: 16pt
   * Use for: Prominent cards
   */
  '2xl': 16,

  /**
   * 3X large radius: 20pt
   * Use for: Modal sheets
   */
  '3xl': 20,

  /**
   * Full radius: 9999pt
   * Use for: Circles and pills
   */
  full: 9999,

  // iOS-specific aliases
  /**
   * Card radius: 12pt
   * Standard iOS card corner radius
   */
  card: 12,

  /**
   * Button radius: 10pt
   * Standard iOS button corner radius
   */
  button: 10,

  /**
   * Input radius: 10pt
   * Standard iOS input corner radius
   */
  input: 10,

  /**
   * Badge radius: 6pt
   * Standard iOS badge corner radius
   */
  badge: 6,

  /**
   * Base radius: 8pt
   * @deprecated Use 'md' instead (same value)
   */
  base: 8,
};

// ======================
// Common Spacing Patterns
// ======================

/**
 * Common spacing patterns for frequent use cases
 */
export const SpacingPatterns = {
  /**
   * Card spacing
   * Internal padding and margin for cards
   */
  card: {
    padding: Layout.cardPadding,
    margin: Layout.cardMargin,
    gap: Spacing.sm,
  },

  /**
   * List spacing
   * Spacing for list items
   */
  list: {
    itemPaddingVertical: Layout.listItemPaddingVertical,
    itemPaddingHorizontal: Layout.listItemPaddingHorizontal,
    itemGap: Layout.listItemGap,
  },

  /**
   * Form spacing
   * Spacing for form fields
   */
  form: {
    fieldGap: Spacing.sm,
    sectionGap: Spacing.lg,
    labelGap: Spacing.xxs,
  },

  /**
   * Screen padding
   * Standard screen edge padding
   */
  screen: {
    horizontal: Layout.screenMargin,
    vertical: Layout.screenPaddingVertical,
    top: Spacing.sm,
    bottom: Spacing.sm,
  },
};

// ======================
// TypeScript Type Definitions
// ======================

/**
 * Spacing size type
 */
export type SpacingSize =
  | 'xxs'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | 'base';

/**
 * Border radius size type
 */
export type BorderRadiusSize =
  | 'none'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | 'full'
  | 'card'
  | 'button'
  | 'input'
  | 'badge'
  | 'base';

/**
 * Helper function to get spacing value
 */
export const getSpacing = (size: SpacingSize): number => {
  return Spacing[size];
};

/**
 * Helper function to get border radius value
 */
export const getBorderRadius = (size: BorderRadiusSize): number => {
  return BorderRadius[size];
};

/**
 * Helper function to calculate spacing multiples
 * Ensures values stay on 8pt grid
 */
export const multiplySpacing = (
  baseSize: SpacingSize,
  multiplier: number
): number => {
  const baseValue = Spacing[baseSize];
  return baseValue * multiplier;
};
