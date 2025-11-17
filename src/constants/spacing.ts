export const Spacing = {
  xs: 4,
  sm: 8,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

// Common spacing patterns
export const Layout = {
  // Screen padding
  screenPadding: Spacing.base,
  screenPaddingHorizontal: Spacing.base,
  screenPaddingVertical: Spacing.lg,

  // Card spacing
  cardPadding: Spacing.base,
  cardMargin: Spacing.sm,
  cardRadius: 12,

  // List spacing
  listItemPadding: Spacing.base,
  listItemGap: Spacing.sm,

  // Form spacing
  formFieldGap: Spacing.base,
  formSectionGap: Spacing.xl,

  // Bottom sheet
  bottomSheetPadding: Spacing.lg,
  bottomSheetRadius: 24,
};

export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};
