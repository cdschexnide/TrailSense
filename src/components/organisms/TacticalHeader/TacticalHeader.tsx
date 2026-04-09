import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text } from '@components/atoms/Text';
import { useTheme } from '@hooks/useTheme';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'neutral';

interface TacticalHeaderProps {
  title: string;
  statusLabel?: string;
  statusVariant?: StatusVariant;
  rightAction?: React.ReactNode;
}

const STATUS_COLORS: Record<StatusVariant, string> = {
  success: '#4ade80',
  warning: '#f59e0b',
  danger: '#ef4444',
  neutral: '#8a887a',
};

const MONO_FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

export const TacticalHeader: React.FC<TacticalHeaderProps> = ({
  title,
  statusLabel,
  statusVariant = 'neutral',
  rightAction,
}) => {
  const { theme } = useTheme();
  const statusColor = STATUS_COLORS[statusVariant];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.label }]}>{title}</Text>
      <View style={styles.rightSection}>
        {statusLabel ? (
          <View style={styles.statusContainer}>
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        ) : null}
        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  title: {
    fontFamily: MONO_FONT,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
