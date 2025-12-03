import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Text, Button, Card, Icon } from '@components/atoms';
import { ScreenLayout } from '@components/templates';
import { useQuery } from '@tanstack/react-query';
import { devicesApi } from '@api/endpoints';
import { alertsApi } from '@api/endpoints';
import { useTheme } from '@hooks/useTheme';
import Svg, {
  Circle,
  Text as SvgText,
  G,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Mapbox, {
  Camera,
  MapView,
  RasterLayer,
  RasterSource,
} from '@rnmapbox/maps';

// Initialize MapBox with access token
// Uses EXPO_PUBLIC_ prefix for Expo SDK 49+ env variable access
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (!MAPBOX_TOKEN) {
  console.warn(
    '[MapBox] No access token found. Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env'
  );
}
Mapbox.setAccessToken(MAPBOX_TOKEN || '');

const { width } = Dimensions.get('window');
const CHART_SIZE = width - 40;
const MAP_SIZE = CHART_SIZE;
const CENTER_X = CHART_SIZE / 2;
const CENTER_Y = CHART_SIZE / 2;

// Distance zones (in feet)
const ZONES = [
  { max: 50, label: '0-50ft', color: '#ff4444', meters: 15 },
  { max: 150, label: '50-150ft', color: '#ff8800', meters: 46 },
  { max: 300, label: '150-300ft', color: '#ffbb00', meters: 91 },
  { max: 500, label: '300-500ft', color: '#88cc00', meters: 152 },
  { max: 800, label: '500-800ft', color: '#00cc88', meters: 244 },
];

// Max radius in meters for map zoom calculation
const MAX_RADIUS_METERS = 244;

interface ProximityData {
  zone: string;
  count: number;
  percentage: number;
  color: string;
}

export const ProximityHeatmapScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [showSatellite, setShowSatellite] = useState(true);
  const cameraRef = useRef<Camera>(null);

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

  // Get device coordinates (use seed data coordinates or fallback)
  const deviceCoordinates = {
    latitude: selectedDevice?.latitude || 29.7605,
    longitude: selectedDevice?.longitude || -95.3699,
  };

  // Calculate zoom level to show 800ft radius
  // At zoom 16, roughly 1000m visible, zoom 17 ~500m, zoom 15 ~2000m
  const getZoomForRadius = (radiusMeters: number) => {
    // Approximate formula: zoom = 14.5 - log2(radius/500)
    return Math.max(14, Math.min(18, 16 - Math.log2(radiusMeters / 300)));
  };

  // Calculate proximity data
  const proximityData: ProximityData[] = ZONES.map((zone, index) => {
    const minDistance = index === 0 ? 0 : ZONES[index - 1].max;
    const maxDistance = zone.max;

    // Count alerts in this zone
    const count = alerts.filter(alert => {
      let distance = 0;
      try {
        const metadata = JSON.parse(alert.metadata || '{}');
        distance = metadata.distance || 0;
      } catch (e) {
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

  const totalDetections = proximityData.reduce(
    (sum, zone) => sum + zone.count,
    0
  );
  const maxCount = Math.max(...proximityData.map(z => z.count), 1);

  const cycleToNextDevice = () => {
    if (devices.length > 0) {
      setSelectedDeviceIndex(prev => (prev + 1) % devices.length);
    }
  };

  const cycleToPreviousDevice = () => {
    if (devices.length > 0) {
      setSelectedDeviceIndex(
        prev => (prev - 1 + devices.length) % devices.length
      );
    }
  };

  // Update camera when device changes
  useEffect(() => {
    if (cameraRef.current && selectedDevice) {
      cameraRef.current.setCamera({
        centerCoordinate: [
          deviceCoordinates.longitude,
          deviceCoordinates.latitude,
        ],
        zoomLevel: getZoomForRadius(MAX_RADIUS_METERS),
        animationDuration: 500,
      });
    }
  }, [
    selectedDeviceIndex,
    deviceCoordinates.latitude,
    deviceCoordinates.longitude,
  ]);

  if (devicesLoading) {
    return (
      <ScreenLayout header={{ title: 'Proximity Heatmap', largeTitle: true }}>
        <View style={styles.centerContainer}>
          <Text variant="body" color="secondaryLabel">
            Loading devices...
          </Text>
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
          <Text
            variant="body"
            color="secondaryLabel"
            style={styles.emptySubtitle}
          >
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
              <Text
                variant="title1"
                weight="bold"
                color={selectedDevice?.online ? 'systemGreen' : 'systemRed'}
              >
                {selectedDevice?.online ? 'Online' : 'Offline'}
              </Text>
              <Text variant="footnote" color="secondaryLabel">
                Status
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="title1" weight="bold" color="label">
                {selectedDevice?.batteryPercent || selectedDevice?.battery || 0}
                %
              </Text>
              <Text variant="footnote" color="secondaryLabel">
                Battery
              </Text>
            </View>
          </View>
        </Card>

        {/* GPS Coordinates */}
        <Card variant="grouped" style={styles.coordsCard}>
          <View style={styles.coordsContent}>
            <Icon name="location" size={20} color="systemBlue" />
            <Text
              variant="footnote"
              color="secondaryLabel"
              style={styles.coordsText}
            >
              {deviceCoordinates.latitude.toFixed(6)},{' '}
              {deviceCoordinates.longitude.toFixed(6)}
            </Text>
            <TouchableOpacity
              onPress={() => setShowSatellite(!showSatellite)}
              style={styles.satelliteToggle}
            >
              <Icon
                name={showSatellite ? 'earth' : 'map'}
                size={20}
                color="systemBlue"
              />
              <Text
                variant="footnote"
                color="systemBlue"
                style={styles.toggleText}
              >
                {showSatellite ? 'Satellite' : 'Standard'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Map + Heatmap Overlay */}
        <Card variant="grouped" style={styles.heatmapCard}>
          <View style={styles.mapContainer}>
            {/* MapBox Satellite View */}
            <MapView
              style={styles.map}
              styleURL={
                showSatellite
                  ? Mapbox.StyleURL.SatelliteStreet
                  : Mapbox.StyleURL.Dark
              }
              logoEnabled={false}
              attributionEnabled={false}
              scaleBarEnabled={false}
              compassEnabled={false}
              scrollEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              zoomEnabled={false}
            >
              <Camera
                ref={cameraRef}
                centerCoordinate={[
                  deviceCoordinates.longitude,
                  deviceCoordinates.latitude,
                ]}
                zoomLevel={getZoomForRadius(MAX_RADIUS_METERS)}
                animationMode="flyTo"
                animationDuration={500}
              />
            </MapView>

            {/* SVG Heatmap Overlay */}
            <View style={styles.heatmapOverlay}>
              <Svg width={MAP_SIZE} height={MAP_SIZE}>
                <Defs>
                  {/* Create gradient for each zone based on density */}
                  {proximityData.map((zone, index) => {
                    const opacity =
                      zone.count > 0
                        ? 0.2 + (zone.count / maxCount) * 0.5
                        : 0.08;
                    return (
                      <RadialGradient
                        key={`gradient-${index}`}
                        id={`zoneGradient${index}`}
                        cx="50%"
                        cy="50%"
                      >
                        <Stop
                          offset="0%"
                          stopColor={zone.color}
                          stopOpacity={opacity}
                        />
                        <Stop
                          offset="100%"
                          stopColor={zone.color}
                          stopOpacity={opacity * 0.2}
                        />
                      </RadialGradient>
                    );
                  })}
                </Defs>

                {/* Draw concentric circles for zones (reverse order so inner zones are on top) */}
                {[...ZONES].reverse().map((zone, reverseIndex) => {
                  const index = ZONES.length - 1 - reverseIndex;
                  const radius = (zone.max / 800) * (MAP_SIZE / 2 - 10);
                  return (
                    <Circle
                      key={`zone-${index}`}
                      cx={CENTER_X}
                      cy={CENTER_Y}
                      r={radius}
                      fill={`url(#zoneGradient${index})`}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth={1}
                      strokeDasharray="4,4"
                    />
                  );
                })}

                {/* Center device marker */}
                <Circle
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r={8}
                  fill="#007AFF"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
                <Circle
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r={16}
                  fill="#007AFF"
                  opacity={0.3}
                />

                {/* Zone labels */}
                {ZONES.map((zone, index) => {
                  const radius = (zone.max / 800) * (MAP_SIZE / 2 - 10);
                  const labelX = CENTER_X + radius - 35;
                  return (
                    <G key={`label-${index}`}>
                      <SvgText
                        x={labelX}
                        y={CENTER_Y - 6}
                        fontSize={9}
                        fill="#FFFFFF"
                        textAnchor="middle"
                        fontWeight="500"
                      >
                        {zone.label}
                      </SvgText>
                      <SvgText
                        x={labelX}
                        y={CENTER_Y + 8}
                        fontSize={12}
                        fontWeight="bold"
                        fill="#FFFFFF"
                        textAnchor="middle"
                      >
                        {proximityData[index].count}
                      </SvgText>
                    </G>
                  );
                })}
              </Svg>
            </View>
          </View>
        </Card>

        {/* Zone Details */}
        <Card variant="grouped" style={styles.detailsCard}>
          <Text
            variant="headline"
            weight="semibold"
            color="label"
            style={styles.detailsTitle}
          >
            Detection Breakdown
          </Text>
          {proximityData.map((zone, index) => (
            <View key={index} style={styles.zoneRow}>
              <View
                style={[styles.colorIndicator, { backgroundColor: zone.color }]}
              />
              <View style={styles.zoneInfo}>
                <Text variant="body" color="label">
                  {zone.zone}
                </Text>
                <Text variant="footnote" color="secondaryLabel">
                  {zone.count} detection{zone.count !== 1 ? 's' : ''} (
                  {zone.percentage.toFixed(1)}%)
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
  coordsCard: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  coordsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  coordsText: {
    flex: 1,
    marginLeft: 8,
  },
  satelliteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
  },
  toggleText: {
    marginLeft: 4,
  },
  heatmapCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  mapContainer: {
    width: MAP_SIZE,
    height: MAP_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  heatmapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
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
