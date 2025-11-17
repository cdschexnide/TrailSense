import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Input } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'username' | 'name' | 'tel' | 'off';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  containerStyle?: ViewStyle;
  testID?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  error,
  helperText,
  containerStyle,
  ...inputProps
}) => {
  const { theme } = useTheme();

  return (
    <View style={[{ marginBottom: theme.spacing.base }, containerStyle]}>
      <Input
        label={label}
        value={value}
        onChangeText={onChangeText}
        error={error}
        helperText={helperText}
        {...inputProps}
      />
    </View>
  );
};
