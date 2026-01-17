/**
 * AlertCard Component - REDESIGNED
 *
 * Compact alert card with:
 * - Top accent bar (3px) colored by threat level
 * - Inline 20px icon next to detection title
 * - Single-line metadata with dot separators (rssi · proximity · device · mac)
 * - Pulsing animation for critical alerts
 * - Signal strength interpretation
 * - Staggered entrance animations
 * - Press scale feedback with haptics
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Alert } from '@types';
import { Badge, Icon, Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { formatTimestamp } from '@utils/dateUtils';
import { interpretRSSI, getThreatColor } from '@utils/visualEffects';

interface AlertCardProps {
  alert: Alert;
  onPress?: (alertId: string) => void;
  /** Used by parent swipeable wrapper for swipe-to-dismiss action */
  onDismiss?: (alertId: string) => void;
  /** Used by parent swipeable wrapper for swipe-to-whitelist action */
  onWhitelist?: (macAddress: string) => void;
  style?: ViewStyle;
  /** Index for staggered entrance animation */
  index?: number;
  /** Enable entrance animation */
  animateEntrance?: boolean;
}

/**
 * Get detection icon and color
 */
const getDetectionConfig = (type: string, theme: any) => {
  switch (type) {
    case 'cellular':
      return {
        icon: 'cellular',
        color: theme.colors.systemPurple,
        label: 'Cellular Detection',
      };
    case 'wifi':
      return {
        icon: 'wifi',
        color: theme.colors.systemBlue,
        label: 'WiFi Detection',
      };
    case 'bluetooth':
      return {
        icon: 'bluetooth',
        color: theme.colors.systemTeal,
        label: 'Bluetooth Detection',
      };
    default:
      return {
        icon: 'radio',
        color: theme.colors.systemGray,
        label: 'Detection',
      };
  }
};

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onPress,
  onDismiss,
  onWhitelist,
  style,
  index = 0,
  animateEntrance = true,
}) => {
  const { theme } = useTheme();

  // Animation values using React Native's built-in Animated API
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(animateEntrance ? 0 : 1)).current;
  const translateXAnim = useRef(new Animated.Value(animateEntrance ? 30 : 0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Entrance animation
  useEffect(() => {
    if (animateEntrance) {
      const delay = index * 60; // 60ms stagger for alerts

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(translateXAnim, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      }, delay);
    }
  }, [animateEntrance, index]);

  // Pulse animation for critical alerts
  useEffect(() => {
    if (alert.threatLevel === 'critical') {
      pulseAnimRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimRef.current.start();
    } else {
      pulseAnimRef.current?.stop();
      pulseAnim.setValue(0);
    }

    return () => {
      pulseAnimRef.current?.stop();
    };
  }, [alert.threatLevel]);

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
    onPress?.(alert.id);
  };

  // Get detection config
  const detectionConfig = getDetectionConfig(alert.detectionType, theme);

  // Get RSSI interpretation
  const rssiInfo = interpretRSSI(alert.rssi);

  // Get threat color
  const threatColor = getThreatColor(alert.threatLevel);

  // Interpolate pulse opacity
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.secondarySystemBackground,
          opacity: opacityAnim,
          transform: [
            { translateX: translateXAnim },
            { scale: scaleAnim },
          ],
        },
        style,
      ]}
    >
      {/* Top accent bar */}
      <View
        style={[
          styles.topAccentBar,
          {
            backgroundColor: threatColor,
          },
        ]}
      />

      {/* Pulse glow for critical alerts */}
      {alert.threatLevel === 'critical' && (
        <Animated.View
          style={[
            styles.topAccentBar,
            {
              backgroundColor: threatColor,
              height: 7,
              opacity: pulseOpacity,
            },
          ]}
          pointerEvents="none"
        />
      )}

      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardContent}
        accessibilityRole="button"
        accessibilityLabel={`${alert.threatLevel} ${alert.detectionType} alert`}
      >

        {/* Header: Badge + Timestamp */}
        <View style={styles.header}>
          <Badge variant={alert.threatLevel as any} size="sm">
            {alert.threatLevel.toUpperCase()}
          </Badge>
          <Text variant="caption1" color="secondaryLabel">
            {formatTimestamp(alert.timestamp)}
          </Text>
        </View>

        {/* Detection info */}
        <View style={styles.detectionRow}>
          <View style={styles.detectionContent}>
            {/* Title row with inline icon */}
            <View style={styles.titleRow}>
              <Icon
                name={detectionConfig.icon as any}
                size={20}
                color={detectionConfig.color}
              />
              <Text variant="headline" color="label" style={styles.detectionTitle}>
                {detectionConfig.label}
              </Text>
            </View>

            {/* Single-line metadata with dot separators */}
            <View style={styles.metadataLine}>
              <Text variant="caption1" color="secondaryLabel">
                {alert.rssi} dBm
              </Text>
              <Text variant="caption1" color="secondaryLabel" style={styles.dotSeparator}>
                {' · '}
              </Text>
              <View
                style={[
                  styles.proximityPill,
                  { backgroundColor: `${rssiInfo.color}20` },
                ]}
              >
                <Text
                  variant="caption2"
                  style={{ color: rssiInfo.color, fontWeight: '600' }}
                >
                  {rssiInfo.label}
                </Text>
              </View>
              <Text variant="caption1" color="secondaryLabel" style={styles.dotSeparator}>
                {' · '}
              </Text>
              <Text variant="caption1" color="secondaryLabel">
                {alert.deviceId}
              </Text>
              {alert.macAddress && (
                <>
                  <Text variant="caption1" color="secondaryLabel" style={styles.dotSeparator}>
                    {' · '}
                  </Text>
                  <Text variant="caption1" color="secondaryLabel" style={styles.macSuffix}>
                    {alert.macAddress.slice(-5).replace(':', '').toLowerCase()}
                  </Text>
                </>
              )}
              {alert.metadata?.signalCount && (
                <>
                  <Text variant="caption1" color="secondaryLabel" style={styles.dotSeparator}>
                    {' · '}
                  </Text>
                  <Text variant="caption1" color="secondaryLabel">
                    {alert.metadata.signalCount}x
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Chevron */}
          <Icon
            name="chevron-forward"
            size={20}
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  topAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    paddingTop: 16, // Extra padding to account for top accent bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  detectionContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detectionTitle: {
    fontWeight: '600',
  },
  metadataLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dotSeparator: {
    opacity: 0.6,
  },
  proximityPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  macSuffix: {
    fontFamily: 'monospace',
  },
});

export default AlertCard;
