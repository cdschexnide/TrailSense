/**
 * PositionInfoPopup
 *
 * Minimal popup shown when tapping a detected device marker
 * Shows: signal type icon, confidence %, accuracy radius
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { TriangulationSignalType } from '@/types/triangulation';

interface PositionInfoPopupProps {
  signalType: TriangulationSignalType;
  confidence: number;
  accuracyMeters: number;
  onClose: () => void;
}

const SIGNAL_TYPE_LABELS: Record<TriangulationSignalType, string> = {
  wifi: 'WiFi',
  bluetooth: 'Bluetooth',
  cellular: 'Cellular',
};

const SIGNAL_TYPE_COLORS: Record<TriangulationSignalType, string> = {
  wifi: '#007AFF',
  bluetooth: '#5856D6',
  cellular: '#FF9500',
};

const SIGNAL_TYPE_ICONS: Record<TriangulationSignalType, string> = {
  wifi: 'wifi',
  bluetooth: 'bluetooth',
  cellular: 'cellular',
};

export const PositionInfoPopup: React.FC<PositionInfoPopupProps> = ({
  signalType,
  confidence,
  accuracyMeters,
  onClose,
}) => {
  const color = SIGNAL_TYPE_COLORS[signalType] || '#8E8E93';
  const iconName = SIGNAL_TYPE_ICONS[signalType] || 'ellipse';
  const label = SIGNAL_TYPE_LABELS[signalType] || 'Unknown';

  return (
    <View style={styles.container}>
      <View style={styles.popup}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="close" size={16} color="secondaryLabel" />
        </TouchableOpacity>

        {/* Signal type row */}
        <View style={styles.row}>
          <Icon name={iconName} size={18} color={color} />
          <Text variant="subheadline" weight="semibold" color="label" style={styles.label}>
            {label}
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {/* Confidence */}
          <View style={styles.stat}>
            <Text variant="caption1" color="secondaryLabel">
              Confidence
            </Text>
            <Text variant="headline" weight="bold" color="label">
              {confidence}%
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Accuracy */}
          <View style={styles.stat}>
            <Text variant="caption1" color="secondaryLabel">
              Accuracy
            </Text>
            <Text variant="headline" weight="bold" color="label">
              ±{accuracyMeters.toFixed(1)}m
            </Text>
          </View>
        </View>
      </View>

      {/* Pointer triangle */}
      <View style={styles.pointer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  popup: {
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderRadius: 12,
    padding: 12,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  label: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(28, 28, 30, 0.95)',
    marginTop: -1,
  },
});

export default PositionInfoPopup;
