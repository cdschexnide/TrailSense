import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Pressable,
} from 'react-native';
import { Text } from '../Text/Text';
import { Icon } from '../Icon/Icon';
import { useTheme } from '@hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  disabled?: boolean;
  secureTextEntry?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  disabled = false,
  secureTextEntry = false,
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const getBorderColor = () => {
    if (error) return colors.error;
    if (isFocused) return colors.primary[500];
    return colors.border;
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          variant="bodySmall"
          color={error ? 'error' : 'secondary'}
          style={styles.label}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            borderWidth: 1,
            borderRadius: theme.borderRadius.base,
            backgroundColor: disabled
              ? colors.surfaceVariant
              : colors.background,
          },
          disabled && styles.disabled,
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            {
              color: colors.text.primary,
              fontFamily: theme.typography.fonts.regular,
              fontSize: theme.typography.sizes.base,
            },
            style,
          ]}
          placeholderTextColor={colors.text.disabled}
          editable={!disabled}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {secureTextEntry && (
          <Pressable
            onPress={togglePasswordVisibility}
            style={styles.iconRight}
          >
            <Icon
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size="sm"
              color={colors.text.secondary}
            />
          </Pressable>
        )}

        {!secureTextEntry && rightIcon && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </View>

      {(error || helperText) && (
        <Text
          variant="caption"
          color={error ? 'error' : 'secondary'}
          style={styles.helperText}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  iconLeft: {
    paddingLeft: 12,
  },
  iconRight: {
    paddingRight: 12,
  },
  helperText: {
    marginTop: 4,
  },
  disabled: {
    opacity: 0.6,
  },
});
