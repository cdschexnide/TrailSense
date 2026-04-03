/**
 * iOS Semantic Color System
 *
 * This color system follows Apple's Human Interface Guidelines for iOS.
 * All colors are semantic (named by purpose, not appearance) and support
 * both light and dark modes automatically.
 *
 * @see https://developer.apple.com/design/human-interface-guidelines/color
 */

export const Colors = {
  light: {
    // ======================
    // iOS System Colors - Label
    // ======================

    /**
     * Primary text color
     * Use for main content text
     */
    label: '#2D2A24',

    /**
     * Secondary text color
     * Use for secondary or supplementary text
     */
    secondaryLabel: 'rgba(45, 42, 36, 0.60)',

    /**
     * Tertiary text color
     * Use for tertiary or de-emphasized text
     */
    tertiaryLabel: 'rgba(45, 42, 36, 0.38)',

    /**
     * Quaternary text color
     * Use for watermarks and disabled text
     */
    quaternaryLabel: 'rgba(45, 42, 36, 0.22)',

    // ======================
    // iOS System Colors - Backgrounds
    // ======================

    /**
     * Primary background color
     * Use for main screen backgrounds
     */
    systemBackground: '#E9E8E3',

    /**
     * Secondary background color
     * Use for grouped content backgrounds
     */
    secondarySystemBackground: '#DFDDD7',

    /**
     * Tertiary background color
     * Use for third-level grouped content
     */
    tertiarySystemBackground: '#D5D3CC',

    /**
     * Primary grouped background
     * Use for grouped table view backgrounds
     */
    systemGroupedBackground: '#E4E3DD',

    /**
     * Secondary grouped background
     * Use for grouped table view cells
     */
    secondarySystemGroupedBackground: '#EBEAE5',

    /**
     * Tertiary grouped background
     * Use for third-level grouped content
     */
    tertiarySystemGroupedBackground: '#D9D7D0',

    // ======================
    // iOS System Colors - Fill
    // ======================

    /**
     * Primary fill color
     * Use for thin overlays over backgrounds
     */
    systemFill: 'rgba(90, 82, 70, 0.15)',

    /**
     * Secondary fill color
     * Use for medium-thickness overlays
     */
    secondarySystemFill: 'rgba(90, 82, 70, 0.12)',

    /**
     * Tertiary fill color
     * Use for thin overlays over fills
     */
    tertiarySystemFill: 'rgba(90, 82, 70, 0.09)',

    /**
     * Quaternary fill color
     * Use for the thinnest overlays
     */
    quaternarySystemFill: 'rgba(90, 82, 70, 0.06)',

    // ======================
    // iOS System Colors - Semantic (Tint Colors)
    // ======================

    /**
     * System Blue - BRAND OLIVE (replaced for earthy theme)
     * Use for interactive elements, links, and primary actions
     */
    systemBlue: '#6B6B4E',

    /**
     * System Green - MUTED OLIVE-GREEN
     * Use for success states and positive actions
     */
    systemGreen: '#5A8A5A',

    /**
     * System Orange - MUTED BURNT ORANGE
     * Use for warnings and medium-priority alerts
     */
    systemOrange: '#C47F30',

    /**
     * System Red - MUTED DUSTY RED
     * Use for errors and destructive actions
     */
    systemRed: '#B84A42',

    /**
     * System Yellow - MUTED OCHRE
     * Use for caution states
     */
    systemYellow: '#C9A030',

    /**
     * System Purple - MUTED DUSTY PURPLE
     * Use for specialized features
     */
    systemPurple: '#8A6090',

    /**
     * System Pink - MUTED DUSTY ROSE
     * Use for accents
     */
    systemPink: '#A85060',

    /**
     * System Teal - MUTED SAGE
     * Use for accents
     */
    systemTeal: '#5A9090',

    /**
     * System Indigo - MUTED SLATE
     * Use for accents
     */
    systemIndigo: '#5A5A80',

    // ======================
    // iOS System Colors - Gray Scale
    // ======================

    systemGray: '#7A7A70',
    systemGray2: '#9A9A90',
    systemGray3: '#B5B5AB',
    systemGray4: '#C5C5BB',
    systemGray5: '#D5D5CB',
    systemGray6: '#E4E3DD',

    // ======================
    // iOS Separator Colors
    // ======================

    /**
     * Separator color
     * Use for thin borders and divider lines
     */
    separator: 'rgba(90, 90, 80, 0.25)',

    /**
     * Opaque separator
     * Use for borders that don't need transparency
     */
    opaqueSeparator: '#C5C5BB',

    // ======================
    // TrailSense-Specific: Threat Levels
    // ======================

    threat: {
      /**
       * Critical threat level - Muted Dusty Red
       */
      critical: '#B84A42',

      /**
       * High threat level - Muted Burnt Orange
       */
      high: '#C47F30',

      /**
       * Medium threat level - Muted Ochre
       */
      medium: '#C9A030',

      /**
       * Low threat level - Muted Olive-Green
       */
      low: '#5A8A5A',
    },

    // ======================
    // TrailSense-Specific: Detection Types
    // ======================

    detection: {
      /**
       * Cellular detection - Muted Dusty Purple
       */
      cellular: '#8A6090',

      /**
       * WiFi detection - Brand Olive
       */
      wifi: '#6B6B4E',

      /**
       * Bluetooth detection - Muted Sage
       */
      bluetooth: '#5A9090',

      /**
       * Multi-band detection - Muted Slate
       */
      multiband: '#5A5A80',

      /**
       * @deprecated Use 'multiband' instead
       */
      multi: '#5A5A80',
    },

    // ======================
    // Semantic Aliases
    // ======================

    /**
     * Primary color for the app - Brand Accent (Golden Tan)
     * @note systemBlue still available for iOS-native interactive elements
     */
    primary: '#C9B896',

    /**
     * Success color - Muted Olive-Green
     */
    success: '#5A8A5A',

    /**
     * Warning color - Muted Burnt Orange
     */
    warning: '#C47F30',

    /**
     * Error color - Muted Dusty Red
     */
    error: '#B84A42',

    /**
     * Info color - Brand Olive
     */
    info: '#6B6B4E',

    // ======================
    // TrailSense Brand Accent
    // ======================

    /**
     * Brand accent color - Golden tan from logo
     * Use for primary actions, selected states, brand moments
     */
    brandAccent: '#C9B896',
    brandAccentLight: '#D4C9A8',
    brandAccentDark: '#B5A682',

    /**
     * Brand accent with opacity for backgrounds
     */
    brandAccentBackground: 'rgba(201, 184, 150, 0.12)',
    brandAccentBorder: 'rgba(201, 184, 150, 0.30)',

    // ======================
    // Additional Status Colors
    // ======================

    online: '#5A8A5A',
    offline: '#7A7A70',

    battery: {
      full: '#5A8A5A',
      medium: '#C47F30',
      low: '#B84A42',
    },

    // ======================
    // TrailSense-Specific: Threat Backgrounds (Card Tints)
    // ======================

    /**
     * Background tint colors for threat-level cards
     * Use these for full-card background washes
     */
    threatBackground: {
      critical: 'rgba(184, 74, 66, 0.15)',
      criticalBorder: 'rgba(184, 74, 66, 0.40)',
      high: 'rgba(196, 127, 48, 0.12)',
      highBorder: 'rgba(196, 127, 48, 0.35)',
      medium: 'rgba(201, 160, 48, 0.10)',
      mediumBorder: 'rgba(201, 160, 48, 0.30)',
      low: 'rgba(90, 138, 90, 0.08)',
      lowBorder: 'rgba(90, 138, 90, 0.25)',
    },

    // ======================
    // TrailSense-Specific: Device Status Backgrounds
    // ======================

    /**
     * Background tint colors for device status cards
     */
    deviceStatusBackground: {
      online: 'rgba(90, 138, 90, 0.08)',
      offline: 'rgba(184, 74, 66, 0.10)',
    },

    // ======================
    // TrailSense-Specific: Gradient Presets
    // ======================

    /**
     * Gradient color arrays for various UI elements
     */
    gradients: {
      cardHeader: ['rgba(90, 90, 80, 0.04)', 'rgba(90, 90, 80, 0)'],
      statsBackground: ['#E4E3DD', '#D5D5CB'],
      shimmer: [
        'rgba(90, 90, 80, 0)',
        'rgba(90, 90, 80, 0.06)',
        'rgba(90, 90, 80, 0)',
      ],
      onlineStatus: ['rgba(90, 138, 90, 0.15)', 'rgba(90, 138, 90, 0)'],
      offlineStatus: ['rgba(184, 74, 66, 0.15)', 'rgba(184, 74, 66, 0)'],
    },

    // ======================
    // Backward Compatibility Aliases
    // ======================

    /**
     * @deprecated Use systemBackground instead
     */
    background: '#E9E8E3',

    /**
     * @deprecated Use secondarySystemBackground instead
     */
    surface: '#DFDDD7',

    /**
     * @deprecated Use tertiarySystemBackground instead
     */
    surfaceVariant: '#D5D3CC',

    /**
     * Text color aliases for backward compatibility
     * @deprecated Use label, secondaryLabel, etc. instead
     */
    text: {
      primary: '#2D2A24',
      secondary: 'rgba(45, 42, 36, 0.60)',
      disabled: 'rgba(45, 42, 36, 0.38)',
      inverse: '#FFFFFF',
    },

    /**
     * @deprecated Use separator instead
     */
    border: 'rgba(90, 90, 80, 0.25)',

    /**
     * @deprecated Use separator instead
     */
    divider: 'rgba(90, 90, 80, 0.25)',
  },

  dark: {
    // ======================
    // iOS System Colors - Label (Dark Mode)
    // ======================

    label: '#FFFFFF',
    secondaryLabel: 'rgba(235, 235, 245, 0.6)',
    tertiaryLabel: 'rgba(235, 235, 245, 0.3)',
    quaternaryLabel: 'rgba(235, 235, 245, 0.18)',

    // ======================
    // iOS System Colors - Backgrounds (Dark Mode)
    // ======================

    systemBackground: '#000000',
    secondarySystemBackground: '#1C1C1E',
    tertiarySystemBackground: '#2C2C2E',
    systemGroupedBackground: '#000000',
    secondarySystemGroupedBackground: '#1C1C1E',
    tertiarySystemGroupedBackground: '#2C2C2E',

    // ======================
    // iOS System Colors - Fill (Dark Mode)
    // ======================

    systemFill: 'rgba(120, 120, 128, 0.36)',
    secondarySystemFill: 'rgba(120, 120, 128, 0.32)',
    tertiarySystemFill: 'rgba(118, 118, 128, 0.24)',
    quaternarySystemFill: 'rgba(118, 118, 128, 0.18)',

    // ======================
    // iOS System Colors - Semantic (Dark Mode)
    // ======================

    systemBlue: '#0A84FF',
    systemGreen: '#30D158',
    systemOrange: '#FF9F0A',
    systemRed: '#FF453A',
    systemYellow: '#FFD60A',
    systemPurple: '#BF5AF2',
    systemPink: '#FF375F',
    systemTeal: '#64D2FF',
    systemIndigo: '#5E5CE6',

    // ======================
    // iOS System Colors - Gray Scale (Dark Mode)
    // ======================

    systemGray: '#8E8E93',
    systemGray2: '#636366',
    systemGray3: '#48484A',
    systemGray4: '#3A3A3C',
    systemGray5: '#2C2C2E',
    systemGray6: '#1C1C1E',

    // ======================
    // iOS Separator Colors (Dark Mode)
    // ======================

    separator: 'rgba(84, 84, 88, 0.6)',
    opaqueSeparator: '#38383A',

    // ======================
    // TrailSense-Specific: Threat Levels (Dark Mode)
    // ======================

    threat: {
      critical: '#FF453A',
      high: '#FF9F0A',
      medium: '#FFD60A',
      low: '#30D158',
    },

    // ======================
    // TrailSense-Specific: Detection Types (Dark Mode)
    // ======================

    detection: {
      cellular: '#BF5AF2',
      wifi: '#0A84FF',
      bluetooth: '#64D2FF',
      multiband: '#5E5CE6',

      /**
       * @deprecated Use 'multiband' instead
       */
      multi: '#5E5CE6',
    },

    // ======================
    // Semantic Aliases (Dark Mode)
    // ======================

    /**
     * Primary color for the app - Brand Accent (Golden Tan)
     * @note systemBlue still available for iOS-native interactive elements
     */
    primary: '#D4C9A8',
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    info: '#0A84FF',

    // ======================
    // TrailSense Brand Accent
    // ======================

    /**
     * Brand accent color - Golden tan from logo (adjusted for dark mode)
     */
    brandAccent: '#D4C9A8',
    brandAccentLight: '#E0D6BE',
    brandAccentDark: '#C9B896',

    /**
     * Brand accent with opacity for backgrounds
     */
    brandAccentBackground: 'rgba(212, 201, 168, 0.15)',
    brandAccentBorder: 'rgba(212, 201, 168, 0.35)',

    // ======================
    // Additional Status Colors (Dark Mode)
    // ======================

    online: '#30D158',
    offline: '#8E8E93',

    battery: {
      full: '#30D158',
      medium: '#FF9F0A',
      low: '#FF453A',
    },

    // ======================
    // TrailSense-Specific: Threat Backgrounds (Card Tints) - Dark Mode
    // ======================

    /**
     * Background tint colors for threat-level cards (Dark Mode)
     * Slightly higher opacity for visibility on dark backgrounds
     */
    threatBackground: {
      critical: 'rgba(255, 69, 58, 0.15)',
      criticalBorder: 'rgba(255, 69, 58, 0.40)',
      high: 'rgba(255, 159, 10, 0.12)',
      highBorder: 'rgba(255, 159, 10, 0.35)',
      medium: 'rgba(255, 214, 10, 0.10)',
      mediumBorder: 'rgba(255, 214, 10, 0.30)',
      low: 'rgba(48, 209, 88, 0.08)',
      lowBorder: 'rgba(48, 209, 88, 0.25)',
    },

    // ======================
    // TrailSense-Specific: Device Status Backgrounds - Dark Mode
    // ======================

    /**
     * Background tint colors for device status cards (Dark Mode)
     */
    deviceStatusBackground: {
      online: 'rgba(48, 209, 88, 0.08)',
      offline: 'rgba(255, 69, 58, 0.10)',
    },

    // ======================
    // TrailSense-Specific: Gradient Presets - Dark Mode
    // ======================

    /**
     * Gradient color arrays for various UI elements (Dark Mode)
     */
    gradients: {
      cardHeader: ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0)'],
      statsBackground: ['#1C1C1E', '#2C2C2E'],
      shimmer: [
        'rgba(255, 255, 255, 0)',
        'rgba(255, 255, 255, 0.08)',
        'rgba(255, 255, 255, 0)',
      ],
      onlineStatus: ['rgba(48, 209, 88, 0.15)', 'rgba(48, 209, 88, 0)'],
      offlineStatus: ['rgba(255, 69, 58, 0.15)', 'rgba(255, 69, 58, 0)'],
    },

    // ======================
    // Backward Compatibility Aliases (Dark Mode)
    // ======================

    /**
     * @deprecated Use systemBackground instead
     */
    background: '#000000',

    /**
     * @deprecated Use secondarySystemBackground instead
     */
    surface: '#1C1C1E',

    /**
     * @deprecated Use tertiarySystemBackground instead
     */
    surfaceVariant: '#2C2C2E',

    /**
     * Text color aliases for backward compatibility
     * @deprecated Use label, secondaryLabel, etc. instead
     */
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(235, 235, 245, 0.6)',
      disabled: 'rgba(235, 235, 245, 0.3)',
      inverse: '#000000',
    },

    /**
     * @deprecated Use separator instead
     */
    border: 'rgba(84, 84, 88, 0.6)',

    /**
     * @deprecated Use separator instead
     */
    divider: 'rgba(84, 84, 88, 0.6)',
  },
};

// ======================
// TypeScript Type Definitions
// ======================

/**
 * Color mode type
 */
export type ColorMode = 'light' | 'dark';

/**
 * Color palette type for a single mode
 */
export type ColorPalette = typeof Colors.light;

/**
 * Threat level type
 */
export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Detection type
 */
export type DetectionType = 'cellular' | 'wifi' | 'bluetooth' | 'multiband';

/**
 * Battery level type
 */
export type BatteryLevel = 'full' | 'medium' | 'low';

/**
 * Helper function to get colors for current theme
 */
export const getColors = (mode: ColorMode = 'light'): ColorPalette => {
  return Colors[mode];
};
