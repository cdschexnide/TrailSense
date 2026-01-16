/**
 * AlertsHeaderHero - Redesigned
 *
 * Clean inline filter bar replacing chunky gradient cards.
 * Uses FilterChip components for threat level filtering.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { InlineFilterBar } from '@components/molecules/InlineFilterBar';
import { useTheme } from '@hooks/useTheme';
import { ThreatLevel } from '@types';

interface AlertsHeaderHeroProps {
  threatCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  selectedFilter: ThreatLevel | null;
  onFilterSelect: (level: ThreatLevel | null) => void;
}

export const AlertsHeaderHero: React.FC<AlertsHeaderHeroProps> = ({
  threatCounts,
  selectedFilter,
  onFilterSelect,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const filterOptions = [
    {
      key: 'critical',
      label: 'Critical',
      count: threatCounts.critical,
      color: colors.systemRed,
    },
    {
      key: 'high',
      label: 'High',
      count: threatCounts.high,
      color: colors.systemOrange,
    },
    {
      key: 'medium',
      label: 'Medium',
      count: threatCounts.medium,
      color: colors.systemYellow,
    },
    {
      key: 'low',
      label: 'Low',
      count: threatCounts.low,
      color: colors.systemGreen,
    },
  ];

  return (
    <View style={styles.container}>
      <InlineFilterBar
        options={filterOptions}
        selectedKey={selectedFilter}
        onSelect={(key) => onFilterSelect(key as ThreatLevel | null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
});
