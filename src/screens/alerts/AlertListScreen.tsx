import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAlerts } from '@hooks/api/useAlerts';
import { AlertCard } from '@components/organisms';
import { ScreenLayout, EmptyState, LoadingState, ErrorState } from '@components/templates';
import { SearchBar } from '@components/molecules/SearchBar';
import { Button } from '@components/atoms/Button';
import { Icon } from '@components/atoms/Icon';
import { Alert } from '@types';
import { useTheme } from '@hooks/useTheme';

export const AlertListScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const {
    data: alerts,
    isLoading,
    error,
    refetch
  } = useAlerts();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load alerts" />;

  const filteredAlerts = alerts?.filter((alert: Alert) =>
    alert.detectionType.toLowerCase().includes(search.toLowerCase()) ||
    alert.deviceId.toLowerCase().includes(search.toLowerCase()) ||
    (alert.macAddress && alert.macAddress.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  const handleDismiss = (alertId: string) => {
    console.log('Dismissing alert:', alertId);
    // TODO: Implement alert dismissal logic
  };

  const handleWhitelist = (macAddress: string) => {
    console.log('Whitelisting MAC address:', macAddress);
    // TODO: Implement whitelist logic
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
        title: 'Alerts',
        largeTitle: true,
        rightActions: (
          <Button
            buttonStyle="plain"
            onPress={() => navigation.navigate('AlertFilter')}
            leftIcon={<Icon name="options" size={22} color="systemBlue" />}
          >
            Filter
          </Button>
        ),
      }}
      scrollable={false}
    >
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search alerts..."
        showCancelButton={true}
        onCancel={() => setSearch('')}
      />
      <FlatList
        data={filteredAlerts}
        renderItem={({ item }) => (
          <AlertCard
            alert={item}
            onPress={() => navigation.navigate('AlertDetail', { alertId: item.id })}
            onDismiss={handleDismiss}
            onWhitelist={handleWhitelist}
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
            icon="notifications-off-outline"
            title="No Alerts"
            message="You have no security alerts"
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
