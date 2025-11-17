import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useDevices } from '@hooks/api/useDevices';
import { DeviceCard } from '@components/organisms';
import { ScreenLayout, LoadingState, ErrorState, EmptyState } from '@components/templates';

export const DeviceListScreen = ({ navigation }: any) => {
  const { data: devices, isLoading, error } = useDevices();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <ScreenLayout title="Devices" scrollable={false}>
      <FlatList
        data={devices}
        renderItem={({ item }) => (
          <DeviceCard
            device={item}
            onPress={() => navigation.navigate('DeviceDetail', {
              deviceId: item.id
            })}
          />
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState message="No devices yet" />}
      />
      {/* TODO: Add FAB component for adding devices */}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({});
