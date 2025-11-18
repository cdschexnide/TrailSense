/**
 * iOS Typography System
 *
 * This typography system follows Apple's Human Interface Guidelines for iOS.
 * It uses the San Francisco (SF) system font and iOS semantic text styles.
 *
 * The system font automatically adapts to the platform and supports Dynamic Type
 * for accessibility.
 *
 * @see https://developer.apple.com/design/human-interface-guidelines/typography
 */

// ======================
// Font Family
// ======================

/**
 * iOS System Font
 * Uses San Francisco (SF) on iOS devices
 * Automatically optimizes for different sizes (SF Text vs SF Display)
 */
export const FontFamily = {
  /**
   * Default system font
   * Use for all standard UI text
   */
  system: 'System',

  /**
   * Fallback for web/cross-platform
   */
  systemFallback: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif',

  /**
   * Monospace font for technical content
   * Use for MAC addresses, code, technical data
   */
  mono: 'Menlo, Monaco, Courier New, monospace',
};

// ======================
// Font Weights
// ======================

/**
 * iOS Font Weights
 * Only use these standard iOS weights for consistency
 */
export const FontWeight = {
  /**
   * Regular weight (400)
   * Default for most text
   */
  regular: '400' as const,

  /**
   * Medium weight (500)
   * Use for subheadings and emphasis
   */
  medium: '500' as const,

  /**
   * Semibold weight (600)
   * Use for headlines and important labels
   */
  semibold: '600' as const,

  /**
   * Bold weight (700)
   * Use for strong emphasis and titles
   */
  bold: '700' as const,
};

// ======================
// iOS Text Styles
// ======================

/**
 * iOS Semantic Text Styles
 *
 * These match Apple's standard text styles and support Dynamic Type.
 * Use these instead of arbitrary font sizes.
 *
 * Guidelines:
 * - Use largeTitle for main screen titles
 * - Use title1-3 for section headers
 * - Use headline for card titles and important content
 * - Use body for primary content
 * - Use callout, subheadline, footnote for supporting content
 * - Use caption1-2 for labels, timestamps, and metadata
 */
