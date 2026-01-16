/**
 * FilterChip Component
 *
 * Compact, tappable chip for filtering lists.
 * Shows count with colored status dot indicator.
 * Used to replace chunky colored summary cards.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface FilterChipProps {
  label: string;
  count: number;
  color: string;
  isSelected?: boolean;
  onPress?: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  count,
  color,
  isSelected = false,
  onPress,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isSelected
            ? colors.brandAccentBackground
            : colors.secondarySystemBackground,
          borderColor: isSelected
            ? colors.brandAccent
            : colors.separator,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        variant="headline"
        weight="semibold"
        color="label"
        style={styles.count}
      >
        {count}
      </Text>
      <Text
        variant="caption1"
        color="secondaryLabel"
        style={styles.label}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  count: {
    minWidth: 16,
  },
  label: {
    textTransform: 'capitalize',
  },
});

export default FilterChip;
