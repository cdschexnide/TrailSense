import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { Device } from '@types';
import { isDeviceOnline } from '@utils/dateUtils';

interface MiniPropertyMapProps {
  devices: Device[];
  onPress: () => void;
}

function buildStaticMapUrl(devices: Device[]): string | null {
  const devicesWithCoords = devices.filter(
    device =>
      typeof device.latitude === 'number' &&
      typeof device.longitude === 'number'
  );

  const token =
    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN ||
    '';
  if (devicesWithCoords.length === 0 || !token) {
    return null;
  }

  const lats = devicesWithCoords.map(device => device.latitude as number);
  const lngs = devicesWithCoords.map(device => device.longitude as number);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

  const pins = devicesWithCoords
    .map(device => {
      const color = isDeviceOnline(device.lastSeen) ? '5A8A5A' : '7A7A70';
      return `pin-s+${color}(${device.longitude},${device.latitude})`;
    })
    .join(',');

  return `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/${pins}/${centerLng},${centerLat},14,0/370x180@2x?access_token=${token}`;
}

export const MiniPropertyMap: React.FC<MiniPropertyMapProps> = ({
  devices,
  onPress,
}) => {
  const { theme } = useTheme();
  const mapUrl = buildStaticMapUrl(devices);
  const devicesWithCoords = devices.filter(
    device =>
      typeof device.latitude === 'number' &&
      typeof device.longitude === 'number'
  );

  return (
    <Pressable
      style={[
        styles.container,
        { backgroundColor: theme.colors.secondarySystemBackground },
      ]}
      onPress={onPress}
    >
      {mapUrl ? (
        <Image
          source={{ uri: mapUrl }}
          style={styles.mapImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <Icon name="map-outline" size={32} color="tertiaryLabel" />
          <Text variant="footnote" color="tertiaryLabel">
            {devicesWithCoords.length === 0
              ? 'No device locations available'
              : 'Map preview unavailable'}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text variant="footnote" color="secondaryLabel" weight="medium">
          {devicesWithCoords.length} device
          {devicesWithCoords.length === 1 ? '' : 's'} on map
        </Text>
        <Text variant="footnote" color="secondaryLabel">
          View Full Map
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: 180,
  },
  placeholder: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

export default MiniPropertyMap;
