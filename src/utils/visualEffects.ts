/**
 * Visual Effects Utilities
 * Centralized configuration for threat-level styling, animations, and visual effects
 */

import { ThreatLevel } from '@types';

// =============================================================================
// THREAT LEVEL BACKGROUNDS
// =============================================================================

/**
 * Background tint colors for cards based on threat level
 * These create a subtle colored wash across the entire card
 */
export const THREAT_BACKGROUNDS = {
  critical: 'rgba(255, 59, 48, 0.15)',
  high: 'rgba(255, 149, 0, 0.12)',
  medium: 'rgba(255, 204, 0, 0.10)',
  low: 'rgba(52, 199, 89, 0.08)',
} as const;

/**
 * Border colors for threat-level cards (subtle accent)
 */
export const THREAT_BORDERS = {
  critical: 'rgba(255, 59, 48, 0.4)',
  high: 'rgba(255, 149, 0, 0.35)',
  medium: 'rgba(255, 204, 0, 0.3)',
  low: 'rgba(52, 199, 89, 0.25)',
} as const;

/**
 * Solid colors for threat level indicators (badges, icons)
 */
export const THREAT_COLORS = {
  critical: '#FF3B30',
  high: '#FF9500',
  medium: '#FFCC00',
  low: '#34C759',
} as const;

/**
 * Get background color for a threat level
 */
export const getThreatBackground = (threatLevel: ThreatLevel): string => {
  return THREAT_BACKGROUNDS[threatLevel] || THREAT_BACKGROUNDS.low;
};

/**
 * Get border color for a threat level
 */
export const getThreatBorder = (threatLevel: ThreatLevel): string => {
  return THREAT_BORDERS[threatLevel] || THREAT_BORDERS.low;
};

/**
 * Get solid color for a threat level
 */
export const getThreatColor = (threatLevel: ThreatLevel): string => {
  return THREAT_COLORS[threatLevel] || THREAT_COLORS.low;
};

// =============================================================================
// PULSE ANIMATION CONFIGURATIONS
// =============================================================================

export interface PulseConfig {
  duration: number;
  minOpacity: number;
  maxOpacity: number;
  baseColor: string;
}

/**
 * Pulse animation configurations by threat level
 * Critical alerts pulse faster and more prominently
 */
export const PULSE_CONFIGS: Record<'critical' | 'high', PulseConfig> = {
  critical: {
    duration: 1500,
    minOpacity: 0.1,
    maxOpacity: 0.25,
    baseColor: '255, 59, 48', // RGB for red
  },
  high: {
    duration: 2000,
    minOpacity: 0.08,
    maxOpacity: 0.18,
    baseColor: '255, 149, 0', // RGB for orange
  },
};

/**
 * Check if a threat level should have pulse animation
 */
export const shouldPulse = (threatLevel: ThreatLevel): boolean => {
  return threatLevel === 'critical' || threatLevel === 'high';
};

/**
 * Get pulse config for a threat level (returns null if no pulse)
 */
export const getPulseConfig = (
  threatLevel: ThreatLevel
): PulseConfig | null => {
  if (threatLevel === 'critical' || threatLevel === 'high') {
    return PULSE_CONFIGS[threatLevel];
  }
  return null;
};

// =============================================================================
// STATUS GLOW EFFECTS
// =============================================================================

export interface GlowConfig {
  color: string;
  radius: number;
  opacity: number;
}

/**
 * Glow effect configurations for status indicators
 */
export const STATUS_GLOWS: Record<
  'online' | 'offline' | 'warning',
  GlowConfig
> = {
  online: {
    color: '#30D158',
    radius: 8,
    opacity: 0.4,
  },
  offline: {
    color: '#FF453A',
    radius: 6,
    opacity: 0.3,
  },
  warning: {
    color: '#FF9F0A',
    radius: 7,
    opacity: 0.35,
  },
};

/**
 * Get glow configuration for a status
 */
export const getStatusGlow = (
  status: 'online' | 'offline' | 'warning'
): GlowConfig => {
  return STATUS_GLOWS[status];
};

