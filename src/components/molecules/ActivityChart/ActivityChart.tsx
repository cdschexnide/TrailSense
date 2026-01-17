/**
 * ActivityChart Component
 *
 * Simple bar chart showing detection activity over time.
 * Uses native Views for reliable rendering without Skia dependencies.
 * Tesla/Rivian dashboard aesthetic for the Alerts hero section.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@hooks/useTheme';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ActivityChartProps {
  /** Array of detection counts (e.g., 24 hourly values) */
  data: number[];
  /** Chart height in pixels. Default: 80 */
  height?: number;
  /** Callback when a segment is pressed */
  onSegmentPress?: (index: number) => void;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({
  data,
  height = 80,
  onSegmentPress: _onSegmentPress,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const chartWidth = SCREEN_WIDTH - 32; // 16px margin on each side

  // Calculate bar heights
  const bars = useMemo(() => {
    if (!data || data.length === 0) return [];

    const maxValue = Math.max(...data, 1); // Avoid division by zero
    const barWidth = (chartWidth - (data.length - 1) * 2) / data.length; // 2px gap between bars

    return data.map((value, index) => ({
      height: Math.max(4, (value / maxValue) * (height - 8)), // Min 4px height, 8px padding
      width: barWidth,
      index,
    }));
  }, [data, chartWidth, height]);

  // Empty state
  if (!data || data.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.emptyState,
          { backgroundColor: colors.systemGray5, height },
        ]}
      />
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.chartArea}>
        {bars.map((bar) => (
          <View
            key={bar.index}
            style={[styles.barContainer, { width: bar.width, height: height - 8 }]}
          >
            <LinearGradient
              colors={[`${colors.brandAccent}CC`, `${colors.brandAccent}33`]}
              style={[
                styles.bar,
                {
                  height: bar.height,
                  width: bar.width,
                },
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: 2,
  },
  barContainer: {
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 2,
  },
  emptyState: {
    // Gray background for empty state is applied via inline style
  },
});

export default ActivityChart;
