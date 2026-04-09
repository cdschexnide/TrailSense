import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { ChartCard } from '@components/molecules';
import { ActivityHeatmap, MultiLineChart } from '@components/organisms/charts';
import { Text } from '@components/atoms/Text';
import { useTheme } from '@hooks/useTheme';
import type { AnalyticsData } from '@/types/alert';
import type { AnalyticsComparisonResponse } from '@hooks/useAnalytics';

interface PatternsTabProps {
  analytics: AnalyticsData;
  comparison?: AnalyticsComparisonResponse | null;
  period?: 'day' | 'week' | 'month' | 'year';
}

interface Anomaly {
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Aggregate hourlyDayOfWeekDistribution into 2-hour blocks per day-of-week
function aggregate2hBlocks(
  data: AnalyticsData['hourlyDayOfWeekDistribution']
): Map<string, number> {
  const map = new Map<string, number>();
  (data ?? []).forEach(entry => {
    const block = Math.floor(entry.hour / 2);
    const key = `${entry.dayOfWeek}-${block}`;
    map.set(key, (map.get(key) ?? 0) + entry.count);
  });
  return map;
}

function computeAnomalies(
  analytics: AnalyticsData,
  comparison?: AnalyticsComparisonResponse | null
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const baseline = comparison?.comparison;

  const currentBlocks = aggregate2hBlocks(
    analytics.hourlyDayOfWeekDistribution
  );
  const baselineBlocks = baseline
    ? aggregate2hBlocks(baseline.hourlyDayOfWeekDistribution)
    : null;

  // If no baseline, fall back to self-comparison using overall average
  const refMap = baselineBlocks ?? currentBlocks;
  const refValues = Array.from(refMap.values());
  const refAvg =
    refValues.length > 0
      ? refValues.reduce((a, b) => a + b, 0) / refValues.length
      : 0;

  // Spike detection: current block > 2× baseline block (or 2× overall avg)
  currentBlocks.forEach((count, key) => {
    const refCount = baselineBlocks ? (baselineBlocks.get(key) ?? 0) : refAvg;
    if (refCount > 0 && count > refCount * 2) {
      const [dayStr, blockStr] = key.split('-');
      const day = DAYS[parseInt(dayStr, 10)] ?? '?';
      const hour = parseInt(blockStr, 10) * 2;
      anomalies.push({
        title: `Spike: ${day} ${hour}:00–${hour + 2}:00`,
        detail: `${count} detections vs ${Math.round(refCount)} baseline`,
        severity: 'warning',
      });
    }
  });

  // Quiet gap: baseline block had activity (>= 2) but current has 0
  if (baselineBlocks) {
    baselineBlocks.forEach((refCount, key) => {
      if (refCount >= 2 && (currentBlocks.get(key) ?? 0) === 0) {
        const [dayStr, blockStr] = key.split('-');
        const day = DAYS[parseInt(dayStr, 10)] ?? '?';
        const hour = parseInt(blockStr, 10) * 2;
        anomalies.push({
          title: `Quiet gap: ${day} ${hour}:00–${hour + 2}:00`,
          detail: `Normally ${refCount} detections in this slot`,
          severity: 'info',
        });
      }
    });
  }

  // Timing shift: compare peak hour across modalities
  const peakHour = (data: AnalyticsData['hourlyDayOfWeekDistribution']) => {
    const hourTotals = new Map<number, number>();
    (data ?? []).forEach(entry => {
      hourTotals.set(
        entry.hour,
        (hourTotals.get(entry.hour) ?? 0) + entry.count
      );
    });
    let maxHour = 0;
    let maxCount = 0;
    hourTotals.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        maxHour = hour;
      }
    });
    return maxHour;
  };

  if (baseline) {
    const currentPeak = peakHour(analytics.hourlyDayOfWeekDistribution);
    const baselinePeak = peakHour(baseline.hourlyDayOfWeekDistribution);
    if (Math.abs(currentPeak - baselinePeak) > 2) {
      anomalies.push({
        title: 'Timing shift detected',
        detail: `Peak activity moved from ${baselinePeak}:00 to ${currentPeak}:00`,
        severity: 'critical',
      });
    }
  }

  return anomalies.slice(0, 5);
}

