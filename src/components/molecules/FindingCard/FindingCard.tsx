import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '@components/molecules/Card';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import type { Finding } from '@/types/report';

interface FindingCardProps {
  finding: Finding;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const dotColor =
    finding.severity === 'critical'
      ? colors.systemRed
      : finding.severity === 'warning'
        ? colors.systemOrange
        : colors.systemBlue;

  return (
    <Card tier="surface" style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text variant="headline">{finding.title}</Text>
      </View>
      <Text variant="body" color="secondaryLabel" style={styles.description}>
        {finding.description}
      </Text>
      {finding.metric ? (
        <Text variant="subheadline" weight="semibold" color="systemBlue">
          {finding.metric}
        </Text>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  description: {
    lineHeight: 22,
  },
});

export default FindingCard;