export const TextStyles = {
  /**
   * Large Title
   * Size: 34pt, Weight: Regular, Line Height: 41
   * Use for: Main screen titles, primary navigation
   */
  largeTitle: {
    fontFamily: FontFamily.system,
    fontSize: 34,
    fontWeight: FontWeight.regular,
    lineHeight: 41,
    letterSpacing: 0,
  },

  /**
   * Large Title (Bold variant)
   * Size: 34pt, Weight: Bold, Line Height: 41
   * Use for: Emphasized screen titles
   */
  largeTitleBold: {
    fontFamily: FontFamily.system,
    fontSize: 34,
    fontWeight: FontWeight.bold,
    lineHeight: 41,
    letterSpacing: 0,
  },

  /**
   * Title 1
   * Size: 28pt, Weight: Regular, Line Height: 34
   * Use for: First-level section headers
   */
  title1: {
    fontFamily: FontFamily.system,
    fontSize: 28,
    fontWeight: FontWeight.regular,
    lineHeight: 34,
    letterSpacing: 0,
  },

  /**
   * Title 1 (Bold variant)
   * Size: 28pt, Weight: Bold, Line Height: 34
   * Use for: Emphasized section headers
   */
  title1Bold: {
    fontFamily: FontFamily.system,
    fontSize: 28,
    fontWeight: FontWeight.bold,
    lineHeight: 34,
    letterSpacing: 0,
  },

  /**
   * Title 2
   * Size: 22pt, Weight: Regular, Line Height: 28
   * Use for: Second-level section headers
   */
  title2: {
    fontFamily: FontFamily.system,
    fontSize: 22,
    fontWeight: FontWeight.regular,
    lineHeight: 28,
    letterSpacing: 0,
  },

  /**
   * Title 2 (Bold variant)
   * Size: 22pt, Weight: Bold, Line Height: 28
   * Use for: Emphasized subsection headers
   */
  title2Bold: {
    fontFamily: FontFamily.system,
    fontSize: 22,
    fontWeight: FontWeight.bold,
    lineHeight: 28,
    letterSpacing: 0,
  },

  /**
   * Title 3
   * Size: 20pt, Weight: Regular, Line Height: 25
   * Use for: Third-level section headers, group headers
   */
  title3: {
    fontFamily: FontFamily.system,
    fontSize: 20,
    fontWeight: FontWeight.regular,
    lineHeight: 25,
    letterSpacing: 0,
  },

  /**
   * Title 3 (Semibold variant)
   * Size: 20pt, Weight: Semibold, Line Height: 25
   * Use for: Emphasized group headers
   */
  title3Semibold: {
    fontFamily: FontFamily.system,
    fontSize: 20,
    fontWeight: FontWeight.semibold,
    lineHeight: 25,
    letterSpacing: 0,
  },

  /**
   * Headline
   * Size: 17pt, Weight: Semibold, Line Height: 22
   * Use for: Card titles, list headers, important content labels
   */
  headline: {
    fontFamily: FontFamily.system,
    fontSize: 17,
    fontWeight: FontWeight.semibold,
    lineHeight: 22,
    letterSpacing: 0,
  },

  /**
   * Body
   * Size: 17pt, Weight: Regular, Line Height: 22
   * Use for: Primary body text, main content
   */
  body: {
    fontFamily: FontFamily.system,
    fontSize: 17,
    fontWeight: FontWeight.regular,
    lineHeight: 22,
    letterSpacing: 0,
  },

  /**
   * Body (Semibold variant)
   * Size: 17pt, Weight: Semibold, Line Height: 22
   * Use for: Emphasized body text
   */
  bodySemibold: {
    fontFamily: FontFamily.system,
    fontSize: 17,
    fontWeight: FontWeight.semibold,
    lineHeight: 22,
    letterSpacing: 0,
  },

  /**
   * Callout
   * Size: 16pt, Weight: Regular, Line Height: 21
   * Use for: Secondary information, subtitles
   */
  callout: {
    fontFamily: FontFamily.system,
    fontSize: 16,
    fontWeight: FontWeight.regular,
    lineHeight: 21,
    letterSpacing: 0,
  },

  /**
   * Callout (Semibold variant)
   * Size: 16pt, Weight: Semibold, Line Height: 21
   * Use for: Emphasized secondary information
   */
  calloutSemibold: {
    fontFamily: FontFamily.system,
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    lineHeight: 21,
    letterSpacing: 0,
  },

  /**
   * Subheadline
   * Size: 15pt, Weight: Regular, Line Height: 20
   * Use for: Supporting text, descriptions
   */
  subheadline: {
    fontFamily: FontFamily.system,
    fontSize: 15,
    fontWeight: FontWeight.regular,
    lineHeight: 20,
    letterSpacing: 0,
  },

  /**
   * Subheadline (Semibold variant)
   * Size: 15pt, Weight: Semibold, Line Height: 20
   * Use for: Emphasized supporting text
   */
  subheadlineSemibold: {
    fontFamily: FontFamily.system,
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    lineHeight: 20,
    letterSpacing: 0,
  },

  /**
   * Footnote
   * Size: 13pt, Weight: Regular, Line Height: 18
   * Use for: Tertiary information, footnotes
   */
  footnote: {
    fontFamily: FontFamily.system,
    fontSize: 13,
    fontWeight: FontWeight.regular,
    lineHeight: 18,
    letterSpacing: 0,
  },

  /**
   * Footnote (Semibold variant)
   * Size: 13pt, Weight: Semibold, Line Height: 18
   * Use for: Emphasized footnotes
   */
  footnoteSemibold: {
    fontFamily: FontFamily.system,
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    lineHeight: 18,
    letterSpacing: 0,
  },

  /**
   * Caption 1
   * Size: 12pt, Weight: Regular, Line Height: 16
   * Use for: Image captions, labels, timestamps
   */
  caption1: {
    fontFamily: FontFamily.system,
    fontSize: 12,
    fontWeight: FontWeight.regular,
    lineHeight: 16,
    letterSpacing: 0,
  },

  /**
   * Caption 1 (Medium variant)
   * Size: 12pt, Weight: Medium, Line Height: 16
   * Use for: Emphasized captions
   */
  caption1Medium: {
    fontFamily: FontFamily.system,
    fontSize: 12,
    fontWeight: FontWeight.medium,
    lineHeight: 16,
    letterSpacing: 0,
  },

  /**
   * Caption 2
   * Size: 11pt, Weight: Regular, Line Height: 13
   * Use for: Smallest readable text, fine print
   */
  caption2: {
    fontFamily: FontFamily.system,
    fontSize: 11,
    fontWeight: FontWeight.regular,
    lineHeight: 13,
    letterSpacing: 0,
  },

  /**
   * Caption 2 (Semibold variant)
   * Size: 11pt, Weight: Semibold, Line Height: 13
   * Use for: Emphasized fine print
   */
  caption2Semibold: {
    fontFamily: FontFamily.system,
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    lineHeight: 13,
    letterSpacing: 0,
  },

  // ======================
  // Specialized Text Styles
  // ======================

  /**
   * Button Text
   * Size: 17pt, Weight: Semibold, Line Height: 22
   * Use for: Button labels
   */
  button: {
    fontFamily: FontFamily.system,
    fontSize: 17,
    fontWeight: FontWeight.semibold,
    lineHeight: 22,
    letterSpacing: 0,
  },

  /**
   * Small Button Text
   * Size: 15pt, Weight: Semibold, Line Height: 20
   * Use for: Compact button labels
   */
  buttonSmall: {
    fontFamily: FontFamily.system,
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    lineHeight: 20,
    letterSpacing: 0,
  },

  /**
   * Monospace Text
   * Size: 13pt, Weight: Regular, Line Height: 18
   * Use for: MAC addresses, technical data, code
   */
  mono: {
    fontFamily: FontFamily.mono,
    fontSize: 13,
    fontWeight: FontWeight.regular,
    lineHeight: 18,
    letterSpacing: 0,
  },

  /**
   * Monospace Small
   * Size: 11pt, Weight: Regular, Line Height: 13
   * Use for: Compact technical data
   */
  monoSmall: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    fontWeight: FontWeight.regular,
    lineHeight: 13,
    letterSpacing: 0,
  },
};

