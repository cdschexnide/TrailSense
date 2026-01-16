/**
 * DevicesHeaderHero - Redesigned
 *
 * Clean inline filter bar for device status filtering.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { InlineFilterBar } from '@components/molecules/InlineFilterBar';
import { useTheme } from '@hooks/useTheme';

type DeviceStatus = 'online' | 'offline' | null;

interface DevicesHeaderHeroProps {
  deviceCounts: {
    total: number;
    online: number;
    offline: number;
  };
  selectedFilter: DeviceStatus;
  onFilterSelect: (status: DeviceStatus) => void;
}

export const DevicesHeaderHero: React.FC<DevicesHeaderHeroProps> = ({
  deviceCounts,
  selectedFilter,
  onFilterSelect,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const filterOptions = [
    {
      key: 'online',
      label: 'Online',
      count: deviceCounts.online,
      color: colors.systemGreen,
    },
    {
      key: 'offline',
      label: 'Offline',
      count: deviceCounts.offline,
      color: colors.systemRed,
    },
  ];

  return (
    <View style={styles.container}>
      <InlineFilterBar
        options={filterOptions}
        selectedKey={selectedFilter}
        onSelect={(key) => onFilterSelect(key as DeviceStatus)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
});

export default DevicesHeaderHero;
