import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

export const ReportsScreen = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text variant="h1">Reports</Text>
      <Text variant="body">Placeholder for reports</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
