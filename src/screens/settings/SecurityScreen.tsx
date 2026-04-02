/**
 * SecurityScreen
 *
 * Privacy and security settings with:
 * - Data privacy options
 * - Account security
 * - Export/Delete data
 */

import React, { useState } from 'react';
import { View, StyleSheet, Switch, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms/Text';
import { Icon, IconName } from '@components/atoms/Icon';
import { ScreenLayout } from '@components/templates';
import { ListSection } from '@components/molecules/ListSection';
import { useTheme } from '@hooks/useTheme';
import { MoreStackParamList, SettingsStackParamList } from '@navigation/types';

type SecurityScreenProps =
  | NativeStackScreenProps<MoreStackParamList, 'Security'>
  | NativeStackScreenProps<SettingsStackParamList, 'Security'>;

interface ActionRowProps {
  icon: IconName;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
}

const ActionRow = ({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  danger,
}: ActionRowProps) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.actionRow,
        { backgroundColor: colors.secondarySystemBackground },
        danger && { borderColor: colors.systemRed + '30', borderWidth: 1 },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: iconColor + '20' }]}>
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.actionContent}>
        <Text
          variant="body"
          weight="semibold"
          style={danger ? { color: colors.systemRed } : { color: colors.label }}
        >
          {title}
        </Text>
        <Text
          variant="caption1"
          style={{
            color: danger ? colors.systemRed + 'CC' : colors.secondaryLabel,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      </View>
      <Icon name="chevron-forward" size={20} color={colors.tertiaryLabel} />
    </Pressable>
  );
};

interface ToggleRowProps {
  icon: IconName;
  iconColor: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const ToggleRow = ({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  onValueChange,
}: ToggleRowProps) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View
      style={[
        styles.toggleRow,
        { backgroundColor: colors.secondarySystemBackground },
      ]}
    >
      <View style={[styles.toggleIcon, { backgroundColor: iconColor + '20' }]}>
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.toggleContent}>
        <Text variant="body" weight="semibold" color="label">
          {title}
        </Text>
        <Text
          variant="caption1"
          style={{ color: colors.secondaryLabel, marginTop: 2 }}
        >
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={val => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onValueChange(val);
        }}
        trackColor={{ true: iconColor }}
      />
    </View>
  );
};

