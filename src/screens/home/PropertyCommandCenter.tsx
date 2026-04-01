import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon, SkeletonCard, Text } from '@components/atoms';
import { ActivitySparkline, GlowContainer } from '@components/molecules';
import { EmptyState, ScreenLayout } from '@components/templates';
import { AlertCard, MiniPropertyMap } from '@components/organisms';
import { usePropertyStatus, PropertyStatusLevel } from '@hooks/usePropertyStatus';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { useTheme } from '@hooks/useTheme';

const STATUS_COLORS: Record<PropertyStatusLevel, { bg: string; dot: string }> = {
  clear: {
    bg: 'rgba(90, 138, 90, 0.12)',
    dot: '#5A8A5A',
  },
  warning: {
    bg: 'rgba(196, 127, 48, 0.12)',
    dot: '#C47F30',
  },
  critical: {
    bg: 'rgba(184, 74, 66, 0.12)',
    dot: '#B84A42',
  },
};

export const PropertyCommandCenter = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const status = usePropertyStatus();
  const reduceMotion = useReducedMotion();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await Promise.all([status.refetchAlerts(), status.refetchDevices()]);
    setRefreshing(false);
  };

  const isFirstRun =
    !status.isLoading &&
    !status.alertsError &&
    !status.devicesError &&
    (status.devicesTotal === 0 || status.allAlerts.length === 0);

  if (isFirstRun) {
    const hasDevices = status.devicesTotal > 0;

    return (
      <ScreenLayout header={{ title: 'My Property', largeTitle: true }}>
        <EmptyState
          icon={hasDevices ? 'radio-outline' : 'shield-checkmark-outline'}
          title={hasDevices ? 'Monitoring Active' : 'Welcome to TrailSense'}
          message={
            hasDevices
              ? 'Your devices are online and scanning. Detections will appear here as activity is recorded.'
              : 'Your property is being set up. Add a device to start monitoring.'
          }
          actionLabel={hasDevices ? undefined : 'Add Device'}
          onActionPress={
            hasDevices
              ? undefined
              : () =>
                  navigation.navigate('DevicesTab', {
                    screen: 'AddDevice',
                  })
          }
        />
      </ScreenLayout>
    );
  }

  if (status.isLoading) {
    return (
      <ScreenLayout header={{ title: 'My Property', largeTitle: true }}>
        <View style={styles.skeletons}>
          <SkeletonCard height={60} borderRadius={16} style={styles.skeletonItem} />
          <View style={styles.statsRowSkeleton}>
            <SkeletonCard height={80} borderRadius={12} style={styles.flexCard} />
            <SkeletonCard height={80} borderRadius={12} style={styles.flexCard} />
            <SkeletonCard height={80} borderRadius={12} style={styles.flexCard} />
          </View>
          <SkeletonCard height={200} borderRadius={16} style={styles.skeletonItem} />
          <SkeletonCard height={76} borderRadius={12} style={styles.skeletonItem} />
          <SkeletonCard height={76} borderRadius={12} style={styles.skeletonItem} />
        </View>
      </ScreenLayout>
    );
  }

  const statusColors = STATUS_COLORS[status.level];
  const statusBanner = (
    <View
      style={[
        styles.statusBanner,
        {
          backgroundColor: statusColors.bg,
          borderColor: `${statusColors.dot}33`,
        },
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: statusColors.dot }]} />
      <View style={styles.statusText}>
        <Text variant="headline" weight="semibold">
          {status.title}
        </Text>
        <Text variant="footnote" color="secondaryLabel">
          {status.subtitle}
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenLayout
      header={{ title: 'My Property', largeTitle: true }}
      scrollable={false}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.systemGray}
          />
        }
      >
        {status.level === 'critical' ? (
          <GlowContainer
            glowColor={statusColors.dot}
            intensity="subtle"
            pulse={!reduceMotion}
            style={styles.bannerGlow}
          >
            {statusBanner}
          </GlowContainer>
        ) : (
          statusBanner
        )}

        <View style={styles.statsRow}>
          <Pressable
            style={[
              styles.statCard,
              { backgroundColor: colors.secondarySystemBackground },
            ]}
            onPress={() =>
              navigation.navigate('AlertsTab', { screen: 'AlertList' })
            }
          >
            <View
              style={[
                styles.statIcon,
                { backgroundColor: 'rgba(184, 74, 66, 0.12)' },
              ]}
            >
              <Icon name="alert-circle" size={16} color="systemRed" />
            </View>
            <Text variant="title2" weight="bold">
              {status.activeAlertCount}
            </Text>
            <Text variant="caption1" color="secondaryLabel">
              Active Alerts
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.statCard,
              { backgroundColor: colors.secondarySystemBackground },
            ]}
            onPress={() => {
              const recentVisitor = status.recentAlerts[0]?.macAddress;
              if (recentVisitor) {
                navigation.navigate('DeviceFingerprint', {
                  macAddress: recentVisitor,
                });
              }
            }}
          >
            <View
              style={[
                styles.statIcon,
                { backgroundColor: 'rgba(107, 107, 78, 0.12)' },
              ]}
            >
              <Icon name="people" size={16} color="label" />
            </View>
            <Text variant="title2" weight="bold">
              {status.visitorsToday}
            </Text>
            <Text variant="caption1" color="secondaryLabel">
              Visitors Today
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.statCard,
              { backgroundColor: colors.secondarySystemBackground },
            ]}
            onPress={() =>
              navigation.navigate('DevicesTab', { screen: 'DeviceList' })
            }
          >
            <View
              style={[
                styles.statIcon,
                { backgroundColor: 'rgba(90, 138, 90, 0.12)' },
              ]}
            >
              <Icon name="checkmark-circle" size={16} color="systemGreen" />
            </View>
            <Text variant="title2" weight="bold">
              {status.devicesOnline}/{status.devicesTotal}
            </Text>
            <Text variant="caption1" color="secondaryLabel">
              Online
            </Text>
          </Pressable>
        </View>

        <MiniPropertyMap
          devices={status.allDevices}
          onPress={() => navigation.navigate('RadarTab', { screen: 'LiveRadar' })}
        />

        {!status.alertsError && status.recentAlerts.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text variant="title3" weight="bold">
                Recent Alerts
              </Text>
              <Pressable
                onPress={() =>
                  navigation.navigate('AlertsTab', { screen: 'AlertList' })
                }
              >
                <Text variant="subheadline" color="secondaryLabel">
                  See All
                </Text>
              </Pressable>
            </View>
            {status.recentAlerts.map((alert, index) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                index={index}
                animateEntrance={!reduceMotion}
                onPress={() =>
                  navigation.navigate('AlertsTab', {
                    screen: 'AlertDetail',
                    params: { alertId: alert.id },
                  })
                }
              />
            ))}
          </View>
        )}

        {status.alertsError && (
          <View style={styles.inlineError}>
            <Text variant="footnote" color="systemRed">
              Couldn&apos;t load alerts
            </Text>
            <Pressable onPress={() => void status.refetchAlerts()}>
              <Text variant="footnote" color="systemBlue">
                Retry
              </Text>
            </Pressable>
          </View>
        )}

        {/* Recent Visitors */}
        {status.recentVisitorMacs.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text variant="title3" weight="bold">
                Recent Visitors
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.visitorsScroll}
            >
              {status.recentVisitorMacs.map(mac => (
                <Pressable
                  key={mac}
                  style={[
                    styles.visitorChip,
                    { backgroundColor: colors.secondarySystemBackground },
                  ]}
                  onPress={() =>
                    navigation.navigate('DeviceFingerprint', {
                      macAddress: mac,
                    })
                  }
                >
                  <View
                    style={[
                      styles.visitorDot,
                      { backgroundColor: colors.systemRed },
                    ]}
                  />
                  <Text variant="caption1" weight="semibold" numberOfLines={1}>
                    {mac.substring(0, 8)}...
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {(status.activeAlertCount > 0 || status.visitorsToday > 0) && (
          <Pressable
            style={[
              styles.insightCard,
              {
                backgroundColor: 'rgba(201, 184, 150, 0.06)',
                borderColor:
                  colors.brandAccentBorder || 'rgba(201, 184, 150, 0.25)',
              },
            ]}
            onPress={() =>
              navigation.navigate('MoreTab', { screen: 'TrailSenseAI' })
            }
          >
            <View style={styles.insightHeader}>
              <Text variant="caption1" weight="semibold" color="secondaryLabel">
                ✦ AI INSIGHT
              </Text>
            </View>
            <Text variant="subheadline" color="label">
              {status.visitorsToday > 0
                ? `${status.visitorsToday} device${
                    status.visitorsToday === 1 ? '' : 's'
                  } detected today. Tap for pattern analysis.`
                : `${status.activeAlertCount} unreviewed alert${
                    status.activeAlertCount === 1 ? '' : 's'
                  } need attention.`}
            </Text>
          </Pressable>
        )}

        <ActivitySparkline
          alerts={status.allAlerts}
          onHourPress={(_hour) =>
            // WS2 will update to: navigate('RadarTab', { screen: 'ReplayRadar', params: { startHour: _hour } })
            navigation.navigate('RadarTab', { screen: 'LiveRadar' })
          }
        />

        {!status.devicesError && (
          <View>
            <View style={styles.sectionHeader}>
              <Text variant="title3" weight="bold">
                Devices
              </Text>
              <Pressable
                onPress={() =>
                  navigation.navigate('DevicesTab', { screen: 'DeviceList' })
                }
              >
                <Text variant="subheadline" color="secondaryLabel">
                  Manage
                </Text>
              </Pressable>
            </View>
            <View style={styles.deviceStatusRow}>
              <View
                style={[
                  styles.deviceStatusCard,
                  { backgroundColor: colors.secondarySystemBackground },
                ]}
              >
                <Text variant="title2" weight="bold" color="systemGreen">
                  {status.devicesOnline}
                </Text>
                <Text variant="caption1" color="secondaryLabel">
                  Online
                </Text>
                <Text variant="caption2" color="tertiaryLabel" numberOfLines={1}>
                  {status.onlineDeviceNames.join(', ') || '—'}
                </Text>
              </View>
              {status.devicesOffline > 0 && (
                <View
                  style={[
                    styles.deviceStatusCard,
                    { backgroundColor: colors.secondarySystemBackground },
                  ]}
                >
                  <Text variant="title2" weight="bold" color="secondaryLabel">
                    {status.devicesOffline}
                  </Text>
                  <Text variant="caption1" color="secondaryLabel">
                    Offline
                  </Text>
                  <Text variant="caption2" color="tertiaryLabel" numberOfLines={1}>
                    {status.offlineDeviceNames.join(', ') || '—'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {status.devicesError && (
          <View style={styles.inlineError}>
            <Text variant="footnote" color="systemRed">
              Couldn&apos;t load devices
            </Text>
            <Pressable onPress={() => void status.refetchDevices()}>
              <Text variant="footnote" color="systemBlue">
                Retry
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  bannerGlow: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
  },
  skeletons: {
    padding: 20,
    gap: 12,
  },
  skeletonItem: {
    marginBottom: 0,
  },
  statsRowSkeleton: {
    flexDirection: 'row',
    gap: 10,
  },
  flexCard: {
    flex: 1,
  },
  statusBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statusText: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
    gap: 4,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 8,
  },
  insightCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  deviceStatusRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  deviceStatusCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  inlineError: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bottomSpacer: {
    height: 40,
  },
  visitorsScroll: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 4,
  },
  visitorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 8,
  },
  visitorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
