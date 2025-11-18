/**
 * iOS Shadow System
 *
 * This shadow system follows Apple's Human Interface Guidelines for iOS.
 * iOS uses subtle, lightweight shadows compared to Material Design.
 *
 * Key principles:
 * - Shadows are lighter and more subtle
 * - Use sparingly - only for elevation and depth
 * - Shadows help define visual hierarchy
 * - iOS prefers lighter shadows than Android/Material
 *
 * @see https://developer.apple.com/design/human-interface-guidelines/visual-design
 */

// ======================
// Shadow Definitions
// ======================

/**
 * No shadow
 * Use for: Flat elements, elements that don't need elevation
 */
export const shadowNone = {
  // iOS shadow properties
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  // Android elevation
  elevation: 0,
};

/**
 * Small shadow
 * Use for: Cards, subtle elevation
 *
 * iOS: Very subtle shadow for cards and slightly elevated content
 * Android: elevation 1
 */
export const shadowSm = {
  // iOS shadow properties
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  // Android elevation
  elevation: 1,
};

/**
 * Medium shadow
 * Use for: Elevated elements, floating buttons
 *
 * iOS: Standard shadow for elevated UI elements
 * Android: elevation 2
 */
export const shadowMd = {
  // iOS shadow properties
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 4,
  // Android elevation
  elevation: 2,
};

/**
 * Large shadow
 * Use for: Modals, sheets, prominent elevated content
 *
 * iOS: Prominent shadow for modals and overlays
 * Android: elevation 4
 */
export const shadowLg = {
  // iOS shadow properties
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  // Android elevation
  elevation: 4,
};

// ======================
// Named Shadow Presets
// ======================

/**
 * Card shadow preset
 * Optimized shadow for iOS card pattern
 * Subtle but visible elevation
 */
export const cardShadow = {
  // iOS shadow properties
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  // Android elevation
  elevation: 1,
};

/**
 * Button shadow preset
 * Subtle shadow for floating action buttons
 */
export const buttonShadow = {
  // iOS shadow properties
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 3,
  // Android elevation
  elevation: 2,
};

/**
 * Modal shadow preset
 * Shadow for modal sheets and overlays
 */
export const modalShadow = {
  // iOS shadow properties
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18,
  shadowRadius: 8,
  // Android elevation
  elevation: 4,
};

/**
 * Dropdown shadow preset
 * Shadow for dropdown menus and popovers
 */
export const dropdownShadow = {
  // iOS shadow properties
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.16,
  shadowRadius: 6,
  // Android elevation
  elevation: 3,
};

// ======================
// Shadow Collection
// ======================

/**
 * Main shadow collection
 * Use this for programmatic access to shadow sizes
 */
export const Shadows = {
  none: shadowNone,
  sm: shadowSm,
  md: shadowMd,
  lg: shadowLg,

  // Named presets
  card: cardShadow,
  button: buttonShadow,
  modal: modalShadow,
  dropdown: dropdownShadow,
};

// ======================
// TypeScript Type Definitions
// ======================

/**
 * Shadow style object type
 */
export type ShadowStyle = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

/**
 * Shadow size type
 */
export type ShadowSize = 'none' | 'sm' | 'md' | 'lg';

/**
 * Shadow preset type
 */
export type ShadowPreset = 'card' | 'button' | 'modal' | 'dropdown';

/**
 * All shadow variants
 */
export type ShadowVariant = ShadowSize | ShadowPreset;

/**
 * Helper function to get shadow style
 */
export const getShadow = (variant: ShadowVariant): ShadowStyle => {
  return Shadows[variant];
};

/**
 * Helper function to create custom shadow
 * All parameters follow iOS shadow conventions
 */
export const createShadow = (
  offset: { width: number; height: number },
  opacity: number,
  radius: number,
  elevation: number = 0,
): ShadowStyle => {
  return {
    shadowColor: '#000',
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
};

// ======================
// Usage Notes
// ======================

/**
 * IMPORTANT iOS Shadow Guidelines:
 *
 * 1. Use shadows sparingly - iOS design is generally flatter than Material Design
 * 2. iOS shadows are more subtle (lower opacity) than Android
 * 3. For cards: Use shadowSm or cardShadow preset
 * 4. For modals: Use shadowLg or modalShadow preset
 * 5. For floating buttons: Use shadowMd or buttonShadow preset
 * 6. In dark mode: Shadows are less visible, consider using borders instead
 * 7. Test shadows in both light and dark modes
 * 8. Don't combine multiple heavy shadows - keep it subtle
 *
 * Shadow Hierarchy:
 * - No shadow (0): Flat content, backgrounds
 * - Small (1): Cards, tiles, list items with slight elevation
 * - Medium (2): Floating buttons, selected items, dropdowns
 * - Large (4): Modals, sheets, dialogs, major overlays
 *
 * Removed from original system:
 * - XL shadow (too heavy for iOS, doesn't match Apple's design language)
 */
