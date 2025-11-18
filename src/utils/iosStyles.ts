/**
 * iOS Style Utilities
 *
 * Collection of reusable style utilities that follow iOS design patterns.
 * These utilities make it easier to apply consistent styling across components.
 *
 * Usage:
 * - Import and spread utilities into StyleSheet objects
 * - Combine multiple utilities for complex layouts
 * - Use with iOS design system constants (colors, spacing, etc.)
 */

import { StyleSheet, ViewStyle } from 'react-native';

// ======================
// Flex Layout Utilities
// ======================

/**
 * Flexbox layout utilities
 * Common flex patterns for iOS layouts
 */
export const flex = {
  /**
   * Flex row layout
   * Items arranged horizontally
   */
  row: {
    flexDirection: 'row' as const,
  },

  /**
   * Flex column layout
   * Items arranged vertically (default)
   */
  column: {
    flexDirection: 'column' as const,
  },

  /**
   * Center items both horizontally and vertically
   */
  center: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  /**
   * Row layout with vertically centered items
   * Common for list items and horizontal layouts
   */
  rowCenter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },

  /**
   * Row layout with space between items
   * Common for headers and action rows
   */
  rowBetween: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },

  /**
   * Space between items
   */
  spaceBetween: {
    justifyContent: 'space-between' as const,
  },

  /**
   * Space around items
   */
  spaceAround: {
    justifyContent: 'space-around' as const,
  },

  /**
   * Space evenly between items
   */
  spaceEvenly: {
    justifyContent: 'space-evenly' as const,
  },

  /**
   * Align items to center
   */
  alignCenter: {
    alignItems: 'center' as const,
  },

  /**
   * Align items to start
   */
  alignStart: {
    alignItems: 'flex-start' as const,
  },

  /**
   * Align items to end
   */
  alignEnd: {
    alignItems: 'flex-end' as const,
  },

  /**
   * Align items stretched
   */
  alignStretch: {
    alignItems: 'stretch' as const,
  },

  /**
   * Justify content to center
   */
  justifyCenter: {
    justifyContent: 'center' as const,
  },

  /**
   * Justify content to start
   */
  justifyStart: {
    justifyContent: 'flex-start' as const,
  },

  /**
   * Justify content to end
   */
  justifyEnd: {
    justifyContent: 'flex-end' as const,
  },

  /**
   * Flex 1 - fill available space
   */
  flex1: {
    flex: 1,
  },

  /**
   * Flex wrap - allow items to wrap
   */
  wrap: {
    flexWrap: 'wrap' as const,
  },

  /**
   * No wrap - items stay on one line (default)
   */
  nowrap: {
    flexWrap: 'nowrap' as const,
  },
};

// ======================
// Spacing Helper Functions
// ======================

/**
 * Spacing utilities for padding and margin
 * Use these to apply spacing dynamically
 */
export const spacing = {
  // Padding utilities
  /**
   * Padding on all sides
   */
  p: (value: number): ViewStyle => ({ padding: value }),

  /**
   * Horizontal padding (left and right)
   */
  px: (value: number): ViewStyle => ({ paddingHorizontal: value }),

  /**
   * Vertical padding (top and bottom)
   */
  py: (value: number): ViewStyle => ({ paddingVertical: value }),

  /**
   * Padding top
   */
  pt: (value: number): ViewStyle => ({ paddingTop: value }),

  /**
   * Padding bottom
   */
  pb: (value: number): ViewStyle => ({ paddingBottom: value }),

  /**
   * Padding left
   */
  pl: (value: number): ViewStyle => ({ paddingLeft: value }),

  /**
   * Padding right
   */
  pr: (value: number): ViewStyle => ({ paddingRight: value }),

  // Margin utilities
  /**
   * Margin on all sides
   */
  m: (value: number): ViewStyle => ({ margin: value }),

  /**
   * Horizontal margin (left and right)
   */
  mx: (value: number): ViewStyle => ({ marginHorizontal: value }),

  /**
   * Vertical margin (top and bottom)
   */
  my: (value: number): ViewStyle => ({ marginVertical: value }),

  /**
   * Margin top
   */
  mt: (value: number): ViewStyle => ({ marginTop: value }),

  /**
   * Margin bottom
   */
  mb: (value: number): ViewStyle => ({ marginBottom: value }),

  /**
   * Margin left
   */
  ml: (value: number): ViewStyle => ({ marginLeft: value }),

  /**
   * Margin right
   */
  mr: (value: number): ViewStyle => ({ marginRight: value }),

  /**
   * Gap between flex items (for compatible versions)
   */
  gap: (value: number): ViewStyle => ({ gap: value }),

  /**
   * Row gap for flex items
   */
  rowGap: (value: number): ViewStyle => ({ rowGap: value }),

  /**
   * Column gap for flex items
   */
  columnGap: (value: number): ViewStyle => ({ columnGap: value }),
};

