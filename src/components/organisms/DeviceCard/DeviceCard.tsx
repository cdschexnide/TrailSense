import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Device } from '@types';
import { Card, Icon, Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface DeviceCardProps {
  device: Device;
  onPress?: (deviceId: string) => void;
  style?: ViewStyle;
}

/**
 * Helper function to select the appropriate battery icon based on level
 */
const getBatteryIcon = (level: number): string => {
  if (level >= 80) return 'battery-full';
  if (level >= 50) return 'battery-half';
  if (level >= 20) return 'battery-charging';
  return 'battery-charging'; // Low battery
};

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onPress, style }) => {
  const { theme } = useTheme();

  return (
    <Card
      variant="grouped"
      style={StyleSheet.flatten([styles.card, style])}
      onPress={() => onPress?.(device.id)}
    >
      {/* Header row: Status dot + Device name + Status text */}
      <View style={styles.header}>
        <View style={styles.nameRow}>
          {/* Status indicator as colored dot */}
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: device.online
                  ? theme.colors.systemGreen
                  : theme.colors.systemRed,
              },
            ]}
          />
          <Text variant="headline" color="label">
            {device.name}
          </Text>
        </View>
        <Text variant="footnote" color="secondaryLabel">
          {device.online ? 'ONLINE' : 'OFFLINE'}
        </Text>
      </View>

      {/* Stats grid (3 columns) */}
      <View
        style={[
          styles.statsGrid,
          {
            backgroundColor: theme.colors.systemGray6,
          },
        ]}
      >
        {/* Battery */}
        <View style={styles.statColumn}>
          <Icon
            name={getBatteryIcon(device.battery || 0) as any}
            size={20}
            color={theme.colors.secondaryLabel}
          />
          <Text variant="title3" color="label">
            {device.battery || 0}%
          </Text>
          <Text variant="caption2" color="secondaryLabel">
            Battery
          </Text>
        </View>

        {/* Signal */}
        <View style={styles.statColumn}>
          <Icon
            name="wifi"
            size={20}
            color={theme.colors.secondaryLabel}
          />
          <Text variant="title3" color="label">
            {device.signalStrength || 'N/A'}
          </Text>
          <Text variant="caption2" color="secondaryLabel">
            Signal
          </Text>
        </View>

        {/* Detections */}
        <View style={styles.statColumn}>
          <Icon
            name="eye-outline"
            size={20}
            color={theme.colors.secondaryLabel}
          />
          <Text variant="title3" color="label">
            {device.detectionCount || 0}
          </Text>
          <Text variant="caption2" color="secondaryLabel">
            Detections
          </Text>
        </View>
      </View>

      {/* Location row */}
      <View style={styles.locationRow}>
        <Icon
          name="location"
          size={16}
          color={theme.colors.secondaryLabel}
        />
        <Text variant="caption1" color="secondaryLabel">
          {device.location.latitude.toFixed(4)}, {device.location.longitude.toFixed(4)}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