// =============================================================================
// DEVICE STATUS BACKGROUNDS
// =============================================================================

/**
 * Background tints for device cards based on online/offline status
 */
export const DEVICE_STATUS_BACKGROUNDS = {
  online: 'rgba(52, 199, 89, 0.06)',
  offline: 'rgba(255, 69, 58, 0.08)',
} as const;

/**
 * Get background color for device status
 */
export const getDeviceStatusBackground = (isOnline: boolean): string => {
  return isOnline
    ? DEVICE_STATUS_BACKGROUNDS.online
    : DEVICE_STATUS_BACKGROUNDS.offline;
};

// =============================================================================
// BATTERY LEVEL COLORS
// =============================================================================

/**
 * Get battery indicator color based on percentage
 */
export const getBatteryColor = (percentage: number): string => {
  if (percentage > 50) return '#30D158'; // Green
  if (percentage > 20) return '#FF9F0A'; // Yellow/Orange
  return '#FF453A'; // Red
};

/**
 * Get battery background tint for low battery warnings
 */
export const getBatteryBackgroundTint = (percentage: number): string | null => {
  if (percentage <= 20) {
    return 'rgba(255, 69, 58, 0.1)';
  }
  return null;
};

// =============================================================================
// ACCURACY INTERPRETATION
// =============================================================================

export interface AccuracyInterpretation {
  label: string;
  color: string;
  percentage: number; // For progress bar visualization (0-100)
}

/**
 * Interpret position accuracy (meters) into human-readable proximity form.
 * Lower accuracy value = closer/more precise position.
 */
export const interpretAccuracy = (
  accuracyMeters: number
): AccuracyInterpretation => {
  if (accuracyMeters < 5) {
    return { label: 'Very Close', color: '#FF453A', percentage: 95 };
  }
  if (accuracyMeters < 10) {
    return { label: 'Close', color: '#FF9F0A', percentage: 75 };
  }
  if (accuracyMeters < 25) {
    return { label: 'Nearby', color: '#FFCC00', percentage: 55 };
  }
  if (accuracyMeters < 50) {
    return { label: 'Moderate', color: '#30D158', percentage: 35 };
  }
  return { label: 'Distant', color: '#8E8E93', percentage: 15 };
};

// =============================================================================
// ANIMATION TIMING
// =============================================================================

/**
 * Standard animation durations (in milliseconds)
 */
export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 250,
  slow: 400,
  pulse: 1500,
  shimmer: 1200,
  entrance: 300,
  stagger: 50, // Delay between staggered items
} as const;

/**
 * Standard easing curves
 */
export const EASING = {
  easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

// =============================================================================
// GRADIENTS
// =============================================================================

/**
 * Gradient presets for various UI elements
 */
export const GRADIENTS = {
  cardHeader: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0)'],
  statsBackground: ['#1C1C1E', '#2C2C2E'],
  criticalPulse: ['rgba(255, 59, 48, 0.2)', 'rgba(255, 59, 48, 0.05)'],
  shimmer: [
    'rgba(255, 255, 255, 0)',
    'rgba(255, 255, 255, 0.1)',
    'rgba(255, 255, 255, 0)',
  ],
  onlineStatus: ['rgba(52, 199, 89, 0.15)', 'rgba(52, 199, 89, 0)'],
  offlineStatus: ['rgba(255, 69, 58, 0.15)', 'rgba(255, 69, 58, 0)'],
} as const;

// =============================================================================
// SHADOW PRESETS
// =============================================================================

export interface ShadowConfig {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number; // Android
}

/**
 * Shadow presets for different card states
 */
export const SHADOWS: Record<
  'none' | 'sm' | 'md' | 'lg' | 'glow',
  ShadowConfig
> = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  glow: {
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
};

/**
 * Get shadow for threat level (critical gets glow effect)
 */
export const getThreatShadow = (threatLevel: ThreatLevel): ShadowConfig => {
  if (threatLevel === 'critical') {
    return {
      ...SHADOWS.md,
      shadowColor: THREAT_COLORS.critical,
      shadowOpacity: 0.25,
    };
  }
  return SHADOWS.sm;
};
