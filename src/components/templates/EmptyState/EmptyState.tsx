import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, Button, Icon } from '@components/atoms';
import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionLabel,
  onActionPress,
  style,
  testID,
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      {icon && (
        <View style={styles.iconContainer}>
          <Icon name={icon} size={48} color="tertiaryLabel" />
        </View>
      )}

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

      {actionLabel && onActionPress && (
        <Button
          buttonStyle="tinted"
          role="default"
          onPress={onActionPress}
          style={styles.action}
        >
          {actionLabel}
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
