/**
 * DeviceCard Component - Tesla Dashboard Style
 *
 * Clean device card with:
 * - Name + status dot on top line
 * - Status + last seen on second line
 * - Horizontal metrics bar (signal | alerts | location)
 * - Glow effect for offline devices
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Device } from '@types';
import { Text } from '@components/atoms';
import { MetricsBar } from '@components/molecules/MetricsBar';
import { GlowContainer } from '@components/molecules/GlowContainer';
import { useTheme } from '@hooks/useTheme';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { isDeviceOnline } from '@utils/dateUtils';

interface DeviceCardProps {
  device: Device;
  onPress?: (deviceId: string) => void;
  style?: ViewStyle;
  index?: number;
  animateEntrance?: boolean;
}

const formatLastSeen = (lastSeen?: string): string => {
  if (!lastSeen) return 'Never';

  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString();
};

const formatCoordinate = (lat?: number, lon?: number): string => {
  if (lat == null || lon == null) return '--';
  return `${Math.abs(lat).toFixed(2)}°`;
};

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onPress,
  style,
  index = 0,
  animateEntrance = true,
}) => {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  const colors = theme.colors;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(
    new Animated.Value(animateEntrance ? 0 : 1)
  ).current;
  const translateYAnim = useRef(
    new Animated.Value(animateEntrance ? 20 : 0)
  ).current;

  useEffect(() => {
    if (animateEntrance && !reduceMotion) {
      const delay = index * 50;

      const timeout = setTimeout(() => {
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

      return () => clearTimeout(timeout);
    }

    opacityAnim.setValue(1);
    translateYAnim.setValue(0);
    return undefined;
  }, [animateEntrance, index, opacityAnim, reduceMotion, translateYAnim]);

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

  const signalStrength = device.signalStrength || '--';
  // Calculate online status from lastSeen timestamp (online if seen within 5 minutes)
  const isOnline = isDeviceOnline(device.lastSeen);

  // Capitalize signal strength value
  const capitalizeSignal = (value: string | number): string => {
    if (typeof value === 'number') return `${value}%`;
    if (value === '--') return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  // Note: Battery removed - not measurable with 5V regulator hardware
  const metrics = [
    { value: capitalizeSignal(signalStrength), label: 'Signal' },
    {
      value: (device.alertCount || 0).toLocaleString(),
      label: 'Alerts',
    },
    {
      value: formatCoordinate(device.latitude, device.longitude),
      label: 'Loc',
    },
  ];

  const cardContent = (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.separator,
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${device.name}, ${isOnline ? 'online' : 'offline'}`}
      >
        {/* Header: Name + Status Dot */}
        <View style={styles.header}>
          <Text variant="caption1" tactical color="label" style={styles.name}>
            {device.name}
          </Text>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isOnline
                  ? colors.systemGreen
                  : colors.systemRed,
              },
            ]}
          />
        </View>

        {/* Status + Last Seen */}
        <Text
          variant="caption1"
          tactical
          color="secondaryLabel"
          style={styles.statusLine}
        >
          {isOnline ? 'Online' : 'Offline'} · {formatLastSeen(device.lastSeen)}
        </Text>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.separator }]} />

        {/* Metrics Bar */}
        <MetricsBar metrics={metrics} />
      </Pressable>
    </Animated.View>
  );

  // Wrap offline devices with glow
  if (!isOnline) {
    return (
      <GlowContainer
        glowColor={colors.systemRed}
        intensity="subtle"
        pulse={false}
        style={StyleSheet.flatten([styles.glowWrapper, style])}
      >
        {cardContent}
      </GlowContainer>
    );
  }

  return <View style={[styles.cardWrapper, style]}>{cardContent}</View>;
};

const styles = StyleSheet.create({
  glowWrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
  },
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    borderRadius: 10,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLine: {
    marginTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
});

export default DeviceCard;
