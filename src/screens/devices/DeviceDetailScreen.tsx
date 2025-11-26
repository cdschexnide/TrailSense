import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text } from '@components/atoms/Text';
import { Button } from '@components/atoms/Button';
import { Card } from '@components/atoms';
import { ScreenLayout, LoadingState, ErrorState } from '@components/templates';
import { ListSection } from '@components/molecules/ListSection';
import { ListRow } from '@components/molecules/ListRow';
import { RouteProp, useRoute } from '@react-navigation/native';
import { DevicesStackParamList } from '@navigation/types';
import { useDevice } from '@hooks/api/useDevices';

type DeviceDetailRouteProp = RouteProp<DevicesStackParamList, 'DeviceDetail'>;

export const DeviceDetailScreen = ({ navigation }: any) => {
  const route = useRoute<DeviceDetailRouteProp>();
  const { deviceId } = route.params;
  const { data: device, isLoading, error } = useDevice(deviceId);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load device" />;
  if (!device) return <ErrorState message="Device not found" />;

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

  const formatDate = (dateString: string) => {
    // TODO: Implement proper date formatting
    return dateString;
  };

  return (
    <ScreenLayout
      header={{
        title: device.name,
        showBack: true,
        rightActions: (
          <Button
            buttonStyle="plain"
            onPress={() => navigation.navigate('DeviceSettings', { id: deviceId })}
          >
            Edit
          </Button>
        ),
      }}
      scrollable
    >
      {/* Status Card */}
      <Card variant="grouped" style={styles.statusCard}>
        <View style={styles.statusContent}>
          <Text variant="title2" color="label">
            {device.online ? 'Online' : 'Offline'}
          </Text>
          <Text variant="footnote" color="secondaryLabel">
            Battery: {device.batteryPercent || device.battery || 0}% • Signal: {device.signalStrength}
          </Text>
        </View>
      </Card>

      <ListSection header="INFORMATION" style={styles.section}>
        <ListRow title="Name" rightText={device.name} accessoryType="none" />
        <ListRow
          title="Firmware"
          rightText={(device as any).firmwareVersion || (device as any).firmware || 'N/A'}
          accessoryType="none"
        />
        <ListRow
          title="Location"
          rightText={`${device.latitude?.toFixed(4) || 'N/A'}, ${device.longitude?.toFixed(4) || 'N/A'}`}
          accessoryType="none"
        />
        <ListRow
          title="Last Seen"
          rightText={device.lastSeen ? formatDate(device.lastSeen) : 'Unknown'}
          accessoryType="none"
        />
      </ListSection>

      <ListSection header="ACTIVITY" style={styles.section}>
        <ListRow
          title="View History"
          onPress={() => navigation.navigate('DeviceHistory', { id: deviceId })}
          accessoryType="disclosureIndicator"
        />
        <ListRow
          title="Detection Count"
          rightText={device.detectionCount?.toString() || '0'}
          accessoryType="none"
        />
      </ListSection>

      <View style={styles.actions}>
        <Button
          buttonStyle="filled"
          role="destructive"
          onPress={handleDelete}
        >
          Remove Device
        </Button>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  statusCard: {
    margin: 20,
  },
  statusContent: {
    padding: 16,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  actions: {
    padding: 20,
  },
});
