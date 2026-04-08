import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { ChartCard, ModalityCard, ProximityZoneVisual } from '@components/molecules';
import { MultiLineChart } from '@components/organisms/charts';
import { Text } from '@components/atoms/Text';
import { useTheme } from '@hooks/useTheme';
import type { AnalyticsData } from '@/types/alert';

interface SignalsTabProps {
  analytics: AnalyticsData;
}

const CONFIDENCE_COLORS = {
  high: '#4ade80',
  medium: '#fbbf24',
  low: '#ef4444',
} as const;

export const SignalsTab: React.FC<SignalsTabProps> = ({ analytics }) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 64;

  return (
    <View style={styles.container}>
      <ChartCard
        title="Signal Strength Distribution"
        subtitle={`Median ${analytics.medianRssi} dBm · Peak ${analytics.peakRssi} dBm`}
      >
        <BarChart
          data={analytics.rssiDistribution.map(bucket => ({
            value: bucket.count,
            label: `${bucket.bucketMin}`,
            frontColor: colors.detection.wifi,
          }))}
          barWidth={22}
          spacing={12}
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
        title="Proximity Zones"
        subtitle={`Closest approach recorded at ${analytics.closestApproachMeters} meters`}
      >
        <ProximityZoneVisual zones={analytics.proximityZoneDistribution} />
      </ChartCard>

      <ChartCard
        title="Detection Confidence"
        subtitle={`${analytics.avgConfidence}% mean confidence across this period`}
      >
        <View style={styles.confidenceList}>
          {analytics.confidenceDistribution.map(item => {
            const percent =
              analytics.totalAlerts > 0
                ? Math.round((item.count / analytics.totalAlerts) * 100)
                : 0;
            return (
              <View key={item.tier} style={styles.confidenceRow}>
                <View style={styles.confidenceHeader}>
                  <Text variant="subheadline" weight="semibold">
                    {item.tier.toUpperCase()}
                  </Text>
                  <Text variant="subheadline" color="secondaryLabel">
                    {item.count} · {percent}%
                  </Text>
                </View>
                <View
                  style={[
                    styles.confidenceTrack,
                    { backgroundColor: colors.tertiarySystemBackground },
                  ]}
                >
                  <View
                    style={[
                      styles.confidenceFill,
                      {
                        width: `${percent}%`,
                        backgroundColor: CONFIDENCE_COLORS[item.tier],
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ChartCard>

      <View style={styles.modalityStack}>
        <ModalityCard
          title="WiFi"
          icon="wifi-outline"
          color={colors.detection.wifi}
          count={analytics.modalityBreakdown.wifi.count}
          metrics={[
            { label: 'Channels active', value: `${analytics.modalityBreakdown.wifi.channelsActive}` },
            { label: 'Probe request share', value: `${analytics.modalityBreakdown.wifi.probeRequestPercent}%` },
          ]}
        />
        <ModalityCard
          title="BLE"
          icon="bluetooth-outline"
          color={colors.detection.bluetooth}
          count={analytics.modalityBreakdown.ble.count}
          metrics={[
            { label: 'Phone-likely', value: `${analytics.modalityBreakdown.ble.phonePercent}%` },
            { label: 'Apple markers', value: `${analytics.modalityBreakdown.ble.applePercent}%` },
            { label: 'Beacon-like', value: `${analytics.modalityBreakdown.ble.beaconPercent}%` },
          ]}
        />
        <ModalityCard
          title="Cellular"
          icon="cellular-outline"
          color={colors.detection.cellular}
          count={analytics.modalityBreakdown.cellular.count}
          metrics={[
            { label: 'Avg peak power', value: `${analytics.modalityBreakdown.cellular.avgPeakDbm} dBm` },
            { label: 'Burst duration', value: `${analytics.modalityBreakdown.cellular.avgBurstDurationMs} ms` },
            { label: 'Noise floor', value: `${analytics.modalityBreakdown.cellular.avgNoiseFloorDbm} dBm` },
          ]}
        />
      </View>

      <ChartCard
        title="Cross-Modal Correlations"
        subtitle="Devices detected across multiple signal types"
      >
        {/* Venn diagram */}
        <View style={styles.vennContainer}>
          <View
            style={[
              styles.vennCircle,
              styles.vennLeft,
              { borderColor: `${colors.detection.wifi}66` },
            ]}
          >
            <Text
              variant="caption2"
              style={[styles.vennLabel, styles.vennLabelLeft, { color: colors.detection.wifi }]}
            >
              WiFi
            </Text>
          </View>
          <View
            style={[
              styles.vennCircle,
              styles.vennRight,
              { borderColor: `${colors.detection.bluetooth}66` },
            ]}
          >
            <Text
              variant="caption2"
              style={[styles.vennLabel, styles.vennLabelRight, { color: colors.detection.bluetooth }]}
            >
              BLE
            </Text>
          </View>
          <View style={styles.vennOverlap}>
            <Text variant="title3" weight="bold">
              {analytics.crossModalStats.wifiBleLinks}
            </Text>
          </View>
        </View>
        <View style={styles.crossModalGrid}>
          <View style={[styles.crossModalCard, { backgroundColor: colors.tertiarySystemBackground }]}>
            <Text variant="title3" weight="bold">
              {analytics.crossModalStats.wifiBleLinks}
            </Text>
            <Text variant="caption1" color="secondaryLabel">
              WiFi↔BLE Links
            </Text>
            <Text variant="caption2" color="tertiaryLabel">
              Avg confidence {analytics.crossModalStats.avgLinkConfidence}%
            </Text>
          </View>
          <View style={[styles.crossModalCard, { backgroundColor: colors.tertiarySystemBackground }]}>
            <Text variant="title3" weight="bold">
              {analytics.crossModalStats.phantomMerges}
            </Text>
            <Text variant="caption1" color="secondaryLabel">
              Phantom Merges
            </Text>
            <Text variant="caption2" color="tertiaryLabel">
              MAC rotations caught
            </Text>
          </View>
        </View>
      </ChartCard>

      <MultiLineChart
        title="Signal Strength Trend"
        subtitle="Average RSSI by modality (closer to 0 = stronger)"
        invertYAxis
        series={[
          {
            color: colors.detection.wifi,
            data: analytics.rssiTrend.map(point => ({
              label: point.date.slice(5),
              value: point.wifiAvgRssi,
            })),
          },
          {
            color: colors.detection.bluetooth,
            dashArray: [6, 3],
            data: analytics.rssiTrend.map(point => ({
              label: point.date.slice(5),
              value: point.bleAvgRssi,
            })),
          },
          {
            color: colors.detection.cellular,
            dashArray: [2, 4],
            data: analytics.rssiTrend.map(point => ({
              label: point.date.slice(5),
              value: point.cellularAvgRssi,
            })),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  confidenceList: {
    width: '100%',
    gap: 14,
  },
  confidenceRow: {
    gap: 6,
    width: '100%',
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confidenceTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 999,
  },
  modalityStack: {
    gap: 12,
  },
  vennContainer: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  vennCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  vennLeft: {
    left: '22%',
  },
  vennRight: {
    right: '22%',
  },
  vennLabel: {
    position: 'absolute',
    top: 8,
  },
  vennLabelLeft: {
    left: 12,
  },
  vennLabelRight: {
    right: 12,
  },
  vennOverlap: {
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  crossModalGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  crossModalCard: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
});
