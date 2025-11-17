import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, Button, Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
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
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <View style={[styles.container, style]} testID={testID}>
      {icon && (
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Icon name={icon} size="2xl" color={colors.text.disabled} />
        </View>
      )}

      <Text variant="h3" style={styles.title}>
        {title}
      </Text>

      {message && (
        <Text
          variant="body"
          color="secondary"
          style={[
            styles.message,
            { marginTop: theme.spacing.sm, marginBottom: theme.spacing.lg },
          ]}
        >
          {message}
        </Text>
      )}

      {actionLabel && onActionPress && (
        <Button
          title={actionLabel}
          onPress={onActionPress}
          variant="primary"
          style={{ marginTop: theme.spacing.lg }}
        />
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
