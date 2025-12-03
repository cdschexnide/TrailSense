/**
 * AlertListScreen - REDESIGNED
 *
 * Enhanced alert list with:
 * - Threat summary chips showing counts per level
 * - Staggered entrance animations for cards
 * - Filtered search with visual feedback
 * - Pull-to-refresh with haptic feedback
 */

import React, { useState, useMemo } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  Pressable,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAlerts } from '@hooks/api/useAlerts';
import { AlertCard } from '@components/organisms';
import {
  ScreenLayout,
  EmptyState,
  LoadingState,
  ErrorState,
} from '@components/templates';
import { SearchBar } from '@components/molecules/SearchBar';
import { Button } from '@components/atoms/Button';
import { Icon } from '@components/atoms/Icon';
import { Text } from '@components/atoms/Text';
import { Alert, ThreatLevel } from '@types';
import { useTheme } from '@hooks/useTheme';
import { getThreatColor } from '@utils/visualEffects';

// Threat level configuration
const THREAT_LEVELS: ThreatLevel[] = ['critical', 'high', 'medium', 'low'];

const THREAT_LABELS: Record<ThreatLevel, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const THREAT_ICONS: Record<ThreatLevel, string> = {
  critical: 'alert-circle',
  high: 'warning',
  medium: 'information-circle',
  low: 'checkmark-circle',
};

export const AlertListScreen = ({ navigation }: any) => {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors;
  const { data: alerts, isLoading, error, refetch } = useAlerts();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedThreatFilter, setSelectedThreatFilter] =
    useState<ThreatLevel | null>(null);

  // Calculate threat level counts
  const threatCounts = useMemo(() => {
    if (!alerts) return { critical: 0, high: 0, medium: 0, low: 0, total: 0 };

    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: alerts.length,
    };

    alerts.forEach((alert: Alert) => {
      if (alert.threatLevel in counts) {
        counts[alert.threatLevel as ThreatLevel]++;
      }
    });

    return counts;
  }, [alerts]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load alerts" />;

  // Filter alerts by search and selected threat level
  const filteredAlerts = useMemo(() => {
    let result = alerts || [];

    // Filter by search
    if (search) {
      result = result.filter(
        (alert: Alert) =>
          alert.detectionType.toLowerCase().includes(search.toLowerCase()) ||
          alert.deviceId.toLowerCase().includes(search.toLowerCase()) ||
          (alert.macAddress &&
            alert.macAddress.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Filter by threat level
    if (selectedThreatFilter) {
      result = result.filter(
        (alert: Alert) => alert.threatLevel === selectedThreatFilter
      );
    }

    return result;
  }, [alerts, search, selectedThreatFilter]);

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

  // Handle threat chip press - toggle filter
  const handleThreatChipPress = (threatLevel: ThreatLevel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedThreatFilter(current =>
      current === threatLevel ? null : threatLevel
    );
  };

  // Threat summary chips header component
  const renderThreatChips = () => (
    <View style={styles.chipsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContent}
      >
        {/* All button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedThreatFilter(null);
          }}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor:
                selectedThreatFilter === null
                  ? colors.systemBlue
                  : isDark
                    ? 'rgba(142, 142, 147, 0.2)'
                    : 'rgba(142, 142, 147, 0.15)',
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text
            variant="subheadline"
            style={[
              styles.chipText,
              {
                color:
                  selectedThreatFilter === null
                    ? '#FFFFFF'
                    : colors.secondaryLabel,
              },
            ]}
          >
            All ({threatCounts.total})
          </Text>
        </Pressable>

        {/* Threat level chips */}
        {THREAT_LEVELS.map(level => {
          const count = threatCounts[level];
          const isSelected = selectedThreatFilter === level;
          const threatColor = getThreatColor(level);

          // Don't show chip if count is 0
          if (count === 0) return null;

          return (
            <Pressable
              key={level}
              onPress={() => handleThreatChipPress(level)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? threatColor
                    : `${threatColor}20`,
                  borderWidth: 1,
                  borderColor: isSelected ? threatColor : `${threatColor}40`,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Icon
                name={THREAT_ICONS[level] as any}
                size={16}
                color={isSelected ? '#FFFFFF' : threatColor}
              />
              <Text
                variant="subheadline"
                style={[
                  styles.chipText,
                  { color: isSelected ? '#FFFFFF' : threatColor },
                ]}
              >
                {THREAT_LABELS[level]} ({count})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

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
        renderItem={({ item, index }) => (
          <AlertCard
            alert={item}
            onPress={() =>
              navigation.navigate('AlertDetail', { alertId: item.id })
            }
            onDismiss={handleDismiss}
            onWhitelist={handleWhitelist}
            index={index}
            animateEntrance={true}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={threatCounts.total > 0 ? renderThreatChips : null}
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
            title={
              selectedThreatFilter
                ? `No ${THREAT_LABELS[selectedThreatFilter]} Alerts`
                : 'No Alerts'
            }
            message={
              selectedThreatFilter
                ? 'Try selecting a different filter'
                : 'You have no security alerts'
            }
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
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
  chipsContainer: {
    paddingVertical: 8,
  },
  chipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  chipText: {
    fontWeight: '600',
  },
});
