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

import React, { useState, useMemo } from 'react';
import { RefreshControl, StyleSheet, View, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAlerts } from '@hooks/api/useAlerts';
import { useDevices } from '@hooks/api/useDevices';
import { AlertCard } from '@components/organisms/AlertCard';
import { AlertsHeaderHero } from '@components/organisms/HeaderHero';
import { ScreenLayout, EmptyState, ErrorState } from '@components/templates';
import { SearchBar } from '@components/molecules/SearchBar';
import { Button, Icon, SkeletonCard } from '@components/atoms';
import { Alert, Device, ThreatLevel } from '@types';
import { useTheme } from '@hooks/useTheme';
import { useBlockedDevices } from '@hooks/useBlockedDevices';
import { AlertsStackParamList, AlertFilterParams } from '@navigation/types';

// Threat level configuration
const THREAT_LABELS: Record<ThreatLevel, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

type Props = NativeStackScreenProps<AlertsStackParamList, 'AlertList'>;

export const AlertListScreen = ({ navigation, route }: Props) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { data: alerts, isLoading, error, refetch } = useAlerts();
  const { data: devices } = useDevices();
  const { isBlocked } = useBlockedDevices();
  const [search, setSearch] = useState('');
  const routeFilters = route.params?.filters;
  const selectedThreatFilters = useMemo(
    () => routeFilters?.threatLevels ?? [],
    [routeFilters?.threatLevels]
  );
  const selectedDetectionTypes = useMemo(
    () => routeFilters?.detectionTypes ?? [],
    [routeFilters?.detectionTypes]
  );

  // Create device name lookup map
  const deviceNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (devices) {
      devices.forEach((device: Device) => {
        map[device.id] = device.name;
      });
    }
    return map;
  }, [devices]);
  const [refreshing, setRefreshing] = useState(false);
  // Animated scroll value for header
  const scrollY = useMemo(() => new Animated.Value(0), []);

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
    if (selectedThreatFilters.length > 0) {
      result = result.filter((alert: Alert) =>
        selectedThreatFilters.includes(alert.threatLevel)
      );
    }

    if (selectedDetectionTypes.length > 0) {
      result = result.filter((alert: Alert) =>
        selectedDetectionTypes.includes(alert.detectionType)
      );
    }

    result = result.filter((alert: Alert) => !isBlocked(alert.macAddress));

    return result;
  }, [
    alerts,
    search,
    selectedThreatFilters,
    selectedDetectionTypes,
    isBlocked,
  ]);

  if (isLoading) {
    return (
      <ScreenLayout
        header={{
          title: 'Alerts',
          largeTitle: true,
        }}
        scrollable={true}
      >
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard
              key={index}
              height={76}
              borderRadius={12}
              style={styles.alertSkeleton}
            />
          ))}
        </View>
      </ScreenLayout>
    );
  }

  if (error) return <ErrorState message="Failed to load alerts" />;

  const handleDismiss = () => {};

  const handleAddToKnown = (macAddress: string) => {
    navigation.getParent()?.navigate('MoreTab', {
      screen: 'AddKnownDevice',
      params: { macAddress },
    });
  };

  const handleRefresh = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleFilterSelect = (level: ThreatLevel | null) => {
    const nextFilters: AlertFilterParams = {
      threatLevels: level ? [level] : [],
      detectionTypes: selectedDetectionTypes,
    };

    navigation.setParams({ filters: nextFilters });
  };

  // Hero section component
  const renderListHeader = () => (
    <View>
      {/* Threat summary hero */}
      {threatCounts.total > 0 && (
        <AlertsHeaderHero
          threatCounts={threatCounts}
          selectedFilter={selectedThreatFilters[0] || null}
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
            onPress={() =>
              navigation.navigate('AlertFilter', {
                filters: {
                  threatLevels: selectedThreatFilters,
                  detectionTypes: selectedDetectionTypes,
                },
              })
            }
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
            onAddToKnown={handleAddToKnown}
            index={index}
            animateEntrance={true}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="on-drag"
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
            icon={search ? 'search-outline' : 'notifications-off-outline'}
            title={
              search
                ? 'No Results'
                : selectedThreatFilters.length > 0
                  ? `No ${selectedThreatFilters
                      .map(level => THREAT_LABELS[level])
                      .join(', ')} Alerts`
                  : selectedDetectionTypes.length > 0
                    ? 'No Matching Alert Types'
                    : 'No Alerts'
            }
            message={
              search
                ? `No alerts matching "${search}"`
                : selectedThreatFilters.length > 0
                  ? 'Try selecting a different filter'
                  : selectedDetectionTypes.length > 0
                    ? 'Try selecting a different alert type filter'
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
  skeletonContainer: {
    paddingHorizontal: 4,
    paddingTop: 16,
  },
  alertSkeleton: {
    marginBottom: 8,
    marginHorizontal: 4,
  },
  listContent: {
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
});
