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
    systemBackground: '#F8F6F1',

    /**
     * Secondary background color
     * Use for grouped content backgrounds
     */
    secondarySystemBackground: '#F2EDE4',

    /**
     * Tertiary background color
     * Use for third-level grouped content
     */
    tertiarySystemBackground: '#EDE7DB',

    /**
     * Primary grouped background
     * Use for grouped table view backgrounds
     */
    systemGroupedBackground: '#F5F2EB',

    /**
     * Secondary grouped background
     * Use for grouped table view cells
     */
    secondarySystemGroupedBackground: '#FAF8F4',

    /**
     * Tertiary grouped background
     * Use for third-level grouped content
     */
    tertiarySystemGroupedBackground: '#F0EBE2',

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
     * System Blue - NEW PRIMARY COLOR
     * Use for interactive elements, links, and primary actions
     */
    systemBlue: '#007AFF',

    /**
     * System Green
     * Use for success states and positive actions
     */
    systemGreen: '#34C759',

    /**
     * System Orange
     * Use for warnings and medium-priority alerts
     */
    systemOrange: '#FF9500',

    /**
     * System Red
     * Use for errors and destructive actions
     */
    systemRed: '#FF3B30',

    /**
     * System Yellow
     * Use for caution states
     */
    systemYellow: '#FFCC00',

    /**
     * System Purple
     * Use for specialized features
     */
    systemPurple: '#AF52DE',

    /**
     * System Pink
     * Use for accents
     */
    systemPink: '#FF2D55',

    /**
     * System Teal
     * Use for accents
     */
    systemTeal: '#5AC8FA',

    /**
     * System Indigo
     * Use for accents
     */
    systemIndigo: '#5856D6',

    // ======================
    // iOS System Colors - Gray Scale
    // ======================

    systemGray: '#8A8579',
    systemGray2: '#ACA69A',
    systemGray3: '#C5BFAE',
    systemGray4: '#D0CABF',
    systemGray5: '#E3DED3',
    systemGray6: '#F0EBE2',

    // ======================
    // iOS Separator Colors
    // ======================

    /**
     * Separator color
     * Use for thin borders and divider lines
     */
    separator: 'rgba(45, 42, 36, 0.18)',

    /**
     * Opaque separator
     * Use for borders that don't need transparency
     */
    opaqueSeparator: '#DDD8CE',

    // ======================
    // TrailSense-Specific: Threat Levels
    // ======================

    threat: {
      /**
       * Critical threat level - System Red
       */
      critical: '#FF3B30',

      /**
       * High threat level - System Orange
       */
      high: '#FF9500',

      /**
       * Medium threat level - System Yellow
       */
      medium: '#FFCC00',

      /**
       * Low threat level - System Green
       */
      low: '#34C759',
    },

    // ======================
    // TrailSense-Specific: Detection Types
    // ======================

    detection: {
      /**
       * Cellular detection - System Purple
       */
      cellular: '#AF52DE',

      /**
       * WiFi detection - System Blue
       */
      wifi: '#007AFF',

      /**
       * Bluetooth detection - System Teal
       */
      bluetooth: '#5AC8FA',

      /**
       * Multi-band detection - System Indigo
       */
      multiband: '#5856D6',

      /**
       * @deprecated Use 'multiband' instead
       */
      multi: '#5856D6',
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
     * Success color - System Green
     */
    success: '#34C759',

    /**
     * Warning color - System Orange
     */
    warning: '#FF9500',

    /**
     * Error color - System Red
     */
    error: '#FF3B30',

    /**
     * Info color - System Blue
     */
    info: '#007AFF',

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

    online: '#34C759',
    offline: '#8E8E93',

    battery: {
      full: '#34C759',
      medium: '#FF9500',
      low: '#FF3B30',
    },

    // ======================
    // TrailSense-Specific: Threat Backgrounds (Card Tints)
    // ======================

    /**
     * Background tint colors for threat-level cards
     * Use these for full-card background washes
     */
    threatBackground: {
      critical: 'rgba(255, 59, 48, 0.12)',
      criticalBorder: 'rgba(255, 59, 48, 0.35)',
      high: 'rgba(255, 149, 0, 0.10)',
      highBorder: 'rgba(255, 149, 0, 0.30)',
      medium: 'rgba(255, 204, 0, 0.08)',
      mediumBorder: 'rgba(255, 204, 0, 0.25)',
      low: 'rgba(52, 199, 89, 0.06)',
      lowBorder: 'rgba(52, 199, 89, 0.20)',
    },

    // ======================
    // TrailSense-Specific: Device Status Backgrounds
    // ======================

    /**
     * Background tint colors for device status cards
     */
    deviceStatusBackground: {
      online: 'rgba(52, 199, 89, 0.06)',
      offline: 'rgba(255, 59, 48, 0.08)',
    },

    // ======================
    // TrailSense-Specific: Gradient Presets
    // ======================

    /**
     * Gradient color arrays for various UI elements
     */
    gradients: {
      cardHeader: ['rgba(45, 42, 36, 0.03)', 'rgba(45, 42, 36, 0)'],
      statsBackground: ['#F5F2EB', '#E8E2D6'],
      shimmer: ['rgba(45, 42, 36, 0)', 'rgba(45, 42, 36, 0.04)', 'rgba(45, 42, 36, 0)'],
      onlineStatus: ['rgba(52, 199, 89, 0.12)', 'rgba(52, 199, 89, 0)'],
      offlineStatus: ['rgba(255, 59, 48, 0.12)', 'rgba(255, 59, 48, 0)'],
    },

    // ======================
    // Backward Compatibility Aliases
    // ======================

    /**
     * @deprecated Use systemBackground instead
     */
    background: '#F8F6F1',

    /**
     * @deprecated Use secondarySystemBackground instead
     */
    surface: '#F2EDE4',

    /**
     * @deprecated Use tertiarySystemBackground instead
     */
    surfaceVariant: '#E3DED3',

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
    border: 'rgba(45, 42, 36, 0.18)',

    /**
     * @deprecated Use separator instead
     */
    divider: 'rgba(45, 42, 36, 0.18)',
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
