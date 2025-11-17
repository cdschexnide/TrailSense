import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button } from '@components/atoms';
import { ScreenLayout } from '@components/templates';
import { useTheme } from '@hooks/useTheme';

interface FilterOptions {
  threatLevels: string[];
  detectionTypes: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export const AlertFilterScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const { onApplyFilters } = route.params || {};

  const [filters, setFilters] = useState<FilterOptions>({
    threatLevels: [],
    detectionTypes: [],
    dateRange: {
      start: null,
      end: null,
    },
  });

  const threatLevels = ['low', 'medium', 'high', 'critical'];
  const detectionTypes = ['wifi', 'bluetooth', 'cellular', 'gps'];

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
      dateRange: { start: null, end: null },
    });
  };

  return (
    <ScreenLayout title="Filter Alerts">
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Threat Level
          </Text>
          <View style={styles.optionsGrid}>
            {threatLevels.map(level => (
              <FilterChip
                key={level}
                label={level.toUpperCase()}
                selected={filters.threatLevels.includes(level)}
                onPress={() => toggleThreatLevel(level)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Detection Type
          </Text>
          <View style={styles.optionsGrid}>
            {detectionTypes.map(type => (
              <FilterChip
                key={type}
                label={type.toUpperCase()}
                selected={filters.detectionTypes.includes(type)}
                onPress={() => toggleDetectionType(type)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Date Range
          </Text>
          <Text variant="caption" style={styles.comingSoon}>
            Date range picker coming soon
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          title="Reset"
          variant="ghost"
          onPress={handleReset}
          style={styles.button}
        />
        <Button
          title="Apply Filters"
          variant="primary"
          onPress={handleApply}
          style={styles.button}
        />
      </View>
    </ScreenLayout>
  );
};

const FilterChip = ({ label, selected, onPress }: any) => {
  const { theme } = useTheme();

  return (
    <Button
      title={label}
      variant={selected ? 'primary' : 'outline'}
      size="sm"
      onPress={onPress}
      style={styles.chip}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  comingSoon: {
    opacity: 0.6,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  button: {
    flex: 1,
  },
});
