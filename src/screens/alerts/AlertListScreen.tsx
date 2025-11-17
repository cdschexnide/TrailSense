import React, { useState } from 'react';
import { FlatList, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAlerts } from '@hooks/useAlerts';
import { AlertCard } from '@components/organisms';
import { ScreenLayout, EmptyState, LoadingState, ErrorState, SearchBar } from '@components/templates';
import { Alert } from '@types';

export const AlertListScreen = ({ navigation }: any) => {
  const {
    data: alerts,
    isLoading,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useAlerts();
  const [search, setSearch] = useState('');

  if (isLoading && !alerts) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const filteredAlerts = alerts?.filter((alert: Alert) =>
    alert.detectionType.toLowerCase().includes(search.toLowerCase()) ||
    alert.deviceId.toLowerCase().includes(search.toLowerCase()) ||
    (alert.macAddress && alert.macAddress.toLowerCase().includes(search.toLowerCase()))
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" />
      </View>
    );
  };

  return (
    <ScreenLayout title="Alerts">
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
          ListEmptyComponent={<EmptyState message="No alerts yet" />}
          ListFooterComponent={renderFooter}
          refreshing={isLoading}
          onRefresh={refetch}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
});
