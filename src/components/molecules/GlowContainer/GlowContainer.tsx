/**
 * GlowContainer Component
 *
 * Wraps children with a subtle animated glow effect.
 * Used for critical alerts and offline devices with
 * Tesla/Rivian dashboard aesthetic.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useReducedMotion } from '@hooks/useReducedMotion';

interface GlowContainerProps {
  children: React.ReactNode;
  glowColor: string;
  intensity?: 'subtle' | 'medium' | 'strong';
  pulse?: boolean;
  style?: ViewStyle;
}

const INTENSITY_OPACITY = {
  subtle: 0.15,
  medium: 0.25,
  strong: 0.35,
} as const;

const PULSE_DURATION = 3000; // 3 second cycle

export const GlowContainer: React.FC<GlowContainerProps> = ({
  children,
  glowColor,
  intensity = 'subtle',
  pulse = false,
  style,
}) => {
  const animatedOpacity = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (pulse && !reduceMotion) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedOpacity, {
            toValue: 0.4,
            duration: PULSE_DURATION / 2,
            useNativeDriver: true,
          }),
          Animated.timing(animatedOpacity, {
            toValue: 1,
            duration: PULSE_DURATION / 2,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();

      return () => {
        animation.stop();
      };
    } else {
      animatedOpacity.setValue(1);
      return undefined;
    }
  }, [pulse, reduceMotion, animatedOpacity]);

  const baseOpacity = INTENSITY_OPACITY[intensity];

  return (
    <View style={[styles.container, style]}>
      {/* Glow layer positioned behind content */}
      <Animated.View
        style={[
          styles.glowLayer,
          {
            backgroundColor: glowColor,
            opacity: animatedOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, baseOpacity],
            }),
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: baseOpacity * 2,
            shadowRadius: 12,
          },
        ]}
      />
      {/* Content layer */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});

export default GlowContainer;
