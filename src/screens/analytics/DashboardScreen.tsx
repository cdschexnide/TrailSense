import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { VictoryChart, VictoryLine, VictoryBar, VictoryPie, VictoryTheme } from 'victory-native';
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
        <VictoryChart theme={VictoryTheme.material} height={250}>
          <VictoryLine
            data={analytics.dailyDetections}
            x="date"
            y="count"
            style={{
              data: { stroke: '#4CAF50', strokeWidth: 2 },
            }}
          />
        </VictoryChart>
      </ChartCard>

      <ChartCard title="Detection Types">
        <VictoryPie
          data={[
            { x: 'Cellular', y: analytics.cellularCount },
            { x: 'WiFi', y: analytics.wifiCount },
            { x: 'Bluetooth', y: analytics.bluetoothCount },
          ]}
          colorScale={['#9C27B0', '#2196F3', '#00BCD4']}
          height={250}
          style={{
            labels: { fill: '#FFFFFF', fontSize: 12 },
          }}
        />
      </ChartCard>

      <ChartCard title="Peak Hours">
        <VictoryChart theme={VictoryTheme.material} height={250}>
          <VictoryBar
            data={analytics.hourlyDistribution}
            x="hour"
            y="count"
            style={{
              data: { fill: '#FF9800' },
            }}
          />
        </VictoryChart>
      </ChartCard>

      <ChartCard title="Threat Level Distribution">
        <VictoryPie
          data={[
            { x: 'Critical', y: analytics.criticalCount || 0 },
            { x: 'High', y: analytics.highCount || 0 },
            { x: 'Medium', y: analytics.mediumCount || 0 },
            { x: 'Low', y: analytics.lowCount || 0 },
          ]}
          colorScale={['#FF0000', '#FF6B00', '#FFB800', '#00C853']}
          height={250}
          style={{
            labels: { fill: '#FFFFFF', fontSize: 12 },
          }}
        />
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
});
