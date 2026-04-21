import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import Mapbox, { Camera, MapView } from '@rnmapbox/maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@components/atoms/Icon';
import { DetectedDeviceMarker } from '@components/molecules/DetectedDeviceMarker';
import { StatusChip } from '@components/molecules/StatusChip/StatusChip';
import { TrailSenseDeviceMarker } from '@components/molecules/TrailSenseDeviceMarker';
import { DetectionBottomSheet } from '@components/organisms/DetectionBottomSheet/DetectionBottomSheet';
import { DeviceBottomSheet } from '@components/organisms/DeviceBottomSheet/DeviceBottomSheet';
import { SettingsOverlay } from '@components/organisms/SettingsOverlay/SettingsOverlay';
import { useDevices } from '@hooks/api/useDevices';
import { DeduplicatedPosition, useAllPositions } from '@hooks/useAllPositions';
import { Device } from '@/types/device';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

if (!MAPBOX_TOKEN) {
  console.warn(
    '[MapBox] No access token found. Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env'
  );
}

Mapbox.setAccessToken(MAPBOX_TOKEN || '');

const OUTDOOR_STYLE = 'mapbox://styles/mapbox/outdoors-v12';
// SE Texas — fallback when no devices have GPS coordinates yet
const DEFAULT_CENTER: [number, number] = [-94.317, 30.396];

export const MapScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Camera>(null);
  const detectionSheetRef = useRef<BottomSheet>(null);
  const deviceSheetRef = useRef<BottomSheet>(null);
  const hasCenteredRef = useRef(false);

  const { data: devices } = useDevices();
  const { positions, isLoading } = useAllPositions(devices);

  const [showSatellite, setShowSatellite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPosition, setSelectedPosition] =
    useState<DeduplicatedPosition | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const mapCenter = useMemo<[number, number]>(() => {
    const devicesWithCoords = (devices ?? []).filter(
      device => device.latitude != null && device.longitude != null
    );

    if (devicesWithCoords.length === 0) {
      return DEFAULT_CENTER;
    }

    const sumLongitude = devicesWithCoords.reduce(
      (sum, device) => sum + (device.longitude ?? 0),
      0
    );
    const sumLatitude = devicesWithCoords.reduce(
      (sum, device) => sum + (device.latitude ?? 0),
      0
    );

    return [
      sumLongitude / devicesWithCoords.length,
      sumLatitude / devicesWithCoords.length,
    ];
  }, [devices]);

  useEffect(() => {
    if (hasCenteredRef.current) {
      return;
    }

    const devicesWithCoords = (devices ?? []).filter(
      device => device.latitude != null && device.longitude != null
    );

    if (devicesWithCoords.length === 0) {
      return;
    }

    hasCenteredRef.current = true;
    cameraRef.current?.setCamera({
      centerCoordinate: mapCenter,
      zoomLevel: 15,
      animationDuration: 1000,
      animationMode: 'flyTo',
    });
  }, [devices, mapCenter]);

  const handleDetectionPress = useCallback((position: DeduplicatedPosition) => {
    setSelectedDevice(null);
    deviceSheetRef.current?.close();
    setSelectedPosition(position);
    detectionSheetRef.current?.snapToIndex(0);
  }, []);

  const handleDevicePress = useCallback((device: Device) => {
    setSelectedPosition(null);
    detectionSheetRef.current?.close();
    setSelectedDevice(device);
    deviceSheetRef.current?.snapToIndex(0);
  }, []);

  const handleCloseDetectionSheet = useCallback(() => {
    setSelectedPosition(null);
  }, []);

  const handleCloseDeviceSheet = useCallback(() => {
    setSelectedDevice(null);
  }, []);

  const selectedDevicePositions = useMemo(() => {
    if (!selectedDevice) {
      return [];
    }

    return positions.filter(position =>
      position.detectedByDeviceIds.includes(selectedDevice.id)
    );
  }, [positions, selectedDevice]);

  const sensorNamesForPosition = useMemo(() => {
    if (!selectedPosition || !devices) {
      return [];
    }

    return selectedPosition.detectedByDeviceIds
      .map(deviceId => devices.find(device => device.id === deviceId)?.name)
      .filter((name): name is string => Boolean(name));
  }, [devices, selectedPosition]);

  const mapStyle = showSatellite
    ? Mapbox.StyleURL.SatelliteStreet
    : OUTDOOR_STYLE;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        styleURL={mapStyle}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: mapCenter,
            zoomLevel: 15,
          }}
        />

        {(devices ?? [])
          .filter(device => device.latitude != null && device.longitude != null)
          .map(device => (
            <TrailSenseDeviceMarker
              key={device.id}
              id={device.id}
              coordinate={[device.longitude!, device.latitude!]}
              isOnline={device.online}
              onPress={() => handleDevicePress(device)}
            />
          ))}

        {positions.map(position => (
          <DetectedDeviceMarker
            key={position.fingerprintHash}
            id={position.fingerprintHash}
            coordinate={[position.longitude, position.latitude]}
            signalType={position.signalType}
            confidence={position.confidence}
            onPress={() => handleDetectionPress(position)}
          />
        ))}
      </MapView>

      <View style={[styles.controlsLeft, { top: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setShowSettings(true)}
        >
          <Icon name="settings-outline" size={22} color="#e8e8e0" />
        </TouchableOpacity>
      </View>

      <View style={[styles.controlsRight, { top: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setShowSatellite(value => !value)}
        >
          <Icon
            name={showSatellite ? 'map-outline' : 'earth'}
            size={22}
            color="#e8e8e0"
          />
        </TouchableOpacity>
      </View>

      <View
        style={[styles.statusChipContainer, { bottom: insets.bottom + 20 }]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fbbf24" />
        ) : (
          <StatusChip count={positions.length} />
        )}
      </View>

      {selectedPosition ? (
        <DetectionBottomSheet
          ref={detectionSheetRef}
          position={selectedPosition}
          sensorNames={sensorNamesForPosition}
          onClose={handleCloseDetectionSheet}
        />
      ) : null}

      {selectedDevice ? (
        <DeviceBottomSheet
          ref={deviceSheetRef}
          device={selectedDevice}
          positions={selectedDevicePositions}
          onClose={handleCloseDeviceSheet}
        />
      ) : null}

      <SettingsOverlay
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111210',
  },
  map: {
    flex: 1,
  },
  controlsLeft: {
    position: 'absolute',
    left: 16,
  },
  controlsRight: {
    position: 'absolute',
    right: 16,
  },
  floatingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(17, 18, 16, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(42, 42, 26, 0.6)',
  },
  statusChipContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
});

export default MapScreen;