// ======================
// TypeScript Type Definitions
// ======================

/**
 * Text style variant type
 */
export type TextStyleVariant =
  | 'largeTitle'
  | 'largeTitleBold'
  | 'title1'
  | 'title1Bold'
  | 'title2'
  | 'title2Bold'
  | 'title3'
  | 'title3Semibold'
  | 'headline'
  | 'body'
  | 'bodySemibold'
  | 'callout'
  | 'calloutSemibold'
  | 'subheadline'
  | 'subheadlineSemibold'
  | 'footnote'
  | 'footnoteSemibold'
  | 'caption1'
  | 'caption1Medium'
  | 'caption2'
  | 'caption2Semibold'
  | 'button'
  | 'buttonSmall'
  | 'mono'
  | 'monoSmall';

/**
 * Font weight type
 */
export type FontWeightType = '400' | '500' | '600' | '700';

/**
 * Text style type
 */
export type TextStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeightType;
  lineHeight: number;
  letterSpacing: number;
};

/**
 * Helper function to get text style
 */
export const getTextStyle = (variant: TextStyleVariant): TextStyle => {
  return TextStyles[variant];
};

// ======================
// Backward Compatibility Export
// ======================

/**
 * Typography object for backward compatibility
 * Contains all typography-related exports in one object
 */
export const Typography = {
  fontFamily: FontFamily,
  fontWeight: FontWeight,
  textStyles: TextStyles,
  getTextStyle,

  // Backward compatibility for old font structure
  /**
   * @deprecated Use FontFamily and FontWeight exports instead
   */
  fonts: {
    regular: FontFamily.system,
    medium: FontFamily.system,
    semiBold: FontFamily.system,
    bold: FontFamily.system,
  },

  /**
   * @deprecated Use TextStyles variants instead
   */
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  /**
   * @deprecated Use TextStyles variants instead
   */
  lineHeights: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 28,
    '2xl': 32,
    '3xl': 36,
    '4xl': 40,
    '5xl': 1,
  },

  /**
   * @deprecated Letter spacing is set to 0 for all iOS text styles
   */
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
  },
};
