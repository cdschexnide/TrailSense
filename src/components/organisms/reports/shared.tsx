import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '@components/molecules/Card';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

export const formatPercent = (value: number) => `${Math.round(value)}%`;

export const formatDistance = (value: number) => `${Math.round(value)} m`;

export const formatChartLabel = (label: string) =>
  label.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

export const MiniBarList: React.FC<{
  data: Array<{ label: string; value: number }>;
  color?: string;
  formatter?: (value: number) => string;
}> = ({ data, color, formatter = value => `${value}` }) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const max = Math.max(...data.map(item => item.value), 1);

  return (
    <View style={styles.list}>
      {data.map(item => (
        <View key={item.label} style={styles.row}>
          <View style={styles.rowHeader}>
            <Text variant="subheadline">{item.label}</Text>
            <Text variant="subheadline" weight="semibold">
              {formatter(item.value)}
            </Text>
          </View>
          <View
            style={[
              styles.track,
              { backgroundColor: colors.secondarySystemBackground },
            ]}
          >
            <View
              style={[
                styles.fill,
                {
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: color || colors.systemBlue,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

export const SimpleTableCard: React.FC<{
  rows: Array<{ label: string; value: string }>;
}> = ({ rows }) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <Card tier="surface" style={styles.tableCard}>
      {rows.map((row, index) => (
        <View
          key={`${row.label}-${index}`}
          style={[
            styles.tableRow,
            index < rows.length - 1 && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.separator,
            },
          ]}
        >
          <Text variant="subheadline" color="secondaryLabel">
            {row.label}
          </Text>
          <Text variant="subheadline" weight="semibold">
            {row.value}
          </Text>
        </View>
      ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  row: {
    gap: 6,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  track: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  tableCard: {
    paddingVertical: 4,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
});
