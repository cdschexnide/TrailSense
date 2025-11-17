import React from 'react';
import { ScrollView, View, StyleSheet, Switch } from 'react-native';
import { Text } from '@components/atoms';
import { useAppSelector, useAppDispatch } from '@store';
import { ScreenLayout } from '@components/templates';
import { ListItem } from '@components/molecules';

export const SettingsScreen = ({ navigation }: any) => {
  const settings = useAppSelector(state => state.settings);
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('Logging out...');
  };

  return (
    <ScreenLayout title="Settings">
      <ScrollView>
        <Section title="Detection">
          <ListItem
            title="Detection Sensitivity"
            subtitle={settings?.sensitivity || 'Medium'}
            onPress={() => navigation.navigate('Sensitivity')}
          />
          <ListItem
            title="Quiet Hours"
            subtitle={settings?.quietHours || 'Not configured'}
            onPress={() => navigation.navigate('QuietHours')}
          />
        </Section>

        <Section title="Notifications">
          <ListItem
            title="Push Notifications"
            subtitle="Receive alerts on your device"
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
        </Section>

        <Section title="Appearance">
          <ListItem
            title="Theme"
            subtitle={settings?.theme || 'System'}
            onPress={() => navigation.navigate('ThemeSettings')}
          />
        </Section>

        <Section title="Security">
          <ListItem
            title="Biometric Authentication"
            subtitle="Use fingerprint or face ID"
            right={
              <Switch
                value={settings?.biometricEnabled || false}
                onValueChange={(value) => {
                  // TODO: Dispatch action to update settings
                  console.log('Biometric:', value);
                }}
              />
            }
          />
        </Section>

        <Section title="Account">
          <ListItem
            title="Profile"
            subtitle="Manage your account"
            onPress={() => navigation.navigate('Profile')}
          />
          <ListItem
            title="Security"
            subtitle="Password and security settings"
            onPress={() => navigation.navigate('Security')}
          />
          <ListItem
            title="Logout"
            subtitle="Sign out of your account"
            onPress={handleLogout}
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
