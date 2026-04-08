import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { formatDistanceStrict } from 'date-fns';
import { BarChart } from 'react-native-gifted-charts';
import { ChartCard, GroupedListRow, GroupedListSection, InsightCard, StatCard } from '@components/molecules';
import { StackedAreaChart } from '@components/organisms/charts';
import { Text } from '@components/atoms/Text';
import { useTheme } from '@hooks/useTheme';
import type { AnalyticsData } from '@/types/alert';
import type { AnalyticsComparisonResponse } from '@hooks/useAnalytics';
import type { Device } from '@/types/device';
import type { Insight } from '@services/analyticsInsights';

interface OverviewTabProps {
  analytics: AnalyticsData;
  comparison?: AnalyticsComparisonResponse | null;
  devices: Device[];
  insights: Insight[];
  onSelectTab: (tab: 'overview' | 'signals' | 'patterns') => void;
}

const changeMeta = (
  current: number,
  previous: number,
  preferred: 'higher' | 'lower' | 'neutral'
): { value: string; trend: 'positive' | 'negative' | 'neutral' } => {
  const delta = current - previous;
  if (previous === 0) {
    return { value: 'No baseline', trend: 'neutral' };
  }
  const percent = Math.round((Math.abs(delta) / previous) * 100);
  if (delta === 0) return { value: '0%', trend: 'neutral' };
  if (preferred === 'neutral') {
    return { value: `${delta > 0 ? '+' : '-'}${percent}%`, trend: 'neutral' };
  }
  const positive = preferred === 'higher' ? delta > 0 : delta < 0;
  return {
    value: `${delta > 0 ? '+' : '-'}${percent}%`,
    trend: positive ? 'positive' : 'negative',
  };
};

const getBatteryLabel = (device: Device) => {
  const battery = device.batteryPercent ?? device.battery;
  return typeof battery === 'number' ? `${battery}% battery` : 'Battery unknown';
};

export const OverviewTab: React.FC<OverviewTabProps> = ({
  analytics,
  comparison,
  devices,
  insights,
  onSelectTab,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 64;
  const previous = comparison?.comparison ?? analytics;

  const detectionBars = analytics.detectionTypeDistribution.map(item => ({
    value: item.count,
    color:
      item.type === 'wifi'
        ? colors.detection.wifi
        : item.type === 'bluetooth'
          ? colors.detection.bluetooth
          : colors.detection.cellular,
    label: item.type.toUpperCase(),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.statGrid}>
        <StatCard
          title="Detections"
          value={analytics.totalAlerts}
          change={changeMeta(analytics.totalAlerts, previous.totalAlerts, 'neutral')}
          style={styles.statCard}
        />
        <StatCard
          title="Unique Devices"
          value={analytics.uniqueDevices}
          change={changeMeta(analytics.uniqueDevices, previous.uniqueDevices, 'lower')}
          style={styles.statCard}
        />
        <StatCard
          title="Avg Confidence"
          value={`${analytics.avgConfidence}%`}
          change={changeMeta(analytics.avgConfidence, previous.avgConfidence, 'higher')}
          style={styles.statCard}
        />
        <StatCard
          title="Closest Approach"
          value={`${analytics.closestApproachMeters}m`}
          change={changeMeta(
            analytics.closestApproachMeters,
            previous.closestApproachMeters,
            'neutral'
          )}
          style={styles.statCard}
        />
      </View>

      <StackedAreaChart
        title="Threat Trend"
        subtitle="Severity mix over the selected period"
        data={analytics.threatTimeline}
        labels={analytics.threatTimeline.map(item => item.date.slice(5))}
      />

      <ChartCard
        title="Detection Breakdown"
        subtitle="Signal modality mix across all detections"
      >
        <BarChart
          horizontal
          barWidth={18}
          data={detectionBars}
          frontColor={colors.systemBlue}
          hideYAxisText
          hideRules
          xAxisColor={colors.separator}
          yAxisColor={colors.separator}
          disableScroll
          noOfSections={4}
          height={120}
          width={chartWidth}
        />
        <View style={styles.breakdownList}>
          {analytics.detectionTypeDistribution.map(item => {
            const percent =
              analytics.totalAlerts > 0
                ? Math.round((item.count / analytics.totalAlerts) * 100)
                : 0;
            return (
              <View key={item.type} style={styles.breakdownRow}>
                <Text variant="subheadline">{item.type.toUpperCase()}</Text>
                <Text variant="subheadline" color="secondaryLabel">
                  {item.count} · {percent}%
                </Text>
              </View>
            );
          })}
        </View>
      </ChartCard>

      <View style={styles.insights}>
        {insights.length === 0 ? (
          <ChartCard title="Highlights" subtitle="No notable shifts in this period">
            <Text variant="subheadline" color="secondaryLabel">
              Analytics are stable. Check Signals or Patterns for detailed breakdowns.
            </Text>
          </ChartCard>
        ) : (
          insights.map(insight => (
            <InsightCard
              key={insight.type}
              insight={insight}
              onPress={insight.targetTab ? () => onSelectTab(insight.targetTab!) : undefined}
            />
          ))
        )}
      </View>

      <GroupedListSection title="SENSOR HEALTH">
        {devices.map(device => (
          <GroupedListRow
            key={device.id}
            icon={device.online ? 'radio' : 'radio-outline'}
            iconColor={device.online ? colors.systemGreen : colors.systemRed}
            iconBackgroundColor={
              device.online ? `${colors.systemGreen}20` : `${colors.systemRed}20`
            }
            title={device.name}
            value={device.online ? 'Online' : 'Offline'}
            subtitle={`${getBatteryLabel(device)} · ${
              device.uptimeSeconds
                ? formatDistanceStrict(0, device.uptimeSeconds * 1000)
                : 'Uptime unknown'
            }`}
          />
        ))}
      </GroupedListSection>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    minWidth: '47%',
  },
  breakdownList: {
    marginTop: 16,
    width: '100%',
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  insights: {
    gap: 12,
  },
});
