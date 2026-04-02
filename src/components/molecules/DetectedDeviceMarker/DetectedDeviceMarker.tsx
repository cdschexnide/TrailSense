/**
 * DetectedDeviceMarker
 *
 * Map marker for a triangulated detected device position
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { PointAnnotation } from '@rnmapbox/maps';
import { Icon } from '@components/atoms/Icon';
import type { IconName } from '@components/atoms/Icon/Icon';
import { TriangulationSignalType } from '@/types/triangulation';

interface DetectedDeviceMarkerProps {
  id: string;
  coordinate: [number, number]; // [longitude, latitude]
  signalType: TriangulationSignalType;
  confidence: number;
  onPress?: () => void;
}

const SIGNAL_TYPE_COLORS: Record<TriangulationSignalType, string> = {
  wifi: '#007AFF', // systemBlue
  bluetooth: '#5856D6', // systemIndigo
  cellular: '#FF9500', // systemOrange
};

const SIGNAL_TYPE_ICONS: Record<TriangulationSignalType, IconName> = {
  wifi: 'wifi',
  bluetooth: 'bluetooth',
  cellular: 'cellular',
};

export const DetectedDeviceMarker: React.FC<DetectedDeviceMarkerProps> = ({
  id,
  coordinate,
  signalType,
  confidence,
  onPress,
}) => {
  const color = SIGNAL_TYPE_COLORS[signalType] || '#8E8E93';
  const iconName = SIGNAL_TYPE_ICONS[signalType] ?? 'ellipse';

  // Opacity based on confidence (50% conf = 0.6 opacity, 100% conf = 1.0)
  const opacity = 0.6 + (confidence / 100) * 0.4;

  return (
    <PointAnnotation
      id={`detected-device-${id}`}
      coordinate={coordinate}
      onSelected={onPress}
    >
      <TouchableOpacity
        style={[styles.markerContainer, { opacity }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={[styles.markerOuter, { backgroundColor: color }]}>
          <View style={styles.markerInner}>
            <Icon name={iconName} size={14} color={color} />
          </View>
        </View>
      </TouchableOpacity>
    </PointAnnotation>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  markerInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DetectedDeviceMarker;