// ======================
// Border Radius Helpers
// ======================

/**
 * Border radius utilities
 * Apply rounded corners with iOS-standard values
 */
export const rounded = {
  /**
   * No border radius - sharp corners
   */
  none: {
    borderRadius: 0,
  },

  /**
   * Extra small radius - 4pt
   */
  xs: {
    borderRadius: 4,
  },

  /**
   * Small radius - 6pt
   */
  sm: {
    borderRadius: 6,
  },

  /**
   * Medium radius - 8pt
   */
  md: {
    borderRadius: 8,
  },

  /**
   * Large radius - 10pt
   * iOS standard for buttons and inputs
   */
  lg: {
    borderRadius: 10,
  },

  /**
   * Extra large radius - 12pt
   * iOS standard for cards
   */
  xl: {
    borderRadius: 12,
  },

  /**
   * 2X large radius - 16pt
   */
  '2xl': {
    borderRadius: 16,
  },

  /**
   * 3X large radius - 20pt
   */
  '3xl': {
    borderRadius: 20,
  },

  /**
   * Full radius - circular
   */
  full: {
    borderRadius: 9999,
  },

  // Specific corner radius utilities
  /**
   * Top corners only
   */
  top: (radius: number): ViewStyle => ({
    borderTopLeftRadius: radius,
    borderTopRightRadius: radius,
  }),

  /**
   * Bottom corners only
   */
  bottom: (radius: number): ViewStyle => ({
    borderBottomLeftRadius: radius,
    borderBottomRightRadius: radius,
  }),

  /**
   * Left corners only
   */
  left: (radius: number): ViewStyle => ({
    borderTopLeftRadius: radius,
    borderBottomLeftRadius: radius,
  }),

  /**
   * Right corners only
   */
  right: (radius: number): ViewStyle => ({
    borderTopRightRadius: radius,
    borderBottomRightRadius: radius,
  }),
};

// ======================
// Divider Utility
// ======================

/**
 * iOS-style divider/separator
 * Creates a hairline divider with proper iOS separator color
 *
 * @param color - Separator color (use theme.colors.separator)
 * @returns ViewStyle for a hairline divider
 */
export const divider = (color: string): ViewStyle => ({
  height: StyleSheet.hairlineWidth,
  backgroundColor: color,
});

/**
 * Vertical divider
 * Creates a vertical hairline separator
 *
 * @param color - Separator color (use theme.colors.separator)
 * @returns ViewStyle for a vertical hairline divider
 */
export const verticalDivider = (color: string): ViewStyle => ({
  width: StyleSheet.hairlineWidth,
  backgroundColor: color,
});

// ======================
// Position Utilities
// ======================

/**
 * Position utilities
 * Common positioning patterns
 */
export const position = {
  /**
   * Absolute positioning
   */
  absolute: {
    position: 'absolute' as const,
  },

  /**
   * Relative positioning
   */
  relative: {
    position: 'relative' as const,
  },

  /**
   * Absolute fill - fill parent container
   */
  absoluteFill: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  /**
   * Absolute centered - center element absolutely
   */
  absoluteCenter: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
  },
};

// ======================
// Size Utilities
// ======================

/**
 * Size utilities
 * Common sizing patterns
 */
