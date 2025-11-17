import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftAccessory,
  rightAccessory,
  onPress,
  disabled = false,
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  const content = (
    <View
      style={[
        styles.container,
        {
          padding: theme.spacing.base,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        },
        style,
      ]}
    >
      {leftAccessory && (
        <View style={styles.leftAccessory}>{leftAccessory}</View>
      )}

      <View style={styles.content}>
        <Text variant="body" color={disabled ? 'disabled' : 'primary'}>
          {title}
        </Text>
        {subtitle && (
          <Text
            variant="bodySmall"
            color={disabled ? 'disabled' : 'secondary'}
            style={styles.subtitle}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {rightAccessory && (
        <View style={styles.rightAccessory}>{rightAccessory}</View>
      )}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
        testID={testID}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return <View testID={testID}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftAccessory: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  rightAccessory: {
    marginLeft: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});
