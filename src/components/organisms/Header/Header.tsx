import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  testID?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightAction,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + theme.spacing.sm,
          paddingBottom: theme.spacing.sm,
          paddingHorizontal: theme.spacing.base,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        },
      ]}
      testID={testID}
    >
      <View style={styles.content}>
        {showBack && (
          <Pressable
            onPress={onBackPress}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon name="chevron-back" size="lg" color={colors.primary[500]} />
          </Pressable>
        )}

        <View style={styles.titleContainer}>
          <Text variant="h3">{title}</Text>
          {subtitle && (
            <Text variant="caption" color="secondary" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>

        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  pressed: {
    opacity: 0.6,
  },
  titleContainer: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  rightAction: {
    marginLeft: 8,
  },
});
