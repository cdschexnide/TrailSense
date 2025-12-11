/**
 * DeviceDetailScreen - REDESIGNED
 *
 * Enhanced device detail view with:
 * - Visual status banner with online/offline indicator
 * - Battery and signal strength gauges
 * - Improved card-based layout
 * - Better visual hierarchy with icons
 */

import React from 'react';
import { View, StyleSheet, Alert, Pressable } from 'react-native';
import { Text } from '@components/atoms/Text';
import { Button } from '@components/atoms/Button';
import { Icon } from '@components/atoms/Icon';
import { ScreenLayout, LoadingState, ErrorState } from '@components/templates';
import { ListSection } from '@components/molecules/ListSection';
import { ListRow } from '@components/molecules/ListRow';
import { RouteProp, useRoute } from '@react-navigation/native';
import { DevicesStackParamList } from '@navigation/types';
import { useDevice } from '@hooks/api/useDevices';
import { useTheme } from '@hooks/useTheme';

type DeviceDetailRouteProp = RouteProp<DevicesStackParamList, 'DeviceDetail'>;

// Signal strength helper
const getSignalInfo = (strength: string | number | undefined) => {
  const strengthStr = String(strength || '').toLowerCase();
  if (strengthStr === 'excellent' || strengthStr === 'strong' || Number(strength) > 75) {
    return { label: 'Excellent', color: '#34C759', bars: 4 };
  } else if (strengthStr === 'good' || Number(strength) > 50) {
    return { label: 'Good', color: '#34C759', bars: 3 };
  } else if (strengthStr === 'fair' || strengthStr === 'moderate' || Number(strength) > 25) {
    return { label: 'Fair', color: '#FF9500', bars: 2 };
  } else {
    return { label: 'Weak', color: '#FF3B30', bars: 1 };
  }
};

