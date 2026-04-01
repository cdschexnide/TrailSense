import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Line,
  vec,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Text } from '@components/atoms';
import { ThreatLevel } from '@/types/alert';
import { BucketEntry, TimeBucketedPositions } from '@/types/replay';

const SIZE = 350;
const CENTER = SIZE / 2;
const RADIUS = CENTER - 10;
const TRAIL_WINDOW = 15;
const HIT_RADIUS = 20;
const RINGS = [RADIUS * 0.25, RADIUS * 0.5, RADIUS * 0.75, RADIUS];

const THREAT_COLORS: Record<ThreatLevel, string> = {
  critical: '#B84A42',
  high: '#C47F30',
  medium: '#C9A030',
  low: '#5A8A5A',
};

const DOT_RADII: Record<ThreatLevel, number> = {
  critical: 8,
  high: 7,
  medium: 6,
  low: 5,
};

interface ReplayRadarDisplayProps {
  currentMinute: number;
  positions: TimeBucketedPositions;
  onDotTap?: (macAddress: string) => void;
  onEmptyTap?: () => void;
  style?: ViewStyle;
}

function getTrailingDots(
  currentMinute: number,
  buckets: Map<number, BucketEntry[]>
) {
  const dots: Array<BucketEntry & { opacity: number }> = [];

  for (let offset = 0; offset < TRAIL_WINDOW; offset++) {
    const minute = currentMinute - offset;
    if (minute < 0) {
      continue;
    }

    const entries = buckets.get(minute);
    if (!entries) {
      continue;
    }

    const opacity = offset === 0 ? 1 : Math.max(0.1, 1 - offset / TRAIL_WINDOW);
    for (const entry of entries) {
      dots.push({ ...entry, opacity });
    }
  }

  return dots;
}

export const ReplayRadarDisplay: React.FC<ReplayRadarDisplayProps> = ({
  currentMinute,
  positions,
  onDotTap,
  onEmptyTap,
  style,
}) => {
  const visibleDots = useMemo(
    () => getTrailingDots(currentMinute, positions.buckets),
    [currentMinute, positions.buckets]
  );

  const handleTap = useCallback(
    (x: number, y: number) => {
      for (const dot of visibleDots) {
        if (!dot.macAddress) {
          continue;
        }

        const dx = x - dot.x;
        const dy = y - dot.y;
        if (dx * dx + dy * dy <= HIT_RADIUS * HIT_RADIUS) {
          onDotTap?.(dot.macAddress);
          return;
        }
      }

      onEmptyTap?.();
    },
    [onDotTap, onEmptyTap, visibleDots]
  );

  const tapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd(event => {
        'worklet';
        runOnJS(handleTap)(event.x, event.y);
      }),
    [handleTap]
  );

  return (
    <View style={[styles.container, style]}>
      <GestureDetector gesture={tapGesture}>
        <Canvas style={styles.canvas}>
          {RINGS.map((ring, index) => (
            <Circle
              key={`ring-${index}`}
              cx={CENTER}
              cy={CENTER}
              r={ring}
              color="rgba(255, 255, 255, 0.08)"
              style="stroke"
              strokeWidth={1}
            />
          ))}

          <Line
            p1={vec(CENTER, 0)}
            p2={vec(CENTER, SIZE)}
            color="rgba(255, 255, 255, 0.06)"
            strokeWidth={1}
          />
          <Line
            p1={vec(0, CENTER)}
            p2={vec(SIZE, CENTER)}
            color="rgba(255, 255, 255, 0.06)"
            strokeWidth={1}
          />

          <Circle cx={CENTER} cy={CENTER} r={6} color="#3478F6" />

          <Group>
            {visibleDots.map((dot, index) => (
              <Circle
                key={`${dot.fingerprintHash}-${index}`}
                cx={dot.x}
                cy={dot.y}
                r={DOT_RADII[dot.threatLevel]}
                color={THREAT_COLORS[dot.threatLevel]}
                opacity={dot.opacity}
              />
            ))}
          </Group>
        </Canvas>
      </GestureDetector>

      {visibleDots.length === 0 ? (
        <View style={styles.noActivityOverlay}>
          <Text variant="title3" color="secondaryLabel" style={styles.noActivityText}>
            No Activity
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: '#0a0a0f',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  canvas: {
    width: SIZE,
    height: SIZE,
  },
  noActivityOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noActivityText: {
    opacity: 0.35,
  },
});
