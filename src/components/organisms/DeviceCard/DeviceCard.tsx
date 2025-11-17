import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Device } from '@types';
import { Card, Badge, Icon } from '@components/atoms';

interface DeviceCardProps {
  device: Device;
  onPress?: () => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onPress }) => {
  const getStatusColor = () => {
    return device.online ? 'success' : 'offline';
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.name}>{device.name}</Text>
        <Badge
          label={device.online ? 'ONLINE' : 'OFFLINE'}
          color={getStatusColor()}
        />
      </View>

      <View style={styles.stats}>
        <Stat icon="battery" value={`${device.battery}%`} />
        <Stat icon="signal" value={device.signalStrength} />
        <Stat icon="eye" value={`${device.detectionCount} today`} />
      </View>

      <Text style={styles.location}>
        {device.location.latitude}, {device.location.longitude}
      </Text>
    </Card>
  );
};

const Stat = ({ icon, value }: { icon: string; value: string }) => (
  <View style={styles.stat}>
    <Icon name={icon} size="sm" />
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
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 12,
    opacity: 0.7,
  },
  location: {
    fontSize: 12,
    opacity: 0.6,
    fontFamily: 'monospace',
  },
});
