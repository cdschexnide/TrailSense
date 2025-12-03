import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button } from '@components/atoms';
import { ScreenLayout } from '@components/templates';
import { useAppSelector, useAppDispatch } from '@store';
import { Slider } from '@react-native-community/slider';

const SENSITIVITY_LEVELS = [
  {
    value: 'low',
    label: 'Low',
    description:
      'Only detect strong signals. Fewer false positives but may miss some threats.',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Balanced detection. Recommended for most users.',
  },
  {
    value: 'high',
    label: 'High',
    description:
      'Detect weaker signals. More comprehensive but may have false positives.',
  },
  {
    value: 'maximum',
    label: 'Maximum',
    description:
      'Detect all signals. Maximum protection but highest false positive rate.',
  },
];

export const SensitivityScreen = ({ navigation }: any) => {
  const currentSensitivity =
    useAppSelector(state => state.settings?.sensitivity) || 'medium';
  const dispatch = useAppDispatch();

  const [selectedLevel, setSelectedLevel] = useState(currentSensitivity);

  const handleSave = () => {
    // TODO: Dispatch action to update settings
    console.log('Saving sensitivity:', selectedLevel);
    navigation.goBack();
  };

  return (
    <ScreenLayout title="Detection Sensitivity">
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text variant="body" style={styles.description}>
            Adjust how sensitive the detection system is to potential threats.
            Higher sensitivity may result in more false alarms.
          </Text>
        </View>

        {SENSITIVITY_LEVELS.map(level => (
          <View key={level.value} style={styles.levelCard}>
            <Button
              title={level.label}
              variant={selectedLevel === level.value ? 'primary' : 'outline'}
              onPress={() => setSelectedLevel(level.value)}
              style={styles.levelButton}
            />
            <Text variant="caption" style={styles.levelDescription}>
              {level.description}
            </Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Button title="Save Changes" variant="primary" onPress={handleSave} />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  description: {
    opacity: 0.7,
    lineHeight: 20,
  },
  levelCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  levelButton: {
    marginBottom: 8,
  },
  levelDescription: {
    opacity: 0.7,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    marginTop: 16,
  },
});
