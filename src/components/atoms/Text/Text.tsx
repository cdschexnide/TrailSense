import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { TextStyles, FontWeight } from '@constants/typography';

// ======================
// Type Definitions
// ======================

/**
 * iOS Text Style Variants
 * These match Apple's standard text styles
 */
export type TextVariant =
  | 'largeTitle'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subheadline'
  | 'footnote'
  | 'caption1'
  | 'caption2';

/**
 * iOS Semantic Colors for Text
 */
export type TextColor =
  | 'label' // Primary text
  | 'secondaryLabel' // Secondary text
  | 'tertiaryLabel' // Tertiary text
  | 'quaternaryLabel' // Disabled/watermark text
  | 'systemBlue' // Interactive elements
  | 'systemGreen' // Success
  | 'systemOrange' // Warning
  | 'systemRed' // Error/Destructive
  | 'systemGray' // Neutral
  | 'white'; // Inverse (on dark backgrounds)

/**
 * Font Weight Override
 */
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

/**
 * Text Alignment
 */
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

export interface TextProps extends RNTextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: TextColor;
  weight?: TextWeight;
  align?: TextAlign;
  numberOfLines?: number;
  style?: TextStyle;
  onPress?: () => void;
}

// ======================
// Text Component
// ======================

export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  color = 'label',
  weight,
  align = 'left',
  numberOfLines,
  style,
  onPress,
  ...props
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  // ======================
  // Style Functions
  // ======================

  /**
   * Get color style based on semantic color
   */
  const getColorStyle = (): TextStyle => {
    switch (color) {
      case 'label':
        return { color: colors.label };
      case 'secondaryLabel':
        return { color: colors.secondaryLabel };
      case 'tertiaryLabel':
        return { color: colors.tertiaryLabel };
      case 'quaternaryLabel':
        return { color: colors.quaternaryLabel };
      case 'systemBlue':
        return { color: colors.systemBlue };
      case 'systemGreen':
        return { color: colors.systemGreen };
      case 'systemOrange':
        return { color: colors.systemOrange };
      case 'systemRed':
        return { color: colors.systemRed };
      case 'systemGray':
        return { color: colors.systemGray };
      case 'white':
        return { color: '#FFFFFF' };
      default:
        return { color: colors.label };
    }
  };

  /**
   * Get font weight if overridden
   */
  const getWeightStyle = (): TextStyle => {
    if (!weight) return {};

    switch (weight) {
      case 'regular':
        return { fontWeight: FontWeight.regular };
      case 'medium':
        return { fontWeight: FontWeight.medium };
      case 'semibold':
        return { fontWeight: FontWeight.semibold };
      case 'bold':
        return { fontWeight: FontWeight.bold };
      default:
        return {};
    }
  };

  /**
   * Get text alignment style
   */
  const getAlignStyle = (): TextStyle => {
    return { textAlign: align };
  };

  /**
   * Get the base text style for the variant
   */
  const getVariantStyle = (): TextStyle => {
    return TextStyles[variant];
  };

  /**
   * Combine all text styles
   */
  const textStyle: TextStyle = {
    ...getVariantStyle(),
    ...getColorStyle(),
    ...getWeightStyle(),
    ...getAlignStyle(),
  };

  // ======================
  // Render
  // ======================

  return (
    <RNText
      style={[textStyle, style]}
      numberOfLines={numberOfLines}
      onPress={onPress}
      {...props}
    >
      {children}
    </RNText>
  );
};
