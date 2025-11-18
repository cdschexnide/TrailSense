import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Detection, ThreatLevel } from '@types';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface RadarDisplayProps {
  detections: Detection[];
  maxRange?: number; // Default 800ft
  showSweep?: boolean; // Default true
  style?: ViewStyle;
}

/**
 * Component for individual legend items
 */
const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text variant="caption1" color="secondaryLabel">
      {label}
    </Text>
  </View>
);

export const RadarDisplay: React.FC<RadarDisplayProps> = ({
  detections,
  maxRange = 800,
  showSweep = true,
  style,
}) => {
  const { theme } = useTheme();
  const size = 350;
  const center = size / 2;

  // Threat level colors using theme
  const threatColors = {
    critical: theme.colors.systemRed,
    high: theme.colors.systemOrange,
    medium: theme.colors.systemYellow,
    low: theme.colors.systemGreen,
  };

  const getThreatColor = (threatLevel: ThreatLevel): string => {
    switch (threatLevel) {
      case 'critical':
        return threatColors.critical;
      case 'high':
        return threatColors.high;
      case 'medium':
        return threatColors.medium;
      case 'low':
        return threatColors.low;
      default:
        return theme.colors.systemGray;
    }
  };

  const getThreatSize = (threatLevel: ThreatLevel): number => {
    switch (threatLevel) {
      case 'critical':
        return 12;
      case 'high':
        return 10;
      case 'medium':
        return 9;
      case 'low':
        return 8;
      default:
        return 8;
    }
  };

  // Radar sweep animation using React Native's built-in Animated API
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Calculate sweep color with opacity
  const sweepColor = theme.colors.systemGreen.replace('rgb', 'rgba').replace(')', ', 0.2)');

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.secondarySystemBackground,
            borderColor: theme.colors.separator,
          },
        ]}
      >
        <Svg width={size} height={size}>
          {/* Concentric circles for range */}
          <Circle
            cx={center}
            cy={center}
            r={140}
            stroke={theme.colors.separator}
            strokeWidth={1}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={105}
            stroke={theme.colors.separator}
            strokeWidth={1}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={70}
            stroke={theme.colors.separator}
            strokeWidth={1}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={35}
            stroke={theme.colors.separator}
            strokeWidth={1}
            fill="none"
          />

          {/* Crosshairs */}
          <Line
            x1={center}
            y1={0}
            x2={center}
            y2={size}
            stroke={theme.colors.separator}
            strokeWidth={1}
          />
          <Line
            x1={0}
            y1={center}
            x2={size}
            y2={center}
            stroke={theme.colors.separator}
            strokeWidth={1}
          />

          {/* Center point - represents device location */}
          <Circle
            cx={center}
            cy={center}
            r={6}
            fill={theme.colors.systemBlue}
          />

          {/* Distance markers */}
          <SvgText
            x={center + 38}
            y={center + 3}
            fill={theme.colors.secondaryLabel}
            fontSize={10}
          >
            200ft
          </SvgText>
          <SvgText
            x={center + 73}
            y={center + 3}
            fill={theme.colors.secondaryLabel}
            fontSize={10}
          >
            400ft
          </SvgText>
          <SvgText
            x={center + 143}
            y={center + 3}
            fill={theme.colors.secondaryLabel}
            fontSize={10}
          >
            {maxRange}ft
          </SvgText>

          {/* Detections */}
          {detections.map((detection) => {
            const distance = (detection.distance / maxRange) * 140;
            const radian = (detection.angle * Math.PI) / 180;
            const x = center + distance * Math.cos(radian);
            const y = center + distance * Math.sin(radian);

            return (
              <Circle
                key={detection.id}
                cx={x}
                cy={y}
                r={getThreatSize(detection.threatLevel)}
                fill={getThreatColor(detection.threatLevel)}
                opacity={0.9}
              />
            );
          })}
        </Svg>

        {/* Sweeping radar line (animated) */}
        {showSweep && (
          <Animated.View
            style={[
              styles.sweep,
              { backgroundColor: sweepColor, transform: [{ rotate: spin }] },
            ]}
          />
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem color={threatColors.critical} label="Critical" />
        <LegendItem color={threatColors.high} label="High" />
        <LegendItem color={threatColors.medium} label="Medium" />
        <LegendItem color={threatColors.low} label="Low" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 175,
    borderWidth: 1,
    width: 350,
    height: 350,
    position: 'relative',
  },
  sweep: {
    position: 'absolute',
    width: 2,
    height: 175,
    top: 175,
    left: 174,
    transformOrigin: 'top center',
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
