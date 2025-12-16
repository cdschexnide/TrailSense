/**
 * DevicesHeaderHero - Premium device stats section
 *
 * Features:
 * - Animated stat cards with gradient backgrounds
 * - Live status indicators with glow effects
 * - Smooth number transitions
 * - Interactive device overview
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface DevicesHeaderHeroProps {
  stats: {
    total: number;
    online: number;
    offline: number;
  };
}

export const DevicesHeaderHero: React.FC<DevicesHeaderHeroProps> = ({
  stats,
}) => {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors;

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Entrance animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1,
      tension: 60,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  // Pulse animation for online indicator
  useEffect(() => {
    if (stats.online > 0) {
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      glow.start();
      return () => glow.stop();
    }
  }, [stats.online]);

  const renderStatCard = (
    type: 'total' | 'online' | 'offline',
    index: number
  ) => {
    const configs = {
      total: {
        value: stats.total,
        label: 'Total',
        icon: 'hardware-chip',
        gradientLight: ['#E8F4FD', '#D0E8FA'],
        gradientDark: ['#1E3A5F', '#0D2137'],
        accentColor: colors.systemBlue,
        borderColor: 'rgba(10, 132, 255, 0.3)',
      },
      online: {
        value: stats.online,
        label: 'Online',
        icon: 'checkmark-circle',
        gradientLight: ['#E6F7ED', '#CCF0DB'],
        gradientDark: ['#1A3D2E', '#0D2518'],
        accentColor: colors.systemGreen,
        borderColor: 'rgba(48, 209, 88, 0.3)',
      },
      offline: {
        value: stats.offline,
        label: 'Offline',
        icon: 'close-circle',
        gradientLight: ['#FDECEC', '#FAD4D4'],
        gradientDark: ['#3D1E1E', '#251010'],
        accentColor: colors.systemRed,
        borderColor: 'rgba(255, 69, 58, 0.3)',
      },
    };

    const config = configs[type];
    const gradient = isDark ? config.gradientDark : config.gradientLight;

    return (
      <Animated.View
        key={type}
        style={[
          styles.statCardWrapper,
          {
            opacity: slideAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
              {
                scale: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={gradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.statCard,
            { borderColor: config.borderColor },
          ]}
        >
          {/* Icon container with glow effect for online */}
          <View style={styles.iconWrapper}>
            {type === 'online' && stats.online > 0 && (
              <Animated.View
                style={[
                  styles.glowEffect,
                  {
                    backgroundColor: config.accentColor,
                    opacity: glowAnim.interpolate({
                      inputRange: [0.5, 1],
                      outputRange: [0.2, 0.4],
                    }),
                    transform: [
                      {
                        scale: glowAnim.interpolate({
                          inputRange: [0.5, 1],
                          outputRange: [1, 1.3],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: config.accentColor + '30' },
              ]}
            >
              <Icon
                name={config.icon as any}
                size={22}
                color={config.accentColor}
              />
            </View>
          </View>

          {/* Value */}
          <Text
            variant="largeTitle"
            style={[
              styles.valueText,
              { color: config.accentColor },
            ]}
          >
            {config.value}
          </Text>

          {/* Label */}
          <Text
            variant="caption1"
            color="secondaryLabel"
            style={styles.labelText}
          >
            {config.label}
          </Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardsRow}>
        {renderStatCard('total', 0)}
        {renderStatCard('online', 1)}
        {renderStatCard('offline', 2)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCardWrapper: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 32,
  },
  labelText: {
    fontWeight: '600',
  },
});
