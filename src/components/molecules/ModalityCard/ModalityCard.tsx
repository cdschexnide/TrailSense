import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { useTheme } from '@hooks/useTheme';

interface Metric {
  label: string;
  value: string;
}

interface ModalityCardProps {
  title: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  color: string;
  count: number;
  metrics: Metric[];
}

export const ModalityCard: React.FC<ModalityCardProps> = ({
  title,
  icon,
  color,
  count,
  metrics,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.secondarySystemGroupedBackground,
          borderColor: `${color}44`,
        },
      ]}
    >
      <View style={styles.titleRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${color}20` }]}>
          <Icon name={icon} size={18} color={color} />
        </View>
        <View>
          <Text variant="headline" weight="semibold">
            {title}
          </Text>
          <Text variant="caption1" color="secondaryLabel">
            {count} detections
          </Text>
        </View>
      </View>
      <View style={styles.metrics}>
        {metrics.map(metric => (
          <View key={metric.label} style={styles.metricRow}>
            <Text variant="footnote" color="secondaryLabel">
              {metric.label}
            </Text>
            <Text variant="footnote" weight="semibold">
              {metric.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metrics: {
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
});
