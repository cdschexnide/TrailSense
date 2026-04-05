import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms/Text';
import type { AlertBriefingData } from '@/types/cardData';
import {
  tacticalColors as c,
  tacticalTypography as t,
  tacticalSpacing as s,
} from '@/constants/tacticalTheme';
import {
  accuracyToZone,
  formatFingerprint,
  formatDate,
} from '@/services/llm/FocusedContextBuilder';
import { BriefingContainer } from './BriefingContainer';
import { MiniMap } from './MiniMap';

interface AlertBriefingCardProps {
  data: AlertBriefingData;
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
    case 'medium':
      return '#60a5fa';
    default:
      return c.accentSuccess;
  }
};

const severityIcon = (level: string) =>
  level === 'critical' ? '◆' : '▲';

export const AlertBriefingCard: React.FC<AlertBriefingCardProps> = ({
  data,
  assessment,
  assessmentUnavailable,
  onCopy,
  onFeedback,
}) => {
  if (data.alerts.length === 0) {
    return (
      <BriefingContainer
        label="ALERT BRIEFING"
        assessment={assessment}
        assessmentUnavailable={assessmentUnavailable}
        onCopy={onCopy}
        onFeedback={onFeedback}
      >
        <Text style={styles.emptyText}>
          No alerts matching your query in the last 24 hours
        </Text>
      </BriefingContainer>
    );
  }

  const detectionDeviceId = data.alerts[0]?.deviceId;

  return (
    <BriefingContainer
      label="ALERT BRIEFING"
      assessment={assessment}
      assessmentUnavailable={assessmentUnavailable}
      onCopy={onCopy}
      onFeedback={onFeedback}
    >
      <MiniMap
        devices={data.devices}
        highlightDeviceId={detectionDeviceId}
      />

      {data.alerts.map((alert, i) => (
        <View
          key={alert.id ?? i}
          style={[
            styles.alertCard,
            {
              borderColor:
                alert.threatLevel === 'critical'
                  ? c.severityCritical
                  : c.border,
            },
          ]}
        >
          <View style={styles.alertHeader}>
            <Text
              style={[
                styles.severity,
                { color: severityColor(alert.threatLevel) },
              ]}
            >
              {severityIcon(alert.threatLevel)}{' '}
              {alert.threatLevel.toUpperCase()}
            </Text>
            <Text style={styles.alertTime}>
              {formatDate(alert.timestamp)}
            </Text>
          </View>
          <Text style={styles.alertDetail}>
            {alert.detectionType} detection
            {alert.deviceId ? ` — ${alert.deviceId}` : ''}
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
    </BriefingContainer>
  );
};

const styles = StyleSheet.create({
  emptyText: {
    ...t.body,
    color: c.textTertiary,
    fontStyle: 'italic',
  },
  alertCard: {
    backgroundColor: c.surfaceDark,
    borderWidth: 1,
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
});
