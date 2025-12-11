/**
 * QuietHoursScreen - REDESIGNED
 *
 * Beautiful quiet hours configuration with:
 * - Visual time picker cards
 * - Clean toggle design
 * - Moon icon branding
 */

import React, { useState } from 'react';
import { View, StyleSheet, Switch, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { ScreenLayout } from '@components/templates';
import { ListSection } from '@components/molecules/ListSection';
import { useAppSelector, useAppDispatch } from '@store';
import { useTheme } from '@hooks/useTheme';

export const QuietHoursScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const quietHoursEnabled = useAppSelector(state => state.settings?.quietHoursEnabled) || false;
  const dispatch = useAppDispatch();

  const [enabled, setEnabled] = useState(quietHoursEnabled);
  const [startTime, setStartTime] = useState(new Date(2024, 0, 1, 22, 0));
  const [endTime, setEndTime] = useState(new Date(2024, 0, 1, 7, 0));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log('Saving quiet hours:', {
      enabled,
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
    });
    navigation.goBack();
  };

  return (
    <ScreenLayout
      header={{
        title: 'Quiet Hours',
        showBack: true,
        onBackPress: () => navigation.goBack(),
      }}
      scrollable
    >
      {/* Hero Card */}
      <View style={[styles.heroCard, { backgroundColor: colors.secondarySystemBackground }]}>
        <LinearGradient
          colors={['#5856D6', '#AF52DE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroIconContainer}
        >
          <Icon name="moon" size={36} color="#FFFFFF" />
        </LinearGradient>
        <Text variant="headline" weight="semibold" color="label" style={{ marginTop: 16 }}>
          Quiet Hours
        </Text>
        <Text variant="subheadline" style={[styles.heroDescription, { color: colors.secondaryLabel }]}>
          Silence notifications during specific hours. Critical alerts will still appear but without sound.
        </Text>
        <View style={styles.masterToggle}>
          <Text variant="body" weight="semibold" color="label" style={{ marginRight: 12 }}>
            {enabled ? 'Enabled' : 'Disabled'}
          </Text>
          <Switch
            value={enabled}
            onValueChange={(val) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setEnabled(val);
            }}
            trackColor={{ true: colors.systemIndigo }}
            style={{ transform: [{ scale: 1.1 }] }}
          />
        </View>
      </View>

      {/* Time Configuration */}
      {enabled && (
        <ListSection header="SCHEDULE" style={styles.section}>
          {/* Start Time */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowStartPicker(true);
            }}
            style={({ pressed }) => [
              styles.timeCard,
              { backgroundColor: colors.secondarySystemBackground },
              pressed && { opacity: 0.7 },
            ]}
          >
            <View style={[styles.timeIcon, { backgroundColor: colors.systemOrange + '20' }]}>
              <Icon name="sunny-outline" size={22} color={colors.systemOrange} />
            </View>
            <View style={styles.timeContent}>
              <Text variant="caption1" style={{ color: colors.secondaryLabel }}>
                START TIME
              </Text>
              <Text variant="title2" weight="bold" color="label">
                {formatTime(startTime)}
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.tertiaryLabel} />
          </Pressable>

          {/* End Time */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowEndPicker(true);
            }}
            style={({ pressed }) => [
              styles.timeCard,
              { backgroundColor: colors.secondarySystemBackground },
              pressed && { opacity: 0.7 },
            ]}
          >
            <View style={[styles.timeIcon, { backgroundColor: colors.systemYellow + '20' }]}>
              <Icon name="sunny" size={22} color={colors.systemYellow} />
            </View>
            <View style={styles.timeContent}>
              <Text variant="caption1" style={{ color: colors.secondaryLabel }}>
                END TIME
              </Text>
              <Text variant="title2" weight="bold" color="label">
                {formatTime(endTime)}
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.tertiaryLabel} />
          </Pressable>

          {/* Duration Info */}
          <View style={[styles.durationCard, { backgroundColor: colors.systemIndigo + '10' }]}>
            <Icon name="time-outline" size={20} color={colors.systemIndigo} />
            <Text variant="subheadline" style={{ color: colors.systemIndigo, marginLeft: 10 }}>
              {(() => {
                const start = startTime.getHours() * 60 + startTime.getMinutes();
                const end = endTime.getHours() * 60 + endTime.getMinutes();
                const diff = end > start ? end - start : (24 * 60 - start) + end;
                const hours = Math.floor(diff / 60);
                const mins = diff % 60;
                return `${hours}h ${mins}m quiet time`;
              })()}
            </Text>
          </View>
        </ListSection>
      )}

      {/* Info Section */}
      <ListSection header="ABOUT" style={styles.section}>
        <View style={[styles.infoCard, { backgroundColor: colors.secondarySystemBackground }]}>
          <View style={styles.infoRow}>
            <Icon name="notifications-off-outline" size={20} color={colors.secondaryLabel} />
            <Text variant="subheadline" style={{ color: colors.secondaryLabel, marginLeft: 12, flex: 1 }}>
              Regular alerts will be silenced during quiet hours
            </Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: colors.separator }]} />
          <View style={styles.infoRow}>
            <Icon name="alert-circle-outline" size={20} color={colors.systemRed} />
            <Text variant="subheadline" style={{ color: colors.secondaryLabel, marginLeft: 12, flex: 1 }}>
              Critical alerts will still appear visually
            </Text>
          </View>
        </View>
      </ListSection>

      {/* Save Button */}
      <View style={styles.saveSection}>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [pressed && { opacity: 0.8 }]}
        >
          <LinearGradient
            colors={['#667EEA', '#764BA2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButton}
          >
            <Icon name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text variant="headline" weight="semibold" style={{ color: '#FFFFFF', marginLeft: 8 }}>
              Save Changes
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Time Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartPicker(Platform.OS === 'ios');
            if (selectedDate) {
              setStartTime(selectedDate);
            }
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndPicker(Platform.OS === 'ios');
            if (selectedDate) {
              setEndTime(selectedDate);
            }
          }}
        />
      )}

      <View style={{ height: 40 }} />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 24,
    borderRadius: 20,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroDescription: {
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  masterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  timeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeContent: {
    flex: 1,
    marginLeft: 14,
  },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },
  infoCard: {
    borderRadius: 14,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoDivider: {
    height: 1,
    marginVertical: 12,
  },
  saveSection: {
    marginHorizontal: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
});
