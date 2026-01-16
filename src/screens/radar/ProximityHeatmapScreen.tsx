import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Text, Card, Icon } from '@components/atoms';
import { ScreenLayout } from '@components/templates';
import { useDevices } from '@hooks/api/useDevices';
import Mapbox, { Camera, MapView } from '@rnmapbox/maps';
import { usePositions, POSITIONS_QUERY_KEY } from '@hooks/api/usePositions';
import { DetectedDeviceMarker } from '@components/molecules/DetectedDeviceMarker';
import { TrailSenseDeviceMarker } from '@components/molecules/TrailSenseDeviceMarker';
import { PositionInfoPopup } from '@components/molecules/PositionInfoPopup';
import { PositionListItem } from '@components/molecules/PositionListItem';
import { TriangulatedPosition } from '@/types/triangulation';
import { websocketService } from '@api/websocket';
import { useQueryClient } from '@tanstack/react-query';

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
const MAP_SIZE = width - 40;

export const ProximityHeatmapScreen = () => {
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [showSatellite, setShowSatellite] = useState(true);
  const cameraRef = useRef<Camera>(null);
  const mapViewRef = useRef<MapView>(null);

  // Animation for GPS update indicator
  const gpsUpdateAnim = useRef(new Animated.Value(0)).current;

  // Selected position for popup
  const [selectedPosition, setSelectedPosition] = useState<TriangulatedPosition | null>(null);

  // Track previous coordinates to detect changes
  const prevCoordsRef = useRef<{ lat: number | null; lon: number | null }>({
    lat: null,
    lon: null,
  });

  // Fetch devices - uses shared hook with 30s auto-refresh
  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  const selectedDevice = devices[selectedDeviceIndex];

  // Fetch triangulated positions for selected device
  const { data: positionsData } = usePositions(selectedDevice?.id);
  const positions = positionsData?.positions ?? [];

  // Handle WebSocket position updates
  const queryClient = useQueryClient();

  useEffect(() => {
    const handlePositionsUpdated = (data: { deviceId: string; positions: any[] }) => {
      // Invalidate positions query for this device to trigger refetch
      if (data.deviceId === selectedDevice?.id) {
        queryClient.invalidateQueries({ queryKey: [POSITIONS_QUERY_KEY, data.deviceId] });
      }
    };

    websocketService.on('positions-updated', handlePositionsUpdated);
    return () => websocketService.off('positions-updated', handlePositionsUpdated);
  }, [selectedDevice?.id, queryClient]);

  // Get device coordinates (null if device has no GPS fix yet)
  const deviceCoordinates = {
    latitude: selectedDevice?.latitude ?? null,
    longitude: selectedDevice?.longitude ?? null,
  };

  // Check if device has valid GPS coordinates
  const hasValidLocation = deviceCoordinates.latitude !== null &&
                           deviceCoordinates.longitude !== null;

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
        zoomLevel: 16,
        animationDuration: coordsChanged ? 1000 : 500, // Slower animation for GPS updates
      });

      // Trigger pulse animation if coordinates changed (not just initial load)
      if (coordsChanged) {
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

  // Reset map to center on device
  const resetMapView = useCallback(() => {
    if (cameraRef.current && hasValidLocation) {
      cameraRef.current.setCamera({
        centerCoordinate: [deviceCoordinates.longitude!, deviceCoordinates.latitude!],
        zoomLevel: 16,
        animationDuration: 500,
      });
    }
  }, [hasValidLocation, deviceCoordinates.longitude, deviceCoordinates.latitude]);

  // Center map on a specific position and show its popup
  const centerOnPosition = useCallback((position: TriangulatedPosition) => {
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [position.longitude, position.latitude],
        zoomLevel: 17,
        animationDuration: 500,
      });
    }
    setSelectedPosition(position);
  }, []);

  // Clear popup when device changes
  useEffect(() => {
    setSelectedPosition(null);
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
                >
                  <Camera
                    ref={cameraRef}
                    centerCoordinate={[
                      deviceCoordinates.longitude!,
                      deviceCoordinates.latitude!,
                    ]}
                    zoomLevel={16}
                    animationMode="flyTo"
                    animationDuration={500}
                  />

                  {/* TrailSense Device Marker */}
                  {hasValidLocation && (
                    <TrailSenseDeviceMarker
                      id={selectedDevice?.id || 'device'}
                      coordinate={[deviceCoordinates.longitude!, deviceCoordinates.latitude!]}
                      isOnline={selectedDevice?.online}
                    />
                  )}

                  {/* Detected Device Position Markers */}
                  {positions.map((position) => (
                    <DetectedDeviceMarker
                      key={position.id}
                      id={position.id}
                      coordinate={[position.longitude, position.latitude]}
                      signalType={position.signalType}
                      confidence={position.confidence}
                      onPress={() => setSelectedPosition(position)}
                    />
                  ))}
                </MapView>

                {/* Reset View Button */}
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={resetMapView}
                  activeOpacity={0.8}
                >
                  <Icon name="locate" size={18} color="white" />
                </TouchableOpacity>

                {/* Position Info Popup */}
                {selectedPosition && (
                  <View style={styles.popupOverlay}>
                    <PositionInfoPopup
                      signalType={selectedPosition.signalType}
                      confidence={selectedPosition.confidence}
                      accuracyMeters={selectedPosition.accuracyMeters}
                      onClose={() => setSelectedPosition(null)}
                    />
                  </View>
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

        {/* Detected Devices List */}
        <Card variant="grouped" style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text variant="headline" weight="semibold" color="label">
              Detected Devices
            </Text>
            <Text variant="footnote" color="secondaryLabel">
              {positions.length}
            </Text>
          </View>

          {positions.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="radio-outline" size={32} color="systemGray" />
              <Text variant="subheadline" color="secondaryLabel" style={styles.emptyText}>
                No detected devices
              </Text>
            </View>
          ) : (
            positions.map(position => (
              <PositionListItem
                key={position.id}
                position={position}
                onPress={() => centerOnPosition(position)}
              />
            ))
          )}
        </Card>
      </ScrollView>
    </ScreenLayout>
  );
};

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
  resetButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    padding: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  popupOverlay: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  // Detected Devices List
  listCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingBottom: 0,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3a3a3c',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    marginTop: 4,
  },
});
