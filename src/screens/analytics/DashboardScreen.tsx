import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Text, TouchableOpacity } from 'react-native';
// TODO: Replace victory-native with a lighter charting library compatible with Expo Go
// import { VictoryChart, VictoryLine, VictoryBar, VictoryPie, VictoryTheme } from 'victory-native';
import { useAnalytics } from '@hooks/useAnalytics';
import { StatCard, ChartCard } from '@components/molecules';

type Period = 'day' | 'week' | 'month' | 'year';

export const DashboardScreen = () => {
  const [period, setPeriod] = useState<Period>('week');
  const { data: analytics, isLoading } = useAnalytics({ period });

  if (isLoading || !analytics) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <View style={styles.periodSelector}>
          {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodButton,
                period === p && styles.periodButtonActive,
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  period === p && styles.periodButtonTextActive,
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
          value={analytics.totalDetections}
          change="+12%"
        />
        <StatCard
          title="Unknown Devices"
          value={analytics.unknownDevices}
          change="-5%"
        />
      </View>

      <ChartCard title="Detections Over Time">
        <View style={styles.chartPlaceholder}>
          <Text style={styles.placeholderText}>Chart temporarily disabled</Text>
          <Text style={styles.placeholderSubtext}>
            {analytics.dailyDetections.length} data points available
          </Text>
        </View>
      </ChartCard>

      <ChartCard title="Detection Types">
        <View style={styles.chartPlaceholder}>
          <Text style={styles.placeholderText}>Chart temporarily disabled</Text>
          <Text style={styles.placeholderSubtext}>
            Cellular: {analytics.cellularCount} | WiFi: {analytics.wifiCount} | BT: {analytics.bluetoothCount}
          </Text>
        </View>
      </ChartCard>

      <ChartCard title="Peak Hours">
        <View style={styles.chartPlaceholder}>
          <Text style={styles.placeholderText}>Chart temporarily disabled</Text>
          <Text style={styles.placeholderSubtext}>
            {analytics.hourlyDistribution.length} hours tracked
          </Text>
        </View>
      </ChartCard>

      <ChartCard title="Threat Level Distribution">
        <View style={styles.chartPlaceholder}>
          <Text style={styles.placeholderText}>Chart temporarily disabled</Text>
          <Text style={styles.placeholderSubtext}>
            Critical: {analytics.criticalCount || 0} | High: {analytics.highCount || 0} |
            Medium: {analytics.mediumCount || 0} | Low: {analytics.lowCount || 0}
          </Text>
        </View>
      </ChartCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    borderRadius: 6,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#4CAF50',
  },
  periodButtonText: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 20,
  },
  placeholderText: {
    color: '#999999',
    fontSize: 14,
    marginBottom: 8,
  },
  placeholderSubtext: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
  },
});
