/**
 * Tactical Color System
 *
 * Single dark tactical palette for the entire app.
 * Inspired by the AI Assistant command center aesthetic.
 * No light mode - dark-only.
 */

export const Colors = {
  dark: {
    label: '#e8e8e0',
    secondaryLabel: '#a8a898',
    tertiaryLabel: '#8a887a',
    quaternaryLabel: 'rgba(90, 90, 80, 0.38)',

    systemBackground: '#111210',
    secondarySystemBackground: '#1a1a14',
    tertiarySystemBackground: '#222218',
    systemGroupedBackground: '#111210',
    secondarySystemGroupedBackground: '#1a1a14',
    tertiarySystemGroupedBackground: '#222218',

    systemFill: 'rgba(90, 90, 80, 0.36)',
    secondarySystemFill: 'rgba(90, 90, 80, 0.32)',
    tertiarySystemFill: 'rgba(90, 90, 80, 0.24)',
    quaternarySystemFill: 'rgba(90, 90, 80, 0.18)',

    systemBlue: '#fbbf24',
    systemGreen: '#4ade80',
    systemOrange: '#f59e0b',
    systemRed: '#ef4444',
    systemYellow: '#fbbf24',
    systemPurple: '#a78bfa',
    systemPink: '#f472b6',
    systemTeal: '#2dd4bf',
    systemIndigo: '#818cf8',

    systemGray: '#8a887a',
    systemGray2: '#48483e',
    systemGray3: '#3a3a30',
    systemGray4: '#2a2a1a',
    systemGray5: '#1a1a14',
    systemGray6: '#141410',

    separator: '#2a2a1a',
    opaqueSeparator: '#2a2a1a',

    threat: {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#fbbf24',
      low: '#4ade80',
    },

    detection: {
      cellular: '#a78bfa',
      wifi: '#60a5fa',
      bluetooth: '#2dd4bf',
      multiband: '#818cf8',
      multi: '#818cf8',
    },

    primary: '#fbbf24',
    success: '#4ade80',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#60a5fa',

    brandAccent: '#fbbf24',
    brandAccentLight: '#fcd34d',
    brandAccentDark: '#f59e0b',
    brandAccentBackground: 'rgba(251, 191, 36, 0.12)',
    brandAccentBorder: 'rgba(251, 191, 36, 0.35)',

    online: '#4ade80',
    offline: '#8a887a',

    battery: {
      full: '#4ade80',
      medium: '#f59e0b',
      low: '#ef4444',
    },

    threatBackground: {
      critical: '#3a1a1a',
      criticalBorder: 'rgba(239, 68, 68, 0.40)',
      high: '#3a2a1a',
      highBorder: 'rgba(245, 158, 11, 0.35)',
      medium: '#2a2a1a',
      mediumBorder: 'rgba(251, 191, 36, 0.30)',
      low: '#1a2a1a',
      lowBorder: 'rgba(74, 222, 128, 0.25)',
    },

    deviceStatusBackground: {
      online: 'rgba(74, 222, 128, 0.08)',
      offline: 'rgba(239, 68, 68, 0.10)',
    },

    gradients: {
      cardHeader: ['rgba(251, 191, 36, 0.06)', 'rgba(251, 191, 36, 0)'],
      statsBackground: ['#1a1a14', '#222218'],
      shimmer: [
        'rgba(251, 191, 36, 0)',
        'rgba(251, 191, 36, 0.08)',
        'rgba(251, 191, 36, 0)',
      ],
      onlineStatus: ['rgba(74, 222, 128, 0.15)', 'rgba(74, 222, 128, 0)'],
      offlineStatus: ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0)'],
    },

    background: '#111210',
    surface: '#1a1a14',
    surfaceVariant: '#222218',

    text: {
      primary: '#e8e8e0',
      secondary: '#a8a898',
      disabled: '#8a887a',
      inverse: '#111210',
    },

    border: '#2a2a1a',
    divider: '#2a2a1a',
  },

  get light() {
    return this.dark;
  },
};

export type ColorMode = 'dark';
export type ColorPalette = typeof Colors.dark;
export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';
export type DetectionType = 'cellular' | 'wifi' | 'bluetooth' | 'multiband';
export type BatteryLevel = 'full' | 'medium' | 'low';

export const getColors = (_mode: ColorMode = 'dark'): ColorPalette => {
  return Colors.dark;
};
