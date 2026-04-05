import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms/Text';
import type { SitrepData } from '@/types/cardData';
import {
  tacticalColors as c,
  tacticalTypography as t,
  tacticalSpacing as s,
} from '@/constants/tacticalTheme';
import {
  accuracyToZone,
  formatDate,
  formatFingerprint,
} from '@/services/llm/FocusedContextBuilder';
import { BriefingContainer } from './BriefingContainer';

interface SitrepCardProps {
  data: SitrepData;
  assessment: string;
  assessmentUnavailable?: boolean;
  onCopy?: () => void;
  onFeedback?: (positive: boolean) => void;
}

const severityColor = (level: string) => {
  switch (level) {
    case 'critical':
      return c.accentDanger;
    case 'high':
      return c.accentWarning;
    default:
      return c.textSecondary;
  }
};

export const SitrepCard: React.FC<SitrepCardProps> = ({
  data,
  assessment,
  assessmentUnavailable,
  onCopy,
  onFeedback,
}) => (
  <BriefingContainer
    label="SITUATION REPORT"
    assessment={assessment}
    assessmentUnavailable={assessmentUnavailable}
    assessmentLabel="PRIORITY ASSESSMENT"
    onCopy={onCopy}
    onFeedback={onFeedback}
  >
    {/* Metrics row */}
    <View style={styles.metricsRow}>
      <View style={[styles.metricBox, { borderColor: c.severityCritical }]}>
        <Text
          style={[styles.metricValue, { color: c.accentDanger }]}
        >
          {data.threatCounts.critical}
        </Text>
        <Text style={styles.metricCaption}>Critical</Text>
      </View>
      <View style={[styles.metricBox, { borderColor: c.severityHigh }]}>
        <Text
          style={[styles.metricValue, { color: c.accentWarning }]}
        >
          {data.threatCounts.high}
        </Text>
        <Text style={styles.metricCaption}>High</Text>
      </View>
      <View style={[styles.metricBox, { borderColor: c.border }]}>
        <Text style={[styles.metricValue, { color: c.textPrimary }]}>
          {data.onlineCount}/{data.devices.length}
        </Text>
        <Text style={styles.metricCaption}>Online</Text>
      </View>
    </View>

    {/* Top alerts */}
    {data.alerts.map((alert, i) => (
      <View key={alert.id ?? i} style={styles.alertRow}>
        <View style={styles.alertHeader}>
          <Text
            style={[
              styles.severity,
              { color: severityColor(alert.threatLevel) },
            ]}
          >
            {alert.threatLevel === 'critical' ? '◆' : '▲'}{' '}
            {alert.threatLevel.toUpperCase()}
          </Text>
          <Text style={styles.alertTime}>
            {formatDate(alert.timestamp)}
          </Text>
        </View>
        <Text style={styles.alertDetail}>
          {alert.detectionType} detection
        </Text>
        <View style={styles.alertMeta}>
          <Text style={styles.metaText}>
            {alert.confidence}% ·{' '}
            {accuracyToZone(alert.accuracyMeters).split(' ')[0]}
          </Text>
          <Text style={styles.metaText}>
            Fingerprint: {formatFingerprint(alert.fingerprintHash)}
          </Text>
        </View>
      </View>
    ))}

    {data.alerts.length === 0 && (
      <Text style={styles.emptyText}>No recent alerts</Text>
    )}
  </BriefingContainer>
);

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  metricBox: {
    flex: 1,
    backgroundColor: c.surfaceDark,
    borderWidth: 1,
    borderRadius: s.innerCardRadius,
    padding: 6,
    alignItems: 'center',
  },
  metricValue: {
    ...t.metric,
  },
  metricCaption: {
    ...t.metricCaption,
    color: c.textTertiary,
    marginTop: 2,
  },
  alertRow: {
    backgroundColor: c.surfaceDark,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: s.innerCardRadius,
    padding: 8,
    marginBottom: 6,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  severity: {
    ...t.severityBadge,
  },
  alertTime: {
    ...t.timestamp,
    color: c.textTertiary,
  },
  alertDetail: {
    ...t.body,
    color: c.textSecondary,
  },
  alertMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  metaText: {
    ...t.dataValue,
    color: c.textTertiary,
  },
  emptyText: {
    ...t.body,
    color: c.textTertiary,
    fontStyle: 'italic',
  },
});
