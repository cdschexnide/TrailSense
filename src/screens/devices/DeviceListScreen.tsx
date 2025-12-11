/**
 * DeviceListScreen - REDESIGNED
 *
 * Enhanced device list with:
 * - Stats summary header showing device counts
 * - Grouped sections (Online/Offline)
 * - Staggered entrance animations for cards
 * - Pull-to-refresh with haptic feedback
 */

import React, { useState, useMemo } from 'react';
import { SectionList, RefreshControl, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useDevices } from '@hooks/api/useDevices';
import { DeviceCard } from '@components/organisms';
import {
  ScreenLayout,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@components/templates';
import { Button } from '@components/atoms/Button';
import { Icon } from '@components/atoms/Icon';
import { Text } from '@components/atoms/Text';
import { useTheme } from '@hooks/useTheme';
import { Device } from '@types';

// Section type for grouped device list
interface DeviceSection {
  title: string;
  data: Device[];
  status: 'online' | 'offline';
}

export const DeviceListScreen = ({ navigation }: any) => {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors;
  const { data: devices, isLoading, error, refetch } = useDevices();
  const [refreshing, setRefreshing] = useState(false);

  // Group devices by online/offline status
  const { sections, stats } = useMemo(() => {
    if (!devices || devices.length === 0) {
      return { sections: [], stats: { total: 0, online: 0, offline: 0 } };
    }

    const onlineDevices = devices.filter((d: Device) => d.online);
    const offlineDevices = devices.filter((d: Device) => !d.online);

    const deviceSections: DeviceSection[] = [];

    if (onlineDevices.length > 0) {
      deviceSections.push({
        title: 'Online',
        data: onlineDevices,
        status: 'online',
      });
    }

    if (offlineDevices.length > 0) {
      deviceSections.push({
        title: 'Offline',
        data: offlineDevices,
        status: 'offline',
      });
    }

    return {
      sections: deviceSections,
      stats: {
        total: devices.length,
        online: onlineDevices.length,
        offline: offlineDevices.length,
      },
    };
  }, [devices]);

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

  // Stats header component - Enhanced design
  const renderStatsHeader = () => (
    <View style={styles.statsHeader}>
      {/* Total Devices */}
      <View style={styles.statCardWrapper}>
        <LinearGradient
          colors={isDark
            ? ['#1E3A5F', '#0D2137']
            : ['#E8F4FD', '#D0E8FA']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statCard, styles.statCardTotal]}
        >
          <View style={[styles.statIconBg, { backgroundColor: 'rgba(10, 132, 255, 0.2)' }]}>
            <Icon name="hardware-chip" size={22} color={colors.systemBlue} />
          </View>
          <Text variant="largeTitle" weight="bold" style={[styles.statValue, { color: colors.systemBlue }]}>
            {stats.total}
          </Text>
          <Text variant="caption1" weight="medium" color="secondaryLabel">
            Total
          </Text>
        </LinearGradient>
      </View>

      {/* Online */}
      <View style={styles.statCardWrapper}>
        <LinearGradient
          colors={isDark
            ? ['#1A3D2E', '#0D2518']
            : ['#E6F7ED', '#CCF0DB']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statCard, styles.statCardOnline]}
        >
          <View style={[styles.statIconBg, { backgroundColor: 'rgba(48, 209, 88, 0.2)' }]}>
            <Icon name="checkmark-circle" size={22} color={colors.systemGreen} />
          </View>
          <Text variant="largeTitle" weight="bold" style={[styles.statValue, { color: colors.systemGreen }]}>
            {stats.online}
          </Text>
          <Text variant="caption1" weight="medium" color="secondaryLabel">
            Online
          </Text>
        </LinearGradient>
      </View>

      {/* Offline */}
      <View style={styles.statCardWrapper}>
        <LinearGradient
          colors={isDark
            ? ['#3D1E1E', '#251010']
            : ['#FDECEC', '#FAD4D4']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statCard, styles.statCardOffline]}
        >
          <View style={[styles.statIconBg, { backgroundColor: 'rgba(255, 69, 58, 0.2)' }]}>
            <Icon name="close-circle" size={22} color={colors.systemRed} />
          </View>
          <Text variant="largeTitle" weight="bold" style={[styles.statValue, { color: colors.systemRed }]}>
            {stats.offline}
          </Text>
          <Text variant="caption1" weight="medium" color="secondaryLabel">
            Offline
          </Text>
        </LinearGradient>
      </View>
    </View>
  );

  // Section header component
  const renderSectionHeader = ({ section }: { section: DeviceSection }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <View
          style={[
            styles.sectionDot,
            {
              backgroundColor:
                section.status === 'online'
                  ? colors.systemGreen
                  : colors.systemRed,
            },
          ]}
        />
        <Text variant="headline" color="label" style={styles.sectionTitle}>
          {section.title}
        </Text>
      </View>
      <Text variant="caption1" color="tertiaryLabel">
        {section.data.length} {section.data.length === 1 ? 'device' : 'devices'}
      </Text>
    </View>
  );

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
      <SectionList
        sections={sections}
        renderItem={({ item, index, section }) => {
          // Calculate global index for staggered animation
          // Items in online section get indices 0, 1, 2...
          // Items in offline section start after online items
          const sectionIndex = sections.indexOf(section);
          const previousItemsCount = sections
            .slice(0, sectionIndex)
            .reduce((acc, s) => acc + s.data.length, 0);
          const globalIndex = previousItemsCount + index;

          return (
            <DeviceCard
              device={item}
              onPress={() => handleDevicePress(item.id)}
              index={globalIndex}
              animateEntrance={true}
            />
          );
        }}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={stats.total > 0 ? renderStatsHeader : null}
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
        stickySectionHeadersEnabled={false}
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
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
  statsHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  statCardWrapper: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
  },
  statCardTotal: {
    borderColor: 'rgba(10, 132, 255, 0.3)',
  },
  statCardOnline: {
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  statCardOffline: {
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontWeight: '600',
  },
});
