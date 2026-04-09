import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface ReportSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const ReportSection: React.FC<ReportSectionProps> = ({
  title,
  subtitle,
  children,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="title3" style={{ color: colors.label }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" color="secondaryLabel">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View
        style={[
          styles.content,
          {
            backgroundColor: colors.secondarySystemGroupedBackground,
            borderColor: colors.separator,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    gap: 2,
  },
  content: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
});

export default ReportSection;
