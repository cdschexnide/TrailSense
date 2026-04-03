/**
 * GroupedListRow Component
 *
 * Single row for use within GroupedListSection.
 * Supports icon, title, subtitle, value, and navigation chevron.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface GroupedListRowProps {
  icon?: string;
  iconColor?: string;
  iconBackgroundColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  showChevron?: boolean;
  destructive?: boolean;
  onPress?: () => void;
}

export const GroupedListRow: React.FC<GroupedListRowProps> = ({
  icon,
  iconColor,
  iconBackgroundColor,
  title,
  subtitle,
  value,
  showChevron = false,
  destructive = false,
  onPress,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const handlePress = async () => {
    if (destructive) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const titleColor = destructive ? colors.systemRed : colors.label;

  return (
    <Pressable
      onPress={onPress ? handlePress : undefined}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityState={{ disabled: !onPress }}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: colors.systemGray6 },
        pressed && onPress && styles.pressed,
      ]}
    >
      {icon && (
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor:
                iconBackgroundColor || `${iconColor || colors.systemBlue}20`,
            },
          ]}
        >
          <Icon
            name={icon as any}
            size={20}
            color={iconColor || colors.systemBlue}
          />
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text variant="body" style={{ ...styles.title, color: titleColor }}>
            {title}
          </Text>
          {value && (
            <Text variant="caption1" tactical color="secondaryLabel">
              {value}
            </Text>
          )}
        </View>
        {subtitle && (
          <Text variant="footnote" color="secondaryLabel">
            {subtitle}
          </Text>
        )}
      </View>
      {showChevron && onPress && (
        <Icon name="chevron-forward" size={18} color={colors.tertiaryLabel} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.75,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
});

export default GroupedListRow;
