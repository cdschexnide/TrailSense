/**
 * MapHeaderHero - Premium device selector and status bar
 *
 * Features:
 * - Device selector with live status
 * - GPS coordinates display
 * - Battery and signal indicators
 * - Map style toggle
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Text, Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface Device {
  id: string;
  name: string;
  online: boolean;
  battery: number;
  signalStrength: 'excellent' | 'good' | 'fair' | 'poor';
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface MapHeaderHeroProps {
  selectedDevice: Device | null;
  mapStyle: 'satellite' | 'standard';
  onMapStyleToggle: () => void;
  onDeviceSelect?: () => void;
}

export const MapHeaderHero: React.FC<MapHeaderHeroProps> = ({
  selectedDevice,
  mapStyle,
  onMapStyleToggle,
  onDeviceSelect,
}) => {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors;

  const handleMapStyleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMapStyleToggle();
  };

  const getSignalColor = (strength: string) => {
    switch (strength) {
      case 'excellent':
        return colors.systemGreen;
      case 'good':
        return colors.systemGreen;
      case 'fair':
        return colors.systemYellow;
      case 'poor':
        return colors.systemRed;
      default:
        return colors.systemGray;
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return colors.systemGreen;
    if (level > 20) return colors.systemYellow;
    return colors.systemRed;
  };

  const getBatteryIcon = (level: number) => {
    if (level > 75) return 'battery-full';
    if (level > 50) return 'battery-half';
    if (level > 25) return 'battery-half';
    return 'battery-dead';
  };

  if (!selectedDevice) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: isDark
                ? 'rgba(28, 28, 30, 0.8)'
                : 'rgba(242, 242, 247, 0.8)',
            },
          ]}
        >
          <Icon name="hardware-chip-outline" size={24} color={colors.tertiaryLabel} />
          <Text variant="subheadline" color="tertiaryLabel">
            No device selected
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          isDark
            ? ['rgba(28, 28, 30, 0.95)', 'rgba(28, 28, 30, 0.85)']
            : ['rgba(255, 255, 255, 0.95)', 'rgba(242, 242, 247, 0.9)']
        }
        style={styles.card}
      >
        {/* Device info row */}
        <Pressable
          onPress={onDeviceSelect}
          style={({ pressed }) => [
            styles.deviceRow,
            pressed && { opacity: 0.7 },
          ]}
        >
          <View style={styles.deviceInfo}>
            {/* Status dot */}
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: selectedDevice.online
                    ? colors.systemGreen
                    : colors.systemGray,
                },
              ]}
            />
            <View style={styles.deviceText}>
              <Text variant="headline" color="label">
                {selectedDevice.name}
              </Text>
              {selectedDevice.latitude != null && selectedDevice.longitude != null && (
                <View style={styles.locationRow}>
                  <Icon name="location" size={12} color={colors.tertiaryLabel} />
                  <Text variant="caption1" color="tertiaryLabel">
                    {selectedDevice.latitude.toFixed(6)},{' '}
                    {selectedDevice.longitude.toFixed(6)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Status badge */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: selectedDevice.online
                  ? colors.systemGreen + '20'
                  : colors.systemGray + '20',
              },
            ]}
          >
            <Text
              variant="caption2"
              style={{
                color: selectedDevice.online
                  ? colors.systemGreen
                  : colors.systemGray,
                fontWeight: '600',
                textTransform: 'uppercase',
              }}
            >
              {selectedDevice.online ? 'Online' : 'Offline'}
            </Text>
          </View>
        </Pressable>

        {/* Divider */}
        <View
          style={[
            styles.divider,
            { backgroundColor: colors.separator },
          ]}
        />

        {/* Stats row */}
        <View style={styles.statsRow}>
          {/* Battery */}
          <View style={styles.statItem}>
            <Icon
              name={getBatteryIcon(selectedDevice.battery) as any}
              size={16}
              color={getBatteryColor(selectedDevice.battery)}
            />
            <Text
              variant="caption1"
              style={{
                color: getBatteryColor(selectedDevice.battery),
                fontWeight: '600',
              }}
            >
              {selectedDevice.battery}%
            </Text>
          </View>

          {/* Signal */}
          <View style={styles.statItem}>
            <Icon
              name="cellular"
              size={16}
              color={getSignalColor(selectedDevice.signalStrength)}
            />
            <Text
              variant="caption1"
              style={{
                color: getSignalColor(selectedDevice.signalStrength),
                fontWeight: '600',
                textTransform: 'capitalize',
              }}
            >
              {selectedDevice.signalStrength}
            </Text>
          </View>

          {/* Map style toggle */}
          <Pressable
            onPress={handleMapStyleToggle}
            style={({ pressed }) => [
              styles.mapStyleButton,
              {
                backgroundColor: isDark
                  ? 'rgba(120, 120, 128, 0.24)'
                  : 'rgba(120, 120, 128, 0.12)',
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Icon
              name={mapStyle === 'satellite' ? 'globe-outline' : 'map-outline'}
              size={14}
              color={colors.systemBlue}
            />
            <Text
              variant="caption2"
              style={{
                color: colors.systemBlue,
                fontWeight: '600',
              }}
            >
              {mapStyle === 'satellite' ? 'Satellite' : 'Standard'}
            </Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  deviceText: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mapStyleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 'auto',
  },
});
