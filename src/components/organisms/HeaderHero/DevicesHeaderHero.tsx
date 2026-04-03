// src/components/organisms/HeaderHero/DevicesHeaderHero.tsx
/**
 * DevicesHeaderHero - Simple Status Display
 *
 * Shows "All Systems Online" or "X Device(s) Offline" status.
 * Quick health check at a glance.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from '@components/atoms';
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
    <Card tier="briefing" headerLabel="FLEET STATUS" style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text variant="caption1" tactical color="label">
          {statusText}
        </Text>
      </View>
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text variant="headline" tactical style={{ color: colors.label }}>
            {deviceCounts.total}
          </Text>
          <Text variant="caption2" tactical color="secondaryLabel">
            Total
          </Text>
        </View>
        <View style={styles.metric}>
          <Text
            variant="headline"
            tactical
            style={{ color: colors.systemGreen }}
          >
            {deviceCounts.online}
          </Text>
          <Text variant="caption2" tactical color="secondaryLabel">
            Online
          </Text>
        </View>
        <View style={styles.metric}>
          <Text
            variant="headline"
            tactical
            style={{ color: hasOffline ? colors.systemRed : colors.systemGray }}
          >
            {deviceCounts.offline}
          </Text>
          <Text variant="caption2" tactical color="secondaryLabel">
            Offline
          </Text>
        </View>
      </View>
      <Text variant="footnote" color="secondaryLabel" style={styles.subtitle}>
        {subtitleText}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  metric: {
    flex: 1,
  },
  subtitle: {
    marginTop: 4,
  },
});

export default DevicesHeaderHero;