// Battery level helper
const getBatteryInfo = (percent: number) => {
  if (percent > 60) {
    return { color: '#34C759', icon: 'battery-full' };
  } else if (percent > 30) {
    return { color: '#FF9500', icon: 'battery-half' };
  } else if (percent > 10) {
    return { color: '#FF3B30', icon: 'battery-half' };
  } else {
    return { color: '#FF3B30', icon: 'battery-dead' };
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
  const batteryInfo = getBatteryInfo(batteryPercent);
  const signalInfo = getSignalInfo(device.signalStrength);
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
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <ScreenLayout
      header={{
        title: device.name,
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
      {/* Status Banner */}
      <View
        style={[
          styles.statusBanner,
          {
            backgroundColor: isOnline
              ? colors.systemGreen + '15'
              : colors.systemRed + '15',
          },
        ]}
      >
        <View
          style={[
            styles.statusIconContainer,
            { backgroundColor: isOnline ? colors.systemGreen : colors.systemRed },
          ]}
        >
          <Icon
            name={isOnline ? 'radio' : 'radio-outline'}
            size={32}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.statusInfo}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? colors.systemGreen : colors.systemRed },
              ]}
            />
            <Text
              variant="title2"
              weight="bold"
              style={{ color: isOnline ? colors.systemGreen : colors.systemRed }}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          <Text variant="caption1" style={{ color: colors.secondaryLabel, marginTop: 2 }}>
            {device.lastSeen ? `Last seen ${formatDate(device.lastSeen)}` : 'Never connected'}
          </Text>
        </View>
      </View>

      {/* Battery & Signal Cards */}
      <View style={styles.metricsRow}>
        {/* Battery Card */}
        <View
          style={[
            styles.metricCard,
            { backgroundColor: colors.secondarySystemBackground },
          ]}
        >
          <View style={styles.metricHeader}>
            <Icon name={batteryInfo.icon as any} size={24} color={batteryInfo.color} />
            <Text variant="caption1" style={{ color: colors.secondaryLabel, marginLeft: 8 }}>
              Battery
            </Text>
          </View>
          <Text
            variant="title1"
            weight="bold"
            style={{ color: batteryInfo.color, marginTop: 8 }}
          >
            {batteryPercent}%
          </Text>
          {/* Battery bar */}
          <View style={[styles.progressBar, { backgroundColor: colors.systemGray5 }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: batteryInfo.color,
                  width: `${batteryPercent}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Signal Card */}
        <View
          style={[
            styles.metricCard,
            { backgroundColor: colors.secondarySystemBackground },
          ]}
        >
          <View style={styles.metricHeader}>
            <Icon name="wifi" size={24} color={signalInfo.color} />
            <Text variant="caption1" style={{ color: colors.secondaryLabel, marginLeft: 8 }}>
              Signal
            </Text>
          </View>
          <Text
            variant="title1"
            weight="bold"
            style={{ color: signalInfo.color, marginTop: 8 }}
          >
            {signalInfo.label}
          </Text>
          {/* Signal bars */}
          <View style={styles.signalBars}>
            {[1, 2, 3, 4].map((bar) => (
              <View
                key={bar}
                style={[
                  styles.signalBar,
                  {
                    height: 6 + bar * 4,
                    backgroundColor:
                      bar <= signalInfo.bars ? signalInfo.color : colors.systemGray4,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Device Information */}
      <ListSection header="DEVICE INFO" style={styles.section}>
        <ListRow
          title="Name"
          rightText={device.name}
          leftIcon={<Icon name="pricetag-outline" size={20} color={colors.systemBlue} />}
          accessoryType="none"
        />
        <ListRow
          title="Firmware"
          rightText={(device as any).firmwareVersion || (device as any).firmware || '1.0.0'}
          leftIcon={<Icon name="code-slash-outline" size={20} color={colors.systemPurple} />}
          accessoryType="none"
        />
        <ListRow
          title="Device ID"
          rightText={deviceId.slice(0, 12) + '...'}
          leftIcon={<Icon name="finger-print-outline" size={20} color={colors.systemIndigo} />}
          accessoryType="none"
        />
      </ListSection>

      {/* Location */}
      <ListSection header="LOCATION" style={styles.section}>
        <Pressable
          style={({ pressed }) => [
            styles.locationCard,
            { backgroundColor: colors.secondarySystemBackground },
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => {
            // Navigate to map centered on device
            navigation.navigate('Map', {
              screen: 'LiveRadar',
              params: {
                focusLat: device.latitude,
                focusLng: device.longitude,
              },
            });
          }}
        >
          <View style={[styles.locationIconContainer, { backgroundColor: colors.systemGreen + '20' }]}>
            <Icon name="location" size={28} color={colors.systemGreen} />
          </View>
          <View style={styles.locationInfo}>
            <Text variant="headline" weight="semibold" color="label">
              View on Map
            </Text>
            <Text variant="subheadline" style={{ color: colors.secondaryLabel, marginTop: 2 }}>
              {device.latitude?.toFixed(4) || 'N/A'}, {device.longitude?.toFixed(4) || 'N/A'}
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.tertiaryLabel} />
        </Pressable>
      </ListSection>

      {/* Activity */}
      <ListSection header="ACTIVITY" style={styles.section}>
        <ListRow
          title="View History"
          subtitle="Detection events and alerts"
          leftIcon={<Icon name="time-outline" size={20} color={colors.systemOrange} />}
          onPress={() => navigation.navigate('DeviceHistory', { id: deviceId })}
          accessoryType="disclosureIndicator"
        />
        <ListRow
          title="Detection Count"
          rightText={
            <View style={[styles.countBadge, { backgroundColor: colors.systemBlue + '20' }]}>
              <Text variant="subheadline" weight="semibold" style={{ color: colors.systemBlue }}>
                {device.detectionCount || 0}
              </Text>
            </View>
          }
          leftIcon={<Icon name="pulse-outline" size={20} color={colors.systemTeal} />}
          accessoryType="none"
        />
      </ListSection>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          buttonStyle="tinted"
          role="destructive"
          onPress={handleDelete}
          leftIcon={<Icon name="trash-outline" size={20} color={colors.systemRed} />}
        >
          Remove Device
        </Button>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
    marginLeft: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  metricsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 12,
    height: 22,
  },
  signalBar: {
    width: 8,
    borderRadius: 2,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  locationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actions: {
    padding: 16,
    paddingBottom: 32,
  },
});
