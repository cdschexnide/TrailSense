import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '@components/molecules/Card';
import { Text } from '@components/atoms';
import { Icon } from '@components/atoms/Icon';
import { useTheme } from '@hooks/useTheme';

interface BriefSummaryCardProps {
  summary: string;
}

export const BriefSummaryCard: React.FC<BriefSummaryCardProps> = ({
  summary,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <Card tier="surface">
      <View style={styles.header}>
        <Icon name="sparkles-outline" size={18} color={colors.systemIndigo} />
        <Text variant="caption1" tactical color="secondaryLabel">
          EXECUTIVE SUMMARY
        </Text>
      </View>
      <Text variant="body" style={styles.body}>
        {summary}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  body: {
    lineHeight: 24,
    fontSize: 17,
  },
});

export default BriefSummaryCard;
