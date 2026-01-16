/**
 * PositionListItem
 *
 * Minimal list item for a triangulated device position.
 * Shows signal type icon, fingerprint hash, and confidence %.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { TriangulatedPosition, TriangulationSignalType } from '@/types/triangulation';

interface PositionListItemProps {
  position: TriangulatedPosition;
  onPress: () => void;
}

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

export const PositionListItem: React.FC<PositionListItemProps> = ({
  position,
  onPress,
}) => {
  const color = SIGNAL_TYPE_COLORS[position.signalType] || '#8E8E93';
  const iconName = SIGNAL_TYPE_ICONS[position.signalType] || 'ellipse';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon name={iconName} size={18} color={color} />
      </View>
      <Text variant="body" weight="medium" color="label" style={styles.fingerprint}>
        {position.fingerprintHash}
      </Text>
      <Text variant="body" color="secondaryLabel">
        {position.confidence}%
      </Text>
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
    borderBottomColor: '#3a3a3c',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fingerprint: {
    flex: 1,
  },
});

export default PositionListItem;
