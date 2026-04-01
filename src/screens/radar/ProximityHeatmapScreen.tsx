import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, Icon } from '@components/atoms';
import { ScreenLayout } from '@components/templates';
import { useAlerts } from '@hooks/api/useAlerts';
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
import { useTheme } from '@theme/provider';

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

export const ProximityHeatmapScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [selectedDeviceIndex] = useState(0);
  const [showSatellite, setShowSatellite] = useState(true);
  const cameraRef = useRef<Camera>(null);
  const mapViewRef = useRef<MapView>(null);

  // Selected position for popup
  const [selectedPosition, setSelectedPosition] = useState<TriangulatedPosition | null>(null);

  // Track previous coordinates to detect changes
  const prevCoordsRef = useRef<{ lat: number | null; lon: number | null }>({
    lat: null,
    lon: null,
  });

  // Fetch devices - uses shared hook with 30s auto-refresh
  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  const { data: alerts = [] } = useAlerts();
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

      // Update previous coordinates ref
      prevCoordsRef.current = { lat: newLat, lon: newLon };
    }
  }, [
    selectedDeviceIndex,
    deviceCoordinates.latitude,
    deviceCoordinates.longitude,
    hasValidLocation,
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

  // Format coordinates for display
  const formatCoordinates = (coords: { latitude: number | null; longitude: number | null }) => {
    if (coords.latitude === null || coords.longitude === null) {
      return 'Awaiting GPS...';
    }
    return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
  };

  return (
    <ScreenLayout
      header={{
        title: selectedDevice?.name || 'Map',
        largeTitle: false,
        showBack: true,
        rightActions:
          alerts[0]?.macAddress ? (
            <Button
              buttonStyle="plain"
              onPress={() =>
                navigation.navigate('DeviceFingerprint', {
                  macAddress: alerts[0].macAddress,
                })
              }
            >
              Visitor
            </Button>
          ) : undefined,
      }}
    >
      <ScrollView>
        {/* Simple status subtitle */}
        <View style={styles.statusSubtitle}>
          <View style={[styles.statusDot, { backgroundColor: selectedDevice?.online ? colors.systemGreen : colors.systemRed }]} />
          <Text variant="subheadline" color="secondaryLabel">
            {selectedDevice?.online ? 'Online' : 'Offline'} · {formatCoordinates(deviceCoordinates)}
          </Text>
          {devices.length > 1 && (
            <Text variant="caption1" color="tertiaryLabel" style={styles.deviceIndicator}>
              {selectedDeviceIndex + 1}/{devices.length}
            </Text>
          )}
        </View>

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

                {/* Floating Map Controls */}
                <View style={styles.floatingControls}>
                  {/* Satellite Toggle */}
                  <TouchableOpacity
                    style={[styles.floatingButton, { backgroundColor: colors.systemBlue }]}
                    onPress={() => setShowSatellite(!showSatellite)}
                    activeOpacity={0.8}
                  >
                    <Icon name={showSatellite ? 'map-outline' : 'earth'} size={18} color="white" />
                  </TouchableOpacity>
                  {/* Reset View Button */}
                  <TouchableOpacity
                    style={[styles.floatingButton, { backgroundColor: colors.systemBlue }]}
                    onPress={resetMapView}
                    activeOpacity={0.8}
                  >
                    <Icon name="locate" size={18} color="white" />
                  </TouchableOpacity>
                </View>

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
          <View style={[styles.listHeader, { borderBottomColor: colors.separator }]}>
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
  // Status subtitle row
  statusSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deviceIndicator: {
    marginLeft: 'auto',
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
  // Floating map controls
  floatingControls: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'column',
    gap: 8,
  },
  floatingButton: {
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
