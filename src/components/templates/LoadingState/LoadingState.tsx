import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface LoadingStateProps {
  message?: string;
  style?: ViewStyle;
  testID?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <View style={[styles.container, style]} testID={testID}>
      <ActivityIndicator size="large" color={colors.systemBlue} />
      {message && (
        <Text
          variant="body"
          color="secondaryLabel"
          align="center"
          style={styles.message}
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
  message: {
    marginTop: 16,
  },
});
