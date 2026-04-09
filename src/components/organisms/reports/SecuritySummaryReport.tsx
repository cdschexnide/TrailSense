import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatCard } from '@components/molecules';
import { Card } from '@components/molecules/Card';
import { ReportSection } from '@components/molecules/ReportSection';
import type { AnalyticsComparisonResponse } from '@hooks/useAnalytics';
import type { AnalyticsData } from '@/types/alert';
import type { Device } from '@/types/device';
import type { ReportConfig } from '@/types/report';
import {
  formatChartLabel,
  formatDistance,
  MiniBarList,
  SimpleTableCard,
} from './shared';

interface SecuritySummaryReportProps {
  analytics: AnalyticsData;
  comparison?: AnalyticsComparisonResponse | null;
  devices: Device[];
  config: ReportConfig;
}

export const SecuritySummaryReport: React.FC<SecuritySummaryReportProps> = ({
  analytics,
  comparison,
  devices,
  config,
}) => {
  const sensorRows = analytics.perSensorTrend
    .flatMap(entry => entry.sensors)
    .filter(sensor => config.deviceIds.includes(sensor.deviceId))
    .reduce<Record<string, { name: string; count: number }>>((acc, sensor) => {
      const current = acc[sensor.deviceId] || {
        name: sensor.deviceName,
        count: 0,
      };
      current.count += sensor.count;
      acc[sensor.deviceId] = current;
      return acc;
    }, {});

  const filteredThreats = analytics.threatLevelDistribution.filter(item =>
    config.threatLevels.includes(item.level as any)
  );
  const filteredDetectionTypes = analytics.detectionTypeDistribution.filter(
    item => config.detectionTypes.includes(item.type as any)
  );

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <StatCard title="Total Detections" value={analytics.totalAlerts} />
        <StatCard title="Unique Devices" value={analytics.uniqueDevices} />
      </View>
      <View style={styles.statsRow}>
        <StatCard
          title="Avg Confidence"
          value={`${analytics.avgConfidence}%`}
        />
        <StatCard
          title="Closest Approach"
          value={formatDistance(analytics.closestApproachMeters)}
        />
      </View>

      <ReportSection
        title="Threat Distribution"
        subtitle="Filtered by selected threat levels"
      >
        <Card tier="surface">
          <MiniBarList
            data={filteredThreats.map(item => ({
              label: formatChartLabel(item.level),
              value: item.count,
            }))}
            color="#ef4444"
          />
        </Card>
      </ReportSection>

      <ReportSection
        title="Detection Types"
        subtitle="Filtered by selected detection types"
      >
        <Card tier="surface">
          <MiniBarList
            data={filteredDetectionTypes.map(item => ({
              label: formatChartLabel(item.type),
              value: item.count,
            }))}
            color="#2563eb"
          />
        </Card>
      </ReportSection>

      <ReportSection title="Top Devices">
        <SimpleTableCard
          rows={analytics.topDetectedDevices.slice(0, 5).map(item => ({
            label: `${item.fingerprintHash.slice(0, 12)}...`,
            value: `${item.count} detections`,
          }))}
        />
      </ReportSection>

      <ReportSection
        title="Detections by Sensor"
        subtitle={`${Object.keys(sensorRows).length} selected sensor${Object.keys(sensorRows).length === 1 ? '' : 's'}`}
      >
        <SimpleTableCard
          rows={Object.entries(sensorRows).map(([deviceId, sensor]) => ({
            label:
              devices.find(device => device.id === deviceId)?.name ||
              sensor.name,
            value: `${sensor.count}`,
          }))}
        />
      </ReportSection>

      {comparison?.percentageChange ? (
        <ReportSection title="Period Comparison">
          <SimpleTableCard
            rows={[
              {
                label: 'Total detections',
                value: `${comparison.percentageChange.totalDetections}%`,
              },
              {
                label: 'Unknown devices',
                value: `${comparison.percentageChange.unknownDevices}%`,
              },
              {
                label: 'Avg response time',
                value: `${comparison.percentageChange.avgResponseTime}%`,
              },
            ]}
          />
        </ReportSection>
      ) : null}
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

export default SecuritySummaryReport;
