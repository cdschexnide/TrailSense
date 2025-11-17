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
  onPress?: () => void;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  loading = false,
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors, shadows } = theme;

  const cardStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.base,
    ...shadows.base,
  };

  if (loading) {
    return (
      <View style={[cardStyle, styles.loadingContainer, style]} testID={testID}>
        <ActivityIndicator color={colors.primary[500]} />
      </View>
    );
  }

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed, style]}
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
  pressed: {
    opacity: 0.8,
  },
});