export const PatternsTab: React.FC<PatternsTabProps> = ({
  analytics,
  comparison,
  period = 'week',
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 64;
  const anomalies = computeAnomalies(analytics, comparison);
  const hourly = analytics.hourlyDistribution ?? [];
  const peakHour = [...hourly].sort((a, b) => b.count - a.count)[0];
  const quietHour = [...hourly].sort((a, b) => a.count - b.count)[0];

  return (
    <View style={styles.container}>
      <ActivityHeatmap
        subtitle={
          period === 'day'
            ? 'Hourly activity today'
            : period === 'year'
              ? 'Monthly patterns by day of week'
              : 'Two-hour blocks across the week'
        }
        data={analytics.hourlyDayOfWeekDistribution}
        period={period}
      />

      <ChartCard
        title="Hourly Distribution"
        subtitle={
          peakHour && quietHour
            ? `Peak ${peakHour.hour}:00 · Quiet ${quietHour.hour}:00`
            : 'Detection volume by hour'
        }
      >
        <BarChart
          data={hourly.map(item => ({
            value: item.count,
            label: `${item.hour}`,
            frontColor:
              item.hour === peakHour?.hour
                ? colors.systemOrange
                : colors.systemBlue,
          }))}
          barWidth={12}
          spacing={8}
          hideRules
          disableScroll
          xAxisColor={colors.separator}
          yAxisColor={colors.separator}
          xAxisLabelTextStyle={{ color: colors.secondaryLabel, fontSize: 9 }}
          yAxisTextStyle={{ color: colors.secondaryLabel, fontSize: 11 }}
          height={180}
          width={chartWidth}
        />
      </ChartCard>

      <ChartCard title="Day Of Week" subtitle="Busiest weekday highlighted">
        <BarChart
          data={analytics.dayOfWeekDistribution.map(item => ({
            value: item.count,
            label: DAYS[item.day],
            frontColor:
              item.count ===
              Math.max(
                ...analytics.dayOfWeekDistribution.map(day => day.count),
                0
              )
                ? colors.systemOrange
                : colors.systemBlue,
          }))}
          barWidth={24}
          spacing={16}
          hideRules
          disableScroll
          xAxisColor={colors.separator}
          yAxisColor={colors.separator}
          xAxisLabelTextStyle={{ color: colors.secondaryLabel, fontSize: 10 }}
          yAxisTextStyle={{ color: colors.secondaryLabel, fontSize: 11 }}
          height={180}
          width={chartWidth}
        />
      </ChartCard>

      <ChartCard
        title="Nighttime Activity"
        subtitle={`${analytics.nighttimeActivity.count} detections between 10 PM and 6 AM`}
      >
        <Text variant="title2" weight="bold">
          {analytics.nighttimeActivity.percentOfTotal}% of all detections
        </Text>
        {analytics.nighttimeActivity.trend.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <MultiLineChart
              title=""
              series={[
                {
                  color: colors.systemRed,
                  data: analytics.nighttimeActivity.trend.map(t => ({
                    label: t.date.slice(5),
                    value: t.count,
                  })),
                },
              ]}
            />
          </View>
        )}
      </ChartCard>

      <ChartCard
        title="Anomalies"
        subtitle="Compared with the previous period baseline"
      >
        <View style={styles.anomalyList}>
          {period === 'year' && !comparison ? (
            <Text variant="subheadline" color="secondaryLabel">
              Anomaly detection requires period comparison, which is unavailable
              for the yearly view. Select a shorter period to see anomalies.
            </Text>
          ) : anomalies.length === 0 ? (
            <Text variant="subheadline" color="secondaryLabel">
              No significant anomalies detected in the current period.
            </Text>
          ) : (
            anomalies.map(anomaly => (
              <View key={anomaly.title} style={styles.anomalyRow}>
                <View
                  style={[
                    styles.anomalyDot,
                    {
                      backgroundColor:
                        anomaly.severity === 'critical'
                          ? colors.systemRed
                          : anomaly.severity === 'warning'
                            ? colors.systemOrange
                            : colors.systemBlue,
                    },
                  ]}
                />
                <View style={styles.anomalyText}>
                  <Text variant="subheadline" weight="semibold">
                    {anomaly.title}
                  </Text>
                  <Text variant="footnote" color="secondaryLabel">
                    {anomaly.detail}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ChartCard>

      <MultiLineChart
        title="Activity By Sensor"
        subtitle="Detection count trends per TrailSense device"
        series={(analytics.perSensorTrend[0]?.sensors ?? [])
          .slice(0, 3)
          .map((sensor, index) => ({
            color: [colors.systemBlue, colors.systemTeal, colors.systemPurple][
              index
            ],
            data: analytics.perSensorTrend.map(point => ({
              label: point.date.slice(5),
              value:
                point.sensors.find(item => item.deviceId === sensor.deviceId)
                  ?.count ?? 0,
            })),
          }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  anomalyList: {
    width: '100%',
    gap: 12,
  },
  anomalyRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  anomalyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  anomalyText: {
    flex: 1,
    gap: 2,
  },
});
