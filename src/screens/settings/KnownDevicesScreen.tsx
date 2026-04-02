/**
 * KnownDevicesScreen - REDESIGNED
 *
 * Beautiful known device management with:
 * - Clean item cards
 * - Category icons
 * - Better empty state
 */

import React from 'react';
import { View, FlatList, StyleSheet, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  useDeleteKnownDevice,
  useKnownDevices,
} from '@hooks/api/useKnownDevices';
import { Text } from '@components/atoms/Text';
import { Icon, IconName } from '@components/atoms/Icon';
import { Button } from '@components/atoms/Button';
import { ScreenLayout, LoadingState, ErrorState } from '@components/templates';
import { useTheme } from '@hooks/useTheme';
import { KnownDevice } from '@types';
import { MoreStackParamList, SettingsStackParamList } from '@navigation/types';

type KnownDevicesScreenProps =
  | NativeStackScreenProps<MoreStackParamList, 'KnownDevices'>
  | NativeStackScreenProps<SettingsStackParamList, 'KnownDevices'>;

type KnownDeviceCategoryDisplay = KnownDevice['category'] | 'default';

type CategoryConfig = {
  icon: IconName;
  color: string;
};

const CATEGORY_CONFIG: Record<KnownDeviceCategoryDisplay, CategoryConfig> = {
  family: { icon: 'people', color: '#007AFF' },
  guests: { icon: 'person-add', color: '#5856D6' },
  service: { icon: 'construct', color: '#34C759' },
  other: { icon: 'shield-checkmark', color: '#FF9500' },
  default: { icon: 'shield-checkmark', color: '#8E8E93' },
};

interface KnownDeviceItemCardProps {
  name: string;
  macAddress: string;
  category?: KnownDevice['category'];
  onDelete: () => void;
}

const KnownDeviceItemCard = ({
  name,
  macAddress,
  category,
  onDelete,
}: KnownDeviceItemCardProps) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const config =
    CATEGORY_CONFIG[category ?? 'default'] ?? CATEGORY_CONFIG.default;

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Remove Known Device',
      `Are you sure you want to remove "${name}" from Known Devices?`,
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
    <View
      style={[
        styles.itemCard,
        { backgroundColor: colors.secondarySystemBackground },
      ]}
    >
      <View style={[styles.itemIcon, { backgroundColor: config.color + '20' }]}>
        <Icon name={config.icon} size={22} color={config.color} />
      </View>
      <View style={styles.itemContent}>
        <Text variant="body" weight="semibold" color="label">
          {name}
        </Text>
        <Text
          variant="caption1"
          style={{ color: colors.secondaryLabel, marginTop: 2 }}
        >
          {macAddress}
        </Text>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: config.color + '15' },
          ]}
        >
          <Text
            variant="caption2"
            weight="semibold"
            style={{ color: config.color }}
          >
            {(category ?? 'Device').toUpperCase()}
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

const EmptyKnownDevices = ({ onAdd }: { onAdd: () => void }) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconContainer,
          { backgroundColor: colors.systemTeal + '20' },
        ]}
      >
        <Icon name="shield-checkmark" size={48} color={colors.systemTeal} />
      </View>
      <Text
        variant="title2"
        weight="bold"
        color="label"
        style={{ marginTop: 20 }}
      >
        No Known Devices
      </Text>
      <Text variant="body" color="secondaryLabel" style={styles.emptyText}>
        Add devices you recognize so they are easier to identify later
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
          <Text
            variant="headline"
            weight="semibold"
            style={{ color: '#FFFFFF', marginLeft: 8 }}
          >
            Add Device
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
};

export const KnownDevicesScreen = ({ navigation }: KnownDevicesScreenProps) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { data: knownDevices, isLoading, error } = useKnownDevices();
  const deleteKnownDevice = useDeleteKnownDevice();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load known devices" />;

  const handleDelete = async (id: string) => {
    deleteKnownDevice.mutate(id);
  };

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('AddKnownDevice');
  };

  return (
    <ScreenLayout
      header={{
        title: 'Known Devices',
        showBack: true,
        onBackPress: () => navigation.goBack(),
        rightActions:
          knownDevices && knownDevices.length > 0 ? (
            <Button buttonStyle="plain" onPress={handleAdd}>
              <Icon name="add" size={24} color={colors.systemBlue} />
            </Button>
          ) : undefined,
      }}
      scrollable={false}
    >
      {knownDevices && knownDevices.length > 0 && (
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.secondarySystemBackground },
          ]}
        >
          <Icon name="information-circle" size={20} color={colors.systemBlue} />
          <Text
            variant="caption1"
            style={{ color: colors.secondaryLabel, marginLeft: 10, flex: 1 }}
          >
            Known devices help you label familiar visitors and equipment
          </Text>
        </View>
      )}

      <FlatList
        data={knownDevices}
        renderItem={({ item }) => (
          <KnownDeviceItemCard
            name={item.name}
            macAddress={item.macAddress}
            category={item.category}
            onDelete={() => void handleDelete(item.id)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          (!knownDevices || knownDevices.length === 0) &&
            styles.emptyListContent,
        ]}
        ListEmptyComponent={<EmptyKnownDevices onAdd={handleAdd} />}
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
