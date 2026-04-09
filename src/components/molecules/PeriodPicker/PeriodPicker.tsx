import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import type { ReportPeriod } from '@/types/report';

const PERIODS: Array<{ key: ReportPeriod; label: string }> = [
  { key: 'day', label: '24h' },
  { key: 'week', label: '7d' },
  { key: 'month', label: '30d' },
  { key: 'year', label: '1y' },
];

interface PeriodPickerProps {
  value: ReportPeriod;
  onChange: (period: ReportPeriod) => void;
}

export const PeriodPicker: React.FC<PeriodPickerProps> = ({
  value,
  onChange,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.secondarySystemBackground },
      ]}
    >
      {PERIODS.map(item => {
        const selected = item.key === value;
        return (
          <Pressable
            key={item.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(item.key);
            }}
            style={[
              styles.button,
              selected && {
                backgroundColor:
                  theme.colors.brandAccent || theme.colors.primary,
              },
            ]}
          >
            <Text
              variant="subheadline"
              weight={selected ? 'semibold' : 'regular'}
              style={{ color: selected ? '#FFFFFF' : theme.colors.label }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
