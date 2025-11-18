import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'grouped';
  onPress?: () => void;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  onPress,
  loading = false,
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors, shadows } = theme;

  const cardStyle: ViewStyle = {
    backgroundColor:
      variant === 'grouped'
        ? colors.secondarySystemGroupedBackground
        : colors.surface,
    borderRadius: 12,
    padding: 16,
    ...(variant === 'default' ? shadows.sm : {}),
  };

  if (loading) {
    return (
      <View style={[cardStyle, styles.loadingContainer, style]} testID={testID}>
        <ActivityIndicator color={colors.systemBlue} />
      </View>
    );
  }

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={[cardStyle, style]}
        testID={testID}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[cardStyle, style]} testID={testID}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
