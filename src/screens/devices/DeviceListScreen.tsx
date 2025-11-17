import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useDevices } from '@hooks/useDevices';
import { DeviceCard } from '@components/organisms';
import { ScreenLayout, FAB, LoadingState, ErrorState, EmptyState } from '@components/atoms';

export const DeviceListScreen = ({ navigation }: any) => {
  const { data: devices, isLoading, error } = useDevices();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <ScreenLayout title="Devices">
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
      <FAB
        icon="plus"
        onPress={() => navigation.navigate('AddDevice')}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({});
