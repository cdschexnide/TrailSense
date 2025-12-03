import React, { useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import * as Haptics from 'expo-haptics';
import { format, parseISO } from 'date-fns';
import { useAnalytics } from '@hooks/useAnalytics';
import { StatCard, ChartCard } from '@components/molecules';
import { useTheme } from '@hooks/useTheme';
import { Colors } from '@constants/colors';

type Period = 'day' | 'week' | 'month' | 'year';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 32; // Account for padding

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
  } catch (error) {
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

export const DashboardScreen = () => {
  const [period, setPeriod] = useState<Period>('week');
  const {
    data: analytics,
    isLoading,
    isError,
    refetch,
  } = useAnalytics({ period });
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  // Chart configuration for react-native-chart-kit
  const chartConfig = {
    backgroundColor: theme.colors.secondarySystemGroupedBackground,
    backgroundGradientFrom: theme.colors.secondarySystemGroupedBackground,
    backgroundGradientTo: theme.colors.secondarySystemGroupedBackground,
    decimalPlaces: 0,
    color: (opacity = 1) =>
      `rgba(${isDark ? '10, 132, 255' : '0, 122, 255'}, ${opacity})`,
    labelColor: (opacity = 1) =>
      `${theme.colors.label}${Math.round(opacity * 255)
        .toString(16)
        .padStart(2, '0')}`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.systemBlue,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: theme.colors.separator,
      strokeWidth: 1,
    },
  };

  // Transform daily trend data for line chart
  const transformDailyTrend = () => {
    if (
      !analytics ||
      !analytics.dailyTrend ||
      analytics.dailyTrend.length === 0
    ) {
      return null;
    }

    const labels = analytics.dailyTrend.map(item =>
      formatChartDate(item.date, period)
    );
    const data = analytics.dailyTrend.map(item => item.count);

    return {
      labels,
      datasets: [
        {
          data,
          color: () => theme.colors.systemBlue,
          strokeWidth: 3,
        },
      ],
    };
  };

  // Transform detection types for pie chart
  const transformDetectionTypes = () => {
    if (
      !analytics ||
      !analytics.detectionTypeDistribution ||
      analytics.detectionTypeDistribution.length === 0
    ) {
      return null;
    }

    return analytics.detectionTypeDistribution.map(item => ({
      name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
      population: item.count,
      color: getDetectionColor(item.type, isDark),
      legendFontColor: theme.colors.label,
      legendFontSize: 14,
    }));
  };

  // Transform threat levels for bar chart
  const transformThreatLevels = () => {
    if (
      !analytics ||
      !analytics.threatLevelDistribution ||
      analytics.threatLevelDistribution.length === 0
    ) {
      return null;
    }

    const labels = analytics.threatLevelDistribution.map(
      item => item.level.charAt(0).toUpperCase() + item.level.slice(1)
    );
    const data = analytics.threatLevelDistribution.map(item => item.count);

    return {
      labels,
      datasets: [
        {
          data,
        },
      ],
    };
  };

  // Transform device distribution for bar chart
  const transformDeviceDistribution = () => {
    if (
      !analytics ||
      !analytics.deviceDistribution ||
      analytics.deviceDistribution.length === 0
    ) {
      return null;
    }

    // Take top 5 devices
    const topDevices = analytics.deviceDistribution.slice(0, 5);
    const labels = topDevices.map(item => {
      // Shorten device ID for display
      const id = item.deviceId;
      return id.length > 8 ? `${id.substring(0, 8)}...` : id;
    });
    const data = topDevices.map(item => item.count);

    return {
      labels,
      datasets: [
        {
          data,
        },
      ],
    };
  };

  // Handle data point click with haptic feedback
  const handleDataPointClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // You can add a tooltip or alert here if needed
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.systemBackground },
        ]}
      >
        <Text style={[styles.loadingText, { color: theme.colors.label }]}>
          Loading analytics...
        </Text>
      </View>
    );
  }

  if (isError || !analytics) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.systemBackground },
        ]}
      >
        <Text style={[styles.errorText, { color: theme.colors.systemRed }]}>
          Failed to load analytics
        </Text>
        <Text
          style={[styles.errorSubtext, { color: theme.colors.secondaryLabel }]}
        >
          The server returned an error. Please try again.
        </Text>
        <TouchableOpacity
          style={[
            styles.retryButton,
            { backgroundColor: theme.colors.systemBlue },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            refetch();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dailyTrendData = transformDailyTrend();
  const detectionTypesData = transformDetectionTypes();
  const threatLevelsData = transformThreatLevels();
  const deviceDistributionData = transformDeviceDistribution();

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: theme.colors.systemBackground },
      ]}
    >
      <View
        style={[
          styles.header,
          { borderBottomWidth: 1, borderBottomColor: theme.colors.separator },
        ]}
      >
        <Text style={[styles.title, { color: theme.colors.label }]}>
          Analytics Dashboard
        </Text>
        <View style={styles.periodSelector}>
          {(['day', 'week', 'month', 'year'] as Period[]).map(p => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodButton,
                {
                  backgroundColor:
                    period === p
                      ? theme.colors.systemBlue
                      : theme.colors.secondarySystemFill,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPeriod(p);
              }}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  {
                    color: period === p ? '#FFFFFF' : theme.colors.label,
                  },
                ]}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          title="Total Detections"
          value={analytics.totalAlerts}
          change={{
            value: '+12%',
            trend: 'positive',
          }}
        />
        <StatCard
          title="Unique Devices"
          value={analytics.topDetectedDevices?.length || 0}
          change={{
            value: '-5%',
            trend: 'negative',
          }}
        />
      </View>

      <ChartCard title="Detections Over Time">
        {dailyTrendData ? (
          <LineChart
            data={dailyTrendData}
            width={CHART_WIDTH}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines
            withOuterLines
            withVerticalLines={false}
            withHorizontalLines
            withDots
            withShadow={false}
            onDataPointClick={handleDataPointClick}
            fromZero
          />
        ) : (
          <View style={styles.emptyState}>
            <Text
              style={[styles.emptyText, { color: theme.colors.secondaryLabel }]}
            >
              No data available for this period
            </Text>
          </View>
        )}
      </ChartCard>

      <ChartCard title="Detection Types">
        {detectionTypesData ? (
          <PieChart
            data={detectionTypesData}
            width={CHART_WIDTH}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 0]}
            absolute
            hasLegend
            style={styles.chart}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text
              style={[styles.emptyText, { color: theme.colors.secondaryLabel }]}
            >
              No detection type data available
            </Text>
          </View>
        )}
      </ChartCard>

      <ChartCard title="Device Distribution">
        {deviceDistributionData ? (
          <BarChart
            data={deviceDistributionData}
            width={CHART_WIDTH}
            height={220}
            chartConfig={chartConfig}
            yAxisLabel=""
            yAxisSuffix=""
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
            withInnerLines={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text
              style={[styles.emptyText, { color: theme.colors.secondaryLabel }]}
            >
              No device distribution data available
            </Text>
          </View>
        )}
      </ChartCard>

      <ChartCard title="Threat Level Distribution">
        {threatLevelsData ? (
          <BarChart
            data={threatLevelsData}
            width={CHART_WIDTH}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: () => theme.colors.systemOrange,
            }}
            yAxisLabel=""
            yAxisSuffix=""
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
            withInnerLines={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text
              style={[styles.emptyText, { color: theme.colors.secondaryLabel }]}
            >
              No threat level data available
            </Text>
          </View>
        )}
      </ChartCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44, // iOS minimum touch target
  },
  periodButtonActive: {
    // Will be styled with theme colors inline
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    // Will be styled with theme colors inline
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyState: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
