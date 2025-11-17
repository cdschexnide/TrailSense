import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Detection, ThreatLevel } from '@types';

interface RadarDisplayProps {
  detections: Detection[];
  range: number;
}

const getThreatColor = (threatLevel: ThreatLevel): string => {
  switch (threatLevel) {
    case 'critical':
      return '#FF0000';
    case 'high':
      return '#FF6B00';
    case 'medium':
      return '#FFB800';
    case 'low':
      return '#00C853';
    default:
      return '#888888';
  }
};

export const RadarDisplay: React.FC<RadarDisplayProps> = ({
  detections,
  range,
}) => {
  const size = 350;
  const center = size / 2;

  // Radar sweep animation
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 4000 }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Concentric circles for range */}
        <Circle
          cx={center}
          cy={center}
          r={140}
          stroke="#333"
          strokeWidth={1}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={105}
          stroke="#333"
          strokeWidth={1}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={70}
          stroke="#333"
          strokeWidth={1}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={35}
          stroke="#333"
          strokeWidth={1}
          fill="none"
        />

        {/* Crosshairs */}
        <Line
          x1={center}
          y1={0}
          x2={center}
          y2={size}
          stroke="#333"
          strokeWidth={1}
        />
        <Line
          x1={0}
          y1={center}
          x2={size}
          y2={center}
          stroke="#333"
          strokeWidth={1}
        />

        {/* Range labels */}
        <SvgText x={center + 145} y={center} fill="#666" fontSize={10}>
          {range}ft
        </SvgText>

        {/* Detections */}
        {detections.map((detection) => {
          const distance = (detection.distance / range) * 140;
          const radian = (detection.angle * Math.PI) / 180;
          const x = center + distance * Math.cos(radian);
          const y = center + distance * Math.sin(radian);

          return (
            <Circle
              key={detection.id}
              cx={x}
              cy={y}
              r={6}
              fill={getThreatColor(detection.threatLevel)}
              opacity={0.8}
            />
          );
        })}
      </Svg>

      {/* Sweeping radar line (animated) */}
      <Animated.View style={[styles.sweep, animatedStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: 175,
    width: 350,
    height: 350,
    position: 'relative',
  },
  sweep: {
    position: 'absolute',
    width: 2,
    height: 175,
    backgroundColor: 'rgba(0, 255, 0, 0.5)',
    top: 175,
    left: 174,
    transformOrigin: 'top center',
  },
});
