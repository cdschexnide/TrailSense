import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import Mapbox, { Camera, MapView } from '@rnmapbox/maps';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Button, Card, Icon, Text } from '@components/atoms';
import { FingerprintPeek } from '@components/molecules/FingerprintPeek';
import { PositionListItem } from '@components/molecules/PositionListItem';
import { DetectedDeviceMarker } from '@components/molecules/DetectedDeviceMarker';
import { TrailSenseDeviceMarker } from '@components/molecules/TrailSenseDeviceMarker';
import { TimelineScrubber } from '@components/organisms/TimelineScrubber';
import { TacticalHeader } from '@components/organisms';
import { ScreenLayout } from '@components/templates';
import { websocketService } from '@api/websocket';
import { useAlerts } from '@hooks/api/useAlerts';
import { useDevices } from '@hooks/api/useDevices';
import { POSITIONS_QUERY_KEY, usePositions } from '@hooks/api/usePositions';
import { useReplayData } from '@hooks/api/useReplayPositions';
import { useAutoPlay } from '@hooks/useAutoPlay';
import { THREAT_COLORS, useReplayPath } from '@hooks/useReplayPath';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { useTimeBucketing } from '@hooks/useTimeBucketing';
import { BucketEntry, RadarMode } from '@/types/replay';
import { TriangulatedPosition } from '@/types/triangulation';
import { isDemoOrMockMode } from '@/config/demoModeRuntime';
import { useTheme } from '@theme/provider';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (!MAPBOX_TOKEN) {
  console.warn(
    '[MapBox] No access token found. Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env'
  );
}
Mapbox.setAccessToken(MAPBOX_TOKEN || '');

const { width } = Dimensions.get('window');
const MAP_SIZE = width - 40;

function formatCoordinates(coords: {
  latitude: number | null;
  longitude: number | null;
}) {
  if (coords.latitude === null || coords.longitude === null) {
    return 'Awaiting GPS...';
  }

  return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
}

function LiveMapContent({
  colors,
  navigation,
  selectedDevice,
  devices,
  hasValidLocation,
  showSatellite,
  setShowSatellite,
  mapViewRef,
  cameraRef,
  deviceCoordinates,
  positions,
  selectedPosition,
  setSelectedPosition,
  resetMapView,
  centerOnPosition,
}: {
  colors: any;
  navigation: any;
  selectedDevice: any;
  devices: any[];
  hasValidLocation: boolean;
  showSatellite: boolean;
  setShowSatellite: React.Dispatch<React.SetStateAction<boolean>>;
  mapViewRef: React.RefObject<MapView>;
  cameraRef: React.RefObject<Camera>;
  deviceCoordinates: { latitude: number | null; longitude: number | null };
  positions: TriangulatedPosition[];
  selectedPosition: TriangulatedPosition | null;
  setSelectedPosition: React.Dispatch<
    React.SetStateAction<TriangulatedPosition | null>
  >;
  resetMapView: () => void;
  centerOnPosition: (position: TriangulatedPosition) => void;
}) {
  return (
    <>
      <ScrollView>
        <View style={styles.statusSubtitle}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: selectedDevice?.online
                  ? colors.systemGreen
                  : colors.systemRed,
              },
            ]}
          />
          <Text variant="subheadline" color="secondaryLabel">
            {selectedDevice?.online ? 'Online' : 'Offline'} ·{' '}
            {formatCoordinates(deviceCoordinates)}
          </Text>
          {devices.length > 1 ? (
            <Text
              variant="caption1"
              color="tertiaryLabel"
              style={styles.deviceIndicator}
            >
              1/{devices.length}
            </Text>
          ) : null}
        </View>

        <Card variant="grouped" style={styles.heatmapCard}>
          <View style={styles.mapContainer}>
            {hasValidLocation ? (
              <>
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

                  <TrailSenseDeviceMarker
                    id={selectedDevice?.id || 'device'}
                    coordinate={[
                      deviceCoordinates.longitude!,
                      deviceCoordinates.latitude!,
                    ]}
                    isOnline={selectedDevice?.online}
                  />

                  {positions.map(position => (
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

                <View style={styles.floatingControls}>
                  <TouchableOpacity
                    style={[
                      styles.floatingButton,
                      { backgroundColor: colors.systemBlue },
                    ]}
                    onPress={() => setShowSatellite(current => !current)}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name={showSatellite ? 'map-outline' : 'earth'}
                      size={18}
                      color="white"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.floatingButton,
                      { backgroundColor: colors.systemBlue },
                    ]}
                    onPress={resetMapView}
                    activeOpacity={0.8}
                  >
                    <Icon name="locate" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.noLocationContainer}>
                <Icon name="location-outline" size={48} color="systemGray" />
                <Text
                  variant="title3"
                  color="label"
                  style={styles.noLocationTitle}
                >
                  No GPS Location
                </Text>
                <Text
                  variant="body"
                  color="secondaryLabel"
                  style={styles.noLocationText}
                >
                  This device hasn&apos;t reported GPS coordinates yet.
                </Text>
                <Text
                  variant="caption1"
                  color="tertiaryLabel"
                  style={styles.noLocationHint}
                >
                  Device will report location once it has a GPS fix
                </Text>
              </View>
            )}
          </View>
        </Card>

        <Card variant="grouped" style={styles.listCard}>
          <View
            style={[styles.listHeader, { borderBottomColor: colors.separator }]}
          >
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
              <Text
                variant="subheadline"
                color="secondaryLabel"
                style={styles.emptyText}
              >
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

      {selectedPosition ? (
        <FingerprintPeek
          fingerprintHash={selectedPosition.fingerprintHash}
          scrubTimestamp={Date.now()}
          onViewProfile={fingerprintHash => {
            setSelectedPosition(null);
            navigation.navigate('DeviceFingerprint', { fingerprintHash });
          }}
          onDismiss={() => setSelectedPosition(null)}
        />
      ) : null}
    </>
  );
}

