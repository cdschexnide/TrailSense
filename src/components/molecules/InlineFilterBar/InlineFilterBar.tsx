/**
 * InlineFilterBar Component
 *
 * 2x2 grid of FilterChips for quick filtering.
 * Supports single selection with clear option.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FilterChip } from '../FilterChip';

const GAP = 6;

interface FilterOption {
  key: string;
  label: string;
  count: number;
  color: string;
}

interface InlineFilterBarProps {
  options: FilterOption[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}

export const InlineFilterBar: React.FC<InlineFilterBarProps> = ({
  options,
  selectedKey,
  onSelect,
}) => {
  const handlePress = (key: string) => {
    // Toggle selection - tap again to clear
    onSelect(selectedKey === key ? null : key);
  };

  return (
    <View style={styles.container}>
      {options.map(option => (
        <FilterChip
          key={option.key}
          label={option.label}
          count={option.count}
          color={option.color}
          isSelected={selectedKey === option.key}
          onPress={() => handlePress(option.key)}
          style={styles.chip}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: GAP,
  },
  chip: {
    // Half the row minus half the gap so two chips fit per row
    width: `${50 - GAP / 2}%`,
  },
});

export default InlineFilterBar;
