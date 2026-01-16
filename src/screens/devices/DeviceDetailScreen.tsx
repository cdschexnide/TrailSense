/**
 * DeviceDetailScreen - iOS Settings Style
 *
 * Device detail view with grouped list layout:
 * - Device name as title with status subtitle
 * - Grouped sections: Status, Device Info, Location
 * - Uses GroupedListSection/GroupedListRow components
 */

import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button } from '@components/atoms/Button';
import { Icon } from '@components/atoms/Icon';
import { ScreenLayout, LoadingState, ErrorState } from '@components/templates';
import { GroupedListSection } from '@components/molecules/GroupedListSection';
import { GroupedListRow } from '@components/molecules/GroupedListRow';
import { RouteProp, useRoute } from '@react-navigation/native';
import { DevicesStackParamList } from '@navigation/types';
import { useDevice } from '@hooks/api/useDevices';
import { useTheme } from '@hooks/useTheme';

type DeviceDetailRouteProp = RouteProp<DevicesStackParamList, 'DeviceDetail'>;

// Signal strength helper
const getSignalLabel = (strength: string | number | undefined): string => {
  const strengthStr = String(strength || '').toLowerCase();
  if (strengthStr === 'excellent' || strengthStr === 'strong' || Number(strength) > 75) {
    return 'Excellent';
  } else if (strengthStr === 'good' || Number(strength) > 50) {
    return 'Good';
  } else if (strengthStr === 'fair' || strengthStr === 'moderate' || Number(strength) > 25) {
    return 'Fair';
  } else {
    return 'Weak';
  }
};

export const DeviceDetailScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const route = useRoute<DeviceDetailRouteProp>();
  const { deviceId } = route.params;
  const { data: device, isLoading, error } = useDevice(deviceId);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load device" />;
  if (!device) return <ErrorState message="Device not found" />;

  const batteryPercent = device.batteryPercent || device.battery || 0;
  const signalLabel = getSignalLabel(device.signalStrength);
  const isOnline = device.online;

  const handleDelete = () => {
    Alert.alert(
      'Remove Device',
      `Are you sure you want to remove "${device.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            navigation.goBack();
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const statusSubtitle = `${isOnline ? '●' : '○'} ${isOnline ? 'Online' : 'Offline'} · Last seen ${device.lastSeen ? formatDate(device.lastSeen) : 'Never'}`;

  return (
    <ScreenLayout
      header={{
        title: device.name,
        subtitle: statusSubtitle,
        showBack: true,
        onBackPress: () => navigation.goBack(),
        rightActions: (
          <Button
            buttonStyle="plain"
            onPress={() => navigation.navigate('DeviceSettings', { id: deviceId })}
            leftIcon={<Icon name="create-outline" size={20} color={colors.systemBlue} />}
          >
            Edit
          </Button>
        ),
      }}
      scrollable
    >
      {/* STATUS Section */}
      <GroupedListSection title="Status">
        <GroupedListRow
          icon="battery-full"
          iconColor={colors.systemGreen}
          title="Battery"
          value={`${batteryPercent}%`}
        />
        <GroupedListRow
          icon="wifi"
          iconColor={colors.systemBlue}
          title="Signal"
          value={signalLabel}
        />
        <GroupedListRow
          icon="pulse-outline"
          iconColor={colors.systemTeal}
          title="Detections"
          value={String(device.detectionCount || 0)}
        />
      </GroupedListSection>

      {/* DEVICE INFO Section */}
      <GroupedListSection title="Device Info">
        <GroupedListRow
          icon="code-slash-outline"
          iconColor={colors.systemPurple}
          title="Firmware"
          value={(device as any).firmwareVersion || (device as any).firmware || '1.0.0'}
        />
        <GroupedListRow
          icon="finger-print-outline"
          iconColor={colors.systemIndigo}
          title="Device ID"
          value={deviceId.length > 12 ? deviceId.slice(0, 12) + '...' : deviceId}
        />
      </GroupedListSection>

      {/* LOCATION Section */}
      <GroupedListSection title="Location">
        <GroupedListRow
          icon="location-outline"
          iconColor={colors.systemGreen}
          title="GPS Coordinates"
          value={`${device.latitude?.toFixed(2) || 'N/A'}, ${device.longitude?.toFixed(2) || 'N/A'}`}
        />
        <GroupedListRow
          icon="map-outline"
          iconColor={colors.systemBlue}
          title="View on Map"
          showChevron
          onPress={() => {
            navigation.navigate('Map', {
              screen: 'LiveRadar',
              params: {
                focusLat: device.latitude,
                focusLng: device.longitude,
              },
            });
          }}
        />
      </GroupedListSection>

      {/* ACTIONS Section */}
      <GroupedListSection>
        <GroupedListRow
          icon="trash-outline"
          iconColor={colors.systemRed}
          title="Remove Device"
          destructive
          onPress={handleDelete}
        />
      </GroupedListSection>

      <View style={styles.bottomSpacer} />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  bottomSpacer: {
    height: 32,
  },
});
