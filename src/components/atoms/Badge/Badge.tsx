import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
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
  const { theme, colorScheme } = useTheme();
  const colors = theme.colors;
  const isDark = colorScheme === 'dark';

  // ======================
  // Style Functions
  // ======================

  /**
   * Get background color with 15% opacity for subtle appearance
   */
  const getBackgroundColor = (): string => {
    const opacity15 = '26'; // Hex for 15% opacity

    switch (variant) {
      // Threat levels
      case 'critical':
        return `${colors.systemRed}${opacity15}`;
      case 'high':
        return `${colors.systemOrange}${opacity15}`;
      case 'medium':
        // Yellow needs 20% opacity for better visibility
        return isDark
          ? `${colors.systemYellow}33` // 20% opacity
          : `${colors.systemYellow}33`;
      case 'low':
        return `${colors.systemGreen}${opacity15}`;

      // Detection types
      case 'cellular':
        return `${colors.systemPurple}${opacity15}`;
      case 'wifi':
        return `${colors.systemBlue}${opacity15}`;
      case 'bluetooth':
        return `${colors.systemTeal}${opacity15}`;
      case 'multiband':
        return `${colors.systemIndigo}${opacity15}`;

      // Semantic
      case 'info':
        return `${colors.systemBlue}${opacity15}`;
      case 'success':
        return `${colors.systemGreen}${opacity15}`;
      case 'warning':
        return `${colors.systemOrange}${opacity15}`;
      case 'error':
        return `${colors.systemRed}${opacity15}`;

      // Status
      case 'online':
        return `${colors.systemGreen}${opacity15}`;
      case 'offline':
        return `${colors.systemGray}${opacity15}`;

      default:
        return `${colors.systemGray}${opacity15}`;
    }
  };

  /**
   * Get text color matching the background base color
   */
  const getTextColor = (): string => {
    switch (variant) {
      // Threat levels
      case 'critical':
        return colors.systemRed;
      case 'high':
        return colors.systemOrange;
      case 'medium':
        // Dark yellow for better contrast
        return isDark ? colors.systemYellow : '#CC9900';
      case 'low':
        return colors.systemGreen;

      // Detection types
      case 'cellular':
        return colors.systemPurple;
      case 'wifi':
        return colors.systemBlue;
      case 'bluetooth':
        return colors.systemTeal;
      case 'multiband':
        return colors.systemIndigo;

      // Semantic
      case 'info':
        return colors.systemBlue;
      case 'success':
        return colors.systemGreen;
      case 'warning':
        return colors.systemOrange;
      case 'error':
        return colors.systemRed;

      // Status
      case 'online':
        return colors.systemGreen;
      case 'offline':
        return colors.systemGray;

      default:
        return colors.label;
    }
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
        style={{ color: getTextColor() }}
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
