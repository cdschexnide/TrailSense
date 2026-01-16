/**
 * InlineFilterBar Component
 *
 * Horizontal row of FilterChips for quick filtering.
 * Supports single selection with clear option.
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { FilterChip } from '../FilterChip';

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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((option) => (
        <FilterChip
          key={option.key}
          label={option.label}
          count={option.count}
          color={option.color}
          isSelected={selectedKey === option.key}
          onPress={() => handlePress(option.key)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
});

export default InlineFilterBar;
