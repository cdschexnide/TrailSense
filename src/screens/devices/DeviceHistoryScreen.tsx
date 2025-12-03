import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useDeviceHistory } from '@hooks/useAnalytics';
import { useRoute, RouteProp } from '@react-navigation/native';
// TODO: Replace victory-native with a lighter charting library compatible with Expo Go
// import { VictoryChart, VictoryLine, VictoryTheme } from 'victory-native';

type RouteParams = {
  DeviceHistory: {
    macAddress: string;
  };
};

export const DeviceHistoryScreen = () => {
  const route = useRoute<RouteProp<RouteParams, 'DeviceHistory'>>();
  const { macAddress } = route.params;
  const { data: fingerprint, isLoading } = useDeviceHistory(macAddress);

  if (isLoading || !fingerprint) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading device history...</Text>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const roundedSeconds = Math.round(seconds);
    const roundedMinutes = Math.round(seconds / 60);
    const roundedHours = Math.round(seconds / 3600);

    if (seconds < 60) return `${roundedSeconds}s`;
    if (seconds < 3600) return `${roundedMinutes}m`;
    return `${roundedHours}h`;
  };

  const renderDetection = ({ item }: { item: any }) => (
    <View style={styles.detectionCard}>
      <View style={styles.detectionHeader}>
        <Text style={styles.detectionDate}>{formatDate(item.timestamp)}</Text>
        <View
          style={[
            styles.badge,
            styles[`badge${item.type}` as keyof typeof styles],
          ]}
        >
          <Text style={styles.badgeText}>{item.type}</Text>
        </View>
      </View>
      <View style={styles.detectionDetails}>
        <Text style={styles.detectionLabel}>RSSI: {item.rssi} dBm</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Device History</Text>
        <Text style={styles.macAddress}>{macAddress}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{fingerprint.totalVisits}</Text>
          <Text style={styles.statLabel}>Total Visits</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {formatDuration(fingerprint.averageDuration)}
          </Text>
          <Text style={styles.statLabel}>Avg Duration</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>First Seen</Text>
            <Text style={styles.timelineValue}>
              {formatDate(fingerprint.firstSeen)}
            </Text>
          </View>
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Last Seen</Text>
            <Text style={styles.timelineValue}>
              {formatDate(fingerprint.lastSeen)}
            </Text>
          </View>
        </View>
      </View>

      {fingerprint.commonHours.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Visit Times</Text>
          <View style={styles.hourList}>
            {fingerprint.commonHours.map(hour => (
              <View key={hour} style={styles.hourBadge}>
                <Text style={styles.hourText}>
                  {hour}:00 - {hour + 1}:00
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category</Text>
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryBadge}>{fingerprint.category}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Signal Strength Over Time</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.placeholderText}>Chart temporarily disabled</Text>
          <Text style={styles.placeholderSubtext}>
            {fingerprint.detections.length} signal readings available
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Recent Detections ({fingerprint.detections.length})
        </Text>
        <FlatList
          data={fingerprint.detections.slice(-20).reverse()}
          renderItem={renderDetection}
          keyExtractor={(item, index) => index.toString()}
          scrollEnabled={false}
        />
      </View>
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
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  macAddress: {
    fontSize: 14,
    color: '#999999',
    fontFamily: 'monospace',
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999999',
    textTransform: 'uppercase',
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  timeline: {
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  timelineLabel: {
    fontSize: 14,
    color: '#999999',
  },
  timelineValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  hourList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hourBadge: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  hourText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryContainer: {
    alignItems: 'flex-start',
  },
  categoryBadge: {
    backgroundColor: '#2196F3',
    color: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: '600',
  },
  detectionCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  detectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detectionDate: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  badgecellular: {
    backgroundColor: '#9C27B0',
  },
  badgewifi: {
    backgroundColor: '#2196F3',
  },
  badgebluetooth: {
    backgroundColor: '#00BCD4',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detectionDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detectionLabel: {
    fontSize: 12,
    color: '#999999',
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
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
