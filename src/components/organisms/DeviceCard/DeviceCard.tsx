import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Device } from '@types';
import { Card, Badge, Icon } from '@components/atoms';

interface DeviceCardProps {
  device: Device;
  onPress?: () => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onPress }) => {
  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.name}>{device.name}</Text>
        <Badge
          label={device.online ? 'ONLINE' : 'OFFLINE'}
          variant={device.online ? 'success' : 'error'}
        />
      </View>

      <View style={styles.stats}>
        <Stat icon="battery-charging" label="Battery" value={`${device.battery || 0}%`} />
        <Stat icon="wifi" label="Signal" value={device.signalStrength || 'N/A'} />
        <Stat icon="eye" label="Detections" value={`${device.detectionCount || 0}`} />
      </View>

      <Text style={styles.location}>
        {device.location.latitude.toFixed(4)}, {device.location.longitude.toFixed(4)}
      </Text>
    </Card>
  );
};

const Stat = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
  <View style={styles.stat}>
    <Icon name={icon} size="base" color="#666" />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  stat: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  location: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    fontFamily: 'monospace',
  },
});
