import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { Text } from '@components/atoms/Text/Text';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  style,
}) => {
  const { theme } = useTheme();
  const { colors, shadows } = theme;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.secondarySystemGroupedBackground,
          ...shadows.sm,
        },
        style,
      ]}
    >
      <Text variant="headline" color="label" style={styles.title}>
        {title}
      </Text>
      {subtitle && (
        <Text variant="footnote" color="secondaryLabel" style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
      <View style={styles.chartContainer}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 12,
  },
  chartContainer: {
    alignItems: 'center',
  },
});
