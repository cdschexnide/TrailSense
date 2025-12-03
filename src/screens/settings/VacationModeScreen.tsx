import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { VacationModeService } from '@services/vacationModeService';

export const VacationModeScreen = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>(
    'high'
  );

  useEffect(() => {
    loadVacationModeStatus();
  }, []);

  const loadVacationModeStatus = async () => {
    const status = await VacationModeService.getVacationModeStatus();
    setIsEnabled(status.enabled);
    if (status.startDate) setStartDate(new Date(status.startDate));
    if (status.endDate) setEndDate(new Date(status.endDate));
    setSensitivity(status.sensitivity);
  };

  const handleToggle = async (value: boolean) => {
    setIsEnabled(value);

    if (value) {
      await VacationModeService.enableVacationMode(startDate, endDate);
    } else {
      await VacationModeService.disableVacationMode();
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vacation Mode</Text>
        <Text style={styles.subtitle}>
          Enhanced monitoring when you're away from home
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Enable Vacation Mode</Text>
            <Text style={styles.description}>
              Increases sensitivity and treats all detections as critical
            </Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={isEnabled ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>
      </View>

      {isEnabled && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dates</Text>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateLabel}>Start Date</Text>
              <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
            </TouchableOpacity>

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={handleStartDateChange}
              />
            )}

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.dateLabel}>End Date</Text>
              <Text style={styles.dateValue}>{formatDate(endDate)}</Text>
            </TouchableOpacity>

            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={handleEndDateChange}
              />
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sensitivity</Text>
            <View style={styles.sensitivityContainer}>
              {(['low', 'medium', 'high'] as const).map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.sensitivityButton,
                    sensitivity === level && styles.sensitivityButtonActive,
                  ]}
                  onPress={() => setSensitivity(level)}
                >
                  <Text
                    style={[
                      styles.sensitivityText,
                      sensitivity === level && styles.sensitivityTextActive,
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔔</Text>
              <Text style={styles.featureText}>
                Maximum alert volume for all notifications
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureText}>
                All detections treated as critical threats
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureText}>
                Detailed activity reports sent daily
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔍</Text>
              <Text style={styles.featureText}>
                Increased detection sensitivity
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#999999',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    color: '#999999',
  },
  dateValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sensitivityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sensitivityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
  },
  sensitivityButtonActive: {
    backgroundColor: '#4CAF50',
  },
  sensitivityText: {
    color: '#999999',
    fontSize: 14,
    fontWeight: '600',
  },
  sensitivityTextActive: {
    color: '#FFFFFF',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
