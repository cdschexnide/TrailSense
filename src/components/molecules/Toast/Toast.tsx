import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Icon, Text } from '@components/atoms';
import { useReducedMotion } from '@hooks/useReducedMotion';

export type ToastVariant = 'success' | 'error' | 'info';

type IconName = keyof typeof Ionicons.glyphMap;

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: IconName; bgColor: string }
> = {
  success: {
    icon: 'checkmark-circle',
    bgColor: 'rgba(90, 138, 90, 0.95)',
  },
  error: {
    icon: 'alert-circle',
    bgColor: 'rgba(184, 74, 66, 0.95)',
  },
  info: {
    icon: 'information-circle',
    bgColor: 'rgba(107, 107, 78, 0.95)',
  },
};

export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'success',
  visible,
  onDismiss,
  duration = 3000,
}) => {
  const reduceMotion = useReducedMotion();
  const [translateY] = useState(() => new Animated.Value(-100));
  const config = VARIANT_CONFIG[variant];

  useEffect(() => {
    if (!visible) {
      translateY.setValue(-100);
      return undefined;
    }

    void Haptics.notificationAsync(
      variant === 'error'
        ? Haptics.NotificationFeedbackType.Error
        : variant === 'info'
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Success
    );

    if (reduceMotion) {
      translateY.setValue(0);
    } else {
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 300,
        useNativeDriver: true,
      }).start();
    }

    const timer = setTimeout(() => {
      if (reduceMotion) {
        translateY.setValue(-100);
        onDismiss();
      } else {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }).start(() => onDismiss());
      }
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [duration, onDismiss, reduceMotion, translateY, variant, visible]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="none"
    >
      <Icon name={config.icon} size={20} color="white" />
      <Text
        variant="subheadline"
        weight="semibold"
        style={styles.message}
        numberOfLines={2}
      >
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 90,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 9999,
    gap: 10,
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
  },
});
