import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, Button } from '@components/atoms';
import { ScreenLayout } from '@components/templates';
import { useAppSelector, useAppDispatch } from '@store/index';
import { updateSettings } from '@store/slices/settingsSlice';
import { MoreStackParamList } from '@navigation/types';
import { AppSettings } from '@store/slices/settingsSlice';

type Props = NativeStackScreenProps<MoreStackParamList, 'Sensitivity'>;
type SensitivityLevel = (typeof SENSITIVITY_LEVELS)[number]['value'];

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
] as const;

export const SensitivityScreen = ({ navigation }: Props) => {
  const currentSensitivity = useAppSelector(
    state => state.settings.settings.sensitivity
  ) as AppSettings['sensitivity'];
  const dispatch = useAppDispatch();

  const [selectedLevel, setSelectedLevel] =
    useState<SensitivityLevel>(currentSensitivity);

  const handleSave = () => {
    dispatch(
      updateSettings({
        sensitivity: selectedLevel,
      })
    );
    navigation.goBack();
  };

  return (
    <ScreenLayout
      header={{
        title: 'Detection Sensitivity',
        showBack: true,
        onBackPress: () => navigation.goBack(),
      }}
    >
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
              buttonStyle={selectedLevel === level.value ? 'filled' : 'gray'}
              onPress={() => setSelectedLevel(level.value)}
              style={styles.levelButton}
            >
              {level.label}
            </Button>
            <Text variant="caption1" style={styles.levelDescription}>
              {level.description}
            </Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Button onPress={handleSave}>Save Changes</Button>
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
