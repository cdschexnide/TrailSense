import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@hooks/useTheme';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';
export type ButtonSize = 'sm' | 'base' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'base',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.base,
      ...getSizeStyle(),
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colors.primary[500],
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'outline':
        return {
          ...baseStyle,
          borderWidth: 2,
          borderColor: colors.primary[500],
        };
      case 'ghost':
        return baseStyle;
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: colors.error,
        };
      default:
        return baseStyle;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: theme.spacing.sm + 4,
          paddingVertical: theme.spacing.sm,
        };
      case 'base':
        return {
          paddingHorizontal: theme.spacing.base,
          paddingVertical: theme.spacing.sm + 4,
        };
      case 'lg':
        return {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.base,
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontFamily: theme.typography.fonts.semiBold,
      letterSpacing: theme.typography.letterSpacing.wide,
      ...getTextSizeStyle(),
    };

    switch (variant) {
      case 'primary':
      case 'danger':
        return { ...baseTextStyle, color: '#FFFFFF' };
      case 'secondary':
        return { ...baseTextStyle, color: colors.text.primary };
      case 'outline':
      case 'ghost':
        return { ...baseTextStyle, color: colors.primary[500] };
      default:
        return baseTextStyle;
    }
  };

  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'sm':
        return {
          fontSize: theme.typography.sizes.sm,
          lineHeight: theme.typography.lineHeights.sm,
        };
      case 'base':
        return {
          fontSize: theme.typography.sizes.base,
          lineHeight: theme.typography.lineHeights.base,
        };
      case 'lg':
        return {
          fontSize: theme.typography.sizes.lg,
          lineHeight: theme.typography.lineHeights.lg,
        };
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        getButtonStyle(),
        (disabled || loading) && styles.disabled,
        style,
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' || variant === 'danger'
              ? '#FFFFFF'
              : colors.primary[500]
          }
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});
