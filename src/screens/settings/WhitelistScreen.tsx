/**
 * WhitelistScreen - REDESIGNED
 *
 * Beautiful whitelist management with:
 * - Clean item cards
 * - Category icons
 * - Better empty state
 */

import React from 'react';
import { View, FlatList, StyleSheet, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useWhitelist } from '@hooks/useWhitelist';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { Button } from '@components/atoms/Button';
import {
  ScreenLayout,
  LoadingState,
  ErrorState,
} from '@components/templates';
import { useTheme } from '@hooks/useTheme';

const CATEGORY_CONFIG: Record<string, { icon: string; color: string }> = {
  wifi: { icon: 'wifi', color: '#007AFF' },
  bluetooth: { icon: 'bluetooth', color: '#5856D6' },
  device: { icon: 'hardware-chip', color: '#34C759' },
  network: { icon: 'globe-outline', color: '#FF9500' },
  default: { icon: 'shield-checkmark', color: '#8E8E93' },
};

// Whitelist item component
const WhitelistItemCard = ({
  name,
  macAddress,
  category,
  onDelete,
}: {
  name: string;
  macAddress: string;
  category?: string;
  onDelete: () => void;
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const config = CATEGORY_CONFIG[category || 'default'] || CATEGORY_CONFIG.default;

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Remove from Whitelist',
      `Are you sure you want to remove "${name}" from the whitelist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  return (
    <View style={[styles.itemCard, { backgroundColor: colors.secondarySystemBackground }]}>
      <View style={[styles.itemIcon, { backgroundColor: config.color + '20' }]}>
        <Icon name={config.icon as any} size={22} color={config.color} />
      </View>
      <View style={styles.itemContent}>
        <Text variant="body" weight="semibold" color="label">
          {name}
        </Text>
        <Text variant="caption1" style={{ color: colors.secondaryLabel, marginTop: 2 }}>
          {macAddress}
        </Text>
        <View style={[styles.categoryBadge, { backgroundColor: config.color + '15' }]}>
          <Text variant="caption2" weight="semibold" style={{ color: config.color }}>
            {(category || 'Device').toUpperCase()}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={handleDelete}
        style={({ pressed }) => [
          styles.deleteButton,
          { backgroundColor: colors.systemRed + '15' },
          pressed && { opacity: 0.7 },
        ]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="trash-outline" size={18} color={colors.systemRed} />
      </Pressable>
    </View>
  );
};

// Empty state component
const EmptyWhitelist = ({ onAdd }: { onAdd: () => void }) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.systemTeal + '20' }]}>
        <Icon name="shield-checkmark" size={48} color={colors.systemTeal} />
      </View>
      <Text variant="title2" weight="bold" color="label" style={{ marginTop: 20 }}>
        No Trusted Devices
      </Text>
      <Text variant="body" style={[styles.emptyText, { color: colors.secondaryLabel }]}>
        Add devices to your whitelist to prevent them from triggering alerts
      </Text>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [pressed && { opacity: 0.8 }]}
      >
        <LinearGradient
          colors={['#667EEA', '#764BA2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addButton}
        >
          <Icon name="add-circle" size={20} color="#FFFFFF" />
          <Text variant="headline" weight="semibold" style={{ color: '#FFFFFF', marginLeft: 8 }}>
            Add Device
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
};

export const WhitelistScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { data: whitelist, isLoading, error } = useWhitelist();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load whitelist" />;

  const handleDelete = async (id: string) => {
    console.log('Deleting whitelist item:', id);
  };

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('AddWhitelist');
  };

  return (
    <ScreenLayout
      header={{
        title: 'Whitelist',
        showBack: true,
        onBackPress: () => navigation.goBack(),
        rightActions: whitelist && whitelist.length > 0 && (
          <Button buttonStyle="plain" onPress={handleAdd}>
            <Icon name="add" size={24} color={colors.systemBlue} />
          </Button>
        ),
      }}
      scrollable={false}
    >
      {/* Info Card */}
      {whitelist && whitelist.length > 0 && (
        <View style={[styles.infoCard, { backgroundColor: colors.secondarySystemBackground }]}>
          <Icon name="information-circle" size={20} color={colors.systemBlue} />
          <Text variant="caption1" style={{ color: colors.secondaryLabel, marginLeft: 10, flex: 1 }}>
            Whitelisted devices won't trigger security alerts
          </Text>
        </View>
      )}

      <FlatList
        data={whitelist}
        renderItem={({ item }) => (
          <WhitelistItemCard
            name={item.name}
            macAddress={item.macAddress}
            category={item.category}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          (!whitelist || whitelist.length === 0) && styles.emptyListContent,
        ]}
        ListEmptyComponent={<EmptyWhitelist onAdd={handleAdd} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: 14,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
});
