/**
 * AnalyticsHeaderHero - Premium time selector and stats summary
 *
 * Features:
 * - Animated time period selector with gradient backgrounds
 * - Key metrics with trend indicators
 * - Smooth transitions between periods
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Text, Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

type TimePeriod = '24h' | '7d' | '30d' | '1y';

interface AnalyticsHeaderHeroProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  stats: {
    totalDetections: number;
    activeDevices: number;
    detectionTrend: number; // percentage change
    allDevicesOnline: boolean;
  };
}

const PERIODS: { key: TimePeriod; label: string }[] = [
  { key: '24h', label: '24h' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '1y', label: '1y' },
];

export const AnalyticsHeaderHero: React.FC<AnalyticsHeaderHeroProps> = ({
  selectedPeriod,
  onPeriodChange,
  stats,
}) => {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors;

  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(
    PERIODS.reduce(
      (acc, p) => ({ ...acc, [p.key]: new Animated.Value(1) }),
      {} as Record<TimePeriod, Animated.Value>
    )
  ).current;

  // Entrance animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1,
      tension: 60,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePeriodPress = (period: TimePeriod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate the pressed button
    Animated.sequence([
      Animated.timing(scaleAnims[period], {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[period], {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    onPeriodChange(period);
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return colors.systemGreen;
    if (trend < 0) return colors.systemRed;
    return colors.secondaryLabel;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return 'trending-up';
    if (trend < 0) return 'trending-down';
    return 'remove';
  };

  return (
    <View style={styles.container}>
      {/* Time period selector */}
      <View
        style={[
          styles.periodSelector,
          {
            backgroundColor: isDark
              ? 'rgba(120, 120, 128, 0.16)'
              : 'rgba(120, 120, 128, 0.08)',
          },
        ]}
      >
        {PERIODS.map((period) => {
          const isSelected = selectedPeriod === period.key;
          return (
            <Animated.View
              key={period.key}
              style={[
                styles.periodButtonWrapper,
                { transform: [{ scale: scaleAnims[period.key] }] },
              ]}
            >
              <Pressable
                onPress={() => handlePeriodPress(period.key)}
                style={({ pressed }) => [
                  styles.periodButton,
                  isSelected && styles.periodButtonSelected,
                  isSelected && {
                    backgroundColor: colors.systemBlue,
                  },
                  pressed && !isSelected && { opacity: 0.7 },
                ]}
              >
                <Text
                  variant="subheadline"
                  style={[
                    styles.periodText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.secondaryLabel,
                    },
                  ]}
                >
                  {period.label}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Stats cards */}
      <Animated.View
        style={[
          styles.statsRow,
          {
            opacity: slideAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [15, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Total Detections */}
        <LinearGradient
          colors={
            isDark
              ? ['#1E3A5F', '#0D2137']
              : ['#E8F4FD', '#D0E8FA']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statCard, { borderColor: 'rgba(10, 132, 255, 0.25)' }]}
        >
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: 'rgba(10, 132, 255, 0.2)' },
            ]}
          >
            <Icon name="pulse" size={20} color={colors.systemBlue} />
          </View>
          <View style={styles.statContent}>
            <Text variant="caption1" color="secondaryLabel">
              Total Detections
            </Text>
            <View style={styles.statValueRow}>
              <Text
                variant="title1"
                style={{ color: colors.systemBlue, fontWeight: '700' }}
              >
                {stats.totalDetections.toLocaleString()}
              </Text>
            </View>
            <View style={styles.trendRow}>
              <Icon
                name={getTrendIcon(stats.detectionTrend) as any}
                size={12}
                color={getTrendColor(stats.detectionTrend)}
              />
              <Text
                variant="caption2"
                style={{
                  color: getTrendColor(stats.detectionTrend),
                  fontWeight: '600',
                }}
              >
                {Math.abs(stats.detectionTrend)}% vs last week
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Active Devices */}
        <LinearGradient
          colors={
            isDark
              ? ['#1A3D2E', '#0D2518']
              : ['#E6F7ED', '#CCF0DB']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statCard, { borderColor: 'rgba(48, 209, 88, 0.25)' }]}
        >
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: 'rgba(48, 209, 88, 0.2)' },
            ]}
          >
            <Icon name="radio" size={20} color={colors.systemGreen} />
          </View>
          <View style={styles.statContent}>
            <Text variant="caption1" color="secondaryLabel">
              Active Devices
            </Text>
            <View style={styles.statValueRow}>
              <Text
                variant="title1"
                style={{ color: colors.systemGreen, fontWeight: '700' }}
              >
                {stats.activeDevices}
              </Text>
            </View>
            <View style={styles.trendRow}>
              <Icon
                name={stats.allDevicesOnline ? 'checkmark-circle' : 'warning'}
                size={12}
                color={stats.allDevicesOnline ? colors.systemGreen : colors.systemYellow}
              />
              <Text
                variant="caption2"
                style={{
                  color: stats.allDevicesOnline
                    ? colors.systemGreen
                    : colors.systemYellow,
                  fontWeight: '600',
                }}
              >
                {stats.allDevicesOnline ? 'All online' : 'Some offline'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 14,
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  periodButtonWrapper: {
    flex: 1,
  },
  periodButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonSelected: {
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  periodText: {
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
    gap: 2,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
});
