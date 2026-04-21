/**
 * TrailSenseDeviceMarker
 *
 * Blue pulsing marker showing the TrailSense device's GPS location
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { PointAnnotation } from '@rnmapbox/maps';

interface TrailSenseDeviceMarkerProps {
  id: string;
  coordinate: [number, number]; // [longitude, latitude]
  isOnline?: boolean;
  onPress?: () => void;
}

export const TrailSenseDeviceMarker: React.FC<TrailSenseDeviceMarkerProps> = ({
  id,
  coordinate,
  isOnline = true,
  onPress,
}) => {
  const [pulseAnim] = useState(() => new Animated.Value(1));

  // Pulsing animation when online
  useEffect(() => {
    if (isOnline) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }

    return undefined;
  }, [isOnline, pulseAnim]);

  const pulseOpacity = useMemo(
    () =>
      pulseAnim.interpolate({
        inputRange: [1, 1.3],
        outputRange: [0.4, 0],
      }),
    [pulseAnim]
  );

  return (
    <PointAnnotation
      id={`trailsense-device-${id}`}
      coordinate={coordinate}
      onSelected={onPress}
    >
      <View collapsable={false} style={styles.container}>
        {/* Pulse ring (only when online) */}
        {isOnline && (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseOpacity,
              },
            ]}
          />
        )}

        {/* Outer blue circle */}
        <View style={[styles.outerCircle, !isOnline && styles.offlineOuter]}>
          {/* Inner white circle */}
          <View style={styles.innerCircle}>
            {/* Center dot */}
            <View style={[styles.centerDot, !isOnline && styles.offlineDot]} />
          </View>
        </View>
      </View>
    </PointAnnotation>
  );
};

const BLUE = '#007AFF';
const GRAY = '#8E8E93';

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BLUE,
  },
  outerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  offlineOuter: {
    backgroundColor: GRAY,
  },
  innerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BLUE,
  },
  offlineDot: {
    backgroundColor: GRAY,
  },
});

export default TrailSenseDeviceMarker;
