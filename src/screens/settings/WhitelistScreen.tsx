import React, { useState } from 'react';
import { FlatList, View, StyleSheet, Alert, Share } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useWhitelist } from '@hooks/useWhitelist';
import { WhitelistItem } from '@components/molecules';
import { ScreenLayout, SearchBar, FAB, LoadingState, ErrorState, EmptyState, Button } from '@components/atoms';

export const WhitelistScreen = ({ navigation }: any) => {
  const { data: whitelist, isLoading, error } = useWhitelist();
  const [search, setSearch] = useState('');

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const filteredList = whitelist?.filter((item: any) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.macAddress.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    // TODO: Implement delete via API
    console.log('Deleting whitelist item:', id);
  };

  const openAddModal = () => {
    navigation.navigate('AddWhitelist');
  };

  const handleExport = async () => {
    try {
      const whitelistData = JSON.stringify(whitelist, null, 2);
      const fileName = `whitelist_${new Date().toISOString().split('T')[0]}.json`;

      // TODO: Implement proper file save dialog
      // For now, using Share API
      await Share.share({
        message: whitelistData,
        title: 'Export Whitelist',
      });

      Alert.alert('Success', 'Whitelist exported successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to export whitelist');
    }
  };

  const handleImport = async () => {
    try {
      // TODO: Implement document picker
      Alert.alert('Import', 'Import functionality coming soon');

      // Example implementation:
      // const result = await DocumentPicker.getDocumentAsync({
      //   type: 'application/json',
      // });
      //
      // if (result.type === 'success') {
      //   const content = await FileSystem.readAsStringAsync(result.uri);
      //   const importedData = JSON.parse(content);
      //   // TODO: Validate and import data via API
      //   Alert.alert('Success', 'Whitelist imported successfully');
      // }
    } catch (error) {
      Alert.alert('Error', 'Failed to import whitelist');
    }
  };

  return (
    <ScreenLayout title="Whitelist">
      <View style={styles.header}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search devices..."
          style={styles.searchBar}
        />
        <View style={styles.actions}>
          <Button
            title="Import"
            variant="outline"
            size="sm"
            onPress={handleImport}
            style={styles.actionButton}
          />
          <Button
            title="Export"
            variant="outline"
            size="sm"
            onPress={handleExport}
            style={styles.actionButton}
          />
        </View>
      </View>
      <FlatList
        data={filteredList}
        renderItem={({ item }) => (
          <WhitelistItem
            item={item}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState message="No whitelisted devices" />}
      />
      <FAB
        icon="plus"
        onPress={openAddModal}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
  },
  searchBar: {
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});