export const SecurityScreen = ({ navigation }: SecurityScreenProps) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [crashReportsEnabled, setCrashReportsEnabled] = useState(true);
  const [locationHistoryEnabled, setLocationHistoryEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This will generate a file containing all your data including alerts, device configurations, and settings. The file will be sent to your email.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
              'Export Started',
              'You will receive an email with your data within 24 hours.'
            );
          },
        },
      ]
    );
  };

  const showNotImplementedAlert = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: 'OK' }]);
  };

  const handleClearAlertHistory = () => {
    Alert.alert(
      'Clear Alert History',
      'This will permanently delete all your alert history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            showNotImplementedAlert(
              'Unavailable',
              'Clearing alert history is not implemented yet.'
            );
          },
        },
      ]
    );
  };

  const handleRevokeAllSessions = () => {
    Alert.alert(
      'Revoke All Sessions',
      'This will log you out from all devices except this one. You will need to log in again on other devices.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            showNotImplementedAlert(
              'Unavailable',
              'Session revocation is not implemented yet.'
            );
          },
        },
      ]
    );
  };

  const handleEnable2FA = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Enable Two-Factor Authentication',
        'You will be guided through the setup process.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setTwoFactorEnabled(true);
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Disable Two-Factor Authentication',
      'This will make your account less secure. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setTwoFactorEnabled(false);
          },
        },
      ]
    );
  };

  const handleOpenPlaceholderLegalScreen = (documentName: string) => {
    Alert.alert(documentName, `${documentName} content is not available yet.`, [
      { text: 'OK' },
    ]);
  };

  return (
    <ScreenLayout
      header={{
        title: 'Privacy & Security',
        showBack: true,
        onBackPress: () => navigation.goBack(),
      }}
      scrollable
    >
      <View style={styles.hero}>
        <View
          style={[
            styles.heroIconContainer,
            { backgroundColor: colors.systemOrange + '20' },
          ]}
        >
          <Icon name="shield-checkmark" size={32} color={colors.systemOrange} />
        </View>
        <Text
          variant="headline"
          weight="semibold"
          color="label"
          style={{ marginTop: 16 }}
        >
          Privacy & Security
        </Text>
        <Text
          variant="subheadline"
          style={{
            color: colors.secondaryLabel,
            marginTop: 4,
            textAlign: 'center',
          }}
        >
          Control your data and account security
        </Text>
      </View>

      <ListSection header="ACCOUNT SECURITY" style={styles.section}>
        <ToggleRow
          icon="key-outline"
          iconColor={colors.systemIndigo}
          title="Two-Factor Authentication"
          subtitle="Add an extra layer of security"
          value={twoFactorEnabled}
          onValueChange={handleEnable2FA}
        />
        <ActionRow
          icon="log-out-outline"
          iconColor={colors.systemBlue}
          title="Active Sessions"
          subtitle="Manage devices logged into your account"
          onPress={handleRevokeAllSessions}
        />
      </ListSection>

      <ListSection header="PRIVACY CONTROLS" style={styles.section}>
        <ToggleRow
          icon="analytics-outline"
          iconColor={colors.systemTeal}
          title="Usage Analytics"
          subtitle="Help improve TrailSense with anonymous data"
          value={analyticsEnabled}
          onValueChange={setAnalyticsEnabled}
        />
        <ToggleRow
          icon="bug-outline"
          iconColor={colors.systemOrange}
          title="Crash Reports"
          subtitle="Automatically send crash reports"
          value={crashReportsEnabled}
          onValueChange={setCrashReportsEnabled}
        />
        <ToggleRow
          icon="location-outline"
          iconColor={colors.systemGreen}
          title="Location History"
          subtitle="Store detection locations for analytics"
          value={locationHistoryEnabled}
          onValueChange={setLocationHistoryEnabled}
        />
      </ListSection>

      <ListSection header="DATA MANAGEMENT" style={styles.section}>
        <ActionRow
          icon="download-outline"
          iconColor={colors.systemBlue}
          title="Export My Data"
          subtitle="Download all your data as a file"
          onPress={handleExportData}
        />
        <ActionRow
          icon="trash-outline"
          iconColor={colors.systemRed}
          title="Clear Alert History"
          subtitle="Permanently delete all alerts"
          onPress={handleClearAlertHistory}
          danger
        />
      </ListSection>

      <View
        style={[
          styles.infoCard,
          { backgroundColor: colors.secondarySystemBackground },
        ]}
      >
        <Icon
          name="lock-closed-outline"
          size={20}
          color={colors.secondaryLabel}
        />
        <Text
          variant="caption1"
          style={{ color: colors.secondaryLabel, marginLeft: 10, flex: 1 }}
        >
          Your security data is encrypted end-to-end. We cannot access your
          detection data or personal information.
        </Text>
      </View>

      <ListSection header="LEGAL" style={styles.section}>
        <ActionRow
          icon="document-text-outline"
          iconColor={colors.systemGray}
          title="Privacy Policy"
          subtitle="How we handle your data"
          onPress={() => handleOpenPlaceholderLegalScreen('Privacy Policy')}
        />
        <ActionRow
          icon="document-outline"
          iconColor={colors.systemGray}
          title="Terms of Service"
          subtitle="Our terms and conditions"
          onPress={() => handleOpenPlaceholderLegalScreen('Terms of Service')}
        />
      </ListSection>

      <View style={{ height: 40 }} />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  heroIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  toggleRow: {
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 14,
    borderRadius: 14,
  },
});
