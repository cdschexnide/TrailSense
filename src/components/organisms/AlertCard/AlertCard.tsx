import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Alert } from '@types';
import { Card, Badge, Button } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { formatTimestamp } from '@utils/dateUtils';

interface AlertCardProps {
  alert: Alert;
  onPress?: () => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onPress }) => {
  const { theme } = useTheme();
  const { colors } = theme;

  const getThreatColor = () => {
    return colors.threat[alert.threatLevel];
  };

  const handleDismiss = async (e: any) => {
    e.stopPropagation();
    // TODO: Implement dismiss logic via API
    console.log('Dismissing alert:', alert.id);
  };

  const handleWhitelist = async (e: any) => {
    e.stopPropagation();
    // TODO: Implement whitelist logic via API
    console.log('Whitelisting alert:', alert.id);
  };

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Badge
          label={alert.threatLevel.toUpperCase()}
          color={getThreatColor()}
        />
        <Text style={styles.timestamp}>
          {formatTimestamp(alert.timestamp)}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {alert.detectionType} Detection
        </Text>
        <Text style={styles.details}>
          Device: {alert.deviceId}
        </Text>
        <Text style={styles.details}>
          Signal: {alert.rssi} dBm
        </Text>
        {alert.macAddress && (
          <Text style={styles.mac}>{alert.macAddress}</Text>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          title="Dismiss"
          variant="ghost"
          size="sm"
          onPress={handleDismiss}
        />
        <Button
          title="Whitelist"
          variant="outline"
          size="sm"
          onPress={handleWhitelist}
        />
        <Button
          title="View"
          variant="primary"
          size="sm"
          onPress={onPress}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  content: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  details: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  mac: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.6,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
