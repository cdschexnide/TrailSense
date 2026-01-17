/**
 * DeviceCard Component
 *
 * Clean device status card with:
 * - Neutral background (Apple-native polish)
 * - Animated status indicator with pulsing glow
 * - Simplified inline stats row
 * - Staggered entrance animations
 * - Press scale feedback with haptics
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Device } from '@types';
import { Icon, Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface DeviceCardProps {
  device: Device;
  onPress?: (deviceId: string) => void;
  style?: ViewStyle;
  /** Index for staggered entrance animation */
  index?: number;
  /** Enable entrance animation */
  animateEntrance?: boolean;
}

/**
 * Format coordinates in user-friendly format (e.g., "31.5308°N, 110.2878°W")
 */
const formatCoordinates = (lat?: number, lon?: number): string => {
  if (lat === undefined || lon === undefined || lat === null || lon === null) {
    return 'Awaiting GPS fix...';
  }
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
};

/**
 * Simple status dot component with optional pulse animation
 */
const StatusDot: React.FC<{
  isOnline: boolean;
  pulse?: boolean;
  onlineColor: string;
  offlineColor: string;
}> = ({ isOnline, pulse = false, onlineColor, offlineColor }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (pulse && isOnline) {
      const animation = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.8,
              duration: 1000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacityAnim, {
              toValue: 0,
              duration: 1000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacityAnim, {
              toValue: 0.4,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [pulse, isOnline]);

  const color = isOnline ? onlineColor : offlineColor;

  return (
    <View style={statusDotStyles.container}>
      {/* Pulse ring */}
      {pulse && isOnline && (
        <Animated.View
          style={[
            statusDotStyles.pulseRing,
            {
              backgroundColor: color,
              opacity: pulseOpacityAnim,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}
      {/* Main dot */}
      <View style={[statusDotStyles.dot, { backgroundColor: color }]} />
    </View>
  );
};

const statusDotStyles = StyleSheet.create({
  container: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onPress,
  style,
  index = 0,
  animateEntrance = true,
}) => {
  const { theme } = useTheme();

  // Animation values using React Native's built-in Animated API
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(animateEntrance ? 0 : 1)).current;
  const translateYAnim = useRef(new Animated.Value(animateEntrance ? 20 : 0)).current;

  // Entrance animation
  useEffect(() => {
    if (animateEntrance) {
      const delay = index * 50; // 50ms stagger

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      }, delay);
    }
  }, [animateEntrance, index]);

  // Press handlers
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 8,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(device.id);
  };

  // Get battery level and signal strength
  const batteryLevel = device.batteryPercent || device.battery || 0;
  const signalStrength = device.signalStrength || 'N/A';

  // Neutral card background
  const cardBackgroundColor = useMemo(() => {
    return theme.colors.secondarySystemBackground;
  }, [theme.colors.secondarySystemBackground]);

  // Neutral border color
  const borderColor = useMemo(() => {
    return theme.colors.separator;
  }, [theme.colors.separator]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: cardBackgroundColor,
          borderColor: borderColor,
          borderWidth: 1,
          opacity: opacityAnim,
          transform: [
            { translateY: translateYAnim },
            { scale: scaleAnim },
          ],
        },
        style,
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${device.name}, ${device.online ? 'online' : 'offline'}`}
      >
        {/* Header row: Status indicator + Device name + Status label */}
        <View style={styles.header}>
          <View style={styles.nameRow}>
            <StatusDot
              isOnline={device.online}
              pulse={device.online}
              onlineColor={theme.colors.systemGreen}
              offlineColor={theme.colors.systemRed}
            />
            <View style={styles.nameContainer}>
              <Text variant="headline" color="label" style={styles.deviceName}>
                {device.name}
              </Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <Text
              variant="caption2"
              style={[
                styles.statusText,
                {
                  color: device.online
                    ? theme.colors.systemGreen
                    : theme.colors.systemRed,
                },
              ]}
            >
              {device.online ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>
        </View>

        {/* Stats row - simplified */}
        <View style={styles.statsRow}>
          <Text variant="subheadline" color="secondaryLabel">
            {batteryLevel}%
          </Text>
          <Text variant="subheadline" color="tertiaryLabel"> · </Text>
          <Text variant="subheadline" color="secondaryLabel">
            {signalStrength}
          </Text>
          <Text variant="subheadline" color="tertiaryLabel"> · </Text>
          <Text variant="subheadline" color="secondaryLabel">
            {(device.detectionCount || 0).toLocaleString()}
          </Text>
        </View>

        {/* Location row with chevron */}
        <View style={styles.locationRow}>
          <View style={styles.locationLeft}>
            <Icon name="location" size={16} color={theme.colors.systemBlue} />
            <Text
              variant="caption1"
              color="secondaryLabel"
              style={styles.locationText}
            >
              {formatCoordinates(device.latitude, device.longitude)}
              {!device.online && device.latitude != null && ' (Last known)'}
            </Text>
          </View>
          <Icon
            name="chevron-forward"
            size={18}
            color={theme.colors.tertiaryLabel}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  nameContainer: {
    flex: 1,
  },
  deviceName: {
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  statusText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontFamily: 'monospace',
  },
});

export default DeviceCard;
