/**
 * PositionListItem
 *
 * Two-line list item for a triangulated device position.
 * Line 1: Signal type label (WiFi/Bluetooth/Cellular Device)
 * Line 2: Fingerprint hash, confidence %, and accuracy in meters.
 * Includes navigation chevron on the right.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { TriangulatedPosition, TriangulationSignalType } from '@/types/triangulation';
import { useTheme } from '@hooks/useTheme';

interface PositionListItemProps {
  position: TriangulatedPosition;
  onPress: () => void;
}

const SIGNAL_TYPE_ICONS: Record<TriangulationSignalType, string> = {
  wifi: 'wifi',
  bluetooth: 'bluetooth',
  cellular: 'cellular',
};

const SIGNAL_TYPE_LABELS: Record<TriangulationSignalType, string> = {
  wifi: 'WiFi',
  bluetooth: 'Bluetooth',
  cellular: 'Cellular',
};

export const PositionListItem: React.FC<PositionListItemProps> = ({
  position,
  onPress,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  // Map signal types to theme colors
  const signalTypeColors: Record<TriangulationSignalType, string> = {
    wifi: colors.systemBlue,
    bluetooth: colors.systemPurple,
    cellular: colors.systemOrange,
  };

  const color = signalTypeColors[position.signalType] || colors.tertiaryLabel;
  const iconName = SIGNAL_TYPE_ICONS[position.signalType] || 'ellipse';

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: colors.separator }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon name={iconName} size={18} color={color} />
      </View>
      <View style={styles.content}>
        <Text variant="body" weight="medium" color="label">
          {SIGNAL_TYPE_LABELS[position.signalType]} Device
        </Text>
        <Text variant="footnote" color="secondaryLabel">
          {position.fingerprintHash} · {position.confidence}% · ±{position.accuracyMeters?.toFixed(1) || '?'}m
        </Text>
      </View>
      <Icon name="chevron-forward" size={16} color={colors.tertiaryLabel} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    gap: 2,
  },
});

export default PositionListItem;
