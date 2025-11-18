import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from '@components/atoms/Button';
import { ScreenLayout } from '@components/templates';
import { ListSection } from '@components/molecules/ListSection';
import { ListRow } from '@components/molecules/ListRow';

interface FilterOptions {
  threatLevels: string[];
  detectionTypes: string[];
}

export const AlertFilterScreen = ({ navigation, route }: any) => {
  const { onApplyFilters } = route.params || {};

  const [filters, setFilters] = useState<FilterOptions>({
    threatLevels: [],
    detectionTypes: [],
  });

  const threatLevels = [
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
  ];

  const detectionTypes = [
    { id: 'cellular', label: 'Cellular' },
    { id: 'wifi', label: 'Wi-Fi' },
    { id: 'bluetooth', label: 'Bluetooth' },
    { id: 'gps', label: 'GPS' },
  ];

  const toggleThreatLevel = (level: string) => {
    setFilters(prev => ({
      ...prev,
      threatLevels: prev.threatLevels.includes(level)
        ? prev.threatLevels.filter(l => l !== level)
        : [...prev.threatLevels, level],
    }));
  };

  const toggleDetectionType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      detectionTypes: prev.detectionTypes.includes(type)
        ? prev.detectionTypes.filter(t => t !== type)
        : [...prev.detectionTypes, type],
    }));
  };

  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters(filters);
    }
    navigation.goBack();
  };

  const handleReset = () => {
    setFilters({
      threatLevels: [],
      detectionTypes: [],
    });
  };

  return (
    <ScreenLayout
      header={{
        title: 'Filter Alerts',
        showBack: true,
        rightActions: (
          <Button
            buttonStyle="plain"
            onPress={handleReset}
          >
            Reset
          </Button>
        ),
      }}
      scrollable
    >
      <ListSection header="THREAT LEVEL" style={styles.section}>
        {threatLevels.map(level => (
          <ListRow
            key={level.id}
            title={level.label}
            accessoryType={filters.threatLevels.includes(level.id) ? "checkmark" : "none"}
            onPress={() => toggleThreatLevel(level.id)}
          />
        ))}
      </ListSection>

      <ListSection header="DETECTION TYPE" style={styles.section}>
        {detectionTypes.map(type => (
          <ListRow
            key={type.id}
            title={type.label}
            accessoryType={filters.detectionTypes.includes(type.id) ? "checkmark" : "none"}
            onPress={() => toggleDetectionType(type.id)}
          />
        ))}
      </ListSection>

      <View style={styles.actions}>
        <Button
          buttonStyle="filled"
          role="default"
          onPress={handleApply}
        >
          Apply Filters
        </Button>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  actions: {
    padding: 20,
  },
});
