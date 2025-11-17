import React from 'react';
import { ScrollView, View, StyleSheet, Switch } from 'react-native';
import { Text } from '@components/atoms';
import { ScreenLayout } from '@components/templates';
import { useAppSelector, useAppDispatch } from '@store';
import { ListItem } from '@components/molecules';

export const NotificationSettingsScreen = () => {
  const settings = useAppSelector(state => state.settings);
  const dispatch = useAppDispatch();

  return (
    <ScreenLayout title="Notification Settings">
      <ScrollView>
        <Section title="Alert Notifications">
          <ListItem
            title="Push Notifications"
            subtitle="Receive notifications for new alerts"
            right={
              <Switch
                value={settings?.pushEnabled || false}
                onValueChange={(value) => {
                  // TODO: Dispatch action to update settings
                  console.log('Push notifications:', value);
                }}
              />
            }
          />
          <ListItem
            title="Alert Sound"
            subtitle="Play sound for new alerts"
            right={
              <Switch
                value={settings?.soundEnabled || false}
                onValueChange={(value) => {
                  // TODO: Dispatch action to update settings
                  console.log('Alert sound:', value);
                }}
              />
            }
          />
          <ListItem
            title="Vibration"
            subtitle="Vibrate on new alerts"
            right={
              <Switch
                value={settings?.vibrationEnabled || false}
                onValueChange={(value) => {
                  // TODO: Dispatch action to update settings
                  console.log('Vibration:', value);
                }}
              />
            }
          />
        </Section>

        <Section title="Threat Level Filters">
          <ListItem
            title="Critical Threats"
            subtitle="Always notify for critical threats"
            right={
              <Switch
                value={settings?.notifyCritical || true}
                onValueChange={(value) => {
                  // TODO: Dispatch action to update settings
                  console.log('Notify critical:', value);
                }}
              />
            }
          />
          <ListItem
            title="High Threats"
            subtitle="Notify for high-level threats"
            right={
              <Switch
                value={settings?.notifyHigh || true}
                onValueChange={(value) => {
                  // TODO: Dispatch action to update settings
                  console.log('Notify high:', value);
                }}
              />
            }
          />
          <ListItem
            title="Medium Threats"
            subtitle="Notify for medium-level threats"
            right={
              <Switch
                value={settings?.notifyMedium || true}
                onValueChange={(value) => {
                  // TODO: Dispatch action to update settings
                  console.log('Notify medium:', value);
                }}
              />
            }
          />
          <ListItem
            title="Low Threats"
            subtitle="Notify for low-level threats"
            right={
              <Switch
                value={settings?.notifyLow || false}
                onValueChange={(value) => {
                  // TODO: Dispatch action to update settings
                  console.log('Notify low:', value);
                }}
              />
            }
          />
        </Section>

        <Section title="Device Status">
          <ListItem
            title="Device Offline"
            subtitle="Notify when a device goes offline"
            right={
              <Switch
                value={settings?.notifyDeviceOffline || true}
                onValueChange={(value) => {
                  // TODO: Dispatch action to update settings
                  console.log('Notify device offline:', value);
                }}
              />
            }
          />
          <ListItem
            title="Low Battery"
            subtitle="Notify when device battery is low"
            right={
              <Switch
                value={settings?.notifyLowBattery || true}
                onValueChange={(value) => {
                  // TODO: Dispatch action to update settings
                  console.log('Notify low battery:', value);
                }}
              />
            }
          />
        </Section>
      </ScrollView>
    </ScreenLayout>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text variant="caption" style={styles.sectionTitle}>
      {title.toUpperCase()}
    </Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginBottom: 8,
    opacity: 0.6,
    fontWeight: '600',
  },
});
