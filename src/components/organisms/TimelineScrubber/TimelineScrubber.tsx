import React, { useCallback, useMemo, useRef } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Icon, Text } from '@components/atoms';
import { ThreatLevel } from '@/types/alert';
import { TimelineScrubberProps } from '@/types/replay';

const TRACK_HEIGHT = 40;
const TOTAL_MINUTES = 1440;

const TRACK_COLORS: Record<ThreatLevel, string> = {
  critical: 'rgba(184, 74, 66, 0.75)',
  high: 'rgba(196, 127, 48, 0.65)',
  medium: 'rgba(201, 160, 48, 0.55)',
  low: 'rgba(90, 138, 90, 0.4)',
};

function formatTime(minuteIndex: number) {
  const hours = Math.floor(minuteIndex / 60);
  const minutes = minuteIndex % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${suffix}`;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  minuteIndex,
  buckets,
  isPlaying,
  speed,
  onPlayPause,
  onSpeedChange,
  onSkipForward,
  onSkipBack,
  onScrub,
}) => {
  const trackWidthRef = useRef(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    trackWidthRef.current = event.nativeEvent.layout.width;
  }, []);

  const handleScrub = useCallback(
    (x: number) => {
      const width = trackWidthRef.current;
      if (!width) {
        return;
      }

      const clamped = Math.max(0, Math.min(x, width));
      const nextMinute = Math.round((clamped / width) * (TOTAL_MINUTES - 1));
      onScrub(nextMinute);
    },
    [onScrub]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(event => {
          'worklet';
          runOnJS(handleScrub)(event.x);
        })
        .onUpdate(event => {
          'worklet';
          runOnJS(handleScrub)(event.x);
        }),
    [handleScrub]
  );

  const segments = useMemo(() => {
    const items: Array<{ height: number; color: string }> = Array.from(
      { length: 96 },
      () => ({ height: 2, color: 'rgba(255, 255, 255, 0.05)' })
    );

    const priority: Record<ThreatLevel, number> = {
      low: 0,
      medium: 1,
      high: 2,
      critical: 3,
    };

    for (const [minute, entries] of buckets) {
      const segment = Math.floor(minute / 15);
      if (!items[segment]) {
        continue;
      }

      const maxThreat = entries.reduce<ThreatLevel>(
        (current, entry) =>
          priority[entry.threatLevel] > priority[current]
            ? entry.threatLevel
            : current,
        'low'
      );
      items[segment] = {
        height: Math.min(TRACK_HEIGHT, Math.max(4, 4 + entries.length * 3)),
        color: TRACK_COLORS[maxThreat],
      };
    }

    return items;
  }, [buckets]);

  return (
    <View style={styles.container}>
      <Text variant="title2" weight="bold" color="white" style={styles.timestamp}>
        {formatTime(minuteIndex)}
      </Text>

      <View style={styles.controls}>
        <Pressable
          testID="skip-back-button"
          onPress={onSkipBack}
          style={styles.controlButton}
        >
          <Icon name="play-skip-back" size={20} color="white" />
        </Pressable>
        <Pressable
          testID="play-pause-button"
          onPress={onPlayPause}
          style={styles.playButton}
        >
          <Icon name={isPlaying ? 'pause' : 'play'} size={24} color="white" />
        </Pressable>
        <Pressable
          testID="skip-forward-button"
          onPress={onSkipForward}
          style={styles.controlButton}
        >
          <Icon name="play-skip-forward" size={20} color="white" />
        </Pressable>
        <Pressable
          testID="speed-button"
          onPress={onSpeedChange}
          style={styles.speedButton}
        >
          <Text variant="caption1" weight="bold" color="white">
            {speed}x
          </Text>
        </Pressable>
      </View>

      <GestureDetector gesture={panGesture}>
        <View testID="scrub-track" style={styles.track} onLayout={onLayout}>
          {segments.map((segment, index) => (
            <View
              key={`segment-${index}`}
              style={[
                styles.segment,
                {
                  backgroundColor: segment.color,
                  height: segment.height,
                },
              ]}
            />
          ))}

          <View
            style={[
              styles.playhead,
              { left: `${(minuteIndex / (TOTAL_MINUTES - 1)) * 100}%` },
            ]}
          />
        </View>
      </GestureDetector>

      <View style={styles.labels}>
        <Text variant="caption2" color="secondaryLabel">12am</Text>
        <Text variant="caption2" color="secondaryLabel">6am</Text>
        <Text variant="caption2" color="secondaryLabel">12pm</Text>
        <Text variant="caption2" color="secondaryLabel">6pm</Text>
        <Text variant="caption2" color="secondaryLabel">Now</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0a0f',
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  timestamp: {
    textAlign: 'center',
    marginBottom: 14,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: TRACK_HEIGHT,
    gap: 1,
    position: 'relative',
  },
  segment: {
    flex: 1,
    borderRadius: 1,
  },
  playhead: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    width: 3,
    marginLeft: -1.5,
    borderRadius: 999,
    backgroundColor: '#C9B896',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
});
