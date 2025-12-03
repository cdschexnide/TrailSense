import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { Text } from '@components/atoms/Text/Text';
import { Icon } from '@components/atoms/Icon/Icon';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'positive' | 'negative' | 'neutral';
  };
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  style,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  const getTrendColor = () => {
    if (!change) return colors.secondaryLabel;
    switch (change.trend) {
      case 'positive':
        return colors.systemGreen;
      case 'negative':
        return colors.systemRed;
      case 'neutral':
      default:
        return colors.secondaryLabel;
    }
  };

  const getTrendIcon = () => {
    if (!change) return null;
    switch (change.trend) {
      case 'positive':
        return <Icon name="arrow-up" size={14} color={colors.systemGreen} />;
      case 'negative':
        return <Icon name="arrow-down" size={14} color={colors.systemRed} />;
      case 'neutral':
      default:
        return <Text style={{ color: colors.secondaryLabel }}>—</Text>;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.secondarySystemGroupedBackground,
        },
        style,
      ]}
    >
      <Text variant="caption1" color="secondaryLabel" style={styles.title}>
        {title.toUpperCase()}
      </Text>
      <Text variant="title1" color="label" style={styles.value}>
        {value}
      </Text>
      {change && (
        <View style={styles.changeContainer}>
          <Text
            variant="footnote"
            style={{ ...styles.changeText, color: getTrendColor() }}
          >
            {change.value}
          </Text>
          <View style={styles.trendIcon}>{getTrendIcon()}</View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  title: {
    marginBottom: 4,
  },
  value: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontWeight: '600',
  },
  trendIcon: {
    marginLeft: 4,
  },
});
