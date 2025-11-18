import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '@components/atoms';

interface ChartWrapperProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  subtitle,
  children,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {title && (
        <View style={styles.header}>
          <Text variant="headline" color="label">
            {title}
          </Text>
          {subtitle && (
            <Text variant="footnote" color="secondaryLabel">
              {subtitle}
            </Text>
          )}
        </View>
      )}
      <View style={styles.chartContainer}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  header: {
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
});
