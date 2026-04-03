/**
 * SettingsScreen - REDESIGNED
 *
 * Beautiful settings screen with:
 * - Icon backgrounds with colors
 * - Clean section styling
 * - User profile header
 * - App info footer
 */

import React from 'react';
import { View, StyleSheet, Pressable, Alert, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Icon } from '@components/atoms/Icon';
import { Text } from '@components/atoms/Text';
import { useAppSelector, useAppDispatch } from '@store/index';
import { ScreenLayout } from '@components/templates';
import { GroupedListSection } from '@components/molecules/GroupedListSection';
import { GroupedListRow } from '@components/molecules/GroupedListRow';
import { TacticalHeader } from '@components/organisms';
import { useTheme } from '@hooks/useTheme';
import { isDemoMode } from '@/config/demoMode';
import { featureFlagsManager } from '@/config/featureFlags';
import { logout } from '@store/slices/authSlice';
import { clearUser } from '@store/slices/userSlice';
import { resetSettings } from '@store/slices/settingsSlice';
import { revertDemoModeConfig } from '@/config/demoModeRuntime';
import { MoreStackParamList } from '@navigation/types';
import footerLogo from '@assets/images/SmallTrailSenseCompanyLogo.png';

type Props = NativeStackScreenProps<MoreStackParamList, 'Settings'>;

export const SettingsScreen = ({ navigation }: Props) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const settings = useAppSelector(state => state.settings.settings);
  const user = useAppSelector(state => state.auth.user);
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          if (isDemoMode()) {
            featureFlagsManager.updateFlags({ DEMO_MODE: false });
            revertDemoModeConfig(queryClient);
            queryClient.clear();
            dispatch(clearUser());
            dispatch(resetSettings());
          }

          await dispatch(logout());
        },
      },
    ]);
  };

  return (
    <ScreenLayout customHeader={<TacticalHeader title="SETTINGS" />} scrollable>
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
            {
              backgroundColor: colors.surface,
              borderColor: colors.separator,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(251, 191, 36, 0.22)', 'rgba(251, 191, 36, 0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileAvatar}
          >
            <Text
              variant="title1"
              weight="bold"
              tactical
              style={{ color: colors.primary }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text variant="caption1" tactical color="label">
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
            {
              backgroundColor: 'transparent',
              borderColor: colors.systemRed,
            },
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
          source={footerLogo}
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
    borderRadius: 10,
    borderWidth: 1,
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
    borderRadius: 10,
    borderWidth: 1,
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
