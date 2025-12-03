import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useWhitelist } from '@hooks/useWhitelist';
import { WhitelistItem } from '@components/molecules';
import {
  ScreenLayout,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@components/templates';
import { Button } from '@components/atoms/Button';

export const WhitelistScreen = ({ navigation }: any) => {
  const { data: whitelist, isLoading, error } = useWhitelist();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load whitelist" />;

  const handleDelete = async (id: string) => {
    // TODO: Implement delete via API
    console.log('Deleting whitelist item:', id);
  };

  const handleAdd = () => {
    navigation.navigate('AddWhitelist');
  };

  return (
    <ScreenLayout
      header={{
        title: 'Whitelist',
        showBack: true,
        rightActions: (
          <Button buttonStyle="plain" onPress={handleAdd}>
            Add
          </Button>
        ),
      }}
      scrollable={false}
    >
      <FlatList
        data={whitelist}
        renderItem={({ item }) => (
          <WhitelistItem
            name={item.name}
            macAddress={item.macAddress}
            category={item.category}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="shield-checkmark-outline"
            title="No Whitelist Entries"
            message="Add trusted devices to avoid false alerts"
          />
        }
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 20,
    gap: 12,
  },
});
