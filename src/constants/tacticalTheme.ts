import { Platform } from 'react-native';

/**
 * Tactical Theme — Amber tactical aesthetic for the AI Assistant screen.
 * Scoped to AI components only. Does not replace the app-wide color system.
 */

const monoFont = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

export const tacticalColors = {
  background: '#111210',
  surface: '#1a1a14',
  surfaceDark: '#141410',
  border: '#2a2a1a',

  accentPrimary: '#fbbf24',
  accentSuccess: '#4ade80',
  accentDanger: '#ef4444',
  accentWarning: '#f59e0b',

  textPrimary: '#e8e8e0',
  textSecondary: '#a8a898',
  textTertiary: '#5a5a50',

  userBubble: '#2a3a2a',
  userBubbleBorder: '#3a4a3a',

  // Severity badge backgrounds
  severityCritical: '#3a1a1a',
  severityHigh: '#3a2a1a',
  severityMedium: '#1a2a3a',
  severityLow: '#1a2a1a',
} as const;

export const tacticalTypography = {
  /** Monospace font for labels, data, and tactical elements */
  mono: monoFont,

  /** Header labels: uppercase monospace */
  headerLabel: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },

  /** Briefing section labels (ASSESSMENT, ANALYSIS, etc.) */
  sectionLabel: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },

  /** Metric numbers */
  metric: {
    fontFamily: monoFont,
    fontSize: 20,
    fontWeight: '700' as const,
  },

  /** Metric captions */
  metricCaption: {
    fontFamily: monoFont,
    fontSize: 9,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },

  /** Data values (signal strength, MAC, etc.) */
  dataValue: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: '400' as const,
  },

  /** Severity badge text */
  severityBadge: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },

  /** Device name in cards */
  deviceName: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: '400' as const,
  },

  /** Timestamp text */
  timestamp: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: '400' as const,
  },

  /** Body text in assessment sections */
  body: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 17,
  },

  /** Quick action button text */
  quickAction: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: '400' as const,
  },

  /** Command input prompt character */
  promptChar: {
    fontFamily: monoFont,
    fontSize: 14,
    fontWeight: '700' as const,
  },
} as const;

export const tacticalSpacing = {
  cardPadding: 10,
  cardRadius: 10,
  innerCardRadius: 6,
  messageGap: 14,
  sectionGap: 8,
} as const;
