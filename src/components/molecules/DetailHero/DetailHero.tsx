import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface DetailHeroProps {
  statusColor?: string;
  title: string;
  subtitle: string;
  metrics?: string[];
}

export const DetailHero: React.FC<DetailHeroProps> = ({
  statusColor,
  title,
  subtitle,
  metrics,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.secondarySystemBackground },
      ]}
    >
      <View style={styles.titleRow}>
        {statusColor && (
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        )}
        <Text variant="title2" weight="bold">
          {title}
        </Text>
      </View>
      <Text
        variant="subheadline"
        color="secondaryLabel"
        style={statusColor ? styles.subtitle : styles.subtitleNoStatus}
      >
        {subtitle}
      </Text>
      {metrics && metrics.length > 0 && (
        <Text
          variant="subheadline"
          color="secondaryLabel"
          style={statusColor ? styles.metrics : styles.metricsNoStatus}
        >
          {metrics.join(' \u00B7 ')}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 16,
    borderRadius: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  subtitle: {
    marginTop: 4,
    marginLeft: 22,
  },
  subtitleNoStatus: {
    marginTop: 4,
    marginLeft: 0,
  },
  metrics: {
    marginTop: 12,
    marginLeft: 22,
  },
  metricsNoStatus: {
    marginTop: 12,
    marginLeft: 0,
  },
});
