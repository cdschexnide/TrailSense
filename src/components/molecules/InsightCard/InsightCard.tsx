import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { useTheme } from '@hooks/useTheme';
import type { Insight } from '@services/analyticsInsights';

interface InsightCardProps {
  insight: Insight;
  onPress?: () => void;
}

const SEVERITY_COLORS = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#60a5fa',
} as const;

const TARGET_ICONS = {
  overview: 'hardware-chip-outline',
  signals: 'pulse-outline',
  patterns: 'analytics-outline',
} as const;

export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onPress,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const borderColor = SEVERITY_COLORS[insight.severity];

  const handlePress = async () => {
    if (!onPress) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.secondarySystemGroupedBackground,
          borderColor: `${borderColor}55`,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.dot, { backgroundColor: borderColor }]} />
          <Text variant="headline" weight="semibold">
            {insight.title}
          </Text>
        </View>
        {insight.targetTab ? (
          <Icon
            name={TARGET_ICONS[insight.targetTab]}
            size={18}
            color={colors.secondaryLabel}
          />
        ) : null}
      </View>
      <Text
        variant="subheadline"
        color="secondaryLabel"
        style={styles.subtitle}
      >
        {insight.subtitle}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  subtitle: {
    lineHeight: 18,
  },
});
