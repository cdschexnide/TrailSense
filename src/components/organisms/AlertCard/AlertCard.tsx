import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Alert } from '@types';
import { Card, Badge, Button } from '@components/atoms';
import { formatTimestamp } from '@utils/dateUtils';

interface AlertCardProps {
  alert: Alert;
  onPress?: () => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onPress }) => {
  const getThreatVariant = (): any => {
    switch (alert.threatLevel) {
      case 'low':
        return 'threat-low';
      case 'medium':
        return 'threat-medium';
      case 'high':
        return 'threat-high';
      case 'critical':
        return 'threat-critical';
      default:
        return 'neutral';
    }
  };

  const getDetectionVariant = (): any => {
    switch (alert.detectionType) {
      case 'cellular':
        return 'detection-cellular';
      case 'wifi':
        return 'detection-wifi';
      case 'bluetooth':
        return 'detection-bluetooth';
      default:
        return 'info';
    }
  };

  const handleDismiss = async (e: any) => {
    e?.stopPropagation?.();
    console.log('Dismissing alert:', alert.id);
  };

  const handleWhitelist = async (e: any) => {
    e?.stopPropagation?.();
    console.log('Whitelisting alert:', alert.id);
  };

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Badge
          label={alert.threatLevel.toUpperCase()}
          variant={getThreatVariant()}
        />
        <Text style={styles.timestamp}>
          {formatTimestamp(alert.timestamp)}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {alert.detectionType.charAt(0).toUpperCase() + alert.detectionType.slice(1)} Detection
          </Text>
          <Badge
            label={alert.detectionType.toUpperCase()}
            variant={getDetectionVariant()}
            size="sm"
          />
        </View>
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
    color: '#999',
  },
  content: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  details: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 6,
  },
  mac: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#888',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
});
