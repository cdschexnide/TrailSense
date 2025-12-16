import React from 'react';
import { View, StyleSheet, FlatList, Pressable, ScrollView } from 'react-native';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { useDeviceHistory } from '@hooks/useAnalytics';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useTheme } from '@hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RouteParams = {
  DeviceHistory: {
    macAddress: string;
  };
};

// Mock fingerprint data for demo
const getMockFingerprint = (macAddress: string) => ({
  id: `fp-${Date.now()}`,
  macAddress,
  firstSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  lastSeen: new Date().toISOString(),
  totalVisits: 12,
  averageDuration: 450,
  commonHours: [9, 10, 14, 17],
  category: 'Regular Visitor',
  detections: [
    { timestamp: new Date().toISOString(), rssi: -55, type: 'wifi' },
    { timestamp: new Date(Date.now() - 3600000).toISOString(), rssi: -62, type: 'bluetooth' },
    { timestamp: new Date(Date.now() - 7200000).toISOString(), rssi: -48, type: 'wifi' },
    { timestamp: new Date(Date.now() - 86400000).toISOString(), rssi: -70, type: 'cellular' },
    { timestamp: new Date(Date.now() - 172800000).toISOString(), rssi: -58, type: 'wifi' },
  ],
});

export const DeviceHistoryScreen = () => {
  const route = useRoute<RouteProp<RouteParams, 'DeviceHistory'>>();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { macAddress } = route.params;
  const { data: apiFingerprint, isLoading } = useDeviceHistory(macAddress);

  // Use API data or fallback to mock data
  const fingerprint = apiFingerprint || getMockFingerprint(macAddress);

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
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'wifi': return colors.systemBlue;
      case 'bluetooth': return colors.systemCyan || '#00BCD4';
      case 'cellular': return colors.systemPurple;
      default: return colors.systemGray;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.systemBackground }]}>
        <Text variant="body" color="secondaryLabel">Loading device history...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.systemBackground }]}>
      {/* Header with back button */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.separator }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-back" size={28} color={colors.systemBlue} />
          <Text variant="body" style={{ color: colors.systemBlue }}>Back</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text variant="largeTitle" weight="bold" color="label">Device History</Text>
          <Text variant="subheadline" color="secondaryLabel" style={styles.macText}>{macAddress}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.secondarySystemBackground }]}>
            <Text variant="largeTitle" weight="bold" style={{ color: colors.systemGreen }}>
              {fingerprint.totalVisits}
            </Text>
            <Text variant="caption1" color="secondaryLabel">Total Visits</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.secondarySystemBackground }]}>
            <Text variant="largeTitle" weight="bold" style={{ color: colors.systemBlue }}>
              {formatDuration(fingerprint.averageDuration)}
            </Text>
            <Text variant="caption1" color="secondaryLabel">Avg Duration</Text>
          </View>
        </View>

        {/* Timeline Section */}
        <View style={[styles.section, { backgroundColor: colors.secondarySystemBackground }]}>
          <Text variant="headline" weight="semibold" color="label" style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineRow}>
            <Text variant="subheadline" color="secondaryLabel">First Seen</Text>
            <Text variant="subheadline" weight="semibold" color="label">{formatDate(fingerprint.firstSeen)}</Text>
          </View>
          <View style={styles.timelineRow}>
            <Text variant="subheadline" color="secondaryLabel">Last Seen</Text>
            <Text variant="subheadline" weight="semibold" color="label">{formatDate(fingerprint.lastSeen)}</Text>
          </View>
        </View>

        {/* Common Hours */}
        {fingerprint.commonHours.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.secondarySystemBackground }]}>
            <Text variant="headline" weight="semibold" color="label" style={styles.sectionTitle}>Common Visit Times</Text>
            <View style={styles.hoursList}>
              {fingerprint.commonHours.map((hour: number) => (
                <View key={hour} style={[styles.hourBadge, { borderColor: colors.systemGreen }]}>
                  <Text variant="caption1" weight="semibold" style={{ color: colors.systemGreen }}>
                    {hour}:00 - {hour + 1}:00
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Category */}
        <View style={[styles.section, { backgroundColor: colors.secondarySystemBackground }]}>
          <Text variant="headline" weight="semibold" color="label" style={styles.sectionTitle}>Category</Text>
          <View style={[styles.categoryBadge, { backgroundColor: colors.systemBlue }]}>
            <Text variant="subheadline" weight="semibold" style={{ color: '#FFFFFF' }}>
              {fingerprint.category}
            </Text>
          </View>
        </View>

        {/* Recent Detections */}
        <View style={[styles.section, { backgroundColor: colors.secondarySystemBackground }]}>
          <Text variant="headline" weight="semibold" color="label" style={styles.sectionTitle}>
            Recent Detections ({fingerprint.detections.length})
          </Text>
          {fingerprint.detections.slice(0, 10).map((detection: any, index: number) => (
            <View key={index} style={[styles.detectionCard, { borderBottomColor: colors.separator }]}>
              <View style={styles.detectionHeader}>
                <Text variant="subheadline" weight="semibold" color="label">
                  {formatDate(detection.timestamp)}
                </Text>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(detection.type) }]}>
                  <Text variant="caption2" weight="semibold" style={{ color: '#FFFFFF', textTransform: 'uppercase' }}>
                    {detection.type}
                  </Text>
                </View>
              </View>
              <Text variant="caption1" color="secondaryLabel">RSSI: {detection.rssi} dBm</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 16,
  },
  scrollView: {
    flex: 1,
  },
  titleSection: {
    padding: 16,
    paddingTop: 24,
  },
  macText: {
    fontFamily: 'monospace',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  hoursList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hourBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  detectionCard: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
});
