import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Badge, Card } from '@components/atoms';
import { ScreenLayout, LoadingState, ErrorState } from '@components/templates';
import { useTheme } from '@hooks/useTheme';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AlertsStackParamList } from '@navigation/types';
import { useAlert } from '@hooks/api/useAlerts';
import { formatTimestamp } from '@utils/dateUtils';

type AlertDetailRouteProp = RouteProp<AlertsStackParamList, 'AlertDetail'>;

export const AlertDetailScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const route = useRoute<AlertDetailRouteProp>();
  const { alertId } = route.params;
  const { data: alert, isLoading, error } = useAlert(alertId);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!alert) return <ErrorState error="Alert not found" />;

  const getThreatColor = () => {
    return theme.colors.threat[alert.threatLevel];
  };

  const handleDismiss = async () => {
    // Implement dismiss logic
    navigation.goBack();
  };

  const handleWhitelist = async () => {
    // Navigate to whitelist addition
    navigation.navigate('AddWhitelist', {
      macAddress: alert.macAddress,
      deviceId: alert.deviceId
    });
  };

  return (
    <ScreenLayout title="Alert Details">
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <Badge
              label={alert.threatLevel.toUpperCase()}
              color={getThreatColor()}
            />
            <Text variant="caption" style={styles.timestamp}>
              {formatTimestamp(alert.timestamp)}
            </Text>
          </View>

          <View style={styles.section}>
            <Text variant="h2" style={styles.sectionTitle}>
              Detection Information
            </Text>
            <InfoRow label="Type" value={alert.detectionType} />
            <InfoRow label="Device ID" value={alert.deviceId} />
            <InfoRow label="Signal Strength" value={`${alert.rssi} dBm`} />
            {alert.macAddress && (
              <InfoRow label="MAC Address" value={alert.macAddress} />
            )}
          </View>

          {alert.location && (
            <View style={styles.section}>
              <Text variant="h2" style={styles.sectionTitle}>
                Location
              </Text>
              <InfoRow
                label="Coordinates"
                value={`${alert.location.latitude}, ${alert.location.longitude}`}
              />
            </View>
          )}

          {alert.metadata && (
            <View style={styles.section}>
              <Text variant="h2" style={styles.sectionTitle}>
                Additional Details
              </Text>
              {Object.entries(alert.metadata).map(([key, value]) => (
                <InfoRow key={key} label={key} value={String(value)} />
              ))}
            </View>
          )}
        </Card>

        <View style={styles.actions}>
          <Button
            title="Dismiss Alert"
            variant="ghost"
            onPress={handleDismiss}
            style={styles.button}
          />
          <Button
            title="Add to Whitelist"
            variant="outline"
            onPress={handleWhitelist}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text variant="caption" style={styles.label}>
      {label}
    </Text>
    <Text variant="body" style={styles.value}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timestamp: {
    opacity: 0.7,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  label: {
    flex: 1,
    opacity: 0.7,
  },
  value: {
    flex: 2,
    textAlign: 'right',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    marginBottom: 8,
  },
});
