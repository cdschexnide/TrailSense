import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { Alert, ThreatLevel } from '@types';

interface ActivitySparklineProps {
  alerts: Alert[];
  onHourPress?: (hour: number) => void;
}

const THREAT_BAR_COLORS: Record<ThreatLevel, string> = {
  critical: 'rgba(184, 74, 66, 0.7)',
  high: 'rgba(196, 127, 48, 0.6)',
  medium: 'rgba(201, 160, 48, 0.5)',
  low: 'rgba(90, 138, 90, 0.3)',
};

const EMPTY_COLOR = 'rgba(0, 0, 0, 0.05)';
const MAX_BAR_HEIGHT = 40;

export const ActivitySparkline: React.FC<ActivitySparklineProps> = ({
  alerts,
  onHourPress,
}) => {
  const { theme } = useTheme();

  const hourlyData = useMemo(() => {
    const buckets: Array<{ count: number; maxThreat: ThreatLevel }> = Array.from(
      { length: 24 },
      () => ({ count: 0, maxThreat: 'low' })
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threatPriority: Record<ThreatLevel, number> = {
      low: 0,
      medium: 1,
      high: 2,
      critical: 3,
    };

    for (const alert of alerts) {
      const alertDate = new Date(alert.timestamp);
      if (alertDate < today) {
        continue;
      }

      const hour = alertDate.getHours();
      buckets[hour].count += 1;

      if (
        threatPriority[alert.threatLevel] >
        threatPriority[buckets[hour].maxThreat]
      ) {
        buckets[hour].maxThreat = alert.threatLevel;
      }
    }

    return buckets;
  }, [alerts]);

  const maxCount = Math.max(...hourlyData.map(bucket => bucket.count), 1);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.secondarySystemBackground },
      ]}
    >
      <View style={styles.header}>
        <Text
          variant="caption1"
          weight="semibold"
          color="secondaryLabel"
          style={styles.headerTitle}
        >
          TODAY&apos;S ACTIVITY
        </Text>
        <Text variant="caption2" color="tertiaryLabel">
          Since midnight
        </Text>
      </View>

      <View style={styles.sparkline}>
        {hourlyData.map((bucket, index) => {
          const height =
            bucket.count === 0
              ? 2
              : Math.max(4, (bucket.count / maxCount) * MAX_BAR_HEIGHT);
          const color =
            bucket.count === 0
              ? EMPTY_COLOR
              : THREAT_BAR_COLORS[bucket.maxThreat];

          return (
            <Pressable
              key={index}
              style={styles.barContainer}
              onPress={() => onHourPress?.(index)}
            >
              <View style={[styles.bar, { height, backgroundColor: color }]} />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.timeLabels}>
        <Text variant="caption2" color="tertiaryLabel">
          12am
        </Text>
        <Text variant="caption2" color="tertiaryLabel">
          6am
        </Text>
        <Text variant="caption2" color="tertiaryLabel">
          12pm
        </Text>
        <Text variant="caption2" color="tertiaryLabel">
          6pm
        </Text>
        <Text variant="caption2" color="tertiaryLabel">
          Now
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    letterSpacing: 0.3,
  },
  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: MAX_BAR_HEIGHT,
    gap: 2,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    borderRadius: 2,
    minHeight: 2,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
});

export default ActivitySparkline;
