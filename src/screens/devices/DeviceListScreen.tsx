// src/screens/devices/DeviceListScreen.tsx
/**
 * DeviceListScreen - Tesla Dashboard Style
 *
 * Flat device list with:
 * - Simple status hero (All Online / X Offline)
 * - Flat list (no grouping)
 * - Offline devices sorted to top
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
import { useDevices } from '@hooks/api/useDevices';
import { DeviceCard } from '@components/organisms/DeviceCard';
import { DevicesHeaderHero } from '@components/organisms/HeaderHero';
import { ScreenLayout, ErrorState, EmptyState } from '@components/templates';
import { Button, Icon, SkeletonCard } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { Device } from '@types';
import { isDeviceOnline } from '@utils/dateUtils';

export const DeviceListScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { data: devices, isLoading, error, refetch } = useDevices();
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Sort devices: offline first, then by name
  // Uses calculated online status based on lastSeen timestamp
  const sortedDevices = useMemo(() => {
    if (!devices) return [];

    return [...devices].sort((a: Device, b: Device) => {
      const aOnline = isDeviceOnline(a.lastSeen);
      const bOnline = isDeviceOnline(b.lastSeen);
      // Offline devices first
      if (!aOnline && bOnline) return -1;
      if (aOnline && !bOnline) return 1;
      // Then alphabetical
      return a.name.localeCompare(b.name);
    });
  }, [devices]);

  // Calculate stats using lastSeen-based online status
  const stats = useMemo(() => {
    if (!devices) return { total: 0, online: 0, offline: 0 };

    const onlineCount = devices.filter((d: Device) =>
      isDeviceOnline(d.lastSeen)
    ).length;
    return {
      total: devices.length,
      online: onlineCount,
      offline: devices.length - onlineCount,
    };
  }, [devices]);

  if (isLoading) {
    return (
      <ScreenLayout
        header={{
          title: 'Devices',
          largeTitle: true,
        }}
        scrollable={true}
      >
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard
              key={index}
              height={112}
              borderRadius={16}
              style={styles.deviceSkeleton}
            />
          ))}
        </View>
      </ScreenLayout>
    );
  }

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

  const renderListHeader = () => (
    <View>{stats.total > 0 && <DevicesHeaderHero deviceCounts={stats} />}</View>
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
      <FlatList
        data={sortedDevices}
        renderItem={({ item, index }) => (
          <DeviceCard
            device={item}
            onPress={() => handleDevicePress(item.id)}
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
            icon="hardware-chip-outline"
            title="No Devices"
            message="Add your first TrailSense detector to start monitoring."
            actionLabel="Add Device"
            onActionPress={handleAddDevice}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    paddingHorizontal: 4,
    paddingTop: 16,
  },
  deviceSkeleton: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
});
