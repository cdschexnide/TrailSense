/**
 * DeviceDetailScreen - Redesigned with Tabs
 *
 * Device detail view with:
 * - DetailHero with status and metrics
 * - TabSegment for Status | Location | History
 * - FloatingActionBar with View on Map primary action
 * - Coverage circles on map in Location tab
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ScreenLayout, LoadingState, ErrorState } from '@components/templates';
import { DetailHero } from '@components/molecules/DetailHero';
import { TabSegment } from '@components/molecules/TabSegment';
import { FloatingActionBar } from '@components/molecules/FloatingActionBar';
import { GroupedListSection } from '@components/molecules/GroupedListSection';
import { GroupedListRow } from '@components/molecules/GroupedListRow';
import { DevicesStackParamList } from '@navigation/types';
import { useDevice } from '@hooks/api/useDevices';
import { useTheme } from '@hooks/useTheme';
import { isDeviceOnline } from '@utils/dateUtils';

type DeviceDetailRouteProp = RouteProp<DevicesStackParamList, 'DeviceDetail'>;

// Tab definitions
const TABS = [
  { key: 'status', label: 'Status' },
  { key: 'location', label: 'Location' },
  { key: 'history', label: 'History' },
];

// Coverage ranges in feet (converted to meters for map circles)
const COVERAGE_RANGES = {
  bluetooth: { feet: 100, meters: 30.48, label: 'Bluetooth (~100ft)' },
  wifi: { feet: 300, meters: 91.44, label: 'WiFi (~300ft)' },
  cellular: { feet: 800, meters: 243.84, label: 'Cellular (~800ft)' },
};

// Signal strength helper
const getSignalLabel = (strength: string | number | undefined): string => {
  const strengthStr = String(strength || '').toLowerCase();
  if (
    strengthStr === 'excellent' ||
    strengthStr === 'strong' ||
    Number(strength) > 75
  ) {
    return 'Excellent';
  } else if (strengthStr === 'good' || Number(strength) > 50) {
    return 'Good';
  } else if (
    strengthStr === 'fair' ||
    strengthStr === 'moderate' ||
    Number(strength) > 25
  ) {
    return 'Fair';
  } else {
    return 'Weak';
  }
};

// Format relative time
const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  } catch {
    return 'Unknown';
  }
};

export const DeviceDetailScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const route = useRoute<DeviceDetailRouteProp>();
  const { deviceId } = route.params;
  const { data: device, isLoading, error } = useDevice(deviceId);

  // Tab state
  const [selectedTab, setSelectedTab] = useState('status');

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load device" />;
  if (!device) return <ErrorState message="Device not found" />;

  const signalLabel = getSignalLabel(device.signalStrength);
  // Calculate online status from lastSeen timestamp (online if seen within 5 minutes)
  const isOnline = isDeviceOnline(device.lastSeen);
  const detectionCount = device.detectionCount || 0;

  // Handlers
  const handleViewOnMap = () => {
    navigation.navigate('RadarTab', {
      screen: 'LiveRadar',
      params: {
        focusLat: device.latitude,
        focusLng: device.longitude,
      },
    });
  };

  const handleEdit = () => {
    Alert.alert('Edit Device', 'Device editing is not implemented yet.');
  };

  const handleConfig = () => {
    // TODO: Navigate to device configuration
    Alert.alert('Device Configuration', 'Device configuration coming soon.');
  };

  const handleMorePress = () => {
    Alert.alert('Device Options', `Manage "${device.name}"`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove Device',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Remove Device',
            `Are you sure you want to remove "${device.name}"? This action cannot be undone.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        },
      },
    ]);
  };

  // Build subtitle for hero
  const lastSeenText = device.lastSeen
    ? formatRelativeTime(device.lastSeen)
    : 'Never';
  const heroSubtitle = `${isOnline ? 'Online' : 'Offline'} · Last seen ${lastSeenText}`;

  // Build metrics array for hero (battery removed - not measurable with 5V regulator)
  const heroMetrics = [signalLabel, `${detectionCount} Detections`];

  // Render Status tab content
  const renderStatusTab = () => (
    <>
      <GroupedListSection title="Device Status">
        <GroupedListRow
          icon="wifi"
          iconColor={colors.systemBlue}
          title="Signal"
          value={signalLabel}
        />
        <GroupedListRow
          icon="time-outline"
          iconColor={colors.systemOrange}
          title="Uptime"
          value={(device as any).uptime || '24h 32m'}
        />
      </GroupedListSection>

      <GroupedListSection title="Device Info">
        <GroupedListRow
          icon="code-slash-outline"
          iconColor={colors.systemPurple}
          title="Firmware"
          value={
            (device as any).firmwareVersion ||
            (device as any).firmware ||
            '1.0.0'
          }
        />
        <GroupedListRow
          icon="finger-print-outline"
          iconColor={colors.systemIndigo}
          title="Device ID"
          value={
            deviceId.length > 12 ? deviceId.slice(0, 12) + '...' : deviceId
          }
        />
      </GroupedListSection>
    </>
  );

  // Render Location tab content
  const renderLocationTab = () => {
    const hasLocation = device.latitude != null && device.longitude != null;

    return (
      <>
        {hasLocation && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: device.latitude!,
                longitude: device.longitude!,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              {/* Coverage circles */}
              <Circle
                center={{
                  latitude: device.latitude!,
                  longitude: device.longitude!,
                }}
                radius={COVERAGE_RANGES.cellular.meters}
                fillColor={`${colors.systemRed}15`}
                strokeColor={colors.systemRed}
                strokeWidth={1}
              />
              <Circle
                center={{
                  latitude: device.latitude!,
                  longitude: device.longitude!,
                }}
                radius={COVERAGE_RANGES.wifi.meters}
                fillColor={`${colors.systemOrange}20`}
                strokeColor={colors.systemOrange}
                strokeWidth={1}
              />
              <Circle
                center={{
                  latitude: device.latitude!,
                  longitude: device.longitude!,
                }}
                radius={COVERAGE_RANGES.bluetooth.meters}
                fillColor={`${colors.systemBlue}25`}
                strokeColor={colors.systemBlue}
                strokeWidth={2}
              />
              <Marker
                coordinate={{
                  latitude: device.latitude!,
                  longitude: device.longitude!,
                }}
              />
            </MapView>
          </View>
        )}

        <GroupedListSection title="Coordinates">
          <GroupedListRow
            icon="location-outline"
            iconColor={colors.systemGreen}
            title="GPS Position"
            value={
              hasLocation
                ? `${device.latitude!.toFixed(4)}, ${device.longitude!.toFixed(4)}`
                : 'N/A'
            }
          />
        </GroupedListSection>

        <GroupedListSection title="Coverage Ranges">
          <GroupedListRow
            icon="bluetooth"
            iconColor={colors.systemBlue}
            title={COVERAGE_RANGES.bluetooth.label}
            value={`${COVERAGE_RANGES.bluetooth.meters.toFixed(0)}m`}
          />
          <GroupedListRow
            icon="wifi"
            iconColor={colors.systemOrange}
            title={COVERAGE_RANGES.wifi.label}
            value={`${COVERAGE_RANGES.wifi.meters.toFixed(0)}m`}
          />
          <GroupedListRow
            icon="cellular"
            iconColor={colors.systemRed}
            title={COVERAGE_RANGES.cellular.label}
            value={`${COVERAGE_RANGES.cellular.meters.toFixed(0)}m`}
          />
        </GroupedListSection>
      </>
    );
  };

  // Render History tab content
  const renderHistoryTab = () => {
    // Mock data for demonstration - would come from device in real implementation
    const todayDetections = Math.floor(detectionCount * 0.15);
    const weekDetections = Math.floor(detectionCount * 0.4);

    return (
      <>
        <GroupedListSection title="Detection Summary">
          <GroupedListRow
            icon="pulse-outline"
            iconColor={colors.systemTeal}
            title="Total Detections"
            value={String(detectionCount)}
          />
          <GroupedListRow
            icon="today-outline"
            iconColor={colors.systemBlue}
            title="Today"
            value={String(todayDetections)}
          />
          <GroupedListRow
            icon="calendar-outline"
            iconColor={colors.systemPurple}
            title="This Week"
            value={String(weekDetections)}
          />
        </GroupedListSection>

        <GroupedListSection title="Recent Detections">
          <GroupedListRow
            icon="radio-outline"
            iconColor={colors.systemOrange}
            title="Bluetooth Signal"
            subtitle="2 hours ago"
            showChevron
            onPress={() => {}}
          />
          <GroupedListRow
            icon="wifi"
            iconColor={colors.systemGreen}
            title="WiFi Probe"
            subtitle="5 hours ago"
            showChevron
            onPress={() => {}}
          />
          <GroupedListRow
            icon="cellular"
            iconColor={colors.systemRed}
            title="Cellular Signal"
            subtitle="Yesterday"
            showChevron
            onPress={() => {}}
          />
        </GroupedListSection>
      </>
    );
  };

  // Render tab content based on selection
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'status':
        return renderStatusTab();
      case 'location':
        return renderLocationTab();
      case 'history':
        return renderHistoryTab();
      default:
        return renderStatusTab();
    }
  };

  return (
    <ScreenLayout
      header={{
        title: device.name,
        showBack: true,
        onBackPress: () => navigation.goBack(),
      }}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Detail Hero */}
        <DetailHero
          statusColor={isOnline ? colors.systemGreen : colors.systemRed}
          title={device.name}
          subtitle={heroSubtitle}
          metrics={heroMetrics}
        />

        {/* Tab Segment */}
        <View style={styles.tabContainer}>
          <TabSegment
            tabs={TABS}
            selectedKey={selectedTab}
            onSelect={setSelectedTab}
          />
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>

      {/* Floating Action Bar */}
      <FloatingActionBar
        primaryAction={{
          label: 'View on Map',
          icon: 'location',
          onPress: handleViewOnMap,
        }}
        secondaryActions={[
          { icon: 'create-outline', label: 'Edit', onPress: handleEdit },
          { icon: 'settings-outline', label: 'Config', onPress: handleConfig },
        ]}
        onMorePress={handleMorePress}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for floating action bar
  },
  tabContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  mapContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    height: 200,
  },
});
