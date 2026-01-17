/**
 * FloatingActionBar Component
 *
 * Bottom action bar with a primary button and secondary icon actions.
 * Tesla/Rivian dashboard aesthetic for detail screens.
 * Positioned fixed at the bottom with safe area handling.
 */

import React from 'react';
import { View, StyleSheet, Pressable, StyleSheet as RNStyleSheet } from 'react-native';
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
          backgroundColor: colors.secondarySystemBackground,
          borderTopColor: colors.separator,
          paddingBottom: bottomPadding,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Primary Action Button */}
        <Pressable
          onPress={handlePrimaryPress}
          accessibilityRole="button"
          accessibilityLabel={primaryAction.label}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.brandAccent },
            pressed && styles.primaryPressed,
          ]}
        >
          {primaryAction.icon && (
            <Icon
              name={primaryAction.icon as any}
              size={20}
              color="white"
              style={styles.primaryIcon}
            />
          )}
          <Text variant="body" weight="semibold" color="white">
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
                  pressed && styles.secondaryPressed,
                ]}
              >
                <Icon
                  name={action.icon as any}
                  size={24}
                  color="secondaryLabel"
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
                  pressed && styles.secondaryPressed,
                ]}
              >
                <Icon
                  name="ellipsis-horizontal"
                  size={24}
                  color="secondaryLabel"
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
    borderTopWidth: RNStyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 12,
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
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryPressed: {
    opacity: 0.8,
  },
  primaryIcon: {
    marginRight: 8,
  },
  secondaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryPressed: {
    opacity: 0.7,
  },
});

export default FloatingActionBar;
