import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '@components/molecules/Card';
import { StatCard } from '@components/molecules';
import { ReportSection } from '@components/molecules/ReportSection';
import type { AnalyticsData } from '@/types/alert';
import type { ReportConfig } from '@/types/report';
import { MiniBarList, SimpleTableCard, formatPercent } from './shared';

interface ActivityReportReportProps {
  analytics: AnalyticsData;
  config: ReportConfig;
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) => `${hour}:00`);
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ActivityReportReport: React.FC<ActivityReportReportProps> = ({
  analytics,
  config,
}) => {
  const hourlyCounts = analytics.hourlyDayOfWeekDistribution.reduce<
    Array<{ label: string; value: number }>
  >(
    (acc, entry) => {
      acc[entry.hour].value += entry.count;
      return acc;
    },
    HOUR_LABELS.map(label => ({ label, value: 0 }))
  );

  const dayRows = analytics.dayOfWeekDistribution.map(item => ({
    label: DAY_LABELS[item.day] || `Day ${item.day}`,
    value: item.count,
  }));

  const sensorRows = analytics.perSensorTrend.slice(-7).flatMap(entry =>
    entry.sensors
      .filter(sensor => config.deviceIds.includes(sensor.deviceId))
      .map(sensor => ({
        label: `${entry.date} · ${sensor.deviceName}`,
        value: `${sensor.count}`,
      }))
  );

  return (
    <View style={styles.container}>
      <ReportSection title="Daily Trend">
        <Card tier="surface">
          <MiniBarList
            data={analytics.dailyTrend.map(item => ({
              label: item.date.slice(5),
              value: item.count,
            }))}
            color="#0891b2"
          />
        </Card>
      </ReportSection>

      <ReportSection title="Hourly Distribution">
        <Card tier="surface">
          <MiniBarList data={hourlyCounts} color="#0f766e" />
        </Card>
      </ReportSection>

      <ReportSection title="Day of Week Distribution">
        <Card tier="surface">
          <MiniBarList data={dayRows} color="#7c3aed" />
        </Card>
      </ReportSection>

      <ReportSection title="Nighttime Activity">
        <View style={styles.statsRow}>
          <StatCard
            title="Nighttime Share"
            value={formatPercent(analytics.nighttimeActivity.percentOfTotal)}
          />
          <StatCard
            title="Nighttime Count"
            value={analytics.nighttimeActivity.count}
          />
        </View>
      </ReportSection>

      <ReportSection
        title="Activity by Sensor"
        subtitle="Last 7 days for selected devices"
      >
        <SimpleTableCard rows={sensorRows} />
      </ReportSection>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
});

export default ActivityReportReport;
