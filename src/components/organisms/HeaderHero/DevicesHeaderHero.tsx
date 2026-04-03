// src/components/organisms/HeaderHero/DevicesHeaderHero.tsx
/**
 * DevicesHeaderHero - Simple Status Display
 *
 * Shows "All Systems Online" or "X Device(s) Offline" status.
 * Quick health check at a glance.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface DevicesHeaderHeroProps {
  deviceCounts: {
    total: number;
    online: number;
    offline: number;
  };
  selectedFilter?: 'online' | 'offline' | null;
  onFilterSelect?: (status: 'online' | 'offline' | null) => void;
}

export const DevicesHeaderHero: React.FC<DevicesHeaderHeroProps> = ({
  deviceCounts,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const hasOffline = deviceCounts.offline > 0;
  const statusColor = hasOffline ? colors.systemRed : colors.systemGreen;
  const statusText = hasOffline
    ? `${deviceCounts.offline} Device${deviceCounts.offline > 1 ? 's' : ''} Offline`
    : 'All Systems Online';
  const subtitleText = hasOffline
    ? 'Needs attention'
    : `${deviceCounts.total} device${deviceCounts.total !== 1 ? 's' : ''} active`;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.secondarySystemBackground },
      ]}
    >
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text variant="title3" weight="semibold" color="label">
          {statusText}
        </Text>
      </View>
      <Text
        variant="subheadline"
        color="secondaryLabel"
        style={styles.subtitle}
      >
        {subtitleText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  subtitle: {
    marginTop: 4,
  },
});

export default DevicesHeaderHero;