export const size = {
  /**
   * Full width
   */
  fullWidth: {
    width: '100%',
  },

  /**
   * Full height
   */
  fullHeight: {
    height: '100%',
  },

  /**
   * Full size - width and height 100%
   */
  full: {
    width: '100%',
    height: '100%',
  },

  /**
   * Square - equal width and height
   */
  square: (size: number): ViewStyle => ({
    width: size,
    height: size,
  }),

  /**
   * Circle - square with full border radius
   */
  circle: (size: number): ViewStyle => ({
    width: size,
    height: size,
    borderRadius: size / 2,
  }),
};

// ======================
// Text Utilities
// ======================

/**
 * Text alignment utilities
 */
export const textAlign = {
  /**
   * Left-aligned text (iOS default)
   */
  left: {
    textAlign: 'left' as const,
  },

  /**
   * Center-aligned text
   */
  center: {
    textAlign: 'center' as const,
  },

  /**
   * Right-aligned text
   */
  right: {
    textAlign: 'right' as const,
  },

  /**
   * Justified text
   */
  justify: {
    textAlign: 'justify' as const,
  },
};

/**
 * Text transformation utilities
 */
export const textTransform = {
  /**
   * Uppercase text
   */
  uppercase: {
    textTransform: 'uppercase' as const,
  },

  /**
   * Lowercase text
   */
  lowercase: {
    textTransform: 'lowercase' as const,
  },

  /**
   * Capitalized text
   */
  capitalize: {
    textTransform: 'capitalize' as const,
  },

  /**
   * Normal text (no transformation)
   */
  none: {
    textTransform: 'none' as const,
  },
};

// ======================
// Opacity Utilities
// ======================

/**
 * Opacity utilities
 * Common opacity values
 */
export const opacity = {
  0: { opacity: 0 },
  10: { opacity: 0.1 },
  20: { opacity: 0.2 },
  30: { opacity: 0.3 },
  40: { opacity: 0.4 },
  50: { opacity: 0.5 },
  60: { opacity: 0.6 },
  70: { opacity: 0.7 },
  80: { opacity: 0.8 },
  90: { opacity: 0.9 },
  100: { opacity: 1 },
};

// ======================
// Overflow Utilities
// ======================

/**
 * Overflow utilities
 */
export const overflow = {
  /**
   * Visible overflow
   */
  visible: {
    overflow: 'visible' as const,
  },

  /**
   * Hidden overflow
   */
  hidden: {
    overflow: 'hidden' as const,
  },

  /**
   * Scroll overflow
   */
  scroll: {
    overflow: 'scroll' as const,
  },
};

// ======================
// iOS-Specific Component Presets
// ======================

/**
 * iOS Card preset
 * Complete card styling following iOS design patterns
 */
export const iosCard = (backgroundColor: string = '#FFFFFF'): ViewStyle => ({
  backgroundColor,
  borderRadius: 12,
  padding: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 1,
});

/**
 * iOS List Item preset
 * Standard iOS list row styling
 */
export const iosListItem = (backgroundColor: string = '#FFFFFF'): ViewStyle => ({
  backgroundColor,
  minHeight: 44,
  paddingHorizontal: 16,
  paddingVertical: 12,
  flexDirection: 'row',
  alignItems: 'center',
});

/**
 * iOS Button preset
 * Standard iOS button styling
 */
export const iosButton = (backgroundColor: string): ViewStyle => ({
  backgroundColor,
  borderRadius: 10,
  height: 50,
  paddingHorizontal: 16,
  justifyContent: 'center',
  alignItems: 'center',
});

/**
 * iOS Input preset
 * Standard iOS text input styling
 * Note: fontSize should be applied to TextInput via style prop separately
 */
export const iosInput = (backgroundColor: string = '#F2F2F7'): ViewStyle => ({
  backgroundColor,
  borderRadius: 10,
  height: 44,
  paddingHorizontal: 16,
});

// ======================
// Export all utilities
// ======================

export default {
  flex,
  spacing,
  rounded,
  divider,
  verticalDivider,
  position,
  size,
  textAlign,
  textTransform,
  opacity,
  overflow,
  iosCard,
  iosListItem,
  iosButton,
  iosInput,
};
