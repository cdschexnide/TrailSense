import React, { useEffect, useState } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { useReducedMotion } from '@hooks/useReducedMotion';

interface SkeletonCardProps {
  width?: number | `${number}%` | 'auto';
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  width = '100%',
  height = 76,
  borderRadius = 12,
  style,
}) => {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [shimmer] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) {
      shimmer.setValue(0.5);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [reduceMotion, shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.16],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.label,
          opacity,
        },
        style,
      ]}
    />
  );
};
