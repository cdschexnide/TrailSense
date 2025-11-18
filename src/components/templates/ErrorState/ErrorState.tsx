import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, Button, Icon } from '@components/atoms';

interface ErrorStateProps {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  retryLabel = 'Try Again',
  onRetry,
  style,
  testID,
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.iconContainer}>
        <Icon name="alert-circle-outline" size={48} color="systemRed" />
      </View>

      <Text variant="title2" weight="bold" align="center" style={styles.title}>
        {title}
      </Text>

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

      {onRetry && (
        <Button
          buttonStyle="filled"
          role="default"
          onPress={onRetry}
          style={styles.action}
        >
          {retryLabel}
        </Button>
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
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  message: {
    maxWidth: 300,
    marginBottom: 24,
  },
  action: {
    // No additional margin needed
  },
});
