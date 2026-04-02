import React from 'react';
import { ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';

// ======================
// Type Definitions
// ======================

export type IconName = keyof typeof Ionicons.glyphMap;

/**
 * iOS Standard Icon Sizes
 * Following Apple's icon sizing guidelines
 */
export type IconSize = 20 | 22 | 24 | 28 | 32;

/**
 * Icon Size Aliases
 * Named sizes for common use cases
 */
export type IconSizeAlias = 'xs' | 'sm' | 'base' | 'lg' | 'xl';

/**
 * SF Symbol Weights
 * Note: Ionicons don't support variable weights, but this is documented
 * for future SF Symbols migration
 */
export type IconWeight =
  | 'ultralight'
  | 'thin'
  | 'light'
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'heavy'
  | 'black';

/**
 * Semantic Color Type
 * Supports iOS semantic colors and custom colors
 */
export type SemanticColor =
  | 'label'
  | 'secondaryLabel'
  | 'tertiaryLabel'
  | 'quaternaryLabel'
  | 'systemBlue'
  | 'systemGreen'
  | 'systemOrange'
  | 'systemRed'
  | 'systemGray'
  | 'systemPurple'
  | 'systemPink'
  | 'systemTeal'
  | 'systemIndigo'
  | 'systemYellow'
  | 'white';

export interface IconProps {
  // Icon name (Ionicons)
  name: IconName;

  // Size (numeric or alias)
  size?: IconSize | IconSizeAlias | number;

  // Color (semantic or custom)
  color?: SemanticColor | string;

  // Weight (documented for future SF Symbols migration)
  // Currently not used with Ionicons
  weight?: IconWeight;

  // Style override
  style?: ViewStyle;

  // Testing
  testID?: string;
}

// ======================
// Icon Component
// ======================

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'base',
  color = 'label',
  weight: _weight = 'regular', // Prefix with _ to indicate intentionally unused
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  // ======================
  // Size Mapping
  // ======================

  /**
   * Size alias to numeric mapping
   * Following iOS standard icon sizes
   */
  const sizeMap: Record<IconSizeAlias, IconSize> = {
    xs: 20, // Extra small
    sm: 22, // Small
    base: 24, // Base/Medium
    lg: 28, // Large
    xl: 32, // Extra large
  };

  /**
   * Get numeric size value
   */
  const getSizeValue = (): number => {
    // If size is a number, use it directly
    if (typeof size === 'number') {
      return size;
    }

    // If size is an alias, map it
    return sizeMap[size];
  };

  // ======================
  // Color Mapping
  // ======================

  /**
   * Get color value from semantic color or custom color
   */
  const getColorValue = (): string => {
    // If color looks like a hex/rgb value, use it directly
    if (
      color.startsWith('#') ||
      color.startsWith('rgb') ||
      color.startsWith('hsl')
    ) {
      return color;
    }

    // Map semantic color to theme color
    const semanticColor = color as SemanticColor;

    switch (semanticColor) {
      case 'label':
        return colors.label;
      case 'secondaryLabel':
        return colors.secondaryLabel;
      case 'tertiaryLabel':
        return colors.tertiaryLabel;
      case 'quaternaryLabel':
        return colors.quaternaryLabel;
      case 'systemBlue':
        return colors.systemBlue;
      case 'systemGreen':
        return colors.systemGreen;
      case 'systemOrange':
        return colors.systemOrange;
      case 'systemRed':
        return colors.systemRed;
      case 'systemGray':
        return colors.systemGray;
      case 'systemPurple':
        return colors.systemPurple;
      case 'systemPink':
        return colors.systemPink;
      case 'systemTeal':
        return colors.systemTeal;
      case 'systemIndigo':
        return colors.systemIndigo;
      case 'systemYellow':
        return colors.systemYellow;
      case 'white':
        return '#FFFFFF';
      default:
        // Fallback to custom color string
        return color;
    }
  };

  // ======================
  // Render
  // ======================

  // Note: Weight is not currently used with Ionicons
  // It's documented for future SF Symbols migration

  return (
    <Ionicons
      name={name}
      size={getSizeValue()}
      color={getColorValue()}
      style={style}
      testID={testID}
    />
  );
};
