/**
 * MetricsBar Component
 *
 * Horizontal row of metrics with subtle dividers between them.
 * Tesla/Rivian dashboard style layout for displaying device metrics
 * like battery, signal, detections, and location.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface Metric {
  value: string | number;
  label: string;
}

interface MetricsBarProps {
  metrics: Metric[];
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ metrics }) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View style={styles.container}>
      {metrics.map((metric, index) => (
        <React.Fragment key={`${metric.label}-${index}`}>
          <View style={styles.metricItem}>
            <Text variant="headline" weight="semibold" color="label">
              {metric.value}
            </Text>
            <Text variant="caption2" color="tertiaryLabel">
              {metric.label}
            </Text>
          </View>
          {index < metrics.length - 1 && (
            <View
              style={[
                styles.divider,
                { backgroundColor: colors.separator, opacity: 0.5 },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 28,
  },
});

export default MetricsBar;
