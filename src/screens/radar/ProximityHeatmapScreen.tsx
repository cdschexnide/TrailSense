import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Icon } from '@components/atoms';
import { ScreenLayout } from '@components/templates';
import { useQuery } from '@tanstack/react-query';
import { devicesApi } from '@api/endpoints';
import { alertsApi } from '@api/endpoints';
import { useTheme } from '@hooks/useTheme';
import Svg, { Circle, Text as SvgText, G, Line, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CHART_SIZE = width - 40;
const CENTER_X = CHART_SIZE / 2;
const CENTER_Y = CHART_SIZE / 2;

// Distance zones (in feet)
const ZONES = [
  { max: 50, label: '0-50ft', color: '#ff4444' },
  { max: 150, label: '50-150ft', color: '#ff8800' },
  { max: 300, label: '150-300ft', color: '#ffbb00' },
  { max: 500, label: '300-500ft', color: '#88cc00' },
  { max: 800, label: '500-800ft', color: '#00cc88' },
];

interface ProximityData {
  zone: string;
  count: number;
  percentage: number;
  color: string;
}

export const ProximityHeatmapScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);

  // Fetch devices
  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: devicesApi.getDevices,
  });

  // Fetch alerts for selected device
  const selectedDevice = devices[selectedDeviceIndex];
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts', { deviceId: selectedDevice?.id }],
    queryFn: () => alertsApi.getAlerts({ deviceId: selectedDevice?.id }),
    enabled: !!selectedDevice,
  });

  // Calculate proximity data
  const proximityData: ProximityData[] = ZONES.map((zone, index) => {
    const minDistance = index === 0 ? 0 : ZONES[index - 1].max;
    const maxDistance = zone.max;

    // Count alerts in this zone
    const count = alerts.filter(alert => {
      // Parse distance from metadata if available
      let distance = 0;
      try {
        const metadata = JSON.parse(alert.metadata || '{}');
        distance = metadata.distance || 0;
      } catch (e) {
        // Estimate from RSSI if metadata doesn't have distance
        distance = estimateDistanceFromRSSI(alert.rssi);
      }
      return distance > minDistance && distance <= maxDistance;
    }).length;

    return {
      zone: zone.label,
      count,
      percentage: alerts.length > 0 ? (count / alerts.length) * 100 : 0,
      color: zone.color,
    };
  });

  const totalDetections = proximityData.reduce((sum, zone) => sum + zone.count, 0);
  const maxCount = Math.max(...proximityData.map(z => z.count), 1);

  const cycleToNextDevice = () => {
    if (devices.length > 0) {
      setSelectedDeviceIndex((prev) => (prev + 1) % devices.length);
    }
  };

  const cycleToPreviousDevice = () => {
    if (devices.length > 0) {
      setSelectedDeviceIndex((prev) => (prev - 1 + devices.length) % devices.length);
    }
  };

  if (devicesLoading) {
    return (
      <ScreenLayout header={{ title: 'Proximity Heatmap', largeTitle: true }}>
        <View style={styles.centerContainer}>
          <Text variant="body" color="secondaryLabel">Loading devices...</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (devices.length === 0) {
    return (
      <ScreenLayout header={{ title: 'Proximity Heatmap', largeTitle: true }}>
        <View style={styles.centerContainer}>
          <Icon name="alert-circle-outline" size={64} color="systemGray" />
          <Text variant="title3" color="label" style={styles.emptyTitle}>
            No Devices Found
          </Text>
          <Text variant="body" color="secondaryLabel" style={styles.emptySubtitle}>
            Add a TrailSense device to view proximity data
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      header={{
        title: 'Proximity Heatmap',
        largeTitle: true,
      }}
    >
      <ScrollView>
        {/* Device Selector */}
        <Card variant="grouped" style={styles.deviceCard}>
          <View style={styles.deviceSelector}>
            <TouchableOpacity
              onPress={cycleToPreviousDevice}
              disabled={devices.length <= 1}
              style={styles.arrowButton}
            >
              <Icon
                name="chevron-back"
                size={24}
                color={devices.length <= 1 ? 'systemGray3' : 'systemBlue'}
              />
            </TouchableOpacity>

            <View style={styles.deviceInfo}>
              <Text variant="headline" color="label">
                {selectedDevice?.name || 'Unknown Device'}
              </Text>
              <Text variant="footnote" color="secondaryLabel">
                {selectedDeviceIndex + 1} of {devices.length}
              </Text>
            </View>

            <TouchableOpacity
              onPress={cycleToNextDevice}
              disabled={devices.length <= 1}
              style={styles.arrowButton}
            >
              <Icon
                name="chevron-forward"
                size={24}
                color={devices.length <= 1 ? 'systemGray3' : 'systemBlue'}
              />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Stats Card */}
        <Card variant="grouped" style={styles.statsCard}>
          <View style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text variant="title1" weight="bold" color="label">
                {totalDetections}
              </Text>
              <Text variant="footnote" color="secondaryLabel">
                Total Detections
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="title1" weight="bold" color={selectedDevice?.online ? 'systemGreen' : 'systemRed'}>
                {selectedDevice?.online ? 'Online' : 'Offline'}
              </Text>
              <Text variant="footnote" color="secondaryLabel">
                Status
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="title1" weight="bold" color="label">
                {selectedDevice?.batteryPercent || 0}%
              </Text>
              <Text variant="footnote" color="secondaryLabel">
                Battery
              </Text>
            </View>
          </View>
        </Card>

        {/* Proximity Heatmap Visualization */}
        <Card variant="grouped" style={styles.heatmapCard}>
          <View style={styles.heatmapContainer}>
            <Svg width={CHART_SIZE} height={CHART_SIZE}>
              <Defs>
                {/* Create gradient for each zone based on density */}
                {proximityData.map((zone, index) => {
                  const opacity = zone.count > 0 ? 0.3 + (zone.count / maxCount) * 0.6 : 0.1;
                  return (
                    <RadialGradient
                      key={`gradient-${index}`}
                      id={`zoneGradient${index}`}
                      cx="50%"
                      cy="50%"
                    >
                      <Stop offset="0%" stopColor={zone.color} stopOpacity={opacity} />
                      <Stop offset="100%" stopColor={zone.color} stopOpacity={opacity * 0.3} />
                    </RadialGradient>
                  );
                })}
              </Defs>

              {/* Draw concentric circles for zones (reverse order so inner zones are on top) */}
              {[...ZONES].reverse().map((zone, reverseIndex) => {
                const index = ZONES.length - 1 - reverseIndex;
                const radius = (zone.max / 800) * (CHART_SIZE / 2 - 20);
                return (
                  <Circle
                    key={`zone-${index}`}
                    cx={CENTER_X}
                    cy={CENTER_Y}
                    r={radius}
                    fill={`url(#zoneGradient${index})`}
                    stroke={theme.colors.systemGray4}
                    strokeWidth={1}
                  />
                );
              })}

              {/* Center device marker */}
              <Circle
                cx={CENTER_X}
                cy={CENTER_Y}
                r={10}
                fill={theme.colors.systemBlue}
              />
              <Circle
                cx={CENTER_X}
                cy={CENTER_Y}
                r={15}
                fill={theme.colors.systemBlue}
                opacity={0.3}
              />

              {/* Zone labels */}
              {ZONES.map((zone, index) => {
                const radius = (zone.max / 800) * (CHART_SIZE / 2 - 20);
                return (
                  <G key={`label-${index}`}>
                    <SvgText
                      x={CENTER_X + radius - 40}
                      y={CENTER_Y - 5}
                      fontSize={10}
                      fill={theme.colors.secondaryLabel}
                      textAnchor="middle"
                    >
                      {zone.label}
                    </SvgText>
                    <SvgText
                      x={CENTER_X + radius - 40}
                      y={CENTER_Y + 10}
                      fontSize={12}
                      fontWeight="bold"
                      fill={theme.colors.label}
                      textAnchor="middle"
                    >
                      {proximityData[index].count}
                    </SvgText>
                  </G>
                );
              })}
            </Svg>
          </View>
        </Card>

        {/* Zone Details */}
        <Card variant="grouped" style={styles.detailsCard}>
          <Text variant="headline" weight="semibold" color="label" style={styles.detailsTitle}>
            Detection Breakdown
          </Text>
          {proximityData.map((zone, index) => (
            <View key={index} style={styles.zoneRow}>
              <View style={[styles.colorIndicator, { backgroundColor: zone.color }]} />
              <View style={styles.zoneInfo}>
                <Text variant="body" color="label">{zone.zone}</Text>
                <Text variant="footnote" color="secondaryLabel">
                  {zone.count} detection{zone.count !== 1 ? 's' : ''} ({zone.percentage.toFixed(1)}%)
                </Text>
              </View>
              <View style={styles.zoneBar}>
                <View
                  style={[
                    styles.zoneBarFill,
                    {
                      width: `${zone.percentage}%`,
                      backgroundColor: zone.color,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </ScreenLayout>
  );
};

// Helper function to estimate distance from RSSI
function estimateDistanceFromRSSI(rssi: number): number {
  // Simple path loss model: distance = 10 ^ ((TxPower - RSSI) / (10 * n))
  // Assuming TxPower = -30 dBm and n = 2 (free space)
  const txPower = -30;
  const n = 2;
  const distanceMeters = Math.pow(10, (txPower - rssi) / (10 * n));
  return distanceMeters * 3.28084; // Convert to feet
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  deviceCard: {
    margin: 20,
    marginBottom: 12,
  },
  deviceSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  arrowButton: {
    padding: 8,
  },
  deviceInfo: {
    flex: 1,
    alignItems: 'center',
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  statsContent: {
    flexDirection: 'row',
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#3a3a3c',
    marginHorizontal: 8,
  },
  heatmapCard: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  heatmapContainer: {
    padding: 20,
    alignItems: 'center',
  },
  detailsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
  },
  detailsTitle: {
    marginBottom: 16,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneBar: {
    width: 80,
    height: 6,
    backgroundColor: '#3a3a3c',
    borderRadius: 3,
    overflow: 'hidden',
  },
  zoneBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
