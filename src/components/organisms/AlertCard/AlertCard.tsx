/**
 * AlertCard Component - REDESIGNED
 *
 * Enhanced alert card with:
 * - Threat-level background tinting
 * - Pulsing animation for critical alerts
 * - Signal strength interpretation
 * - Enhanced visual hierarchy
 * - Staggered entrance animations
 * - Press scale feedback with haptics
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Alert, ThreatLevel } from '@types';
import { Badge, Icon, Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { formatTimestamp } from '@utils/dateUtils';
import { interpretRSSI, getThreatColor } from '@utils/visualEffects';

interface AlertCardProps {
  alert: Alert;
  onPress?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  onWhitelist?: (macAddress: string) => void;
  style?: ViewStyle;
  /** Index for staggered entrance animation */
  index?: number;
  /** Enable entrance animation */
  animateEntrance?: boolean;
}

/**
 * Get threat stripe width based on severity
 */
const getThreatStripeWidth = (threatLevel: ThreatLevel) => {
  const widths = {
    critical: 5,
    high: 4,
    medium: 4,
    low: 3,
  };
  return widths[threatLevel] || 3;
};

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
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

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

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDismiss?.(alert.id);
  };

  const handleWhitelist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onWhitelist?.(alert.macAddress);
  };

  // Get detection config
  const detectionConfig = getDetectionConfig(alert.detectionType, theme);

  // Get RSSI interpretation
  const rssiInfo = interpretRSSI(alert.rssi);

  // Get threat color and stripe width
  const threatColor = getThreatColor(alert.threatLevel);
  const stripeWidth = getThreatStripeWidth(alert.threatLevel);

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
      {/* Left threat stripe indicator */}
      <View
        style={[
          styles.threatStripe,
          {
            backgroundColor: threatColor,
            width: stripeWidth,
          },
        ]}
      />

      {/* Pulse glow for critical alerts */}
      {alert.threatLevel === 'critical' && (
        <Animated.View
          style={[
            styles.threatStripe,
            {
              backgroundColor: threatColor,
              width: stripeWidth + 4,
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
          {/* Detection icon with colored background */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${detectionConfig.color}20` },
            ]}
          >
            <Icon
              name={detectionConfig.icon as any}
              size={28}
              color={detectionConfig.color}
            />
          </View>

          <View style={styles.detectionContent}>
            <Text variant="headline" color="label" style={styles.detectionTitle}>
              {detectionConfig.label}
            </Text>

            {/* Metadata */}
            <View style={styles.metadata}>
              {/* Signal strength with interpretation */}
              <View style={styles.metadataRow}>
                <Icon name="cellular" size={14} color={rssiInfo.color} />
                <Text
                  variant="subheadline"
                  color="secondaryLabel"
                  style={styles.metadataText}
                >
                  {alert.rssi} dBm
                </Text>
                <View
                  style={[
                    styles.signalBadge,
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
              </View>

              {/* Device */}
              <View style={styles.metadataRow}>
                <Icon
                  name="hardware-chip-outline"
                  size={14}
                  color={theme.colors.secondaryLabel}
                />
                <Text
                  variant="subheadline"
                  color="secondaryLabel"
                  style={styles.metadataText}
                >
                  {alert.deviceId}
                </Text>
              </View>

              {/* MAC Address */}
              {alert.macAddress && (
                <View style={styles.metadataRow}>
                  <Icon
                    name="finger-print-outline"
                    size={14}
                    color={theme.colors.secondaryLabel}
                  />
                  <Text
                    variant="caption1"
                    color="tertiaryLabel"
                    style={[styles.metadataText, styles.macAddress]}
                  >
                    {alert.macAddress}
                  </Text>
                </View>
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

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={handleWhitelist}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 159, 10, 0.15)'
                  : 'rgba(255, 149, 0, 0.12)',
                borderColor: theme.colors.systemOrange,
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Icon
              name="shield-checkmark"
              size={18}
              color={theme.colors.systemOrange}
            />
            <Text
              variant="caption1"
              style={{ color: theme.colors.systemOrange, fontWeight: '600' }}
            >
              Whitelist
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 69, 58, 0.15)'
                  : 'rgba(255, 59, 48, 0.12)',
                borderColor: theme.colors.systemRed,
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Icon name="trash-outline" size={18} color={theme.colors.systemRed} />
            <Text
              variant="caption1"
              style={{ color: theme.colors.systemRed, fontWeight: '600' }}
            >
              Delete
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  threatStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    paddingLeft: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  detectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detectionContent: {
    flex: 1,
  },
  detectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  metadata: {
    gap: 6,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    marginLeft: 2,
  },
  signalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  macAddress: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
});

export default AlertCard;
