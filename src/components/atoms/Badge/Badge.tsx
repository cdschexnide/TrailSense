import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Text } from '../Text/Text';
import { useTheme } from '@hooks/useTheme';
import { BorderRadius } from '@constants/spacing';

// ======================
// Type Definitions
// ======================

/**
 * Badge Variant System
 * Organized by purpose: threat levels, detection types, semantic, and status
 */
export type BadgeVariant =
  // Threat levels
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  // Detection types
  | 'cellular'
  | 'wifi'
  | 'bluetooth'
  | 'multiband'
  // Semantic
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  // Status
  | 'online'
  | 'offline';

export type BadgeSize = 'sm' | 'base' | 'lg';

export interface BadgeProps {
  children: React.ReactNode;
  variant: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  testID?: string;
}

// ======================
// Badge Component
// ======================

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  size = 'base',
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const BADGE_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
    critical: { bg: '#3a1a1a', text: '#f87171' },
    high: { bg: '#3a2a1a', text: '#fbbf24' },
    medium: { bg: '#2a2a1a', text: '#fcd34d' },
    low: { bg: '#1a2a1a', text: '#86efac' },
    cellular: { bg: 'rgba(167, 139, 250, 0.16)', text: colors.systemPurple },
    wifi: { bg: 'rgba(96, 165, 250, 0.16)', text: colors.info },
    bluetooth: { bg: 'rgba(45, 212, 191, 0.16)', text: colors.systemTeal },
    multiband: { bg: 'rgba(129, 140, 248, 0.16)', text: colors.systemIndigo },
    info: { bg: 'rgba(96, 165, 250, 0.16)', text: colors.info },
    success: { bg: 'rgba(74, 222, 128, 0.16)', text: colors.success },
    warning: { bg: '#3a2a1a', text: '#fbbf24' },
    error: { bg: '#3a1a1a', text: '#f87171' },
    online: { bg: '#1a2a1a', text: '#86efac' },
    offline: { bg: 'rgba(138, 136, 122, 0.18)', text: colors.systemGray },
  };

  // ======================
  // Style Functions
  // ======================

  /**
   * Get background color with 15% opacity for subtle appearance
   */
  const getBackgroundColor = (): string => {
    return BADGE_COLORS[variant].bg;
  };

  /**
   * Get text color matching the background base color
   */
  const getTextColor = (): string => {
    return BADGE_COLORS[variant].text;
  };

  /**
   * Get text variant based on size
   */
  const getTextVariant = (): 'caption2' | 'caption1' | 'footnote' => {
    switch (size) {
      case 'sm':
        return 'caption2';
      case 'base':
        return 'caption1';
      case 'lg':
        return 'footnote';
    }
  };

  /**
   * Get padding based on size
   */
  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
        };
      case 'base':
        return {
          paddingHorizontal: 10,
          paddingVertical: 6,
        };
      case 'lg':
        return {
          paddingHorizontal: 12,
          paddingVertical: 8,
        };
    }
  };

  // ======================
  // Render
  // ======================

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: BorderRadius.badge, // 6pt
        },
        getSizeStyle(),
        style,
      ]}
      testID={testID}
    >
      <Text
        variant={getTextVariant()}
        style={{
          color: getTextColor(),
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
        numberOfLines={1}
      >
        {children}
      </Text>
    </View>
  );
};

// ======================
// Styles
// ======================

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});
