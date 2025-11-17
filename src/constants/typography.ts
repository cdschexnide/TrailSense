export const Typography = {
  fonts: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },

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

  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
  },
};

// Text Styles
export const TextStyles = {
  // Headings
  h1: {
    fontFamily: Typography.fonts.bold,
    fontSize: Typography.sizes['4xl'],
    lineHeight: Typography.lineHeights['4xl'],
    letterSpacing: Typography.letterSpacing.tight,
  },
  h2: {
    fontFamily: Typography.fonts.bold,
    fontSize: Typography.sizes['3xl'],
    lineHeight: Typography.lineHeights['3xl'],
    letterSpacing: Typography.letterSpacing.tight,
  },
  h3: {
    fontFamily: Typography.fonts.semiBold,
    fontSize: Typography.sizes['2xl'],
    lineHeight: Typography.lineHeights['2xl'],
    letterSpacing: Typography.letterSpacing.normal,
  },
  h4: {
    fontFamily: Typography.fonts.semiBold,
    fontSize: Typography.sizes.xl,
    lineHeight: Typography.lineHeights.xl,
    letterSpacing: Typography.letterSpacing.normal,
  },

  // Body Text
  bodyLarge: {
    fontFamily: Typography.fonts.regular,
    fontSize: Typography.sizes.lg,
    lineHeight: Typography.lineHeights.lg,
    letterSpacing: Typography.letterSpacing.normal,
  },
  body: {
    fontFamily: Typography.fonts.regular,
    fontSize: Typography.sizes.base,
    lineHeight: Typography.lineHeights.base,
    letterSpacing: Typography.letterSpacing.normal,
  },
  bodySmall: {
    fontFamily: Typography.fonts.regular,
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.lineHeights.sm,
    letterSpacing: Typography.letterSpacing.normal,
  },

  // UI Text
  button: {
    fontFamily: Typography.fonts.semiBold,
    fontSize: Typography.sizes.base,
    lineHeight: Typography.lineHeights.base,
    letterSpacing: Typography.letterSpacing.wide,
  },
  caption: {
    fontFamily: Typography.fonts.regular,
    fontSize: Typography.sizes.xs,
    lineHeight: Typography.lineHeights.xs,
    letterSpacing: Typography.letterSpacing.normal,
  },
  overline: {
    fontFamily: Typography.fonts.semiBold,
    fontSize: Typography.sizes.xs,
    lineHeight: Typography.lineHeights.xs,
    letterSpacing: Typography.letterSpacing.wider,
  },

  // Monospace (for MAC addresses, technical data)
  mono: {
    fontFamily: 'Courier',
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.lineHeights.sm,
    letterSpacing: Typography.letterSpacing.normal,
  },
};
