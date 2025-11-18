import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@hooks/useTheme';
import { TextStyles } from '@constants/typography';
import { BorderRadius, Layout } from '@constants/spacing';

// ======================
// Type Definitions
// ======================

export type ButtonStyle = 'filled' | 'tinted' | 'gray' | 'plain';
export type ButtonRole = 'default' | 'cancel' | 'destructive';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  // Text content
  children: React.ReactNode;

  // Styling
  buttonStyle?: ButtonStyle;
  role?: ButtonRole;
  size?: ButtonSize;
  prominent?: boolean;

  // State
  disabled?: boolean;
  loading?: boolean;

  // Layout
  fullWidth?: boolean;

  // Icons
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  // Actions
  onPress?: () => void;

  // Style override (use sparingly)
  style?: ViewStyle;
  textStyle?: TextStyle;

  // Testing
  testID?: string;
}

// ======================
// Button Component
// ======================

export const Button: React.FC<ButtonProps> = ({
  children,
  buttonStyle = 'filled',
  role = 'default',
  size = 'medium',
  prominent = false,
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  onPress,
  style,
  textStyle,
  testID,
}) => {
  const { theme, colorScheme } = useTheme();
  const colors = theme.colors;
  const isDark = colorScheme === 'dark';

  // ======================
  // Event Handlers
  // ======================

  const handlePress = async () => {
    if (disabled || loading) return;

    // Trigger haptic feedback with appropriate strength
    // Medium impact for prominent or destructive actions
    const hapticStyle =
      prominent || role === 'destructive'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light;

    await Haptics.impactAsync(hapticStyle);

    onPress?.();
  };

  // ======================
  // Style Functions
  // ======================

  /**
   * Get button height based on size
   */
  const getButtonHeight = (): number => {
    switch (size) {
      case 'small':
        return 36;
      case 'medium':
        return Layout.minTouchTarget; // 44pt
      case 'large':
        return Layout.buttonHeight; // 50pt
      default:
        return Layout.minTouchTarget;
    }
  };

  /**
   * Get button padding to ensure 44pt minimum touch target
   */
  const getButtonPadding = (): { paddingHorizontal: number; paddingVertical: number } => {
    const height = getButtonHeight();
    const minHeight = Layout.minTouchTarget;

    // If button is smaller than minimum, add vertical padding
    const paddingVertical = height < minHeight ? (minHeight - height) / 2 : 0;

    const paddingHorizontal = size === 'small' ? 12 : size === 'large' ? 20 : 16;

    return { paddingHorizontal, paddingVertical };
  };

  /**
   * Get background color based on buttonStyle and role
   */
  const getBackgroundColor = (): string => {
    switch (buttonStyle) {
      case 'filled':
        switch (role) {
          case 'destructive':
            return colors.systemRed;
          case 'cancel':
            return colors.systemGray;
          case 'default':
          default:
            return colors.systemBlue;
        }

      case 'tinted':
        switch (role) {
          case 'destructive':
            return isDark
              ? `${colors.systemRed}26` // 15% opacity
              : `${colors.systemRed}26`;
          case 'cancel':
            return isDark
              ? `${colors.systemGray}26`
              : `${colors.systemGray}26`;
          case 'default':
          default:
            return isDark
              ? `${colors.systemBlue}26`
              : `${colors.systemBlue}26`;
        }

      case 'gray':
        return isDark ? colors.systemGray3 : colors.systemGray4;

      case 'plain':
      default:
        return 'transparent';
    }
  };

  /**
   * Get text color based on buttonStyle and role
   */
  const getTextColor = (): string => {
    switch (buttonStyle) {
      case 'filled':
        return '#FFFFFF';

      case 'tinted':
        switch (role) {
          case 'destructive':
            return colors.systemRed;
          case 'cancel':
            return colors.label;
          case 'default':
          default:
            return colors.systemBlue;
        }

      case 'gray':
        return colors.label;

      case 'plain':
        switch (role) {
          case 'destructive':
            return colors.systemRed;
          case 'cancel':
            return colors.systemGray;
          case 'default':
          default:
            return colors.systemBlue;
        }

      default:
        return colors.label;
    }
  };

  /**
   * Get text style based on size
   */
  const getTextStyle = (): TextStyle => {
    const baseStyle =
      size === 'small' ? TextStyles.buttonSmall : TextStyles.button;

    return {
      ...baseStyle,
      color: getTextColor(),
    };
  };

  /**
   * Get button container style
   */
  const getButtonStyle = (): ViewStyle => {
    const padding = getButtonPadding();
    const height = getButtonHeight();

    return {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height,
      minHeight: Layout.minTouchTarget,
      paddingHorizontal: padding.paddingHorizontal,
      paddingVertical: padding.paddingVertical,
      backgroundColor: getBackgroundColor(),
      borderRadius: BorderRadius.button, // 10pt
      ...(fullWidth && { width: '100%' }),
      ...(prominent && buttonStyle === 'filled' && {
        // Add subtle shadow for prominent buttons
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }),
    };
  };

  // ======================
  // Render
  // ======================

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        getButtonStyle(),
        pressed && !disabled && !loading && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator
          color={getTextColor()}
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <>
          {leftIcon && (
            <View style={styles.leftIconContainer}>{leftIcon}</View>
          )}
          <Text style={[getTextStyle(), textStyle]}>{children}</Text>
          {rightIcon && (
            <View style={styles.rightIconContainer}>{rightIcon}</View>
          )}
        </>
      )}
    </Pressable>
  );
};

// ======================
// Styles
// ======================

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.5,
  },
  disabled: {
    opacity: 0.4,
  },
  leftIconContainer: {
    marginRight: 8,
  },
  rightIconContainer: {
    marginLeft: 8,
  },
});
