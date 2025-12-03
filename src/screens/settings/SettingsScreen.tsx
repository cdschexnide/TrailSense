import React from 'react';
import { StyleSheet } from 'react-native';
import { Icon } from '@components/atoms/Icon';
import { useAppSelector } from '@store';
import { ScreenLayout } from '@components/templates';
import { ListSection } from '@components/molecules/ListSection';
import { ListRow } from '@components/molecules/ListRow';

export const SettingsScreen = ({ navigation }: any) => {
  const settings = useAppSelector(state => state.settings);

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('Logging out...');
  };

  return (
    <ScreenLayout
      header={{
        title: 'Settings',
        largeTitle: true,
      }}
      scrollable
    >
      <ListSection header="DETECTION" style={styles.section}>
        <ListRow
          leftIcon={
            <Icon name="speedometer-outline" size={24} color="systemOrange" />
          }
          title="Detection Sensitivity"
          rightText={settings?.sensitivity || 'Medium'}
          onPress={() => navigation.navigate('Sensitivity')}
          accessoryType="disclosureIndicator"
        />
        <ListRow
          leftIcon={<Icon name="moon-outline" size={24} color="systemIndigo" />}
          title="Quiet Hours"
          rightText={settings?.quietHours || 'Not configured'}
          onPress={() => navigation.navigate('QuietHours')}
          accessoryType="disclosureIndicator"
        />
      </ListSection>

      <ListSection header="NOTIFICATIONS" style={styles.section}>
        <ListRow
          leftIcon={
            <Icon name="notifications-outline" size={24} color="systemRed" />
          }
          title="Push Notifications"
          subtitle="Receive alerts on your device"
          onPress={() => navigation.navigate('NotificationSettings')}
          accessoryType="disclosureIndicator"
        />
        <ListRow
          leftIcon={
            <Icon name="volume-high-outline" size={24} color="systemBlue" />
          }
          title="Alert Sound"
          subtitle="Play sound for new alerts"
          onPress={() => navigation.navigate('AlertSound')}
          accessoryType="disclosureIndicator"
        />
      </ListSection>

      <ListSection header="APPEARANCE" style={styles.section}>
        <ListRow
          leftIcon={
            <Icon name="color-palette-outline" size={24} color="systemPurple" />
          }
          title="Theme"
          rightText={settings?.theme || 'System'}
          onPress={() => navigation.navigate('Theme')}
          accessoryType="disclosureIndicator"
        />
      </ListSection>

      <ListSection header="SECURITY" style={styles.section}>
        <ListRow
          leftIcon={
            <Icon name="finger-print-outline" size={24} color="systemGreen" />
          }
          title="Biometric Authentication"
          subtitle="Use fingerprint or face ID"
          onPress={() => navigation.navigate('Biometric')}
          accessoryType="disclosureIndicator"
        />
        <ListRow
          leftIcon={<Icon name="shield-outline" size={24} color="systemTeal" />}
          title="Whitelist"
          onPress={() => navigation.navigate('Whitelist')}
          accessoryType="disclosureIndicator"
        />
      </ListSection>

      <ListSection header="ACCOUNT" style={styles.section}>
        <ListRow
          leftIcon={<Icon name="person-outline" size={24} color="systemGray" />}
          title="Profile"
          subtitle="Manage your account"
          onPress={() => navigation.navigate('Profile')}
          accessoryType="disclosureIndicator"
        />
        <ListRow
          leftIcon={
            <Icon name="lock-closed-outline" size={24} color="systemOrange" />
          }
          title="Security"
          subtitle="Password and security settings"
          onPress={() => navigation.navigate('Security')}
          accessoryType="disclosureIndicator"
        />
        <ListRow title="Logout" onPress={handleLogout} accessoryType="none" />
      </ListSection>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
});
