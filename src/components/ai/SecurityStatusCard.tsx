import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SecurityContextData } from '@/hooks/useSecurityContext';

interface SecurityStatusCardProps {
  context: SecurityContextData;
  compact?: boolean;
}

/**
 * Security Status Card
 * Displays current security status summary for AI Assistant context
 */
export const SecurityStatusCard = memo<SecurityStatusCardProps>(
  ({ context, compact = false }) => {
    const getStatusColor = () => {
      if (context.criticalAlerts > 0) return '#FF3B30';
      if (context.highAlerts > 0) return '#FF9500';
      if (context.offlineDevices > 0) return '#FFCC00';
      return '#34C759';
    };

    const getStatusText = () => {
      if (context.criticalAlerts > 0) return 'Critical';
      if (context.highAlerts > 0) return 'Alert';
      if (context.offlineDevices > 0) return 'Warning';
      return 'Normal';
    };

    if (compact) {
      return (
        <View style={styles.compactContainer}>
          <View
            style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
          />
          <Text style={styles.compactText}>
            {context.alertsLast24h} alerts today • {context.onlineDevices}/
            {context.totalDevices} sensors online
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.statusBadge}>
            <View
              style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
            />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
          <Text style={styles.timestamp}>Live</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{context.alertsLast24h}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{context.unreviewedAlerts}</Text>
            <Text style={styles.statLabel}>Unreviewed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {context.onlineDevices}/{context.totalDevices}
            </Text>
            <Text style={styles.statLabel}>Sensors</Text>
          </View>
        </View>

        {/* Alert breakdown */}
        {(context.criticalAlerts > 0 || context.highAlerts > 0) && (
          <View style={styles.alertBreakdown}>
            {context.criticalAlerts > 0 && (
              <View style={styles.alertBadge}>
                <View
                  style={[styles.alertDot, { backgroundColor: '#FF3B30' }]}
                />
                <Text style={styles.alertBadgeText}>
                  {context.criticalAlerts} Critical
                </Text>
              </View>
            )}
            {context.highAlerts > 0 && (
              <View style={styles.alertBadge}>
                <View
                  style={[styles.alertDot, { backgroundColor: '#FF9500' }]}
                />
                <Text style={styles.alertBadgeText}>
                  {context.highAlerts} High
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Issues */}
        {(context.offlineDevices > 0 || context.lowBatteryDevices > 0) && (
          <View style={styles.issuesContainer}>
            {context.offlineDevices > 0 && (
              <Text style={styles.issueText}>
                ⚠️ {context.offlineDevices} sensor
                {context.offlineDevices > 1 ? 's' : ''} offline
              </Text>
            )}
            {context.lowBatteryDevices > 0 && (
              <Text style={styles.issueText}>
                🔋 {context.lowBatteryDevices} sensor
                {context.lowBatteryDevices > 1 ? 's' : ''} low battery
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#38383A',
  },
  alertBreakdown: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  alertBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  issuesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#38383A',
  },
  issueText: {
    fontSize: 13,
    color: '#FFCC00',
    marginBottom: 4,
  },
  compactText: {
    fontSize: 12,
    color: '#8E8E93',
  },
});

SecurityStatusCard.displayName = 'SecurityStatusCard';
export default SecurityStatusCard;
