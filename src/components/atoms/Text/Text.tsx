import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { TextStyles } from '@constants/index';

type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'bodyLarge'
  | 'body'
  | 'bodySmall'
  | 'button'
  | 'caption'
  | 'overline'
  | 'mono';

type TextColor =
  | 'primary'
  | 'secondary'
  | 'disabled'
  | 'inverse'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'primary',
  style,
  children,
  ...props
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  const getColorStyle = (): TextStyle => {
    switch (color) {
      case 'primary':
        return { color: colors.text.primary };
      case 'secondary':
        return { color: colors.text.secondary };
      case 'disabled':
        return { color: colors.text.disabled };
      case 'inverse':
        return { color: colors.text.inverse };
      case 'success':
        return { color: colors.success };
      case 'warning':
        return { color: colors.warning };
      case 'error':
        return { color: colors.error };
      case 'info':
        return { color: colors.info };
      default:
        return { color: colors.text.primary };
    }
  };

  const textStyle: TextStyle = {
    ...TextStyles[variant],
    ...getColorStyle(),
  };

  return (
    <RNText style={[textStyle, style]} {...props}>
      {children}
    </RNText>
  );
};
