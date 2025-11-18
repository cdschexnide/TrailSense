import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Alert } from '@types';
import { Card, Badge, Text, Icon } from '@components/atoms';
import { formatTimestamp } from '@utils/dateUtils';
import { useTheme } from '@hooks/useTheme';

interface AlertCardProps {
  alert: Alert;
  onPress?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  onWhitelist?: (macAddress: string) => void;
  style?: ViewStyle;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onPress,
  onDismiss,
  onWhitelist,
  style,
}) => {
  const { theme } = useTheme();

  const getThreatVariant = () => {
    switch (alert.threatLevel) {
      case 'low':
        return 'low';
      case 'medium':
        return 'medium';
      case 'high':
        return 'high';
      case 'critical':
        return 'critical';
      default:
        return 'info';
    }
  };

  const getDetectionIcon = () => {
    switch (alert.detectionType) {
      case 'cellular':
        return 'cellular';
      case 'wifi':
        return 'wifi';
      case 'bluetooth':
        return 'bluetooth';
      default:
        return 'radio';
    }
  };

  const getDetectionIconColor = () => {
    switch (alert.detectionType) {
      case 'cellular':
        return theme.colors.systemPurple;
      case 'wifi':
        return theme.colors.systemBlue;
      case 'bluetooth':
        return theme.colors.systemTeal;
      default:
        return theme.colors.systemBlue;
    }
  };

  const getDetectionLabel = () => {
    return `${alert.detectionType.charAt(0).toUpperCase()}${alert.detectionType.slice(1)} Detection`;
  };

  const handleDelete = async (e: any) => {
    e?.stopPropagation?.();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDismiss?.(alert.id);
  };

  const handleWhitelist = async (e: any) => {
    e?.stopPropagation?.();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onWhitelist?.(alert.macAddress);
  };

  return (
    <Card onPress={() => onPress?.(alert.id)} variant="grouped" style={StyleSheet.flatten([styles.card, style])}>
      {/* Header row: Badge and Timestamp */}
      <View style={styles.header}>
        <Badge variant={getThreatVariant() as any} size="sm">
          {alert.threatLevel.toUpperCase()}
        </Badge>
        <Text variant="caption1" color="secondaryLabel">
          {formatTimestamp(alert.timestamp)}
        </Text>
      </View>

      {/* Detection type with icon */}
      <View style={styles.detectionRow}>
        <Icon
          name={getDetectionIcon()}
          size={24}
          color={getDetectionIconColor()}
        />
        <View style={styles.detectionContent}>
          <Text variant="headline" color="label">
            {getDetectionLabel()}
          </Text>

          {/* Metadata rows */}
          <View style={styles.metadata}>
            <Text variant="subheadline" color="secondaryLabel">
              Device: {alert.deviceId}
            </Text>
            <Text variant="subheadline" color="secondaryLabel" style={styles.metadataRow}>
              Signal: {alert.rssi} dBm
            </Text>
            {alert.macAddress && (
              <Text variant="subheadline" color="secondaryLabel" style={StyleSheet.flatten([styles.metadataRow, styles.mac])}>
                {alert.macAddress}
              </Text>
            )}
          </View>
        </View>

        {/* Chevron indicator */}
        <Icon
          name="chevron-forward"
          size={20}
          color={theme.colors.tertiaryLabel}
          style={styles.chevron}
        />
      </View>

      {/* Action buttons row at bottom */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={handleWhitelist}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: 'rgba(255, 149, 0, 0.15)',
              borderColor: theme.colors.systemOrange,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Icon name="shield-checkmark" size={20} color={theme.colors.systemOrange} />
          <Text variant="caption2" style={{ color: theme.colors.systemOrange, fontWeight: '600' }}>
            Whitelist
          </Text>
        </Pressable>

        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: 'rgba(255, 59, 48, 0.15)',
              borderColor: theme.colors.systemRed,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Icon name="trash-outline" size={20} color={theme.colors.systemRed} />
          <Text variant="caption2" style={{ color: theme.colors.systemRed, fontWeight: '600' }}>
            Delete
          </Text>
        </Pressable>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  detectionContent: {
    flex: 1,
  },
  metadata: {
    marginTop: 8,
  },
  metadataRow: {
    marginTop: 4,
  },
  mac: {
    fontFamily: 'monospace',
  },
  chevron: {
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 90,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
});
