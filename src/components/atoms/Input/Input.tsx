import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  Pressable,
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '../Text/Text';
import { Icon } from '../Icon/Icon';
import { useTheme } from '@hooks/useTheme';
import { BorderRadius, Layout } from '@constants/spacing';
import { TextStyles } from '@constants/typography';

// ======================
// Type Definitions
// ======================

/**
 * iOS TextContentType for autofill and keyboard suggestions
 * @see https://reactnative.dev/docs/textinput#textcontenttype-ios
 */
export type TextContentType =
  | 'none'
  | 'emailAddress'
  | 'password'
  | 'username'
  | 'name'
  | 'telephoneNumber'
  | 'newPassword'
  | 'oneTimeCode'
  | 'addressCity'
  | 'addressCityAndState'
  | 'addressState'
  | 'countryName'
  | 'creditCardNumber'
  | 'fullStreetAddress'
  | 'streetAddressLine1'
  | 'streetAddressLine2'
  | 'postalCode';

/**
 * Clear button visibility mode
 */
export type ClearButtonMode =
  | 'never'
  | 'while-editing'
  | 'unless-editing'
  | 'always';

export interface InputProps extends Omit<TextInputProps, 'textContentType'> {
  // Value
  value: string;
  onChangeText: (text: string) => void;

  // Appearance
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;

  // Type
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  textContentType?: TextContentType;
  returnKeyType?: ReturnKeyTypeOptions;

  // Icons
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearButtonMode?: ClearButtonMode;

  // State
  disabled?: boolean;
  editable?: boolean;

  // Actions
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;

  // Style
  style?: ViewStyle;
  inputStyle?: TextStyle;
  containerStyle?: ViewStyle;
}

// ======================
// Input Component
// ======================

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  label,
  placeholder,
  helperText,
  error,
  secureTextEntry = false,
  keyboardType,
  textContentType = 'none',
  returnKeyType = 'done',
  leftIcon,
  rightIcon,
  clearButtonMode = 'while-editing',
  disabled = false,
  editable = true,
  onFocus,
  onBlur,
  onSubmitEditing,
  style,
  inputStyle,
  containerStyle,
  ...props
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // ======================
  // Event Handlers
  // ======================

  const handleFocus = () => {
    if (disabled || !editable) return;

    // Trigger haptic feedback (fire-and-forget, don't await)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleClear = () => {
    // Trigger haptic feedback (fire-and-forget, don't await)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    onChangeText('');
  };

  const togglePasswordVisibility = () => {
    // Trigger haptic feedback (fire-and-forget, don't await)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setIsPasswordVisible(!isPasswordVisible);
  };

  // ======================
  // Style Functions
  // ======================

  /**
   * Get border color based on state
   */
  const getBorderColor = (): string => {
    if (error) return colors.systemRed;
    if (isFocused) return colors.systemBlue;
    return colors.systemGray4;
  };

  /**
   * Get border width based on state
   */
  const getBorderWidth = (): number => {
    return isFocused ? 2 : 1;
  };

  /**
   * Get background color based on state
   */
  const getBackgroundColor = (): string => {
    if (disabled || !editable) return colors.systemGray5;
    return colors.secondarySystemBackground;
  };

  /**
   * Determine if clear button should be shown
   */
  const shouldShowClearButton = (): boolean => {
    if (clearButtonMode === 'never') return false;
    if (clearButtonMode === 'always') return true;
    if (clearButtonMode === 'while-editing') return isFocused && value.length > 0;
    if (clearButtonMode === 'unless-editing')
      return !isFocused && value.length > 0;
    return false;
  };

  // ======================
  // Render
  // ======================

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text
          variant="subheadline"
          color={error ? 'systemRed' : 'label'}
          style={styles.label}
        >
          {label}
        </Text>
      )}

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            borderWidth: getBorderWidth(),
            borderRadius: BorderRadius.input, // 10pt
            backgroundColor: getBackgroundColor(),
            minHeight: Layout.inputHeight, // 44pt
          },
          isFocused && styles.focused,
          (disabled || !editable) && styles.disabled,
          style,
        ]}
      >
        {/* Left Icon */}
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        {/* Text Input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={[
            styles.input,
            {
              ...TextStyles.body,
              color: colors.label,
            },
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.tertiaryLabel}
          editable={!disabled && editable}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSubmitEditing}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />

        {/* Password Visibility Toggle */}
        {secureTextEntry && (
          <Pressable
            onPress={togglePasswordVisibility}
            style={styles.iconRight}
            hitSlop={8}
          >
            <Icon
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size="sm"
              color="secondaryLabel"
            />
          </Pressable>
        )}

        {/* Clear Button */}
        {!secureTextEntry && shouldShowClearButton() && (
          <Pressable
            onPress={handleClear}
            style={styles.clearButton}
            hitSlop={8}
          >
            <Icon name="close-circle" size="sm" color="secondaryLabel" />
          </Pressable>
        )}

        {/* Right Icon */}
        {!secureTextEntry && !shouldShowClearButton() && rightIcon && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </View>

      {/* Helper Text / Error Message */}
      {(error || helperText) && (
        <Text
          variant="footnote"
          color={error ? 'systemRed' : 'secondaryLabel'}
          style={styles.helperText}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

// ======================
// Styles
// ======================

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconLeft: {
    paddingLeft: 12,
    marginRight: 8,
  },
  iconRight: {
    paddingRight: 12,
    marginLeft: 8,
  },
  clearButton: {
    paddingRight: 12,
    marginLeft: 8,
  },
  helperText: {
    marginTop: 6,
  },
  focused: {
    // Subtle glow/shadow on focus
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
