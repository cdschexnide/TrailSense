import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { Button } from '@components/atoms/Button';
import { ScreenLayout, LoadingState, ErrorState } from '@components/templates';
import { ListSection } from '@components/molecules/ListSection';
import { ListRow } from '@components/molecules/ListRow';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AlertsStackParamList } from '@navigation/types';
import { useAlert } from '@hooks/api/useAlerts';
import { formatTimestamp } from '@utils/dateUtils';
import { useAlertSummary } from '@/hooks/useAlertSummary';
import { AlertSummaryCard } from '@/components/organisms/AlertSummaryCard';
import { FEATURE_FLAGS } from '@/config/featureFlags';

type AlertDetailRouteProp = RouteProp<AlertsStackParamList, 'AlertDetail'>;

export const AlertDetailScreen = ({ navigation }: any) => {
  const route = useRoute<AlertDetailRouteProp>();
  const { alertId } = route.params;
  const { data: alert, isLoading, error } = useAlert(alertId);

  // LLM Alert Summary Hook
  const {
    summary,
    isLoading: isGeneratingSummary,
    error: summaryError,
    generate: generateSummary,
    regenerate: regenerateSummary,
  } = useAlertSummary(alert);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load alert" />;
  if (!alert) return <ErrorState message="Alert not found" />;

  const handleMarkReviewed = async () => {
    // Implement mark reviewed logic
    console.log('Marking alert as reviewed:', alertId);
  };

  const handleDelete = async () => {
    // Implement delete logic
    console.log('Deleting alert:', alertId);
    navigation.goBack();
  };

  const handleFeedback = (positive: boolean) => {
    // Track feedback for analytics
    console.log('LLM feedback:', {
      alertId: alert.id,
      feedback: positive ? 'positive' : 'negative',
      threatLevel: alert.threatLevel,
    });
    // TODO: Add analytics tracking when analytics service is available
  };

  return (
    <ScreenLayout
      header={{
        title: 'Alert Details',
        showBack: true,
      }}
      scrollable
    >
      <ListSection header="DETECTION INFORMATION" style={styles.section}>
        <ListRow
          title="Type"
          rightText={alert.detectionType}
          accessoryType="none"
        />
        <ListRow
          title="Threat Level"
          rightText={alert.threatLevel.toUpperCase()}
          accessoryType="none"
        />
        <ListRow
          title="Signal Strength"
          rightText={`${alert.rssi} dBm`}
          accessoryType="none"
        />
        {alert.macAddress && (
          <ListRow
            title="MAC Address"
            rightText={alert.macAddress}
            accessoryType="none"
          />
        )}
        <ListRow
          title="Detected"
          rightText={formatTimestamp(alert.timestamp)}
          accessoryType="none"
        />
      </ListSection>

      {/* AI Summary Section - Now available on both Android and iOS */}
      {FEATURE_FLAGS.LLM_ALERT_SUMMARIES &&
        (Platform.OS === 'android' || Platform.OS === 'ios') && (
          <View style={styles.aiSummarySection}>
            {!summary && !isGeneratingSummary && !summaryError && (
              <TouchableOpacity
                onPress={generateSummary}
                style={styles.explainButton}
                accessibilityLabel="Explain alert with AI"
                accessibilityRole="button"
              >
                <Text style={styles.explainButtonText}>✨ Explain with AI</Text>
              </TouchableOpacity>
            )}

            <AlertSummaryCard
              summary={summary}
              isLoading={isGeneratingSummary}
              error={summaryError}
              onRegenerate={regenerateSummary}
              onFeedback={handleFeedback}
            />
          </View>
        )}

      <ListSection header="DEVICE INFORMATION" style={styles.section}>
        <ListRow
          title="Device"
          rightText={alert.deviceId}
          onPress={() =>
            navigation.navigate('DeviceDetail', { id: alert.deviceId })
          }
          accessoryType="disclosureIndicator"
        />
        {alert.location && (
          <ListRow
            title="Location"
            rightText={`${alert.location.latitude}, ${alert.location.longitude}`}
            accessoryType="none"
          />
        )}
      </ListSection>

      <ListSection header="STATUS" style={styles.section}>
        <ListRow
          title="Reviewed"
          rightText={alert.isReviewed ? 'Yes' : 'No'}
          accessoryType="none"
        />
        <ListRow
          title="False Positive"
          rightText={alert.isFalsePositive ? 'Yes' : 'No'}
          accessoryType="none"
        />
      </ListSection>

      <View style={styles.actions}>
        <Button
          buttonStyle="filled"
          role="default"
          onPress={handleMarkReviewed}
        >
          Mark as Reviewed
        </Button>
        <Button buttonStyle="filled" role="destructive" onPress={handleDelete}>
          Delete Alert
        </Button>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  aiSummarySection: {
    marginHorizontal: 20,
    marginVertical: 12,
  },
  explainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  explainButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
});
