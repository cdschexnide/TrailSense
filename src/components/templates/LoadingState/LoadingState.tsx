import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  style?: ViewStyle;
  testID?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'large',
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <View style={[styles.container, style]} testID={testID}>
      <ActivityIndicator size={size} color={colors.primary[500]} />
      {message && (
        <Text
          variant="body"
          color="secondary"
          style={{ marginTop: theme.spacing.base }}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});
