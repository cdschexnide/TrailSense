/**
 * NotificationSettingsScreen - REDESIGNED
 *
 * Beautiful notification settings with:
 * - Clean toggle cards
 * - Threat level color coding
 * - Better visual hierarchy
 */

import React, { useState } from 'react';
import { View, StyleSheet, Switch, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { ScreenLayout } from '@components/templates';
import { ListSection } from '@components/molecules/ListSection';
import { useAppSelector, useAppDispatch } from '@store';
import { useTheme } from '@hooks/useTheme';

// Toggle row component
const ToggleRow = ({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View style={[styles.toggleCard, { backgroundColor: colors.secondarySystemBackground }]}>
      <View style={[styles.toggleIcon, { backgroundColor: iconColor + '20' }]}>
        <Icon name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.toggleContent}>
        <Text variant="body" weight="semibold" color="label">
          {title}
        </Text>
        <Text variant="caption1" style={{ color: colors.secondaryLabel, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={(val) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onValueChange(val);
        }}
        trackColor={{ true: iconColor }}
      />
    </View>
  );
};

export const NotificationSettingsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const settings = useAppSelector(state => state.settings);
  const dispatch = useAppDispatch();

  // Local state for toggles
  const [pushEnabled, setPushEnabled] = useState(settings?.pushEnabled ?? true);
  const [soundEnabled, setSoundEnabled] = useState(settings?.soundEnabled ?? true);
  const [vibrationEnabled, setVibrationEnabled] = useState(settings?.vibrationEnabled ?? true);
  const [notifyCritical, setNotifyCritical] = useState(settings?.notifyCritical ?? true);
  const [notifyHigh, setNotifyHigh] = useState(settings?.notifyHigh ?? true);
  const [notifyMedium, setNotifyMedium] = useState(settings?.notifyMedium ?? true);
  const [notifyLow, setNotifyLow] = useState(settings?.notifyLow ?? false);
  const [notifyOffline, setNotifyOffline] = useState(settings?.notifyDeviceOffline ?? true);
  const [notifyBattery, setNotifyBattery] = useState(settings?.notifyLowBattery ?? true);

  return (
    <ScreenLayout
      header={{
        title: 'Notifications',
        showBack: true,
        onBackPress: () => navigation.goBack(),
      }}
      scrollable
    >
      {/* Master Controls */}
      <View style={styles.heroCard}>
        <View style={[styles.heroBg, { backgroundColor: colors.secondarySystemBackground }]}>
          <View style={[styles.heroIconContainer, { backgroundColor: colors.systemRed + '20' }]}>
            <Icon name="notifications" size={32} color={colors.systemRed} />
          </View>
          <Text variant="headline" weight="semibold" color="label" style={{ marginTop: 16 }}>
            Push Notifications
          </Text>
          <Text variant="subheadline" style={{ color: colors.secondaryLabel, marginTop: 4, textAlign: 'center' }}>
            Receive alerts about security events
          </Text>
          <View style={styles.masterToggle}>
            <Switch
              value={pushEnabled}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setPushEnabled(val);
              }}
              trackColor={{ true: colors.systemRed }}
              style={{ transform: [{ scale: 1.1 }] }}
            />
          </View>
        </View>
      </View>

      {/* Alert Preferences */}
      <ListSection header="ALERT PREFERENCES" style={styles.section}>
        <ToggleRow
          icon="musical-notes-outline"
          iconColor={colors.systemPink}
          title="Alert Sound"
          subtitle="Play sound for new alerts"
          value={soundEnabled}
          onValueChange={setSoundEnabled}
        />
        <ToggleRow
          icon="phone-portrait-outline"
          iconColor={colors.systemOrange}
          title="Vibration"
          subtitle="Vibrate on new alerts"
          value={vibrationEnabled}
          onValueChange={setVibrationEnabled}
        />
      </ListSection>

      {/* Threat Levels */}
      <ListSection header="THREAT LEVEL FILTERS" style={styles.section}>
        <Text variant="caption1" style={[styles.sectionNote, { color: colors.secondaryLabel }]}>
          Choose which threat levels trigger notifications
        </Text>

        <ToggleRow
          icon="alert-circle"
          iconColor="#FF3B30"
          title="Critical Threats"
          subtitle="Immediate security risks"
          value={notifyCritical}
          onValueChange={setNotifyCritical}
        />
        <ToggleRow
          icon="warning"
          iconColor="#FF9500"
          title="High Threats"
          subtitle="Significant security concerns"
          value={notifyHigh}
          onValueChange={setNotifyHigh}
        />
        <ToggleRow
          icon="information-circle"
          iconColor="#FFCC00"
          title="Medium Threats"
          subtitle="Moderate security events"
          value={notifyMedium}
          onValueChange={setNotifyMedium}
        />
        <ToggleRow
          icon="checkmark-circle"
          iconColor="#34C759"
          title="Low Threats"
          subtitle="Minor security events"
          value={notifyLow}
          onValueChange={setNotifyLow}
        />
      </ListSection>

      {/* Device Status */}
      <ListSection header="DEVICE STATUS" style={styles.section}>
        <Text variant="caption1" style={[styles.sectionNote, { color: colors.secondaryLabel }]}>
          Get notified about sensor health
        </Text>

        <ToggleRow
          icon="cloud-offline-outline"
          iconColor={colors.systemIndigo}
          title="Device Offline"
          subtitle="When a sensor loses connection"
          value={notifyOffline}
          onValueChange={setNotifyOffline}
        />
        <ToggleRow
          icon="battery-half"
          iconColor={colors.systemTeal}
          title="Low Battery"
          subtitle="When sensor battery is low"
          value={notifyBattery}
          onValueChange={setNotifyBattery}
        />
      </ListSection>

      <View style={{ height: 40 }} />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  heroBg: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
  },
  heroIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  masterToggle: {
    marginTop: 20,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionNote: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
});
