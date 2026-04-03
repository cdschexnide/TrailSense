import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms/Text';
import type { TimelineData } from '@/types/cardData';
import {
  tacticalColors as c,
  tacticalTypography as t,
} from '@/constants/tacticalTheme';
import { BriefingContainer } from './BriefingContainer';

interface TimelineCardProps {
  data: TimelineData;
  assessment: string;
  assessmentUnavailable?: boolean;
  onCopy?: () => void;
  onFeedback?: (positive: boolean) => void;
}

export const TimelineCard: React.FC<TimelineCardProps> = ({
  data,
  assessment,
  assessmentUnavailable,
  onCopy,
  onFeedback,
}) => {
  if (data.hourlyBuckets.every(b => b.count === 0)) {
    return (
      <BriefingContainer
        label="ACTIVITY TIMELINE — 24H"
        assessment={assessment}
        assessmentUnavailable={assessmentUnavailable}
        assessmentLabel="ANALYSIS"
        onCopy={onCopy}
        onFeedback={onFeedback}
      >
        <Text style={styles.emptyText}>
          No activity recorded in the selected period
        </Text>
      </BriefingContainer>
    );
  }

  const maxCount = Math.max(...data.hourlyBuckets.map(b => b.count), 1);

  // Show every 2 hours to keep it compact
  const visibleBuckets = data.hourlyBuckets.filter(
    (_, i) => i % 2 === 0
  );

  return (
    <BriefingContainer
      label="ACTIVITY TIMELINE — 24H"
      assessment={assessment}
      assessmentUnavailable={assessmentUnavailable}
      assessmentLabel="ANALYSIS"
      onCopy={onCopy}
      onFeedback={onFeedback}
    >
      {visibleBuckets.map(bucket => {
        const pct = (bucket.count / maxCount) * 100;
        const isPeak = bucket.label === data.busiestHour;
        return (
          <View key={bucket.hour} style={styles.row}>
            <Text style={styles.timeLabel}>{bucket.label}</Text>
            <View style={styles.barWrap}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${Math.max(pct, 2)}%`,
                    backgroundColor: isPeak
                      ? c.accentPrimary
                      : pct > 50
                        ? '#6a8a4a'
                        : pct > 20
                          ? '#4a5a3a'
                          : '#2a3a2a',
                  },
                ]}
              />
            </View>
            <Text style={styles.countLabel}>{bucket.count}</Text>
          </View>
        );
      })}
    </BriefingContainer>
  );
};

const styles = StyleSheet.create({
  emptyText: {
    ...t.body,
    color: c.textTertiary,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  timeLabel: {
    ...t.timestamp,
    color: c.textTertiary,
    width: 44,
  },
  barWrap: {
    flex: 1,
    height: 14,
    backgroundColor: c.surfaceDark,
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
  countLabel: {
    ...t.timestamp,
    color: c.textTertiary,
    width: 20,
    textAlign: 'right',
  },
});
