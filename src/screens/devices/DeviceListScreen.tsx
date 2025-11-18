import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useDevices } from '@hooks/api/useDevices';
import { DeviceCard } from '@components/organisms';
import { ScreenLayout, LoadingState, ErrorState, EmptyState } from '@components/templates';
import { Button } from '@components/atoms/Button';
import { Icon } from '@components/atoms/Icon';
import { useTheme } from '@hooks/useTheme';

export const DeviceListScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { data: devices, isLoading, error, refetch } = useDevices();
  const [refreshing, setRefreshing] = useState(false);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load devices" />;

  const handleDevicePress = (deviceId: string) => {
    navigation.navigate('DeviceDetail', { deviceId });
  };

  const handleAddDevice = () => {
    navigation.navigate('AddDevice');
  };

  const handleRefresh = async () => {
    // Trigger haptic feedback when pull-to-refresh is triggered
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <ScreenLayout
      header={{
        title: 'Devices',
        largeTitle: true,
        rightActions: (
          <Button
            buttonStyle="plain"
            onPress={handleAddDevice}
            leftIcon={<Icon name="add" size={22} color="systemBlue" />}
          >
            Add
          </Button>
        ),
      }}
      scrollable={false}
    >
      <FlatList
        data={devices}
        renderItem={({ item }) => (
          <DeviceCard
            device={item}
            onPress={() => handleDevicePress(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
    padding: 20,
    gap: 16,
  },
});
