/**
 * DeviceCard Component - REDESIGNED
 *
 * Enhanced device status card with:
 * - Status-based background tinting (green=online, red=offline)
 * - Animated status indicator with pulsing glow
 * - Color-coded battery and signal indicators
 * - Staggered entrance animations
 * - Press scale feedback with haptics
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Device } from '@types';
import { Icon, Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import {
  getBatteryColor,
  getSignalColor,
  getSignalStrengthCategory,
} from '@utils/visualEffects';

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
 * Get battery icon based on level
 */
const getBatteryIcon = (level: number): string => {
  if (level >= 80) return 'battery-full';
  if (level >= 50) return 'battery-half';
  if (level >= 20) return 'battery-charging';
  return 'battery-dead';
};

/**
 * Get signal icon based on strength
 */
const getSignalIcon = (strength: string | undefined): string => {
  const category = getSignalStrengthCategory(strength);
  switch (category) {
    case 'excellent':
    case 'good':
      return 'cellular';
    case 'fair':
      return 'cellular';
    case 'poor':
      return 'cellular-outline';
    default:
      return 'cellular-outline';
  }
};

/**
 * Simple status dot component with optional pulse animation
 */
const StatusDot: React.FC<{
  isOnline: boolean;
  pulse?: boolean;
}> = ({ isOnline, pulse = false }) => {
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

  const color = isOnline ? '#30D158' : '#FF453A';

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
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

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

  // Get battery level and color
  const batteryLevel = device.batteryPercent || device.battery || 0;
  const batteryColor = getBatteryColor(batteryLevel);

  // Get signal strength and color
  const signalStrength = device.signalStrength || 'N/A';
  const signalCategory = getSignalStrengthCategory(signalStrength);
  const signalColor = getSignalColor(signalCategory);

  // Background color based on online/offline status
  const cardBackgroundColor = useMemo(() => {
    if (device.online) {
      return isDark ? 'rgba(48, 209, 88, 0.08)' : 'rgba(52, 199, 89, 0.06)';
    }
    return isDark ? 'rgba(255, 69, 58, 0.10)' : 'rgba(255, 59, 48, 0.08)';
  }, [device.online, isDark]);

  // Border color based on status
  const borderColor = useMemo(() => {
    if (device.online) {
      return isDark ? 'rgba(48, 209, 88, 0.25)' : 'rgba(52, 199, 89, 0.20)';
    }
    return isDark ? 'rgba(255, 69, 58, 0.30)' : 'rgba(255, 59, 48, 0.25)';
  }, [device.online, isDark]);

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
            <StatusDot isOnline={device.online} pulse={device.online} />
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

        {/* Enhanced Stats grid (3 columns) */}
        <View
          style={[
            styles.statsGrid,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.03)',
            },
          ]}
        >
          {/* Battery */}
          <View style={styles.statColumn}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${batteryColor}20` },
              ]}
            >
              <Icon
                name={getBatteryIcon(batteryLevel) as any}
                size={24}
                color={batteryColor}
              />
            </View>
            <Text
              variant="title3"
              style={[
                styles.statValue,
                { color: batteryLevel <= 20 ? batteryColor : theme.colors.label },
              ]}
            >
              {batteryLevel}%
            </Text>
            <Text variant="caption2" color="secondaryLabel">
              Battery
            </Text>
          </View>

          {/* Divider */}
          <View
            style={[styles.divider, { backgroundColor: theme.colors.separator }]}
          />

          {/* Signal */}
          <View style={styles.statColumn}>
            <View
              style={[styles.iconCircle, { backgroundColor: `${signalColor}20` }]}
            >
              <Icon
                name={getSignalIcon(signalStrength) as any}
                size={24}
                color={signalColor}
              />
            </View>
            <Text variant="title3" style={styles.statValue} color="label">
              {signalStrength}
            </Text>
            <Text variant="caption2" color="secondaryLabel">
              Signal
            </Text>
          </View>

          {/* Divider */}
          <View
            style={[styles.divider, { backgroundColor: theme.colors.separator }]}
          />

          {/* Detections */}
          <View style={styles.statColumn}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${theme.colors.systemBlue}20` },
              ]}
            >
              <Icon name="eye" size={24} color={theme.colors.systemBlue} />
            </View>
            <Text variant="title3" style={styles.statValue} color="label">
              {device.detectionCount || 0}
            </Text>
            <Text variant="caption2" color="secondaryLabel">
              Detections
            </Text>
          </View>
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
              {device.latitude?.toFixed(4) || 'N/A'},{' '}
              {device.longitude?.toFixed(4) || 'N/A'}
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
  statsGrid: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '700',
    fontSize: 18,
  },
  divider: {
    width: 1,
    marginVertical: 8,
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
