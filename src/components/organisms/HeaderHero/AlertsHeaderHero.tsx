/**
 * AlertsHeaderHero - Premium threat summary section
 *
 * Features:
 * - Animated threat level indicators with pulse effects
 * - Gradient background cards
 * - Real-time count updates with spring animations
 * - Interactive filter chips
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Text, Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { ThreatLevel } from '@types';

interface ThreatCount {
  level: ThreatLevel;
  count: number;
  label: string;
  icon: string;
}

interface AlertsHeaderHeroProps {
  threatCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  selectedFilter: ThreatLevel | null;
  onFilterSelect: (level: ThreatLevel | null) => void;
}

const THREAT_CONFIG: Record<ThreatLevel, {
  label: string;
  icon: string;
  gradientLight: [string, string];
  gradientDark: [string, string];
}> = {
  critical: {
    label: 'Critical',
    icon: 'alert-circle',
    gradientLight: ['#FF3B30', '#FF6961'],
    gradientDark: ['#FF453A', '#FF6F61'],
  },
  high: {
    label: 'High',
    icon: 'warning',
    gradientLight: ['#FF9500', '#FFB340'],
    gradientDark: ['#FF9F0A', '#FFBA4D'],
  },
  medium: {
    label: 'Medium',
    icon: 'information-circle',
    gradientLight: ['#FFCC00', '#FFD633'],
    gradientDark: ['#FFD60A', '#FFE03D'],
  },
  low: {
    label: 'Low',
    icon: 'checkmark-circle',
    gradientLight: ['#34C759', '#5DD57A'],
    gradientDark: ['#30D158', '#5DD67B'],
  },
};

export const AlertsHeaderHero: React.FC<AlertsHeaderHeroProps> = ({
  threatCounts,
  selectedFilter,
  onFilterSelect,
}) => {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors;

  // Animation refs for each threat level
  const pulseAnims = {
    critical: useRef(new Animated.Value(1)).current,
    high: useRef(new Animated.Value(1)).current,
    medium: useRef(new Animated.Value(1)).current,
    low: useRef(new Animated.Value(1)).current,
  };

  // Pulse animation for critical alerts
  useEffect(() => {
    if (threatCounts.critical > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnims.critical, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnims.critical, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [threatCounts.critical]);

  const handleFilterPress = (level: ThreatLevel | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFilterSelect(level);
  };

  const renderThreatCard = (level: ThreatLevel, index: number) => {
    const config = THREAT_CONFIG[level];
    const count = threatCounts[level];
    const isSelected = selectedFilter === level;
    const gradient = isDark ? config.gradientDark : config.gradientLight;

    return (
      <Animated.View
        key={level}
        style={[
          styles.threatCardWrapper,
          { transform: [{ scale: pulseAnims[level] }] },
        ]}
      >
        <Pressable
          onPress={() => handleFilterPress(level)}
          style={({ pressed }) => [pressed && { opacity: 0.8 }]}
        >
          <LinearGradient
            colors={isSelected ? gradient : [gradient[0] + '30', gradient[1] + '20']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.threatCard,
              isSelected && styles.threatCardSelected,
              {
                borderColor: isSelected ? gradient[0] : gradient[0] + '50',
              },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isSelected
                    ? 'rgba(255, 255, 255, 0.25)'
                    : gradient[0] + '30',
                },
              ]}
            >
              <Icon
                name={config.icon as any}
                size={20}
                color={isSelected ? '#FFFFFF' : gradient[0]}
              />
            </View>
            <Text
              variant="title2"
              style={[
                styles.countText,
                { color: isSelected ? '#FFFFFF' : gradient[0] },
              ]}
            >
              {count}
            </Text>
            <Text
              variant="caption2"
              style={[
                styles.labelText,
                {
                  color: isSelected
                    ? 'rgba(255, 255, 255, 0.8)'
                    : colors.secondaryLabel,
                },
              ]}
            >
              {config.label}
            </Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Threat level cards - equal width */}
      <View style={styles.cardsRow}>
        {(['critical', 'high', 'low'] as ThreatLevel[]).map(
          (level, index) => renderThreatCard(level, index)
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  threatCardWrapper: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  threatCard: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },
  threatCardSelected: {
    borderWidth: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  countText: {
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 32,
  },
  labelText: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
});
