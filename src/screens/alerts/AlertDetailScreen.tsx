import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from '@components/atoms/Button';
import { ScreenLayout, LoadingState, ErrorState } from '@components/templates';
import { ListSection } from '@components/molecules/ListSection';
import { ListRow } from '@components/molecules/ListRow';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AlertsStackParamList } from '@navigation/types';
import { useAlert } from '@hooks/api/useAlerts';
import { formatTimestamp } from '@utils/dateUtils';

type AlertDetailRouteProp = RouteProp<AlertsStackParamList, 'AlertDetail'>;

export const AlertDetailScreen = ({ navigation }: any) => {
  const route = useRoute<AlertDetailRouteProp>();
  const { alertId } = route.params;
  const { data: alert, isLoading, error } = useAlert(alertId);

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

      <ListSection header="DEVICE INFORMATION" style={styles.section}>
        <ListRow
          title="Device"
          rightText={alert.deviceId}
          onPress={() => navigation.navigate('DeviceDetail', { id: alert.deviceId })}
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
        <Button
          buttonStyle="filled"
          role="destructive"
          onPress={handleDelete}
        >
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
});
