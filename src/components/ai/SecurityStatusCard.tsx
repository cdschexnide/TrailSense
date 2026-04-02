/**
 * SecurityStatusCard - REDESIGNED
 *
 * Beautiful status display with:
 * - Gradient header based on status
 * - Clean metrics grid
 * - Animated indicators
 */

import React, { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from '@components/atoms/Text';
import { Icon, IconName } from '@components/atoms/Icon';
import { SecurityContextData } from '@/hooks/useSecurityContext';
import { useTheme } from '@hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';

interface SecurityStatusCardProps {
  context: SecurityContextData;
  compact?: boolean;
  onPress?: () => void;
}

type StatusConfig = {
  label: string;
  icon: IconName;
  gradient: [string, string];
};

const STATUS_CONFIG: Record<
  'critical' | 'alert' | 'warning' | 'normal',
  StatusConfig
> = {
  critical: {
    label: 'Critical',
    icon: 'alert-circle',
    gradient: ['#FF3B30', '#D70015'],
  },
  alert: {
    label: 'Alert',
    icon: 'warning',
    gradient: ['#FF9500', '#E08600'],
  },
  warning: {
    label: 'Warning',
    icon: 'information-circle',
    gradient: ['#FFCC00', '#E6B800'],
  },
  normal: {
    label: 'All Clear',
    icon: 'checkmark-circle',
    gradient: ['#34C759', '#28A745'],
  },
};

const SecurityStatusCardComponent = ({
  context,
  compact = false,
  onPress,
}: SecurityStatusCardProps) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const getStatus = (): StatusConfig => {
    if (context.criticalAlerts > 0) return STATUS_CONFIG.critical;
    if (context.highAlerts > 0) return STATUS_CONFIG.alert;
    if (context.offlineDevices > 0) return STATUS_CONFIG.warning;
    return STATUS_CONFIG.normal;
  };

  const status = getStatus();

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View
          style={[styles.compactDot, { backgroundColor: status.gradient[0] }]}
        />
        <Text variant="caption1" style={{ color: colors.secondaryLabel }}>
          {context.alertsLast24h} alerts today
          {' • '}
          {context.onlineDevices}/{context.totalDevices} online
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: colors.secondarySystemBackground },
        pressed && onPress && { opacity: 0.8 },
      ]}
    >
      <LinearGradient
        colors={status.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.statusHeader}
      >
        <View style={styles.statusLeft}>
          <View style={styles.statusIconBg}>
            <Icon name={status.icon} size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text variant="caption2" style={{ color: 'rgba(255,255,255,0.8)' }}>
              SECURITY STATUS
            </Text>
            <Text variant="headline" weight="bold" style={{ color: '#FFFFFF' }}>
              {status.label}
            </Text>
          </View>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveIndicator} />
          <Text
            variant="caption2"
            weight="semibold"
            style={{ color: '#FFFFFF' }}
          >
            LIVE
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text variant="title1" weight="bold" color="label">
            {context.alertsLast24h}
          </Text>
          <Text variant="caption1" style={{ color: colors.secondaryLabel }}>
            Today
          </Text>
        </View>
        <View
          style={[styles.metricDivider, { backgroundColor: colors.separator }]}
        />
        <View style={styles.metricItem}>
          <Text variant="title1" weight="bold" color="label">
            {context.unreviewedAlerts}
          </Text>
          <Text variant="caption1" style={{ color: colors.secondaryLabel }}>
            Unreviewed
          </Text>
        </View>
        <View
          style={[styles.metricDivider, { backgroundColor: colors.separator }]}
        />
        <View style={styles.metricItem}>
          <Text variant="title1" weight="bold" color="label">
            {context.onlineDevices}/{context.totalDevices}
          </Text>
          <Text variant="caption1" style={{ color: colors.secondaryLabel }}>
            Sensors
          </Text>
        </View>
      </View>

      {(context.criticalAlerts > 0 || context.highAlerts > 0) && (
        <View style={styles.alertBreakdown}>
          {context.criticalAlerts > 0 && (
            <View style={[styles.alertPill, { backgroundColor: '#FF3B3020' }]}>
              <Icon name="alert-circle" size={14} color="#FF3B30" />
              <Text
                variant="caption1"
                weight="semibold"
                style={{ color: '#FF3B30', marginLeft: 4 }}
              >
                {context.criticalAlerts} Critical
              </Text>
            </View>
          )}
          {context.highAlerts > 0 && (
            <View style={[styles.alertPill, { backgroundColor: '#FF950020' }]}>
              <Icon name="warning" size={14} color="#FF9500" />
              <Text
                variant="caption1"
                weight="semibold"
                style={{ color: '#FF9500', marginLeft: 4 }}
              >
                {context.highAlerts} High
              </Text>
            </View>
          )}
        </View>
      )}

      {(context.offlineDevices > 0 || context.lowBatteryDevices > 0) && (
        <View
          style={[styles.issuesContainer, { borderTopColor: colors.separator }]}
        >
          {context.offlineDevices > 0 && (
            <View style={styles.issueRow}>
              <Icon
                name="cloud-offline-outline"
                size={16}
                color={colors.systemYellow}
              />
              <Text
                variant="subheadline"
                style={{ color: colors.systemYellow, marginLeft: 8 }}
              >
                {context.offlineDevices} sensor
                {context.offlineDevices > 1 ? 's' : ''} offline
              </Text>
            </View>
          )}
          {context.lowBatteryDevices > 0 && (
            <View style={styles.issueRow}>
              <Icon name="battery-half" size={16} color={colors.systemOrange} />
              <Text
                variant="subheadline"
                style={{ color: colors.systemOrange, marginLeft: 8 }}
              >
                {context.lowBatteryDevices} sensor
                {context.lowBatteryDevices > 1 ? 's' : ''} low battery
              </Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
};

export const SecurityStatusCard = memo(SecurityStatusCardComponent);

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 44,
    alignSelf: 'center',
  },
  alertBreakdown: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  alertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  issuesContainer: {
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
});

SecurityStatusCard.displayName = 'SecurityStatusCard';
export default SecurityStatusCard;
