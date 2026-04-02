import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

export const RadarSettingsScreen = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text variant="title1">Radar Settings</Text>
      <Text variant="body">Placeholder for radar settings</Text>
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
