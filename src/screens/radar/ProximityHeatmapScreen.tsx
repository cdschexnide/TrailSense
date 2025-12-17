import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { Text, Button, Card, Icon } from '@components/atoms';
import { ScreenLayout } from '@components/templates';
import { useTheme } from '@hooks/useTheme';
import { useDevices } from '@hooks/api/useDevices';
import { useAlerts } from '@hooks/api/useAlerts';
import Svg, {
  Circle,
  Text as SvgText,
  G,
  Defs,
  RadialGradient,
  Stop,
  Line,
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

// ============================================================
// MOCK DATA TOGGLE - Set to true to test heatmap zone shading
// ============================================================
const USE_MOCK_HEATMAP_DATA = true;

// Generate mock alerts with varying distances to test zone shading
const generateMockAlerts = () => {
  const mockAlerts: any[] = [];

  // Zone distribution: more detections in closer zones (realistic pattern)
  // Zone 0-50ft:    15 detections (IMMEDIATE - high threat)
  // Zone 50-150ft:  25 detections (NEAR - medium-high)
  // Zone 150-300ft: 10 detections (MEDIUM)
  // Zone 300-500ft: 5 detections  (FAR)
  // Zone 500-800ft: 3 detections  (DISTANT)

  const zoneConfig = [
    { minDist: 5, maxDist: 45, count: 15, zone: '0-50ft' },
    { minDist: 55, maxDist: 140, count: 25, zone: '50-150ft' },
    { minDist: 160, maxDist: 290, count: 10, zone: '150-300ft' },
    { minDist: 310, maxDist: 480, count: 5, zone: '300-500ft' },
    { minDist: 520, maxDist: 780, count: 3, zone: '500-800ft' },
  ];

  const detectionTypes = ['wifi', 'bluetooth', 'cellular'];

  zoneConfig.forEach(({ minDist, maxDist, count }) => {
    for (let i = 0; i < count; i++) {
      const distance = minDist + Math.random() * (maxDist - minDist);
      mockAlerts.push({
        id: `mock-${mockAlerts.length}`,
        deviceId: 'mock-device',
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        threatLevel: distance < 50 ? 'critical' : distance < 150 ? 'high' : distance < 300 ? 'medium' : 'low',
        detectionType: detectionTypes[Math.floor(Math.random() * 3)],
        rssi: -30 - (distance / 10), // Approximate RSSI from distance
        macAddress: `${Math.random().toString(16).slice(2, 14).toUpperCase()}`,
        metadata: { distance },
      });
    }
  });

  return mockAlerts;
};

const MOCK_ALERTS = generateMockAlerts();

const { width } = Dimensions.get('window');
const CHART_SIZE = width - 40;
const MAP_SIZE = CHART_SIZE;
const CENTER_X = CHART_SIZE / 2;
const CENTER_Y = CHART_SIZE / 2;

// Distance zones (in feet) - threat gradient: red → orange → yellow → lime → green
const ZONES = [
  { max: 50, label: '0-50ft', shortLabel: '50ft', color: '#FF3B30', threatLevel: 'IMMEDIATE', meters: 15 },
  { max: 150, label: '50-150ft', shortLabel: '150ft', color: '#FF9500', threatLevel: 'NEAR', meters: 46 },
  { max: 300, label: '150-300ft', shortLabel: '300ft', color: '#FFCC00', threatLevel: 'MEDIUM', meters: 91 },
  { max: 500, label: '300-500ft', shortLabel: '500ft', color: '#A8D600', threatLevel: 'FAR', meters: 152 },
  { max: 800, label: '500-800ft', shortLabel: '800ft', color: '#34C759', threatLevel: 'DISTANT', meters: 244 },
];

// Max radius in meters for map zoom calculation
const MAX_RADIUS_METERS = 244;

interface ProximityData {
  zone: string;
  count: number;
  percentage: number;
  color: string;
  threatLevel: string;
  // Detection type breakdown
  wifiCount: number;
  bleCount: number;
  cellularCount: number;
}

export const ProximityHeatmapScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [showSatellite, setShowSatellite] = useState(true);
  const cameraRef = useRef<Camera>(null);
  const mapViewRef = useRef<MapView>(null);

  // Animation for GPS update indicator
  const gpsUpdateAnim = useRef(new Animated.Value(0)).current;
  const [lastGpsUpdate, setLastGpsUpdate] = useState<Date | null>(null);

  // Gesture tracking state for SVG overlay synchronization
  const [deviceScreenPos, setDeviceScreenPos] = useState({ x: CENTER_X, y: CENTER_Y });
  const [zoomScale, setZoomScale] = useState(1);
  const initialZoomRef = useRef<number | null>(null);

  // Track previous coordinates to detect changes
  const prevCoordsRef = useRef<{ lat: number | null; lon: number | null }>({
    lat: null,
    lon: null,
  });

  // Fetch devices - uses shared hook with 30s auto-refresh
  const { data: devices = [], isLoading: devicesLoading } = useDevices();

  // Fetch alerts for selected device - uses shared hook with 30s auto-refresh
  const selectedDevice = devices[selectedDeviceIndex];
  const { data: fetchedAlerts = [] } = useAlerts(
    !USE_MOCK_HEATMAP_DATA && selectedDevice?.id
      ? { deviceId: selectedDevice.id }
      : undefined
  );

  // Use mock alerts when testing, otherwise use fetched alerts
  const alerts = USE_MOCK_HEATMAP_DATA ? MOCK_ALERTS : fetchedAlerts;

  // Get device coordinates (null if device has no GPS fix yet)
  const deviceCoordinates = {
    latitude: selectedDevice?.latitude ?? null,
    longitude: selectedDevice?.longitude ?? null,
  };

  // Check if device has valid GPS coordinates
  const hasValidLocation = deviceCoordinates.latitude !== null &&
                           deviceCoordinates.longitude !== null;

  // Calculate zoom level to show 800ft radius
  // At zoom 16, roughly 1000m visible, zoom 17 ~500m, zoom 15 ~2000m
  const getZoomForRadius = (radiusMeters: number) => {
    // Approximate formula: zoom = 14.5 - log2(radius/500)
    return Math.max(14, Math.min(18, 16 - Math.log2(radiusMeters / 300)));
  };

  // Calculate proximity data with detection type breakdown
  const proximityData: ProximityData[] = ZONES.map((zone, index) => {
    const minDistance = index === 0 ? 0 : ZONES[index - 1].max;
    const maxDistance = zone.max;

    // Filter alerts in this zone
    const zoneAlerts = alerts.filter(alert => {
      let distance = 0;
      try {
        const metadata = typeof alert.metadata === 'string'
          ? JSON.parse(alert.metadata || '{}')
          : (alert.metadata || {});
        distance = metadata.distance || 0;
      } catch (e) {
        distance = estimateDistanceFromRSSI(alert.rssi);
      }
      return distance > minDistance && distance <= maxDistance;
    });

    // Count by detection type
    const wifiCount = zoneAlerts.filter(a => a.detectionType === 'wifi').length;
    const bleCount = zoneAlerts.filter(a => a.detectionType === 'bluetooth').length;
    const cellularCount = zoneAlerts.filter(a => a.detectionType === 'cellular').length;

    return {
      zone: zone.label,
      count: zoneAlerts.length,
      percentage: alerts.length > 0 ? (zoneAlerts.length / alerts.length) * 100 : 0,
      color: zone.color,
      threatLevel: zone.threatLevel,
      wifiCount,
      bleCount,
      cellularCount,
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

  // Update camera when device changes or GPS updates (only if valid coordinates)
  useEffect(() => {
    if (cameraRef.current && selectedDevice && hasValidLocation) {
      const newLat = deviceCoordinates.latitude;
      const newLon = deviceCoordinates.longitude;
      const prevLat = prevCoordsRef.current.lat;
      const prevLon = prevCoordsRef.current.lon;

      // Check if coordinates actually changed (real GPS update)
      const coordsChanged =
        prevLat !== null &&
        prevLon !== null &&
        (Math.abs(prevLat - newLat!) > 0.000001 ||
         Math.abs(prevLon - newLon!) > 0.000001);

      // Update camera with smooth animation
      cameraRef.current.setCamera({
        centerCoordinate: [newLon!, newLat!],
        zoomLevel: getZoomForRadius(MAX_RADIUS_METERS),
        animationDuration: coordsChanged ? 1000 : 500, // Slower animation for GPS updates
      });

      // Trigger pulse animation if coordinates changed (not just initial load)
      if (coordsChanged) {
        setLastGpsUpdate(new Date());
        // Pulse animation: 0 -> 1 -> 0
        gpsUpdateAnim.setValue(0);
        Animated.sequence([
          Animated.timing(gpsUpdateAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(gpsUpdateAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]).start();
      }

      // Update previous coordinates ref
      prevCoordsRef.current = { lat: newLat, lon: newLon };
    }
  }, [
    selectedDeviceIndex,
    deviceCoordinates.latitude,
    deviceCoordinates.longitude,
    hasValidLocation,
    gpsUpdateAnim,
  ]);

  // Handle camera changes from user gestures (pinch/zoom/pan)
  const handleCameraChanged = useCallback(async (event: any) => {
    if (!mapViewRef.current || !hasValidLocation) return;

    const { zoom } = event.properties;

    // Store initial zoom level on first camera change
    if (initialZoomRef.current === null) {
      initialZoomRef.current = zoom;
    }

    // Calculate scale factor based on zoom difference
    // Each zoom level doubles/halves the scale
    const newScale = Math.pow(2, zoom - initialZoomRef.current!);
    setZoomScale(newScale);

    // Get device position in screen coordinates
    try {
      const screenPoint = await mapViewRef.current.getPointInView([
        deviceCoordinates.longitude!,
        deviceCoordinates.latitude!,
      ]);
      setDeviceScreenPos({ x: screenPoint[0], y: screenPoint[1] });
    } catch (error) {
      // Fallback to center if getPointInView fails
      console.warn('Failed to get device screen position:', error);
    }
  }, [hasValidLocation, deviceCoordinates.longitude, deviceCoordinates.latitude]);

  // Reset map to center on device with initial zoom
  const resetMapView = useCallback(() => {
    if (cameraRef.current && hasValidLocation) {
      // Reset zoom scale and position
      setZoomScale(1);
      setDeviceScreenPos({ x: CENTER_X, y: CENTER_Y });
      initialZoomRef.current = getZoomForRadius(MAX_RADIUS_METERS);

      // Animate camera back to device location
      cameraRef.current.setCamera({
        centerCoordinate: [deviceCoordinates.longitude!, deviceCoordinates.latitude!],
        zoomLevel: getZoomForRadius(MAX_RADIUS_METERS),
        animationDuration: 500,
      });
    }
  }, [hasValidLocation, deviceCoordinates.longitude, deviceCoordinates.latitude]);

  // Reset overlay position when device changes
  useEffect(() => {
    setDeviceScreenPos({ x: CENTER_X, y: CENTER_Y });
    setZoomScale(1);
    initialZoomRef.current = null;
  }, [selectedDeviceIndex]);

  if (devicesLoading) {
    return (
      <ScreenLayout header={{ title: 'Proximity Heatmap', largeTitle: true }} variant="map">
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
      <ScreenLayout header={{ title: 'Proximity Heatmap', largeTitle: true }} variant="map">
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
      variant="map"
    >
      <ScrollView>
        {/* Compact Device Info Header */}
        <Card variant="grouped" style={styles.compactHeader}>
          {/* Row 1: Device name + Status + Battery */}
          <View style={styles.deviceRow}>
            {devices.length > 1 && (
              <TouchableOpacity
                onPress={cycleToPreviousDevice}
                style={styles.compactArrow}
              >
                <Icon name="chevron-back" size={20} color="systemBlue" />
              </TouchableOpacity>
            )}
            <Text variant="headline" weight="semibold" color="label" style={styles.deviceName}>
              {selectedDevice?.name || 'Unknown Device'}
            </Text>
            {devices.length > 1 && (
              <TouchableOpacity
                onPress={cycleToNextDevice}
                style={styles.compactArrow}
              >
                <Icon name="chevron-forward" size={20} color="systemBlue" />
              </TouchableOpacity>
            )}
            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: selectedDevice?.online ? '#34C759' : '#FF3B30' },
                ]}
              />
              <Text variant="caption1" color={selectedDevice?.online ? 'systemGreen' : 'systemRed'}>
                {selectedDevice?.online ? 'Online' : 'Offline'}
              </Text>
            </View>
            <View style={styles.batteryBadge}>
              <Icon name="battery-half" size={16} color="secondaryLabel" />
              <Text variant="caption1" color="secondaryLabel">
                {selectedDevice?.batteryPercent || selectedDevice?.battery || 0}%
              </Text>
            </View>
          </View>
          {/* Row 2: Coordinates + GPS Updated indicator + Satellite toggle */}
          <View style={styles.coordsRow}>
            <Icon name="location" size={14} color="tertiaryLabel" />
            <Text variant="caption2" color="tertiaryLabel" style={styles.coordsTextCompact}>
              {hasValidLocation
                ? `${deviceCoordinates.latitude!.toFixed(6)}, ${deviceCoordinates.longitude!.toFixed(6)}`
                : 'Awaiting GPS fix...'}
              {!selectedDevice?.online && hasValidLocation && ' (Last known)'}
            </Text>
            {/* GPS Updated indicator - fades in/out when location updates */}
            <Animated.View
              style={[
                styles.gpsUpdatedBadge,
                {
                  opacity: gpsUpdateAnim,
                  transform: [
                    {
                      scale: gpsUpdateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Icon name="checkmark-circle" size={12} color="systemGreen" />
              <Text variant="caption2" color="systemGreen">
                Updated
              </Text>
            </Animated.View>
            {hasValidLocation && (
              <TouchableOpacity
                onPress={() => setShowSatellite(!showSatellite)}
                style={styles.satelliteToggleCompact}
              >
                <Icon
                  name={showSatellite ? 'earth' : 'map'}
                  size={14}
                  color="systemBlue"
                />
                <Text variant="caption2" color="systemBlue">
                  {showSatellite ? 'Satellite' : 'Map'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Map + Heatmap Overlay */}
        <Card variant="grouped" style={styles.heatmapCard}>
          <View style={styles.mapContainer}>
            {hasValidLocation ? (
              <>
                {/* MapBox Satellite View - Gestures enabled for pan/zoom */}
                <MapView
                  ref={mapViewRef}
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
                  scrollEnabled={true}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  zoomEnabled={true}
                  onCameraChanged={handleCameraChanged}
                >
                  <Camera
                    ref={cameraRef}
                    centerCoordinate={[
                      deviceCoordinates.longitude!,
                      deviceCoordinates.latitude!,
                    ]}
                    zoomLevel={getZoomForRadius(MAX_RADIUS_METERS)}
                    animationMode="flyTo"
                    animationDuration={500}
                  />
                </MapView>

            {/* SVG Heatmap Overlay - syncs with map gestures */}
            <View style={styles.heatmapOverlay} pointerEvents="none">
              <Svg width={MAP_SIZE} height={MAP_SIZE} style={{ overflow: 'visible' }}>
                <Defs>
                  {/* Gradients defined but we'll use solid fills for zone bands */}
                </Defs>

                {/* Draw zone bands - REVERSE order so inner zones appear on top */}
                {/* Position and scale sync with map camera via deviceScreenPos and zoomScale */}
                {[...ZONES].reverse().map((zone, reverseIndex) => {
                  const index = ZONES.length - 1 - reverseIndex;
                  const maxRadius = MAP_SIZE / 2 - 10;

                  // Calculate TRUE proportional radii based on distance, then apply zoom scale
                  const baseOuterRadius = (zone.max / 800) * maxRadius;
                  const baseInnerRadius = index === 0 ? 0 : (ZONES[index - 1].max / 800) * maxRadius;
                  const baseBandWidth = baseOuterRadius - baseInnerRadius;

                  // Apply zoom scale to radii
                  const outerRadius = baseOuterRadius * zoomScale;
                  const innerRadius = baseInnerRadius * zoomScale;
                  const bandWidth = baseBandWidth * zoomScale;
                  const midRadius = innerRadius + bandWidth / 2;

                  const detectionCount = proximityData[index].count;
                  const hasDetections = detectionCount > 0;

                  // Calculate fill opacity based on detection count relative to max
                  // Range: 0.2 (few detections) to 0.65 (max detections)
                  const fillOpacity = hasDetections
                    ? 0.2 + (detectionCount / Math.max(maxCount, 1)) * 0.45
                    : 0;

                  // Innermost zone - draw as filled circle (no inner radius)
                  if (index === 0) {
                    return (
                      <G key={`zone-band-${index}`}>
                        {/* Innermost zone - filled circle at TRUE proportional size */}
                        <Circle
                          cx={deviceScreenPos.x}
                          cy={deviceScreenPos.y}
                          r={outerRadius}
                          fill={zone.color}
                          fillOpacity={fillOpacity}
                        />
                        {/* Border */}
                        <Circle
                          cx={deviceScreenPos.x}
                          cy={deviceScreenPos.y}
                          r={outerRadius}
                          fill="none"
                          stroke={zone.color}
                          strokeWidth={1.5}
                          strokeOpacity={hasDetections ? 0.9 : 0.5}
                        />
                      </G>
                    );
                  }

                  return (
                    <G key={`zone-band-${index}`}>
                      {/* Zone band fill - thick stroke creates ring shape */}
                      <Circle
                        cx={deviceScreenPos.x}
                        cy={deviceScreenPos.y}
                        r={midRadius}
                        fill="none"
                        stroke={zone.color}
                        strokeWidth={bandWidth}
                        strokeOpacity={fillOpacity}
                      />
                      {/* Outer border of this zone */}
                      <Circle
                        cx={deviceScreenPos.x}
                        cy={deviceScreenPos.y}
                        r={outerRadius}
                        fill="none"
                        stroke={zone.color}
                        strokeWidth={1.5}
                        strokeOpacity={hasDetections ? 0.9 : 0.5}
                      />
                    </G>
                  );
                })}


                {/* Center device marker - minimal target reticle */}
                {/* Marker size stays constant regardless of zoom for visibility */}
                {/* Outer shadow for visibility on any background */}
                <Circle
                  cx={deviceScreenPos.x}
                  cy={deviceScreenPos.y}
                  r={5}
                  fill="none"
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth={3}
                />
                {/* Inner white ring */}
                <Circle
                  cx={deviceScreenPos.x}
                  cy={deviceScreenPos.y}
                  r={5}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
                {/* Center dot */}
                <Circle
                  cx={deviceScreenPos.x}
                  cy={deviceScreenPos.y}
                  r={2}
                  fill="#FFFFFF"
                />
              </Svg>
            </View>

            {/* Reset View Button - appears when map has been panned/zoomed */}
            {(Math.abs(zoomScale - 1) > 0.01 ||
              Math.abs(deviceScreenPos.x - CENTER_X) > 5 ||
              Math.abs(deviceScreenPos.y - CENTER_Y) > 5) && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetMapView}
                activeOpacity={0.8}
              >
                <Icon name="locate" size={18} color="white" />
                <Text variant="caption1" weight="semibold" style={styles.resetButtonText}>
                  Reset
                </Text>
              </TouchableOpacity>
            )}
              </>
            ) : (
              /* No GPS location available */
              <View style={styles.noLocationContainer}>
                <Icon name="location-outline" size={48} color="systemGray" />
                <Text variant="title3" color="label" style={styles.noLocationTitle}>
                  No GPS Location
                </Text>
                <Text variant="body" color="secondaryLabel" style={styles.noLocationText}>
                  This device hasn't reported GPS coordinates yet.
                </Text>
                <Text variant="caption1" color="tertiaryLabel" style={styles.noLocationHint}>
                  Device will report location once it has a GPS fix
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Zone Legend - Compact Summary */}
        <Card variant="grouped" style={styles.legendCard}>
          <View style={styles.legendHeader}>
            <Text variant="headline" weight="semibold" color="label">
              Zone Summary
            </Text>
            <Text variant="footnote" color="secondaryLabel">
              {totalDetections} total detection{totalDetections !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Compact zone row with color bars */}
          <View style={styles.zoneSummaryRow}>
            {proximityData.map((zone, index) => (
              <View key={index} style={styles.zoneSummaryItem}>
                <View style={[styles.zoneSummaryColor, { backgroundColor: zone.color }]} />
                <Text variant="title2" weight="bold" color="label">
                  {zone.count}
                </Text>
                <Text variant="caption2" color="secondaryLabel" style={styles.zoneSummaryLabel}>
                  {ZONES[index].shortLabel}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Detection Type Totals */}
        <Card variant="grouped" style={styles.typeCard}>
          <View style={styles.typeRow}>
            <View style={styles.typeItem}>
              <Icon name="wifi" size={20} color="systemBlue" />
              <Text variant="title3" weight="semibold" color="label" style={styles.typeCount}>
                {proximityData.reduce((sum, z) => sum + z.wifiCount, 0)}
              </Text>
              <Text variant="caption1" color="secondaryLabel">WiFi</Text>
            </View>
            <View style={styles.typeDivider} />
            <View style={styles.typeItem}>
              <Icon name="bluetooth" size={20} color="systemIndigo" />
              <Text variant="title3" weight="semibold" color="label" style={styles.typeCount}>
                {proximityData.reduce((sum, z) => sum + z.bleCount, 0)}
              </Text>
              <Text variant="caption1" color="secondaryLabel">Bluetooth</Text>
            </View>
            <View style={styles.typeDivider} />
            <View style={styles.typeItem}>
              <Icon name="cellular" size={20} color="systemOrange" />
              <Text variant="title3" weight="semibold" color="label" style={styles.typeCount}>
                {proximityData.reduce((sum, z) => sum + z.cellularCount, 0)}
              </Text>
              <Text variant="caption1" color="secondaryLabel">Cellular</Text>
            </View>
          </View>
        </Card>

        {/* Detailed Zone Breakdown */}
        <Card variant="grouped" style={styles.detailsCard}>
          <Text
            variant="subheadline"
            weight="semibold"
            color="secondaryLabel"
            style={styles.detailsTitle}
          >
            DETECTION BREAKDOWN BY ZONE
          </Text>
          {proximityData.map((zone, index) => (
            <View key={index} style={styles.zoneRow}>
              <View style={styles.zoneLeftSection}>
                <View
                  style={[styles.colorIndicator, { backgroundColor: zone.color }]}
                />
                <View style={styles.zoneInfo}>
                  <View style={styles.zoneNameRow}>
                    <Text variant="body" weight="medium" color="label">
                      {zone.zone}
                    </Text>
                    <Text variant="caption1" color="secondaryLabel" style={styles.threatLabel}>
                      {zone.threatLevel}
                    </Text>
                  </View>
                  {/* Detection type icons for this zone */}
                  <View style={styles.zoneTypeIcons}>
                    {zone.wifiCount > 0 && (
                      <View style={styles.typeIconBadge}>
                        <Icon name="wifi" size={12} color="systemBlue" />
                        <Text variant="caption2" color="secondaryLabel">{zone.wifiCount}</Text>
                      </View>
                    )}
                    {zone.bleCount > 0 && (
                      <View style={styles.typeIconBadge}>
                        <Icon name="bluetooth" size={12} color="systemIndigo" />
                        <Text variant="caption2" color="secondaryLabel">{zone.bleCount}</Text>
                      </View>
                    )}
                    {zone.cellularCount > 0 && (
                      <View style={styles.typeIconBadge}>
                        <Icon name="cellular" size={12} color="systemOrange" />
                        <Text variant="caption2" color="secondaryLabel">{zone.cellularCount}</Text>
                      </View>
                    )}
                    {zone.count === 0 && (
                      <Text variant="caption2" color="tertiaryLabel">No detections</Text>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.zoneRightSection}>
                <Text variant="title3" weight="bold" color="label">
                  {zone.count}
                </Text>
                <View style={styles.zoneBar}>
                  <View
                    style={[
                      styles.zoneBarFill,
                      {
                        width: `${Math.max(zone.percentage, zone.count > 0 ? 10 : 0)}%`,
                        backgroundColor: zone.color,
                      },
                    ]}
                  />
                </View>
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
  // No GPS location container
  noLocationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: MAP_SIZE,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
  },
  noLocationTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  noLocationText: {
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  noLocationHint: {
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Compact Header (replaces 3 separate cards)
  compactHeader: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactArrow: {
    padding: 4,
  },
  deviceName: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  batteryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 4,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  coordsTextCompact: {
    flex: 1,
  },
  gpsUpdatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderRadius: 6,
    marginRight: 8,
  },
  satelliteToggleCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 6,
  },
  heatmapCard: {
    marginHorizontal: 16,
    marginBottom: 8,
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
    overflow: 'visible',
  },
  resetButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  resetButtonText: {
    color: '#FFFFFF',
  },
  // Zone Legend Card
  legendCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  zoneSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  zoneSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  zoneSummaryColor: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  zoneSummaryLabel: {
    marginTop: 2,
  },
  // Detection Type Card
  typeCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  typeItem: {
    alignItems: 'center',
    flex: 1,
  },
  typeCount: {
    marginVertical: 4,
  },
  typeDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#3a3a3c',
  },
  // Details Card
  detailsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
  },
  detailsTitle: {
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3a3a3c',
  },
  zoneLeftSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  zoneRightSection: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  colorIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
    marginTop: 2,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  threatLabel: {
    marginLeft: 8,
    opacity: 0.7,
  },
  zoneTypeIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeIconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  zoneBar: {
    width: 60,
    height: 6,
    backgroundColor: '#3a3a3c',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
  },
  zoneBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
