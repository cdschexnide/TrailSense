// src/components/organisms/HeaderHero/AlertsHeaderHero.tsx
/**
 * AlertsHeaderHero - Tesla Dashboard Style
 *
 * Activity area chart showing detection volume over 24h,
 * with filter chips below for threat level filtering.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ActivityChart } from '@components/molecules/ActivityChart';
import { InlineFilterBar } from '@components/molecules/InlineFilterBar';
import { useTheme } from '@hooks/useTheme';
import { ThreatLevel, Alert } from '@types';

interface AlertsHeaderHeroProps {
  threatCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  selectedFilter: ThreatLevel | null;
  onFilterSelect: (level: ThreatLevel | null) => void;
  alerts?: Alert[];
  scrollY?: Animated.Value;
}

export const AlertsHeaderHero: React.FC<AlertsHeaderHeroProps> = ({
  threatCounts,
  selectedFilter,
  onFilterSelect,
  alerts = [],
  scrollY,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  // Generate 24-hour activity data from alerts
  const activityData = useMemo(() => {
    const hourlyData = new Array(24).fill(0);
    const now = new Date();

    alerts.forEach((alert) => {
      const alertTime = new Date(alert.timestamp);
      const hoursAgo = Math.floor(
        (now.getTime() - alertTime.getTime()) / (1000 * 60 * 60)
      );

      if (hoursAgo >= 0 && hoursAgo < 24) {
        hourlyData[23 - hoursAgo]++;
      }
    });

    return hourlyData;
  }, [alerts]);

  const filterOptions = [
    {
      key: 'critical',
      label: 'Critical',
      count: threatCounts.critical,
      color: colors.systemRed,
    },
    {
      key: 'high',
      label: 'High',
      count: threatCounts.high,
      color: colors.systemOrange,
    },
    {
      key: 'medium',
      label: 'Medium',
      count: threatCounts.medium,
      color: colors.systemYellow,
    },
    {
      key: 'low',
      label: 'Low',
      count: threatCounts.low,
      color: colors.systemGreen,
    },
  ];

  // Collapse animation based on scroll
  const chartHeight = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [80, 0],
        extrapolate: 'clamp',
      })
    : 80;

  const chartOpacity = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      })
    : 1;

  return (
    <View style={styles.container}>
      {/* Activity Chart - collapses on scroll */}
      <Animated.View
        style={[
          styles.chartContainer,
          {
            height: chartHeight,
            opacity: chartOpacity,
          },
        ]}
      >
        <ActivityChart data={activityData} height={80} />
      </Animated.View>

      {/* Filter Chips */}
      <InlineFilterBar
        options={filterOptions}
        selectedKey={selectedFilter}
        onSelect={(key) => onFilterSelect(key as ThreatLevel | null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  chartContainer: {
    overflow: 'hidden',
    marginBottom: 8,
  },
});

export default AlertsHeaderHero;
