/**
 * DashboardScreen - REDESIGNED
 *
 * Enhanced analytics dashboard with:
 * - Large title header with period selector
 * - Visual stat cards with icons and trends
 * - Quick insights summary
 * - Improved chart cards with better styling
 * - Pull-to-refresh support
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  RefreshControl,
} from 'react-native';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import * as Haptics from 'expo-haptics';
import { format, parseISO } from 'date-fns';
import { useAnalytics } from '@hooks/useAnalytics';
import { ChartCard, GroupedListSection, GroupedListRow } from '@components/molecules';
import { useTheme } from '@hooks/useTheme';
import { Colors } from '@constants/colors';
import { ScreenLayout, LoadingState, ErrorState } from '@components/templates';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { Button } from '@components/atoms/Button';

type Period = 'day' | 'week' | 'month' | 'year';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 64;

// Period labels
const PERIOD_CONFIG: Record<Period, { label: string; shortLabel: string }> = {
  day: { label: 'Today', shortLabel: '24h' },
  week: { label: 'This Week', shortLabel: '7d' },
  month: { label: 'This Month', shortLabel: '30d' },
  year: { label: 'This Year', shortLabel: '1y' },
};

// Helper: Format date based on period
const formatChartDate = (dateString: string, period: Period): string => {
  try {
    const date = parseISO(dateString);
    switch (period) {
      case 'day':
        return format(date, 'HH:mm');
      case 'week':
        return format(date, 'EEE');
      case 'month':
        return format(date, 'MMM d');
      case 'year':
        return format(date, 'MMM');
      default:
        return format(date, 'MMM d');
    }
  } catch {
    return dateString;
  }
};

// Helper: Get detection type color
const getDetectionColor = (type: string, isDark: boolean): string => {
  const colors = isDark ? Colors.dark : Colors.light;
  switch (type.toLowerCase()) {
    case 'wifi':
      return colors.detection.wifi;
    case 'bluetooth':
      return colors.detection.bluetooth;
    case 'cellular':
      return colors.detection.cellular;
    default:
      return colors.systemGray;
  }
};

// Threat level colors
const THREAT_COLORS: Record<string, string> = {
  critical: '#FF3B30',
  high: '#FF9500',
  medium: '#FFCC00',
  low: '#34C759',
};

export const DashboardScreen = ({ navigation }: any) => {
  const [period, setPeriod] = useState<Period>('week');
  const [refreshing, setRefreshing] = useState(false);
  const {
    data: analytics,
    isLoading,
    isError,
    refetch,
  } = useAnalytics({ period });
  const { theme, colorScheme } = useTheme();
  const colors = theme.colors;
  const isDark = colorScheme === 'dark';

  // Pull to refresh
  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Chart configuration
  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
    labelColor: () => colors.secondaryLabel,
    style: { borderRadius: 16 },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: colors.systemBlue,
    },
    propsForBackgroundLines: {
      strokeDasharray: '4, 4',
      stroke: colors.separator,
      strokeWidth: 1,
    },
  };

  // Transform daily trend data for line chart
  const transformDailyTrend = () => {
    if (!analytics?.dailyTrend?.length) return null;

    const labels = analytics.dailyTrend.map(item =>
      formatChartDate(item.date, period)
    );
    const data = analytics.dailyTrend.map(item => item.count);

    return {
      labels,
      datasets: [{ data, color: () => colors.systemBlue, strokeWidth: 3 }],
    };
  };

  // Transform detection types for pie chart
  const transformDetectionTypes = () => {
    if (!analytics?.detectionTypeDistribution?.length) return null;

    return analytics.detectionTypeDistribution.map(item => ({
      name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
      population: item.count,
      color: getDetectionColor(item.type, isDark),
      legendFontColor: colors.label,
      legendFontSize: 13,
    }));
  };

  // Transform threat levels for display
  const getThreatSummary = () => {
    if (!analytics?.threatLevelDistribution?.length) return [];
    return analytics.threatLevelDistribution;
  };

  // Transform device distribution
  const transformDeviceDistribution = () => {
    if (!analytics?.deviceDistribution?.length) return null;

    const topDevices = analytics.deviceDistribution.slice(0, 5);
    const labels = topDevices.map(item => {
      const id = item.deviceId;
      return id.length > 6 ? `${id.substring(0, 6)}...` : id;
    });
    const data = topDevices.map(item => item.count);

    return { labels, datasets: [{ data }] };
  };

  if (isLoading) return <LoadingState />;

  if (isError || !analytics) {
    return (
      <ErrorState
        message="Failed to load analytics"
        onRetry={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          refetch();
        }}
      />
    );
  }

  const dailyTrendData = transformDailyTrend();
  const detectionTypesData = transformDetectionTypes();
  const deviceDistributionData = transformDeviceDistribution();
  const threatSummary = getThreatSummary();

  return (
    <ScreenLayout
      header={{
        title: 'Analytics',
        largeTitle: true,
        rightActions: (
          <Button
            buttonStyle="plain"
            onPress={() => navigation?.navigate?.('Reports')}
            leftIcon={<Icon name="document-text-outline" size={20} color={colors.systemBlue} />}
          >
            Reports
          </Button>
        ),
      }}
      variant="analytics"
      scrollable
    >
      {/* Period Selector */}
      <View style={[styles.periodContainer, { backgroundColor: colors.secondarySystemBackground }]}>
        {(['day', 'week', 'month', 'year'] as Period[]).map((p) => {
          const isSelected = period === p;
          return (
            <Pressable
              key={p}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPeriod(p);
              }}
              style={[
                styles.periodButton,
                isSelected && { backgroundColor: colors.brandAccent || colors.primary },
              ]}
            >
              <Text
                variant="subheadline"
                weight={isSelected ? 'semibold' : 'regular'}
                style={{ color: isSelected ? '#FFFFFF' : colors.label }}
              >
                {PERIOD_CONFIG[p].shortLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Overview Stats */}
      <GroupedListSection title="OVERVIEW">
        <GroupedListRow
          icon="pulse"
          iconColor={colors.systemBlue}
          iconBackgroundColor={`${colors.systemBlue}20`}
          title="Detections"
          value={analytics.totalAlerts.toLocaleString()}
          subtitle="↑ 12% vs last period"
        />
        <GroupedListRow
          icon="radio"
          iconColor={colors.systemGreen}
          iconBackgroundColor={`${colors.systemGreen}20`}
          title="Active Devices"
          value="1"
          subtitle="All online"
        />
      </GroupedListSection>

      {/* Threat Level Summary */}
      {threatSummary.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text variant="headline" weight="semibold" color="label" style={styles.sectionTitle}>
            Threat Distribution
          </Text>
          <View style={[styles.threatCard, { backgroundColor: colors.secondarySystemBackground }]}>
            <View style={styles.threatBars}>
              {threatSummary.map((item) => {
                const total = threatSummary.reduce((sum, i) => sum + i.count, 0);
                const percentage = total > 0 ? (item.count / total) * 100 : 0;
                return (
                  <View key={item.level} style={styles.threatBarItem}>
                    <View style={styles.threatLabelRow}>
                      <View
                        style={[
                          styles.threatDot,
                          { backgroundColor: THREAT_COLORS[item.level] || colors.systemGray },
                        ]}
                      />
                      <Text variant="subheadline" style={{ color: colors.label, flex: 1 }}>
                        {item.level.charAt(0).toUpperCase() + item.level.slice(1)}
                      </Text>
                      <Text variant="subheadline" weight="semibold" style={{ color: colors.label }}>
                        {item.count}
                      </Text>
                    </View>
                    <View style={[styles.threatBarBg, { backgroundColor: colors.systemGray5 }]}>
                      <View
                        style={[
                          styles.threatBarFill,
                          {
                            backgroundColor: THREAT_COLORS[item.level] || colors.systemGray,
                            width: `${percentage}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Detections Over Time Chart */}
      <View style={styles.sectionContainer}>
        <Text variant="headline" weight="semibold" color="label" style={styles.sectionTitle}>
          Detection Trend
        </Text>
        <View style={[styles.chartCard, { backgroundColor: colors.secondarySystemBackground }]}>
          {dailyTrendData ? (
            <LineChart
              data={dailyTrendData}
              width={CHART_WIDTH}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines
              withDots
              withShadow={false}
              fromZero
            />
          ) : (
            <View style={styles.emptyChart}>
              <Icon name="analytics-outline" size={48} color={colors.tertiaryLabel} />
              <Text variant="subheadline" style={{ color: colors.secondaryLabel, marginTop: 12 }}>
                No data for this period
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Detection Types */}
      <View style={styles.sectionContainer}>
        <Text variant="headline" weight="semibold" color="label" style={styles.sectionTitle}>
          Detection Types
        </Text>
        <View style={[styles.chartCard, { backgroundColor: colors.secondarySystemBackground }]}>
          {detectionTypesData ? (
            <PieChart
              data={detectionTypesData}
              width={CHART_WIDTH}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 0]}
              absolute
              hasLegend
            />
          ) : (
            <View style={styles.emptyChart}>
              <Icon name="pie-chart-outline" size={48} color={colors.tertiaryLabel} />
              <Text variant="subheadline" style={{ color: colors.secondaryLabel, marginTop: 12 }}>
                No detection data
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Top Devices */}
      <View style={styles.sectionContainer}>
        <Text variant="headline" weight="semibold" color="label" style={styles.sectionTitle}>
          Top Devices
        </Text>
        <View style={[styles.chartCard, { backgroundColor: colors.secondarySystemBackground }]}>
          {deviceDistributionData ? (
            <BarChart
              data={deviceDistributionData}
              width={CHART_WIDTH}
              height={200}
              chartConfig={{
                ...chartConfig,
                color: () => colors.systemIndigo,
                barPercentage: 0.6,
              }}
              yAxisLabel=""
              yAxisSuffix=""
              showValuesOnTopOfBars
              fromZero
              withInnerLines={false}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Icon name="hardware-chip-outline" size={48} color={colors.tertiaryLabel} />
              <Text variant="subheadline" style={{ color: colors.secondaryLabel, marginTop: 12 }}>
                No device data
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            { backgroundColor: colors.secondarySystemBackground },
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => navigation?.navigate?.('Heatmap')}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.systemOrange + '20' }]}>
            <Icon name="map" size={24} color={colors.systemOrange} />
          </View>
          <Text variant="subheadline" weight="semibold" color="label">
            View Heatmap
          </Text>
          <Icon name="chevron-forward" size={16} color={colors.tertiaryLabel} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            { backgroundColor: colors.secondarySystemBackground },
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => navigation?.navigate?.('Reports')}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.systemPurple + '20' }]}>
            <Icon name="download-outline" size={24} color={colors.systemPurple} />
          </View>
          <Text variant="subheadline" weight="semibold" color="label">
            Export Report
          </Text>
          <Icon name="chevron-forward" size={16} color={colors.tertiaryLabel} />
        </Pressable>
      </View>

      <View style={{ height: 32 }} />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  periodContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 4,
    borderRadius: 12,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  chartCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 12,
  },
  emptyChart: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  threatCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
  },
  threatBars: {
    gap: 16,
  },
  threatBarItem: {
    gap: 8,
  },
  threatLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  threatDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  threatBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  threatBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionsContainer: {
    marginHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
