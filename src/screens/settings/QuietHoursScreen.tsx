import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Switch } from 'react-native';
import { Text, Button } from '@components/atoms';
import { ScreenLayout } from '@components/templates';
import { useAppSelector, useAppDispatch } from '@store';
import DateTimePicker from '@react-native-community/datetimepicker';

export const QuietHoursScreen = ({ navigation }: any) => {
  const quietHoursEnabled = useAppSelector(state => state.settings?.quietHoursEnabled) || false;
  const dispatch = useAppDispatch();

  const [enabled, setEnabled] = useState(quietHoursEnabled);
  const [startTime, setStartTime] = useState(new Date(2024, 0, 1, 22, 0)); // 10:00 PM
  const [endTime, setEndTime] = useState(new Date(2024, 0, 1, 7, 0)); // 7:00 AM
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSave = () => {
    // TODO: Dispatch action to update settings
    console.log('Saving quiet hours:', {
      enabled,
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
    });
    navigation.goBack();
  };

  return (
    <ScreenLayout title="Quiet Hours">
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text variant="body" style={styles.description}>
            During quiet hours, notifications will be silenced. Critical alerts
            will still appear but without sound or vibration.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text variant="h3">Enable Quiet Hours</Text>
              <Text variant="caption" style={styles.subtitle}>
                Silence notifications during specific times
              </Text>
            </View>
            <Switch value={enabled} onValueChange={setEnabled} />
          </View>
        </View>

        {enabled && (
          <>
            <View style={styles.section}>
              <Text variant="h3" style={styles.sectionTitle}>
                Start Time
              </Text>
              <Button
                title={formatTime(startTime)}
                variant="outline"
                onPress={() => setShowStartPicker(true)}
              />
              {showStartPicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  is24Hour={false}
                  onChange={(event, selectedDate) => {
                    setShowStartPicker(false);
                    if (selectedDate) {
                      setStartTime(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.section}>
              <Text variant="h3" style={styles.sectionTitle}>
                End Time
              </Text>
              <Button
                title={formatTime(endTime)}
                variant="outline"
                onPress={() => setShowEndPicker(true)}
              />
              {showEndPicker && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  is24Hour={false}
                  onChange={(event, selectedDate) => {
                    setShowEndPicker(false);
                    if (selectedDate) {
                      setEndTime(selectedDate);
                    }
                  }}
                />
              )}
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Button
            title="Save Changes"
            variant="primary"
            onPress={handleSave}
          />
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
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  footer: {
    padding: 16,
    marginTop: 16,
  },
});
