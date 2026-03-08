/**
 * FloatingActionBar Component
 *
 * Clean, modern bottom action bar for detail screens.
 * Features a full-width primary button with iOS system blue styling.
 * Positioned fixed at the bottom with safe area handling.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Text, Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

// ======================
// Type Definitions
// ======================

interface ActionItem {
  icon: string;
  label: string;
  onPress: () => void;
}

interface FloatingActionBarProps {
  primaryAction: {
    label: string;
    icon?: string;
    onPress: () => void;
  };
  secondaryActions?: ActionItem[];
  onMorePress?: () => void;
}

// ======================
// FloatingActionBar Component
// ======================

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  primaryAction,
  secondaryActions,
  onMorePress,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  // Minimum bottom padding of 16, otherwise use safe area inset
  const bottomPadding = Math.max(insets.bottom, 16);

  /**
   * Handle primary button press with medium haptic
   */
  const handlePrimaryPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    primaryAction.onPress();
  };

  /**
   * Handle secondary button press with light haptic
   */
  const handleSecondaryPress = async (onPress: () => void) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  /**
   * Handle more button press with light haptic
   */
  const handleMorePress = async () => {
    if (onMorePress) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onMorePress();
    }
  };

  const hasSecondaryActions = (secondaryActions && secondaryActions.length > 0) || onMorePress;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: bottomPadding,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Primary Action Button - Full width with iOS blue */}
        <Pressable
          onPress={handlePrimaryPress}
          accessibilityRole="button"
          accessibilityLabel={primaryAction.label}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.systemBlue },
            pressed && styles.primaryPressed,
          ]}
        >
          {primaryAction.icon && (
            <Icon
              name={primaryAction.icon as any}
              size={18}
              color="#FFFFFF"
              style={styles.primaryIcon}
            />
          )}
          <Text
            variant="body"
            weight="semibold"
            style={styles.primaryText}
          >
            {primaryAction.label}
          </Text>
        </Pressable>

        {/* Secondary Actions Container */}
        {hasSecondaryActions && (
          <View style={styles.secondaryContainer}>
            {secondaryActions?.map((action, index) => (
              <Pressable
                key={`${action.label}-${index}`}
                onPress={() => handleSecondaryPress(action.onPress)}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { backgroundColor: `${colors.systemGray}20` },
                  pressed && styles.secondaryPressed,
                ]}
              >
                <Icon
                  name={action.icon as any}
                  size={22}
                  color={colors.systemBlue}
                />
              </Pressable>
            ))}

            {/* More Button (Overflow Menu) */}
            {onMorePress && (
              <Pressable
                onPress={handleMorePress}
                accessibilityRole="button"
                accessibilityLabel="More options"
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { backgroundColor: `${colors.systemGray}20` },
                  pressed && styles.secondaryPressed,
                ]}
              >
                <Icon
                  name="ellipsis-horizontal"
                  size={22}
                  color={colors.systemBlue}
                />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

// ======================
// Styles
// ======================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryIcon: {
    marginRight: 8,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 17,
    letterSpacing: -0.4,
  },
  secondaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  secondaryButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});

export default FloatingActionBar;
