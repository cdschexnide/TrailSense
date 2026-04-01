/**
 * SettingsScreen - REDESIGNED
 *
 * Beautiful settings screen with:
 * - Icon backgrounds with colors
 * - Clean section styling
 * - User profile header
 * - App info footer
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Icon } from '@components/atoms/Icon';
import { Text } from '@components/atoms/Text';
import { useAppSelector } from '@store/index';
import { ScreenLayout, useToast } from '@components/templates';
import { GroupedListSection } from '@components/molecules/GroupedListSection';
import { GroupedListRow } from '@components/molecules/GroupedListRow';
import { useTheme } from '@hooks/useTheme';
import { isDemoMode, setDemoMode } from '@/config/demoMode';
import { featureFlagsManager } from '@/config/featureFlags';
import { AnalyticsEvents, logEvent } from '@services/analyticsEvents';

export const SettingsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const settings = useAppSelector(state => state.settings);
  const user = useAppSelector(state => state.auth.user);
  const [themePreference, setThemePreference] = useState<string>('System');
  const [isDemoEnabled, setIsDemoEnabled] = useState<boolean>(isDemoMode());
  const { showToast } = useToast();

  // Load theme preference when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadThemePreference = async () => {
        const saved = await AsyncStorage.getItem('@trailsense:theme');
        if (saved) {
          // Capitalize first letter for display
          const displayName =
            saved === 'auto'
              ? 'System'
              : saved.charAt(0).toUpperCase() + saved.slice(1);
          setThemePreference(displayName);
        } else {
          setThemePreference('System');
        }

        setIsDemoEnabled(isDemoMode());
      };
      loadThemePreference();
    }, [])
  );

  const handleToggleDemo = async () => {
    const newValue = !isDemoEnabled;

    await setDemoMode(newValue);
    featureFlagsManager.updateFlags({ DEMO_MODE: newValue });
    setIsDemoEnabled(newValue);
    logEvent(AnalyticsEvents.DEMO_MODE_TOGGLED, { enabled: newValue });
    showToast(
      newValue
        ? 'Demo mode enabled. Restart app to load sample data.'
        : 'Demo mode disabled. Restart app to return to live data.',
      'info'
    );
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          console.log('Logging out...');
        },
      },
    ]);
  };

  return (
    <ScreenLayout
      header={{
        title: 'Settings',
        largeTitle: true,
      }}
      scrollable
    >
      {/* User Profile Card */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('Profile');
        }}
        style={({ pressed }) => [pressed && { opacity: 0.8 }]}
      >
        <View
          style={[
            styles.profileCard,
            { backgroundColor: colors.secondarySystemBackground },
          ]}
        >
          <LinearGradient
            colors={['#667EEA', '#764BA2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileAvatar}
          >
            <Text variant="title1" weight="bold" style={{ color: '#FFFFFF' }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text variant="headline" weight="semibold" color="label">
              {user?.name || 'User'}
            </Text>
            <Text
              variant="subheadline"
              style={{ color: colors.secondaryLabel }}
            >
              {user?.email || 'user@example.com'}
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.tertiaryLabel} />
        </View>
      </Pressable>

      {/* Detection Settings */}
      <GroupedListSection title="Detection">
        <GroupedListRow
          icon="speedometer-outline"
          iconColor={colors.systemOrange}
          title="Detection Sensitivity"
          subtitle="Adjust alert threshold"
          value={settings?.sensitivity || 'Medium'}
          showChevron
          onPress={() => navigation.navigate('Sensitivity')}
        />
        <GroupedListRow
          icon="moon-outline"
          iconColor={colors.systemIndigo}
          title="Quiet Hours"
          subtitle="Silence notifications at night"
          value={settings?.quietHoursEnabled ? 'On' : 'Off'}
          showChevron
          onPress={() => navigation.navigate('QuietHours')}
        />
        <GroupedListRow
          icon="airplane-outline"
          iconColor={colors.systemTeal}
          title="Vacation Mode"
          subtitle="Enhanced monitoring while away"
          value={settings?.vacationMode ? 'On' : 'Off'}
          showChevron
          onPress={() => navigation.navigate('VacationMode')}
        />
      </GroupedListSection>

      {/* Notifications */}
      <GroupedListSection title="Notifications">
        <GroupedListRow
          icon="notifications-outline"
          iconColor={colors.systemRed}
          title="Push Notifications"
          subtitle="Manage alert preferences"
          showChevron
          onPress={() => navigation.navigate('NotificationSettings')}
        />
        <GroupedListRow
          icon="musical-notes-outline"
          iconColor={colors.systemPink}
          title="Alert Sounds"
          subtitle="Customize notification sounds"
          showChevron
          onPress={() => navigation.navigate('AlertSound')}
        />
      </GroupedListSection>

      {/* Appearance */}
      <GroupedListSection title="Appearance">
        <GroupedListRow
          icon="color-palette-outline"
          iconColor={colors.systemPurple}
          title="Theme"
          subtitle="Light, dark, or system"
          value={themePreference}
          showChevron
          onPress={() => navigation.navigate('Theme')}
        />
        <GroupedListRow
          icon="flask-outline"
          iconColor={colors.systemOrange}
          title="Demo Mode"
          subtitle="Show sample data for demonstrations"
          value={isDemoEnabled ? 'On' : 'Off'}
          onPress={() => {
            void handleToggleDemo();
          }}
        />
      </GroupedListSection>

      {/* Security */}
      <GroupedListSection title="Security">
        <GroupedListRow
          icon="finger-print-outline"
          iconColor={colors.systemGreen}
          title="Biometric Authentication"
          subtitle="Use Face ID or fingerprint"
          showChevron
          onPress={() => navigation.navigate('Biometric')}
        />
        <GroupedListRow
          icon="shield-checkmark-outline"
          iconColor={colors.systemTeal}
          title="Known Devices"
          subtitle="Recognized visitors and equipment"
          showChevron
          onPress={() => navigation.navigate('KnownDevices')}
        />
        <GroupedListRow
          icon="lock-closed-outline"
          iconColor={colors.systemOrange}
          title="Privacy & Security"
          subtitle="Data and account protection"
          showChevron
          onPress={() => navigation.navigate('Security')}
        />
      </GroupedListSection>

      {/* Support */}
      <GroupedListSection title="Support">
        <GroupedListRow
          icon="help-circle-outline"
          iconColor={colors.systemBlue}
          title="Help & FAQ"
          subtitle="Get answers to common questions"
          showChevron
          onPress={() => {}}
        />
        <GroupedListRow
          icon="chatbubble-outline"
          iconColor={colors.systemGreen}
          title="Contact Support"
          subtitle="Reach our support team"
          showChevron
          onPress={() => {}}
        />
        <GroupedListRow
          icon="document-text-outline"
          iconColor={colors.systemGray}
          title="Terms & Privacy"
          subtitle="Legal information"
          showChevron
          onPress={() => {}}
        />
      </GroupedListSection>

      {/* Logout */}
      <View style={styles.logoutSection}>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            { backgroundColor: colors.systemRed + '15' },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Icon name="log-out-outline" size={20} color={colors.systemRed} />
          <Text
            variant="body"
            weight="semibold"
            style={{ color: colors.systemRed, marginLeft: 8 }}
          >
            Logout
          </Text>
        </Pressable>
      </View>

      {/* App Info Footer */}
      <View style={styles.footer}>
        <Image
          source={require('@assets/images/SmallTrailSenseCompanyLogo.png')}
          style={styles.footerLogo}
          resizeMode="contain"
        />
        <Text
          variant="caption1"
          style={{ color: colors.tertiaryLabel, marginTop: 12 }}
        >
          TrailSense v1.0.0
        </Text>
        <Text
          variant="caption2"
          style={{ color: colors.tertiaryLabel, marginTop: 4 }}
        >
          Made with care for your security
        </Text>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  logoutSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 40,
  },
  footerLogo: {
    width: 48,
    height: 48,
    opacity: 0.6,
  },
});
