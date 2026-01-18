/**
 * AlertListScreen - Production Grade
 *
 * Premium alert list with:
 * - Animated header with blur on scroll
 * - Threat summary hero section
 * - Staggered entrance animations for cards
 * - Pull-to-refresh with haptic feedback
 * - Screen-specific gradient accents
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAlerts } from '@hooks/api/useAlerts';
import { useDevices } from '@hooks/api/useDevices';
import { AlertCard, AlertsHeaderHero } from '@components/organisms';
import {
  ScreenLayout,
  EmptyState,
  LoadingState,
  ErrorState,
} from '@components/templates';
import { SearchBar } from '@components/molecules/SearchBar';
import { Button } from '@components/atoms/Button';
import { Icon } from '@components/atoms/Icon';
import { Alert, ThreatLevel } from '@types';
import { useTheme } from '@hooks/useTheme';

// Threat level configuration
const THREAT_LEVELS: ThreatLevel[] = ['critical', 'high', 'medium', 'low'];

const THREAT_LABELS: Record<ThreatLevel, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const AlertListScreen = ({ navigation }: any) => {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors;
  const { data: alerts, isLoading, error, refetch } = useAlerts();
  const { data: devices } = useDevices();
  const [search, setSearch] = useState('');

  // Create device name lookup map
  const deviceNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (devices) {
      devices.forEach((device: any) => {
        map[device.id] = device.name;
      });
    }
    return map;
  }, [devices]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedThreatFilter, setSelectedThreatFilter] =
    useState<ThreatLevel | null>(null);

  // Animated scroll value for header
  const scrollY = useRef(new Animated.Value(0)).current;

  // Calculate threat level counts
  const threatCounts = useMemo(() => {
    if (!alerts) return { critical: 0, high: 0, medium: 0, low: 0, total: 0 };

    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: alerts.length,
    };

    alerts.forEach((alert: Alert) => {
      if (alert.threatLevel in counts) {
        counts[alert.threatLevel as ThreatLevel]++;
      }
    });

    return counts;
  }, [alerts]);

  // Filter alerts by search and selected threat level
  const filteredAlerts = useMemo(() => {
    let result = alerts || [];

    // Filter by search
    if (search) {
      result = result.filter(
        (alert: Alert) =>
          alert.detectionType.toLowerCase().includes(search.toLowerCase()) ||
          alert.deviceId.toLowerCase().includes(search.toLowerCase()) ||
          (alert.macAddress &&
            alert.macAddress.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Filter by threat level
    if (selectedThreatFilter) {
      result = result.filter(
        (alert: Alert) => alert.threatLevel === selectedThreatFilter
      );
    }

    return result;
  }, [alerts, search, selectedThreatFilter]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load alerts" />;

  const handleDismiss = (alertId: string) => {
    console.log('Dismissing alert:', alertId);
  };

  const handleWhitelist = (macAddress: string) => {
    console.log('Whitelisting MAC address:', macAddress);
  };

  const handleRefresh = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleFilterSelect = (level: ThreatLevel | null) => {
    setSelectedThreatFilter(level);
  };

  // Hero section component
  const renderListHeader = () => (
    <View>
      {/* Threat summary hero */}
      {threatCounts.total > 0 && (
        <AlertsHeaderHero
          threatCounts={threatCounts}
          selectedFilter={selectedThreatFilter}
          onFilterSelect={handleFilterSelect}
        />
      )}
    </View>
  );

  return (
    <ScreenLayout
      header={{
        title: 'Alerts',
        largeTitle: true,
        rightActions: (
          <Button
            buttonStyle="plain"
            onPress={() => navigation.navigate('AlertFilter')}
            leftIcon={<Icon name="options" size={20} color="systemBlue" />}
          >
            Filter
          </Button>
        ),
      }}
      scrollable={false}
      stickyHeader={
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search alerts..."
          showCancelButton={true}
          onCancel={() => setSearch('')}
        />
      }
    >
      <Animated.FlatList
        data={filteredAlerts}
        renderItem={({ item, index }) => (
          <AlertCard
            alert={item}
            deviceName={deviceNameMap[item.deviceId]}
            onPress={() =>
              navigation.navigate('AlertDetail', { alertId: item.id })
            }
            onDismiss={handleDismiss}
            onWhitelist={handleWhitelist}
            index={index}
            animateEntrance={true}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderListHeader}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.systemGray}
            titleColor={colors.secondaryLabel}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title={
              selectedThreatFilter
                ? `No ${THREAT_LABELS[selectedThreatFilter]} Alerts`
                : 'No Alerts'
            }
            message={
              selectedThreatFilter
                ? 'Try selecting a different filter'
                : 'You have no security alerts'
            }
          />
        }
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
});
