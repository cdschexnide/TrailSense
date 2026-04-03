import React from 'react';
import { View, StyleSheet, Pressable, Clipboard } from 'react-native';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import {
  tacticalColors as c,
  tacticalTypography as t,
  tacticalSpacing as s,
} from '@/constants/tacticalTheme';
import * as Haptics from 'expo-haptics';

interface BriefingContainerProps {
  label: string;
  children: React.ReactNode;
  assessment?: string;
  assessmentUnavailable?: boolean;
  assessmentLabel?: string;
  onCopy?: () => void;
  onFeedback?: (positive: boolean) => void;
}

export const BriefingContainer: React.FC<BriefingContainerProps> = ({
  label,
  children,
  assessment,
  assessmentUnavailable,
  assessmentLabel = 'ASSESSMENT',
  onCopy,
  onFeedback,
}) => {
  const handleCopy = () => {
    if (assessment) {
      Clipboard.setString(assessment);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onCopy?.();
    }
  };

  const handleFeedback = (positive: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFeedback?.(positive);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerLabel, { color: c.accentPrimary }]}>
          {'▌ ' + label}
        </Text>
      </View>

      <View style={styles.body}>{children}</View>

      {(assessment || assessmentUnavailable) && (
        <View style={styles.assessment}>
          <Text
            style={[styles.sectionLabel, { color: c.accentPrimary }]}
          >
            {'▌ ' + assessmentLabel}
          </Text>
          <Text
            style={[
              styles.assessmentText,
              assessmentUnavailable && styles.assessmentMuted,
            ]}
          >
            {assessmentUnavailable
              ? 'Analysis unavailable'
              : assessment}
          </Text>
        </View>
      )}

      <View style={styles.feedbackRow}>
        <Pressable
          style={styles.feedbackBtn}
          onPress={handleCopy}
          hitSlop={8}
        >
          <Icon name="copy-outline" size={12} color={c.textTertiary} />
          <Text style={styles.feedbackText}>Copy</Text>
        </Pressable>
        <Pressable
          style={styles.feedbackBtn}
          onPress={() => handleFeedback(true)}
          hitSlop={8}
        >
          <Icon
            name="thumbs-up-outline"
            size={12}
            color={c.textTertiary}
          />
        </Pressable>
        <Pressable
          style={styles.feedbackBtn}
          onPress={() => handleFeedback(false)}
          hitSlop={8}
        >
          <Icon
            name="thumbs-down-outline"
            size={12}
            color={c.textTertiary}
          />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch' as const,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: s.cardRadius,
  },
  header: {
    backgroundColor: c.surfaceDark,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  headerLabel: {
    ...t.headerLabel,
  },
  body: {
    padding: s.cardPadding,
  },
  assessment: {
    marginTop: 0,
    paddingTop: s.sectionGap,
    paddingHorizontal: s.cardPadding,
    paddingBottom: s.cardPadding,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  sectionLabel: {
    ...t.sectionLabel,
    marginBottom: 4,
  },
  assessmentText: {
    ...t.body,
    color: c.textSecondary,
  },
  assessmentMuted: {
    color: c.textTertiary,
    fontStyle: 'italic',
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: s.cardPadding,
    paddingTop: 6,
    paddingBottom: s.cardPadding,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  feedbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 4,
  },
  feedbackText: {
    ...t.dataValue,
    color: c.textTertiary,
  },
});
