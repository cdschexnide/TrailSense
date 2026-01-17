/**
 * AlertCard Component - REDESIGNED
 *
 * Compact alert card (~76px) with:
 * - Top accent bar (3px, 5px for critical) colored by threat level
 * - Critical alerts get 1px border around entire card
 * - Inline 20px icon next to detection title
 * - Single-line metadata with dot separators
 * - Staggered entrance animations
 * - Press scale feedback with haptics
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Alert } from '@types';
import { Icon, Text } from '@components/atoms';
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
  const isCritical = alert.threatLevel === 'critical';

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
          // Critical alerts get a border
          ...(isCritical && {
            borderWidth: 1,
            borderColor: threatColor,
          }),
        },
        style,
      ]}
    >
      {/* Top accent bar - 5px for critical, 3px for others */}
      <View
        style={[
          styles.topAccentBar,
          {
            backgroundColor: threatColor,
            height: isCritical ? 5 : 3,
          },
        ]}
      />

      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardContent}
        accessibilityRole="button"
        accessibilityLabel={`${alert.threatLevel} ${alert.detectionType} alert`}
      >

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
          <Text variant="caption1" color="secondaryLabel" style={styles.timestamp}>
            {formatTimestamp(alert.timestamp)}
          </Text>
        </View>

        {/* Single-line metadata with dot separators */}
        <View style={styles.metadataRow}>
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
          {/* Chevron */}
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
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  topAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  detectionTitle: {
    flex: 1,
    fontWeight: '600',
  },
  timestamp: {
    marginLeft: 'auto',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataLine: {
    flex: 1,
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
