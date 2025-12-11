/**
 * SettingsScreen - REDESIGNED
 *
 * Beautiful settings screen with:
 * - Icon backgrounds with colors
 * - Clean section styling
 * - User profile header
 * - App info footer
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Icon } from '@components/atoms/Icon';
import { Text } from '@components/atoms/Text';
import { useAppSelector } from '@store';
import { ScreenLayout } from '@components/templates';
import { ListSection } from '@components/molecules/ListSection';
import { ListRow } from '@components/molecules/ListRow';
import { useTheme } from '@hooks/useTheme';

// Icon wrapper component
const IconBox = ({ name, color, gradient }: { name: string; color: string; gradient?: [string, string] }) => {
  if (gradient) {
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconBox}
      >
        <Icon name={name as any} size={20} color="#FFFFFF" />
      </LinearGradient>
    );
  }
  return (
    <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
      <Icon name={name as any} size={20} color={color} />
    </View>
  );
};

export const SettingsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const settings = useAppSelector(state => state.settings);
  const user = useAppSelector(state => state.auth.user);
  const [themePreference, setThemePreference] = useState<string>('System');

  // Load theme preference when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadThemePreference = async () => {
        const saved = await AsyncStorage.getItem('@trailsense:theme');
        if (saved) {
          // Capitalize first letter for display
          const displayName = saved === 'auto' ? 'System' : saved.charAt(0).toUpperCase() + saved.slice(1);
          setThemePreference(displayName);
        } else {
          setThemePreference('System');
        }
      };
      loadThemePreference();
    }, [])
  );

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            console.log('Logging out...');
          },
        },
      ]
    );
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
        <View style={[styles.profileCard, { backgroundColor: colors.secondarySystemBackground }]}>
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
            <Text variant="subheadline" style={{ color: colors.secondaryLabel }}>
              {user?.email || 'user@example.com'}
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.tertiaryLabel} />
        </View>
      </Pressable>

      {/* Detection Settings */}
      <ListSection header="DETECTION" style={styles.section}>
        <ListRow
          leftIcon={<IconBox name="speedometer-outline" color={colors.systemOrange} />}
          title="Detection Sensitivity"
          subtitle="Adjust alert threshold"
          rightText={settings?.sensitivity || 'Medium'}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Sensitivity');
          }}
          accessoryType="disclosureIndicator"
        />
        <ListRow
          leftIcon={<IconBox name="moon-outline" color={colors.systemIndigo} />}
          title="Quiet Hours"
          subtitle="Silence notifications at night"
          rightText={settings?.quietHoursEnabled ? 'On' : 'Off'}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('QuietHours');
          }}
          accessoryType="disclosureIndicator"
        />
        <ListRow
          leftIcon={<IconBox name="airplane-outline" color={colors.systemCyan} />}
          title="Vacation Mode"
          subtitle="Enhanced monitoring while away"
          rightText={settings?.vacationMode ? 'On' : 'Off'}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('VacationMode');
          }}
          accessoryType="disclosureIndicator"
        />
      </ListSection>

      {/* Notifications */}
      <ListSection header="NOTIFICATIONS" style={styles.section}>
        <ListRow
          leftIcon={<IconBox name="notifications-outline" color={colors.systemRed} />}
          title="Push Notifications"
          subtitle="Manage alert preferences"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('NotificationSettings');
          }}
          accessoryType="disclosureIndicator"
        />
        <ListRow
          leftIcon={<IconBox name="musical-notes-outline" color={colors.systemPink} />}
          title="Alert Sounds"
          subtitle="Customize notification sounds"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('AlertSound');
          }}
          accessoryType="disclosureIndicator"
        />
      </ListSection>

      {/* Appearance */}
      <ListSection header="APPEARANCE" style={styles.section}>
        <ListRow
          leftIcon={<IconBox name="color-palette-outline" color={colors.systemPurple} />}
          title="Theme"
          subtitle="Light, dark, or system"
          rightText={themePreference}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Theme');
          }}
          accessoryType="disclosureIndicator"
        />
      </ListSection>

      {/* Security */}
      <ListSection header="SECURITY" style={styles.section}>
        <ListRow
          leftIcon={<IconBox name="finger-print-outline" color={colors.systemGreen} />}
          title="Biometric Authentication"
          subtitle="Use Face ID or fingerprint"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Biometric');
          }}
          accessoryType="disclosureIndicator"
        />
        <ListRow
          leftIcon={<IconBox name="shield-checkmark-outline" color={colors.systemTeal} />}
          title="Whitelist"
          subtitle="Trusted devices and networks"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Whitelist');
          }}
          accessoryType="disclosureIndicator"
        />
        <ListRow
          leftIcon={<IconBox name="lock-closed-outline" color={colors.systemOrange} />}
          title="Privacy & Security"
          subtitle="Data and account protection"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Security');
          }}
          accessoryType="disclosureIndicator"
        />
      </ListSection>

      {/* Support */}
      <ListSection header="SUPPORT" style={styles.section}>
        <ListRow
          leftIcon={<IconBox name="help-circle-outline" color={colors.systemBlue} />}
          title="Help & FAQ"
          subtitle="Get answers to common questions"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          accessoryType="disclosureIndicator"
        />
        <ListRow
          leftIcon={<IconBox name="chatbubble-outline" color={colors.systemGreen} />}
          title="Contact Support"
          subtitle="Reach our support team"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          accessoryType="disclosureIndicator"
        />
        <ListRow
          leftIcon={<IconBox name="document-text-outline" color={colors.systemGray} />}
          title="Terms & Privacy"
          subtitle="Legal information"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          accessoryType="disclosureIndicator"
        />
      </ListSection>

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
          <Text variant="body" weight="semibold" style={{ color: colors.systemRed, marginLeft: 8 }}>
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
        <Text variant="caption1" style={{ color: colors.tertiaryLabel, marginTop: 12 }}>
          TrailSense v1.0.0
        </Text>
        <Text variant="caption2" style={{ color: colors.tertiaryLabel, marginTop: 4 }}>
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
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