export const ProximityHeatmapScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const reduceMotion = useReducedMotion();

  const [selectedDeviceIndex] = useState(0);
  const [showSatellite, setShowSatellite] = useState(true);
  const [selectedPosition, setSelectedPosition] =
    useState<TriangulatedPosition | null>(null);
  const [peekFingerprint, setPeekFingerprint] = useState<string | null>(null);

  const startHour: number | undefined = route?.params?.startHour;
  const [mode, setMode] = useState<RadarMode>(
    startHour !== undefined ? 'replay' : 'live'
  );

  const cameraRef = useRef<Camera>(null);
  const mapViewRef = useRef<MapView>(null);
  const replayCameraRef = useRef<Camera>(null);
  const [replayShowSatellite, setReplayShowSatellite] = useState(true);
  const prevCoordsRef = useRef<{ lat: number | null; lon: number | null }>({
    lat: null,
    lon: null,
  });

  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  const { data: alerts = [] } = useAlerts();
  const selectedDevice = devices[selectedDeviceIndex];

  const { data: positionsData } = usePositions(selectedDevice?.id);
  const positions = positionsData?.positions ?? [];

  const { data: replayData } = useReplayData(selectedDevice?.id);
  const replayPositions = replayData?.positions ?? [];
  const replayAlerts = replayData?.alerts ?? [];

  const propertyCenter = {
    latitude: selectedDevice?.latitude ?? 31.530757,
    longitude: selectedDevice?.longitude ?? -110.287842,
  };

  const bucketed = useTimeBucketing({
    positions: replayPositions,
    alerts: replayAlerts,
    propertyCenter,
    canvasSize: 350,
    maxRange: 244,
  });

  const autoPlay = useAutoPlay({
    buckets: bucketed.buckets,
    initialMinute: startHour !== undefined ? startHour * 60 : 0,
  });

  const autoPlayRef = useRef(autoPlay);
  autoPlayRef.current = autoPlay;

  const TRAIL_WINDOW = 15;
  const currentReplayEntries = useMemo(() => {
    const entries: BucketEntry[] = [];
    for (let offset = 0; offset < TRAIL_WINDOW; offset++) {
      const minute = autoPlay.minuteIndex - offset;
      if (minute < 0) continue;
      const bucket = bucketed.buckets.get(minute);
      if (bucket) entries.push(...bucket);
    }
    // Deduplicate by fingerprint hash, keeping latest
    const seen = new Map<string, BucketEntry>();
    for (const e of entries) {
      if (!seen.has(e.fingerprintHash)) seen.set(e.fingerprintHash, e);
    }
    return Array.from(seen.values());
  }, [autoPlay.minuteIndex, bucketed.buckets]);

  const smoothMode = isDemoOrMockMode();
  const { interpolatedDevices, trailLines } = useReplayPath(
    bucketed.buckets,
    autoPlay.minuteIndex,
    autoPlay.progress
  );

  const fadeAnim = useSharedValue(startHour !== undefined ? 0 : 1);
  const liveStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));
  const replayStyle = useAnimatedStyle(() => ({
    opacity: 1 - fadeAnim.value,
  }));

  const queryClient = useQueryClient();

  useEffect(() => {
    const handlePositionsUpdated = (data: {
      deviceId: string;
      positions: any[];
    }) => {
      if (data.deviceId === selectedDevice?.id) {
        queryClient.invalidateQueries({
          queryKey: [POSITIONS_QUERY_KEY, data.deviceId],
        });
      }
    };

    websocketService.on('positions-updated', handlePositionsUpdated);
    return () =>
      websocketService.off('positions-updated', handlePositionsUpdated);
  }, [queryClient, selectedDevice?.id]);

  const deviceCoordinates = {
    latitude: selectedDevice?.latitude ?? null,
    longitude: selectedDevice?.longitude ?? null,
  };
  const hasValidLocation =
    deviceCoordinates.latitude !== null && deviceCoordinates.longitude !== null;

  useEffect(() => {
    if (!cameraRef.current || !selectedDevice || !hasValidLocation) {
      return;
    }

    const newLat = deviceCoordinates.latitude;
    const newLon = deviceCoordinates.longitude;
    const prevLat = prevCoordsRef.current.lat;
    const prevLon = prevCoordsRef.current.lon;
    const coordsChanged =
      prevLat !== null &&
      prevLon !== null &&
      (Math.abs(prevLat - newLat!) > 0.000001 ||
        Math.abs(prevLon - newLon!) > 0.000001);

    cameraRef.current.setCamera({
      centerCoordinate: [newLon!, newLat!],
      zoomLevel: 16,
      animationDuration: coordsChanged ? 1000 : 500,
    });
    prevCoordsRef.current = { lat: newLat, lon: newLon };
  }, [
    deviceCoordinates.latitude,
    deviceCoordinates.longitude,
    hasValidLocation,
    selectedDevice,
  ]);

  useEffect(() => {
    setSelectedPosition(null);
  }, [selectedDeviceIndex]);

  const resetMapView = useCallback(() => {
    if (!cameraRef.current || !hasValidLocation) {
      return;
    }

    cameraRef.current.setCamera({
      centerCoordinate: [
        deviceCoordinates.longitude!,
        deviceCoordinates.latitude!,
      ],
      zoomLevel: 16,
      animationDuration: 500,
    });
  }, [
    deviceCoordinates.latitude,
    deviceCoordinates.longitude,
    hasValidLocation,
  ]);

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

  const switchToLive = useCallback(() => {
    setMode('live');
    fadeAnim.value = reduceMotion ? 1 : withTiming(1, { duration: 300 });
    autoPlayRef.current.pause();
    setPeekFingerprint(null);
  }, [fadeAnim, reduceMotion]);

  const switchToReplay = useCallback(() => {
    setMode('replay');
    fadeAnim.value = reduceMotion ? 0 : withTiming(0, { duration: 300 });
  }, [fadeAnim, reduceMotion]);

  useEffect(() => {
    if (startHour === undefined) {
      return;
    }

    switchToReplay();
    autoPlayRef.current.setMinuteIndex(startHour * 60);
    navigation.setParams({ startHour: undefined });
  }, [navigation, startHour, switchToReplay]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        switchToLive();
      };
    }, [switchToLive])
  );

  const activeCount =
    mode === 'live' ? positions.length : currentReplayEntries.length;

  if (devicesLoading) {
    return (
      <ScreenLayout
        customHeader={
          <TacticalHeader
            title="RADAR"
            statusLabel={activeCount > 0 ? `${activeCount} ACTIVE` : 'SCANNING'}
            statusVariant={activeCount > 0 ? 'success' : 'warning'}
          />
        }
      >
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
      <ScreenLayout
        customHeader={
          <TacticalHeader
            title="RADAR"
            statusLabel="SCANNING"
            statusVariant="warning"
          />
        }
      >
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
      customHeader={
        <TacticalHeader
          title="RADAR"
          statusLabel={activeCount > 0 ? `${activeCount} ACTIVE` : 'SCANNING'}
          statusVariant={activeCount > 0 ? 'success' : 'warning'}
          rightAction={
            alerts[0]?.fingerprintHash ? (
              <Button
                buttonStyle="plain"
                onPress={() =>
                  navigation.navigate('DeviceFingerprint', {
                    fingerprintHash: alerts[0].fingerprintHash,
                  })
                }
              >
                Visitor
              </Button>
            ) : undefined
          }
        />
      }
      scrollable={false}
    >
      <View style={styles.segmentedControl}>
        <Pressable
          style={[styles.segment, mode === 'live' && styles.segmentActive]}
          onPress={switchToLive}
        >
          <Text
            variant="subheadline"
            weight={mode === 'live' ? 'semibold' : 'regular'}
            color={mode === 'live' ? 'label' : 'secondaryLabel'}
          >
            Live Map
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segment, mode === 'replay' && styles.segmentActive]}
          onPress={switchToReplay}
        >
          <Text
            variant="subheadline"
            weight={mode === 'replay' ? 'semibold' : 'regular'}
            color={mode === 'replay' ? 'label' : 'secondaryLabel'}
          >
            Replay
          </Text>
        </Pressable>
      </View>

      <View style={styles.modeContainer}>
        <Animated.View
          testID="live-map-content"
          pointerEvents={mode === 'live' ? 'auto' : 'none'}
          style={[StyleSheet.absoluteFillObject, liveStyle]}
        >
          <LiveMapContent
            colors={colors}
            navigation={navigation}
            selectedDevice={selectedDevice}
            devices={devices}
            hasValidLocation={hasValidLocation}
            showSatellite={showSatellite}
            setShowSatellite={setShowSatellite}
            mapViewRef={mapViewRef}
            cameraRef={cameraRef}
            deviceCoordinates={deviceCoordinates}
            positions={positions}
            selectedPosition={selectedPosition}
            setSelectedPosition={setSelectedPosition}
            resetMapView={resetMapView}
            centerOnPosition={centerOnPosition}
          />
        </Animated.View>

        <Animated.View
          testID="replay-content"
          pointerEvents={mode === 'replay' ? 'auto' : 'none'}
          style={[StyleSheet.absoluteFillObject, replayStyle]}
        >
          <View style={styles.replayMapContainer}>
            {hasValidLocation ? (
              <>
                <MapView
                  style={StyleSheet.absoluteFillObject}
                  styleURL={
                    replayShowSatellite
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
                    ref={replayCameraRef}
                    centerCoordinate={[
                      deviceCoordinates.longitude!,
                      deviceCoordinates.latitude!,
                    ]}
                    zoomLevel={16}
                    animationMode="flyTo"
                    animationDuration={500}
                  />

                  <TrailSenseDeviceMarker
                    id={`replay-${selectedDevice?.id || 'device'}`}
                    coordinate={[
                      deviceCoordinates.longitude!,
                      deviceCoordinates.latitude!,
                    ]}
                    isOnline={selectedDevice?.online}
                  />

                  {smoothMode
                    ? trailLines.map(trail => (
                        <Mapbox.ShapeSource
                          key={`trail-${trail.fingerprintHash}`}
                          id={`trail-${trail.fingerprintHash}`}
                          lineMetrics
                          shape={{
                            type: 'Feature',
                            properties: {},
                            geometry: {
                              type: 'LineString',
                              coordinates: trail.coordinates,
                            },
                          }}
                        >
                          <Mapbox.LineLayer
                            id={`trail-line-${trail.fingerprintHash}`}
                            style={{
                              lineColor: THREAT_COLORS[trail.threatLevel],
                              lineWidth: 2.5,
                              lineGradient: [
                                'interpolate',
                                ['linear'],
                                ['line-progress'],
                                0,
                                'rgba(0, 0, 0, 0)',
                                0.4,
                                THREAT_COLORS[trail.threatLevel],
                                1,
                                THREAT_COLORS[trail.threatLevel],
                              ],
                              lineCap: 'round',
                              lineJoin: 'round',
                            }}
                          />
                        </Mapbox.ShapeSource>
                      ))
                    : null}

                  {(smoothMode
                    ? interpolatedDevices
                    : currentReplayEntries
                  ).map((entry, i) => (
                    <DetectedDeviceMarker
                      key={`${entry.fingerprintHash}-${i}`}
                      id={`replay-${entry.fingerprintHash}-${i}`}
                      coordinate={[entry.longitude, entry.latitude]}
                      signalType={entry.signalType}
                      confidence={entry.confidence}
                      onPress={() => {
                        autoPlay.pause();
                        setPeekFingerprint(entry.fingerprintHash);
                      }}
                    />
                  ))}
                </MapView>

                <View style={styles.floatingControls}>
                  <TouchableOpacity
                    style={[
                      styles.floatingButton,
                      { backgroundColor: colors.systemBlue },
                    ]}
                    onPress={() => setReplayShowSatellite(c => !c)}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name={replayShowSatellite ? 'map-outline' : 'earth'}
                      size={18}
                      color="white"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.floatingButton,
                      { backgroundColor: colors.systemBlue },
                    ]}
                    onPress={() => {
                      replayCameraRef.current?.setCamera({
                        centerCoordinate: [
                          deviceCoordinates.longitude!,
                          deviceCoordinates.latitude!,
                        ],
                        zoomLevel: 16,
                        animationDuration: 500,
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <Icon name="locate" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.noLocationContainer}>
                <Icon name="location-outline" size={48} color="systemGray" />
                <Text
                  variant="title3"
                  color="label"
                  style={styles.noLocationTitle}
                >
                  No GPS Location
                </Text>
              </View>
            )}
          </View>

          <TimelineScrubber
            minuteIndex={autoPlay.minuteIndex}
            buckets={bucketed.buckets}
            isPlaying={autoPlay.isPlaying}
            speed={autoPlay.speed}
            onPlayPause={autoPlay.togglePlayPause}
            onSpeedChange={autoPlay.cycleSpeed}
            onSkipForward={autoPlay.skipForward}
            onSkipBack={autoPlay.skipBack}
            onScrub={autoPlay.setMinuteIndex}
          />

          {peekFingerprint ? (
            <FingerprintPeek
              fingerprintHash={peekFingerprint}
              scrubTimestamp={
                bucketed.startTime + autoPlay.minuteIndex * 60_000
              }
              onViewProfile={fingerprintHash => {
                setPeekFingerprint(null);
                navigation.navigate('DeviceFingerprint', { fingerprintHash });
              }}
              onDismiss={() => {
                setPeekFingerprint(null);
                autoPlay.play();
              }}
            />
          ) : null}
        </Animated.View>
      </View>
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
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    padding: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  modeContainer: {
    flex: 1,
    position: 'relative',
  },
  replayMapContainer: {
    flex: 1,
    position: 'relative',
  },
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
    width: '100%',
    height: MAP_SIZE,
    position: 'relative',
  },
  map: {
    flex: 1,
    borderRadius: 12,
  },
  floatingControls: {
    position: 'absolute',
    right: 12,
    top: 12,
    gap: 8,
  },
  floatingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  listCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 8,
  },
});
