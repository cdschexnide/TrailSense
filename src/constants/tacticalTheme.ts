import { Platform } from 'react-native';
import { TacticalTextStyles } from './typography';

/**
 * Tactical Theme — Now app-wide. Kept for backward compatibility
 * with existing AI components that import from here.
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
  textTertiary: '#8a887a',

  userBubble: '#2a3a2a',
  userBubbleBorder: '#3a4a3a',

  // Severity badge backgrounds
  severityCritical: '#3a1a1a',
  severityHigh: '#3a2a1a',
  severityMedium: '#2a2a1a',
  severityLow: '#1a2a1a',
} as const;

export const tacticalTypography = {
  mono: monoFont,
  ...TacticalTextStyles,
  /** @deprecated Use badge instead */
  severityBadge: TacticalTextStyles.badge,
  body: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 17,
  },
  quickAction: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: '400' as const,
  },
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
