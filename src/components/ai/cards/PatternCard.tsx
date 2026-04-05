import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms/Text';
import type { PatternData } from '@/types/cardData';
import {
  tacticalColors as c,
  tacticalTypography as t,
  tacticalSpacing as s,
} from '@/constants/tacticalTheme';
import { BriefingContainer } from './BriefingContainer';

interface PatternCardProps {
  data: PatternData;
  assessment: string;
  assessmentUnavailable?: boolean;
  onCopy?: () => void;
  onFeedback?: (positive: boolean) => void;
}

const classificationColor = (cls: string) => {
  switch (cls) {
    case 'SUSPICIOUS':
      return c.accentWarning;
    case 'ROUTINE':
      return c.accentSuccess;
    default:
      return c.accentDanger;
  }
};

export const PatternCard: React.FC<PatternCardProps> = ({
  data,
  assessment,
  assessmentUnavailable,
  onCopy,
  onFeedback,
}) => {
  if (data.visitors.length === 0) {
    return (
      <BriefingContainer
        label="DETECTION PATTERNS"
        assessment={assessment}
        assessmentUnavailable={assessmentUnavailable}
        assessmentLabel="ANALYSIS"
        onCopy={onCopy}
        onFeedback={onFeedback}
      >
        <Text style={styles.emptyText}>
          No repeat visitors detected in the selected period
        </Text>
      </BriefingContainer>
    );
  }

  return (
    <BriefingContainer
      label="DETECTION PATTERNS"
      assessment={assessment}
      assessmentUnavailable={assessmentUnavailable}
      assessmentLabel="ANALYSIS"
      onCopy={onCopy}
      onFeedback={onFeedback}
    >
      {data.visitors.map((visitor, i) => (
        <View key={visitor.fingerprint + i} style={styles.visitorRow}>
          <View style={styles.visitorHeader}>
            <Text style={styles.mac}>{visitor.fingerprint}</Text>
            <View
              style={[
                styles.badge,
                {
                  borderColor: classificationColor(
                    visitor.classification
                  ),
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: classificationColor(
                      visitor.classification
                    ),
                  },
                ]}
              >
                {visitor.classification}
              </Text>
            </View>
          </View>
          <Text style={styles.visitorDetail}>
            {visitor.count} detections · {visitor.detectionType} ·{' '}
            {visitor.lastDevice}
          </Text>
        </View>
      ))}

      {data.busiestHour && (
        <View style={styles.anomalyRow}>
          <Text style={styles.anomalyText}>
            Peak activity: {data.busiestHour}
          </Text>
        </View>
      )}
    </BriefingContainer>
  );
};

const styles = StyleSheet.create({
  emptyText: {
    ...t.body,
    color: c.textTertiary,
    fontStyle: 'italic',
  },
  visitorRow: {
    backgroundColor: c.surfaceDark,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: s.innerCardRadius,
    padding: 8,
    marginBottom: 6,
  },
  visitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mac: {
    ...t.deviceName,
    color: c.textPrimary,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    ...t.dataValue,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  visitorDetail: {
    ...t.dataValue,
    color: c.textTertiary,
  },
  anomalyRow: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  anomalyText: {
    ...t.dataValue,
    color: c.accentWarning,
  },
});
