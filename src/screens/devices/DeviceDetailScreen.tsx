import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Button, Badge, Card } from '@components/atoms';
import { ScreenLayout, LoadingState, ErrorState } from '@components/templates';
import { useTheme } from '@hooks/useTheme';
import { RouteProp, useRoute } from '@react-navigation/native';
import { DevicesStackParamList } from '@navigation/types';
import { useDevice } from '@hooks/api/useDevices';

type DeviceDetailRouteProp = RouteProp<DevicesStackParamList, 'DeviceDetail'>;

export const DeviceDetailScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const route = useRoute<DeviceDetailRouteProp>();
  const { deviceId } = route.params;
  const { data: device, isLoading, error } = useDevice(deviceId);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!device) return <ErrorState error="Device not found" />;

  const handleDelete = () => {
    Alert.alert(
      'Delete Device',
      'Are you sure you want to delete this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement delete via API
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleConfigure = () => {
    navigation.navigate('DeviceConfig', { deviceId });
  };

  return (
    <ScreenLayout title={device.name}>
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <Text variant="h2">{device.name}</Text>
            <Badge
              label={device.online ? 'ONLINE' : 'OFFLINE'}
              color={device.online ? 'success' : 'error'}
            />
          </View>

          <View style={styles.section}>
            <Text variant="h3" style={styles.sectionTitle}>
              Status
            </Text>
            <InfoRow label="Battery" value={`${device.battery}%`} />
            <InfoRow label="Signal Strength" value={device.signalStrength} />
            <InfoRow label="Detections Today" value={device.detectionCount.toString()} />
            <InfoRow label="Last Seen" value={device.lastSeen} />
          </View>

          <View style={styles.section}>
            <Text variant="h3" style={styles.sectionTitle}>
              Location
            </Text>
            <InfoRow
              label="Coordinates"
              value={`${device.location.latitude}, ${device.location.longitude}`}
            />
          </View>

          <View style={styles.section}>
            <Text variant="h3" style={styles.sectionTitle}>
              Device Information
            </Text>
            <InfoRow label="Device ID" value={device.id} />
            <InfoRow label="Firmware Version" value={device.firmwareVersion || 'N/A'} />
            <InfoRow label="Hardware Version" value={device.hardwareVersion || 'N/A'} />
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Configure Device"
            variant="primary"
            onPress={handleConfigure}
            style={styles.button}
          />
          <Button
            title="Delete Device"
            variant="ghost"
            onPress={handleDelete}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text variant="caption" style={styles.label}>
      {label}
    </Text>
    <Text variant="body" style={styles.value}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  section: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    flex: 1,
    opacity: 0.7,
  },
  value: {
    flex: 2,
    textAlign: 'right',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    marginBottom: 8,
  },
});
