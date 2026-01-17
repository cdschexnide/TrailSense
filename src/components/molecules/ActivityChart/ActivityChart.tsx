/**
 * ActivityChart Component
 *
 * Area chart with gradient fill showing detection activity over time.
 * Uses @shopify/react-native-skia for smooth rendering.
 * Tesla/Rivian dashboard aesthetic for the Alerts hero section.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Path,
  LinearGradient,
  Skia,
  vec,
} from '@shopify/react-native-skia';
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

/**
 * Converts a hex color to rgba format with specified opacity
 */
const hexToRgba = (hex: string, opacity: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return hex;
};

export const ActivityChart: React.FC<ActivityChartProps> = ({
  data,
  height = 80,
  onSegmentPress: _onSegmentPress,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const chartWidth = SCREEN_WIDTH - 32; // 16px margin on each side

  // Generate smooth path from data points
  const { areaPath, strokePath } = useMemo(() => {
    if (!data || data.length === 0) {
      return { areaPath: null, strokePath: null };
    }

    const maxValue = Math.max(...data, 1); // Avoid division by zero
    const pointSpacing = chartWidth / (data.length - 1 || 1);
    const padding = 4; // Small padding from edges

    // Calculate points
    const points = data.map((value, index) => ({
      x: index * pointSpacing,
      y: padding + (height - padding * 2) * (1 - value / maxValue),
    }));

    // Create smooth bezier curve path for stroke
    const strokePathObj = Skia.Path.Make();
    if (points.length > 0) {
      strokePathObj.moveTo(points[0].x, points[0].y);

      // Use quadratic bezier curves for smoothness
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpx = (prev.x + curr.x) / 2;
        strokePathObj.quadTo(prev.x, prev.y, cpx, (prev.y + curr.y) / 2);
      }
      // Connect to the last point
      if (points.length > 1) {
        const last = points[points.length - 1];
        strokePathObj.lineTo(last.x, last.y);
      }
    }

    // Create area path (closed shape for gradient fill)
    const areaPathObj = Skia.Path.Make();
    if (points.length > 0) {
      // Start from bottom-left
      areaPathObj.moveTo(0, height);
      // Line to first point
      areaPathObj.lineTo(points[0].x, points[0].y);

      // Smooth curve through all points
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpx = (prev.x + curr.x) / 2;
        areaPathObj.quadTo(prev.x, prev.y, cpx, (prev.y + curr.y) / 2);
      }
      // Connect to the last point
      if (points.length > 1) {
        const last = points[points.length - 1];
        areaPathObj.lineTo(last.x, last.y);
      }

      // Close the path at the bottom
      areaPathObj.lineTo(chartWidth, height);
      areaPathObj.lineTo(0, height);
      areaPathObj.close();
    }

    return { areaPath: areaPathObj, strokePath: strokePathObj };
  }, [data, chartWidth, height]);

  // Empty state
  if (!data || data.length === 0 || !areaPath || !strokePath) {
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

  // Get gradient colors
  const brandAccentColor = colors.brandAccent;
  const gradientTopColor = hexToRgba(brandAccentColor, 0.6);
  const gradientBottomColor = hexToRgba(brandAccentColor, 0.05);

  return (
    <View style={[styles.container, { height }]}>
      <Canvas style={[styles.canvas, { width: chartWidth, height }]}>
        {/* Area fill with gradient */}
        <Path path={areaPath}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, height)}
            colors={[gradientTopColor, gradientBottomColor]}
          />
        </Path>

        {/* Stroke line at top of area */}
        <Path
          path={strokePath}
          style="stroke"
          strokeWidth={2}
          color={brandAccentColor}
          strokeCap="round"
          strokeJoin="round"
        />
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
  },
  emptyState: {
    // Gray background for empty state is applied via inline style
  },
});

export default ActivityChart;
