import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Card } from '@components/molecules/Card';
import { Icon } from '@components/atoms/Icon';
import { useTheme } from '@hooks/useTheme';
import { AlertSummary } from '@/types/llm';

interface AlertSummaryCardProps {
  summary: AlertSummary | null;
  isLoading: boolean;
  error?: Error | null;
  onRegenerate?: () => void;
  onFeedback?: (positive: boolean) => void;
  testID?: string;
}

/**
 * AlertSummaryCard Component
 * Displays AI-generated natural language summaries of security alerts
 */
export const AlertSummaryCard: React.FC<AlertSummaryCardProps> = ({
  summary,
  isLoading,
  error,
  onRegenerate,
  onFeedback,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  // Loading state
  if (isLoading) {
    return (
      <Card style={styles.card} testID={`${testID}-loading`}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.systemBlue} />
          <Text style={[styles.loadingText, { color: colors.secondaryLabel }]}>
            Analyzing with AI...
          </Text>
        </View>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card style={styles.card} testID={`${testID}-error`}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={20} color={colors.systemRed} />
          <Text style={[styles.errorText, { color: colors.systemRed }]}>
            Unable to generate AI summary
          </Text>
          {onRegenerate && (
            <TouchableOpacity onPress={onRegenerate} style={styles.retryButton}>
              <Text style={[styles.retryText, { color: colors.systemBlue }]}>
                Try Again
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  }

  // No summary yet
  if (!summary) {
    return null;
  }

  return (
    <Card style={styles.card} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="sparkles" size={20} color={colors.systemBlue} />
        <Text
          style={[
            styles.headerText,
            typography.headline,
            { color: colors.label },
          ]}
        >
          AI Analysis
        </Text>
      </View>

      {/* Main Summary */}
      <Text
        style={[
          styles.summary,
          typography.body,
          { color: colors.label },
        ]}
      >
        {summary.summary}
      </Text>

      {/* Recommended Actions */}
      {summary.recommendedActions && summary.recommendedActions.length > 0 && (
        <View
          style={[
            styles.actionsContainer,
            { backgroundColor: colors.secondarySystemGroupedBackground },
          ]}
        >
          <Text
            style={[
              styles.actionsTitle,
              typography.subheadline,
              { color: colors.label },
            ]}
          >
            Recommended Actions:
          </Text>
          {summary.recommendedActions.map((action, index) => (
            <View key={index} style={styles.actionItem}>
              <Text style={[styles.actionBullet, { color: colors.systemBlue }]}>
                •
              </Text>
              <Text
                style={[
                  styles.actionText,
                  typography.callout,
                  { color: colors.secondaryLabel },
                ]}
              >
                {action}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer with feedback and regenerate */}
      <View style={styles.footer}>
        {/* Feedback buttons */}
        {onFeedback && (
          <View style={styles.feedbackContainer}>
            <Text
              style={[
                styles.feedbackLabel,
                typography.caption1,
                { color: colors.tertiaryLabel },
              ]}
            >
              Was this helpful?
            </Text>
            <TouchableOpacity
              onPress={() => onFeedback(true)}
              style={styles.feedbackButton}
              accessibilityLabel="Positive feedback"
              accessibilityRole="button"
            >
              <Icon name="thumbs-up" size={18} color={colors.secondaryLabel} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onFeedback(false)}
              style={styles.feedbackButton}
              accessibilityLabel="Negative feedback"
              accessibilityRole="button"
            >
              <Icon name="thumbs-down" size={18} color={colors.secondaryLabel} />
            </TouchableOpacity>
          </View>
        )}

        {/* Regenerate button */}
        {onRegenerate && (
          <TouchableOpacity
            onPress={onRegenerate}
            style={styles.regenerateButton}
            accessibilityLabel="Regenerate summary"
            accessibilityRole="button"
          >
            <Icon name="refresh-cw" size={16} color={colors.systemBlue} />
            <Text
              style={[
                styles.regenerateText,
                typography.footnote,
                { color: colors.systemBlue },
              ]}
            >
              Regenerate
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Confidence indicator (optional) */}
      {summary.confidence && summary.confidence < 0.7 && (
        <View
          style={[
            styles.confidenceWarning,
            { backgroundColor: colors.systemYellow + '20' },
          ]}
        >
          <Icon name="alert-triangle" size={14} color={colors.systemYellow} />
          <Text
            style={[
              styles.confidenceText,
              typography.caption2,
              { color: colors.secondaryLabel },
            ]}
          >
            Low confidence analysis
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 15,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    marginLeft: 8,
    fontSize: 17,
    fontWeight: '600',
  },
  summary: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  actionsContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  actionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  actionBullet: {
    marginRight: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackLabel: {
    fontSize: 13,
    marginRight: 8,
  },
  feedbackButton: {
    padding: 8,
    marginLeft: 4,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  regenerateText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  confidenceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  confidenceText: {
    marginLeft: 6,
    fontSize: 12,
  },
});
