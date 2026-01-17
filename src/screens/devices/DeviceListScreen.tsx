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
import { DeviceCard, DevicesHeaderHero } from '@components/organisms';
import {
  ScreenLayout,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@components/templates';
import { Button } from '@components/atoms/Button';
import { Icon } from '@components/atoms/Icon';
import { useTheme } from '@hooks/useTheme';
import { Device } from '@types';

export const DeviceListScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { data: devices, isLoading, error, refetch } = useDevices();
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Sort devices: offline first, then by name
  const sortedDevices = useMemo(() => {
    if (!devices) return [];

    return [...devices].sort((a: Device, b: Device) => {
      // Offline devices first
      if (!a.online && b.online) return -1;
      if (a.online && !b.online) return 1;
      // Then alphabetical
      return a.name.localeCompare(b.name);
    });
  }, [devices]);

  const stats = useMemo(() => {
    if (!devices) return { total: 0, online: 0, offline: 0 };

    return {
      total: devices.length,
      online: devices.filter((d: Device) => d.online).length,
      offline: devices.filter((d: Device) => !d.online).length,
    };
  }, [devices]);

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

  const renderListHeader = () => (
    <View>
      {stats.total > 0 && <DevicesHeaderHero deviceCounts={stats} />}
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
        keyExtractor={(item) => item.id}
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
            message="Add your first TrailSense detector to start monitoring."
            action={{
              label: 'Add Device',
              onPress: handleAddDevice,
            }}
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
  listContent: {
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
});
