import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Text, Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  // Navigation
  showBack?: boolean;
  backTitle?: string;
  onBackPress?: () => void;

  // Title
  title: string;
  subtitle?: string;
  largeTitle?: boolean;

  // Actions
  rightActions?: React.ReactNode;

  // Style
  style?: ViewStyle;
  testID?: string;
}

export const Header: React.FC<HeaderProps> = ({
  showBack = false,
  backTitle = 'Back',
  onBackPress,
  title,
  subtitle,
  largeTitle = false,
  rightActions,
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.systemBackground,
          borderBottomColor: theme.colors.separator,
          paddingTop: insets.top,
        },
        style,
      ]}
      testID={testID}
    >
      {/* Standard iOS navigation bar - 44pt height, hidden for large title without back */}
      {(!largeTitle || showBack) && (
      <View style={styles.navBar}>
        {/* Back button - 44x44pt minimum touch target */}
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
            <View style={styles.backButtonContent}>
              <Icon
                name="chevron-back"
                size={22}
                color={theme.colors.systemBlue}
              />
              <Text variant="body" style={{ color: theme.colors.systemBlue }}>
                {backTitle}
              </Text>
            </View>
          </Pressable>
        )}

        {/* Center title - hidden when using large title */}
        <View style={styles.titleContainer}>
          {!largeTitle && (
            <>
              <Text variant="title3" color="label" style={styles.title}>
                {title}
              </Text>
              {subtitle && (
                <Text
                  variant="caption1"
                  color="secondaryLabel"
                  style={styles.subtitle}
                >
                  {subtitle}
                </Text>
              )}
            </>
          )}
        </View>

        {/* Right actions - only in navBar when not using large title */}
        {rightActions && !largeTitle && (
          <View style={styles.rightActions}>{rightActions}</View>
        )}
      </View>
      )}

      {/* Large title (iOS 11+ pattern) */}
      {largeTitle && (
        <View style={styles.largeTitleContainer}>
          <View style={styles.largeTitleRow}>
            <Text variant="largeTitle" color="label" style={styles.largeTitle}>
              {title}
            </Text>
            {rightActions && (
              <View style={styles.largeTitleActions}>{rightActions}</View>
            )}
          </View>
          {subtitle && (
            <Text
              variant="caption1"
              color="secondaryLabel"
              style={styles.largeTitleSubtitle}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    marginRight: 8,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pressed: {
    opacity: 0.4,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 2,
    textAlign: 'center',
  },
  rightActions: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  largeTitleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  largeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  largeTitle: {
    flex: 1,
  },
  largeTitleActions: {
    marginLeft: 16,
  },
  largeTitleSubtitle: {
    marginTop: 2,
  },
});
