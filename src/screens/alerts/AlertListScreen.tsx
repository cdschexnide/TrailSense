import React, { useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { useAlerts } from '@hooks/api/useAlerts';
import { AlertCard } from '@components/organisms';
import { ScreenLayout, EmptyState, LoadingState, ErrorState } from '@components/templates';
import { SearchBar } from '@components/molecules/SearchBar';
import { Alert } from '@types';

export const AlertListScreen = ({ navigation }: any) => {
  const {
    data: alerts,
    isLoading,
    error,
    refetch
  } = useAlerts();
  const [search, setSearch] = useState('');

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load alerts" />;

  const filteredAlerts = alerts?.filter((alert: Alert) =>
    alert.detectionType.toLowerCase().includes(search.toLowerCase()) ||
    alert.deviceId.toLowerCase().includes(search.toLowerCase()) ||
    (alert.macAddress && alert.macAddress.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  return (
    <ScreenLayout title="Alerts" scrollable={false}>
      <View style={styles.container}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search alerts..."
        />
        <FlatList
          data={filteredAlerts}
          renderItem={({ item }) => (
            <AlertCard
              alert={item}
              onPress={() => navigation.navigate('AlertDetail', { alertId: item.id })}
            />
          )}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<EmptyState title="No Alerts" message="No alerts yet" />}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
