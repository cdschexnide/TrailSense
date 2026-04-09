import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '@components/molecules/Card';
import { ModalityCard, StatCard } from '@components/molecules';
import { ReportSection } from '@components/molecules/ReportSection';
import type { AnalyticsData } from '@/types/alert';
import type { ReportConfig } from '@/types/report';
import { MiniBarList, SimpleTableCard } from './shared';

interface SignalAnalysisReportProps {
  analytics: AnalyticsData;
  config: ReportConfig;
}

export const SignalAnalysisReport: React.FC<SignalAnalysisReportProps> = ({
  analytics,
  config,
}) => {
  const modalityItems = [
    {
      key: 'wifi',
      title: 'WiFi',
      count: analytics.modalityBreakdown.wifi.count,
      details: `${analytics.modalityBreakdown.wifi.channelsActive} active channels`,
    },
    {
      key: 'bluetooth',
      title: 'Bluetooth',
      count: analytics.modalityBreakdown.ble.count,
      details: `${analytics.modalityBreakdown.ble.phonePercent}% phone-class`,
    },
    {
      key: 'cellular',
      title: 'Cellular',
      count: analytics.modalityBreakdown.cellular.count,
      details: `${analytics.modalityBreakdown.cellular.avgPeakDbm} dBm avg peak`,
    },
  ].filter(item => config.detectionTypes.includes(item.key as any));

  return (
    <View style={styles.container}>
      <ReportSection title="RSSI Distribution">
        <Card tier="surface">
          <MiniBarList
            data={analytics.rssiDistribution.map(item => ({
              label: `${item.bucketMin} to ${item.bucketMax}`,
              value: item.count,
            }))}
            color="#dc2626"
          />
        </Card>
        <View style={styles.statsRow}>
          <StatCard title="Median RSSI" value={`${analytics.medianRssi} dBm`} />
          <StatCard title="Peak RSSI" value={`${analytics.peakRssi} dBm`} />
        </View>
      </ReportSection>

      <ReportSection title="Proximity Zones">
        <Card tier="surface">
          <MiniBarList
            data={analytics.proximityZoneDistribution.map(item => ({
              label: item.zone,
              value: item.count,
            }))}
            color="#2563eb"
          />
        </Card>
      </ReportSection>

      <ReportSection
        title="Modality Breakdown"
        subtitle="Filtered by selected detection types"
      >
        <View style={styles.modalityGrid}>
          {modalityItems.map(item => (
            <ModalityCard
              key={item.key}
              title={item.title}
              icon={
                item.key === 'wifi'
                  ? 'wifi-outline'
                  : item.key === 'bluetooth'
                    ? 'bluetooth-outline'
                    : 'cellular-outline'
              }
              color={
                item.key === 'wifi'
                  ? '#2563eb'
                  : item.key === 'bluetooth'
                    ? '#7c3aed'
                    : '#ea580c'
              }
              count={item.count}
              metrics={[{ label: 'Signal note', value: item.details }]}
            />
          ))}
        </View>
      </ReportSection>

      <ReportSection title="Cross-Modal Correlation">
        <View style={styles.statsRow}>
          <StatCard
            title="WiFi ↔ BLE Links"
            value={analytics.crossModalStats.wifiBleLinks}
          />
          <StatCard
            title="Link Confidence"
            value={`${analytics.crossModalStats.avgLinkConfidence}%`}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            title="Phantom Merges"
            value={analytics.crossModalStats.phantomMerges}
          />
        </View>
      </ReportSection>

      <ReportSection title="Signal Strength Trend">
        <SimpleTableCard
          rows={analytics.rssiTrend.map(item => ({
            label: item.date,
            value: [
              config.detectionTypes.includes('wifi')
                ? `WiFi ${item.wifiAvgRssi ?? '-'}`
                : null,
              config.detectionTypes.includes('bluetooth')
                ? `BLE ${item.bleAvgRssi ?? '-'}`
                : null,
              config.detectionTypes.includes('cellular')
                ? `Cell ${item.cellularAvgRssi ?? '-'}`
                : null,
            ]
              .filter(Boolean)
              .join(' · '),
          }))}
        />
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
  modalityGrid: {
    gap: 12,
  },
});

export default SignalAnalysisReport;
