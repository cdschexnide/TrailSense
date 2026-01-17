/**
 * DeviceListScreen - Production Grade
 *
 * Premium device list with:
 * - Animated header with blur on scroll
 * - Stats summary hero section with gradient cards
 * - Grouped sections (Online/Offline)
 * - Staggered entrance animations for cards
 * - Pull-to-refresh with haptic feedback
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  SectionList,
  RefreshControl,
  StyleSheet,
  View,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useDevices } from '@hooks/api/useDevices';
import { DeviceCard, DevicesHeaderHero } from '@components/organisms';
import {
  ScreenLayout,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@components/templates';
import { Button } from '@components/atoms/Button';
import { Icon } from '@components/atoms/Icon';
import { Text } from '@components/atoms/Text';
import { useTheme } from '@hooks/useTheme';
import { Device } from '@types';

// Section type for grouped device list
interface DeviceSection {
  title: string;
  data: Device[];
  status: 'online' | 'offline';
}

export const DeviceListScreen = ({ navigation }: any) => {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors;
  const { data: devices, isLoading, error, refetch } = useDevices();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'online' | 'offline' | null>(null);

  // Animated scroll value for header
  const scrollY = useRef(new Animated.Value(0)).current;

  // Group devices by online/offline status
  const { sections, stats } = useMemo(() => {
    if (!devices || devices.length === 0) {
      return { sections: [], stats: { total: 0, online: 0, offline: 0 } };
    }

    const onlineDevices = devices.filter((d: Device) => d.online);
    const offlineDevices = devices.filter((d: Device) => !d.online);

    // Apply status filter
    let filteredDevices = devices;
    if (statusFilter === 'online') {
      filteredDevices = onlineDevices;
    } else if (statusFilter === 'offline') {
      filteredDevices = offlineDevices;
    }

    const deviceSections: DeviceSection[] = [];

    const filteredOnline = filteredDevices.filter((d: Device) => d.online);
    const filteredOffline = filteredDevices.filter((d: Device) => !d.online);

    if (filteredOnline.length > 0) {
      deviceSections.push({
        title: 'Online',
        data: filteredOnline,
        status: 'online',
      });
    }

    if (filteredOffline.length > 0) {
      deviceSections.push({
        title: 'Offline',
        data: filteredOffline,
        status: 'offline',
      });
    }

    return {
      sections: deviceSections,
      stats: {
        total: devices.length,
        online: onlineDevices.length,
        offline: offlineDevices.length,
      },
    };
  }, [devices, statusFilter]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load devices" />;

  const handleDevicePress = (deviceId: string) => {
    navigation.navigate('DeviceDetail', { deviceId });
  };

  const handleAddDevice = () => {
    navigation.navigate('AddDevice');
  };

  const handleRefresh = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Hero section with filter chips
  const renderListHeader = () => (
    <View>
      {stats.total > 0 && (
        <DevicesHeaderHero
          deviceCounts={stats}
          selectedFilter={statusFilter}
          onFilterSelect={setStatusFilter}
        />
      )}
    </View>
  );

  // Section header component
  const renderSectionHeader = ({ section }: { section: DeviceSection }) => (
    <View
      style={[
        styles.sectionHeader,
        { backgroundColor: colors.systemBackground },
      ]}
    >
      <View style={styles.sectionTitleRow}>
        <View
          style={[
            styles.sectionDot,
            {
              backgroundColor:
                section.status === 'online'
                  ? colors.systemGreen
                  : colors.systemRed,
            },
          ]}
        />
        <Text variant="headline" color="label" style={styles.sectionTitle}>
          {section.title}
        </Text>
      </View>
      <Text variant="caption1" color="tertiaryLabel">
        {section.data.length} {section.data.length === 1 ? 'device' : 'devices'}
      </Text>
    </View>
  );

  return (
    <ScreenLayout
      header={{
        title: 'Devices',
        largeTitle: true,
        rightActions: (
          <Button
            buttonStyle="plain"
            onPress={handleAddDevice}
            leftIcon={<Icon name="add" size={20} color="systemBlue" />}
          >
            Add
          </Button>
        ),
      }}
      scrollable={false}
    >
      <SectionList
        sections={sections}
        renderItem={({ item, index, section }) => {
          // Calculate global index for staggered animation
          const sectionIndex = sections.indexOf(section);
          const previousItemsCount = sections
            .slice(0, sectionIndex)
            .reduce((acc, s) => acc + s.data.length, 0);
          const globalIndex = previousItemsCount + index;

          return (
            <DeviceCard
              device={item}
              onPress={() => handleDevicePress(item.id)}
              index={globalIndex}
              animateEntrance={true}
            />
          );
        }}
        renderSectionHeader={renderSectionHeader}
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
            icon="hardware-chip-outline"
            title="No Devices"
            message="Add a device to start monitoring"
          />
        }
        stickySectionHeadersEnabled={false}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontWeight: '600',
  },
});
