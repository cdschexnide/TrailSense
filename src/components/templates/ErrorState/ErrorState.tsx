import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, Button, Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface ErrorStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  actionLabel = 'Try Again',
  onActionPress,
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={{ marginBottom: theme.spacing.lg }}>
        <Icon name="alert-circle-outline" size="2xl" color={colors.error} />
      </View>

      <Text variant="h3" color="error" style={styles.title}>
        {title}
      </Text>

      <Text
        variant="body"
        color="secondary"
        style={[
          styles.message,
          { marginTop: theme.spacing.sm, marginBottom: theme.spacing.xl },
        ]}
      >
        {message}
      </Text>

      {onActionPress && (
        <Button title={actionLabel} onPress={onActionPress} variant="primary" />
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
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    maxWidth: 300,
  },
});
