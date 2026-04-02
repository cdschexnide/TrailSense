import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from '@components/atoms';
import { GroupedListRow, GroupedListSection } from '@components/molecules';
import { ScreenLayout } from '@components/templates';
import { useAlerts } from '@hooks/api/useAlerts';
import { useKnownDevices } from '@hooks/api/useKnownDevices';
import { useTheme } from '@hooks/useTheme';
import { useBlockedDevices } from '@hooks/useBlockedDevices';
import {
  computeVisitPattern,
  generateInsightText,
} from '@services/patternDetection';
import { AnalyticsEvents, logEvent } from '@services/analyticsEvents';

const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const DeviceFingerprintScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { macAddress } = route.params;
  const { data: alerts = [] } = useAlerts();
  const { data: knownDevices = [] } = useKnownDevices();
  const { isBlocked, block, unblock } = useBlockedDevices();

  const pattern = useMemo(
    () => computeVisitPattern(alerts, macAddress),
    [alerts, macAddress]
  );
  const insightText = useMemo(() => generateInsightText(pattern), [pattern]);
  const deviceAlerts = useMemo(
    () =>
      alerts
        .filter(alert => alert.macAddress === macAddress)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
    [alerts, macAddress]
  );
  const knownDevice = knownDevices.find(device => device.macAddress === macAddress);
  const blocked = isBlocked(macAddress);

  React.useEffect(() => {
    logEvent(AnalyticsEvents.FINGERPRINT_VIEWED, { macAddress });
  }, [macAddress]);

  const latestAlert = deviceAlerts[0];
  const topDays = DAY_KEYS.filter(day => (pattern.dayOfWeekFrequency[day] ?? 0) > 0)
    .sort(
      (a, b) =>
        (pattern.dayOfWeekFrequency[b] ?? 0) - (pattern.dayOfWeekFrequency[a] ?? 0)
    )
    .slice(0, 3)
    .join(', ');
  const topCluster = pattern.timeOfDayClusters[0];

  const handleAddKnownDevice = () => {
    navigation.navigate('MoreTab', {
      screen: 'AddKnownDevice',
      params: { macAddress },
    });
  };

  const handleToggleBlock = () => {
    if (blocked) {
      unblock(macAddress);
      return;
    }

    block(macAddress);
  };

  return (
    <ScreenLayout
      header={{
        title: knownDevice?.name || 'Device Fingerprint',
        subtitle: macAddress,
        showBack:
          typeof navigation.canGoBack === 'function'
            ? navigation.canGoBack()
            : true,
        onBackPress: () => navigation.goBack(),
      }}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.hero,
            { backgroundColor: colors.secondarySystemBackground },
          ]}
        >
          <Text variant="title2" weight="bold">
            {knownDevice?.name || 'Unknown Device'}
          </Text>
          <Text variant="caption1" color="secondaryLabel">
            {latestAlert?.detectionType?.toUpperCase() || 'UNKNOWN'} detection
          </Text>
          <View style={styles.heroMetrics}>
            <View style={styles.metric}>
              <Text variant="title3" weight="bold">
                {pattern.totalVisits}
              </Text>
              <Text variant="caption2" color="secondaryLabel">
                Total visits
              </Text>
            </View>
            <View style={styles.metric}>
              <Text variant="title3" weight="bold">
                {pattern.visitsThisWeek}
              </Text>
              <Text variant="caption2" color="secondaryLabel">
                This week
              </Text>
            </View>
            <View style={styles.metric}>
              <Text variant="title3" weight="bold">
                {pattern.averageArrivalHour === null
                  ? '—'
                  : formatHour(pattern.averageArrivalHour)}
              </Text>
              <Text variant="caption2" color="secondaryLabel">
                Avg. arrival
              </Text>
            </View>
          </View>
        </View>

        <GroupedListSection title="Insight">
          <GroupedListRow
            icon="sparkles-outline"
            iconColor={colors.systemPurple}
            title="AI Insight"
            subtitle={insightText}
          />
        </GroupedListSection>

        <GroupedListSection title="Pattern">
          <GroupedListRow
            icon="calendar-outline"
            iconColor={colors.systemBlue}
            title="Most active days"
            value={topDays || 'No repeat pattern yet'}
          />
          <GroupedListRow
            icon="time-outline"
            iconColor={colors.systemOrange}
            title="Peak time window"
            value={
              topCluster
                ? `${formatHour(topCluster.start)} - ${formatHour(topCluster.end)}`
                : 'No repeat pattern yet'
            }
          />
          <GroupedListRow
            icon="today-outline"
            iconColor={colors.systemGreen}
            title="First seen"
            value={pattern.firstSeen ? formatDate(pattern.firstSeen) : 'Unknown'}
          />
          <GroupedListRow
            icon="refresh-outline"
            iconColor={colors.systemTeal}
            title="Last seen"
            value={pattern.lastSeen ? formatDate(pattern.lastSeen) : 'Unknown'}
          />
        </GroupedListSection>

        <GroupedListSection title="Actions">
          {!knownDevice && (
            <Button onPress={handleAddKnownDevice} style={styles.actionButton}>
              Add to Known Devices
            </Button>
          )}
          <Button
            buttonStyle={blocked ? 'gray' : 'tinted'}
            role={blocked ? 'cancel' : 'destructive'}
            onPress={handleToggleBlock}
            style={styles.actionButton}
          >
            {blocked ? 'Unblock Device' : 'Block Device'}
          </Button>
        </GroupedListSection>
      </View>
    </ScreenLayout>
  );
};

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
  },
  hero: {
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  heroMetrics: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  metric: {
    flex: 1,
  },
  actionButton: {
    marginTop: 8,
  },
});
