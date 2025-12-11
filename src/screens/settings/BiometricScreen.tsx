/**
 * BiometricScreen
 *
 * Biometric authentication settings with:
 * - Face ID / Fingerprint toggle
 * - App lock settings
 * - Timeout configuration
 */

import React, { useState } from 'react';
import { View, StyleSheet, Switch, Pressable, Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { ScreenLayout } from '@components/templates';
import { ListSection } from '@components/molecules/ListSection';
import { useTheme } from '@hooks/useTheme';

const TIMEOUT_OPTIONS = [
  { value: 0, label: 'Immediately' },
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 900, label: '15 minutes' },
  { value: 1800, label: '30 minutes' },
];

export const BiometricScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [requireOnOpen, setRequireOnOpen] = useState(true);
  const [requireForAlerts, setRequireForAlerts] = useState(false);
  const [requireForSettings, setRequireForSettings] = useState(true);
  const [lockTimeout, setLockTimeout] = useState(300);

  // Determine biometric type based on platform
  const biometricType = Platform.OS === 'ios' ? 'Face ID' : 'Fingerprint';
  const biometricIcon = Platform.OS === 'ios' ? 'scan-outline' : 'finger-print-outline';

  const handleEnableBiometric = async (value: boolean) => {
    if (value) {
      // In production, this would check for biometric availability
      // and request permission
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setBiometricEnabled(true);
    } else {
      Alert.alert(
        'Disable Biometric',
        `Are you sure you want to disable ${biometricType}? You'll need to use your PIN instead.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setBiometricEnabled(false);
            },
          },
        ]
      );
    }
  };

  return (
    <ScreenLayout
      header={{
        title: 'Biometric',
        showBack: true,
        onBackPress: () => navigation.goBack(),
      }}
      scrollable
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={[styles.heroIconContainer, { backgroundColor: colors.systemGreen + '20' }]}>
          <Icon name={biometricIcon as any} size={32} color={colors.systemGreen} />
        </View>
        <Text variant="headline" weight="semibold" color="label" style={{ marginTop: 16 }}>
          {biometricType}
        </Text>
        <Text variant="subheadline" style={{ color: colors.secondaryLabel, marginTop: 4, textAlign: 'center' }}>
          Secure your app with biometric authentication
        </Text>
      </View>

      {/* Main Toggle */}
      <View style={[styles.mainToggleCard, { backgroundColor: colors.secondarySystemBackground }]}>
        <View style={styles.mainToggleContent}>
          <View style={[styles.toggleIcon, { backgroundColor: colors.systemGreen + '20' }]}>
            <Icon name={biometricIcon as any} size={24} color={colors.systemGreen} />
          </View>
          <View style={styles.toggleText}>
            <Text variant="headline" weight="semibold" color="label">
              Enable {biometricType}
            </Text>
            <Text variant="caption1" style={{ color: colors.secondaryLabel, marginTop: 4 }}>
              Use {biometricType.toLowerCase()} to unlock TrailSense
            </Text>
          </View>
        </View>
        <Switch
          value={biometricEnabled}
          onValueChange={handleEnableBiometric}
          trackColor={{ true: colors.systemGreen }}
          style={{ transform: [{ scale: 1.1 }] }}
        />
      </View>

      {biometricEnabled && (
        <>
          {/* Require Biometric For */}
          <ListSection header="REQUIRE AUTHENTICATION FOR" style={styles.section}>
            <View style={[styles.optionCard, { backgroundColor: colors.secondarySystemBackground }]}>
              <View style={[styles.optionIcon, { backgroundColor: colors.systemBlue + '20' }]}>
                <Icon name="enter-outline" size={20} color={colors.systemBlue} />
              </View>
              <View style={styles.optionContent}>
                <Text variant="body" weight="semibold" color="label">
                  Opening App
                </Text>
                <Text variant="caption1" style={{ color: colors.secondaryLabel, marginTop: 2 }}>
                  Require authentication when opening
                </Text>
              </View>
              <Switch
                value={requireOnOpen}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRequireOnOpen(val);
                }}
                trackColor={{ true: colors.systemBlue }}
              />
            </View>

            <View style={[styles.optionCard, { backgroundColor: colors.secondarySystemBackground }]}>
              <View style={[styles.optionIcon, { backgroundColor: colors.systemOrange + '20' }]}>
                <Icon name="alert-circle-outline" size={20} color={colors.systemOrange} />
              </View>
              <View style={styles.optionContent}>
                <Text variant="body" weight="semibold" color="label">
                  Viewing Alerts
                </Text>
                <Text variant="caption1" style={{ color: colors.secondaryLabel, marginTop: 2 }}>
                  Require authentication to view alert details
                </Text>
              </View>
              <Switch
                value={requireForAlerts}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRequireForAlerts(val);
                }}
                trackColor={{ true: colors.systemOrange }}
              />
            </View>

            <View style={[styles.optionCard, { backgroundColor: colors.secondarySystemBackground }]}>
              <View style={[styles.optionIcon, { backgroundColor: colors.systemPurple + '20' }]}>
                <Icon name="settings-outline" size={20} color={colors.systemPurple} />
              </View>
              <View style={styles.optionContent}>
                <Text variant="body" weight="semibold" color="label">
                  Changing Settings
                </Text>
                <Text variant="caption1" style={{ color: colors.secondaryLabel, marginTop: 2 }}>
                  Require authentication for sensitive settings
                </Text>
              </View>
              <Switch
                value={requireForSettings}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRequireForSettings(val);
                }}
                trackColor={{ true: colors.systemPurple }}
              />
            </View>
          </ListSection>

          {/* Lock Timeout */}
          <ListSection header="AUTO-LOCK TIMEOUT" style={styles.section}>
            <Text variant="caption1" style={[styles.sectionNote, { color: colors.secondaryLabel }]}>
              Lock app after this period of inactivity
            </Text>
            {TIMEOUT_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLockTimeout(option.value);
                }}
                style={({ pressed }) => [
                  styles.timeoutRow,
                  { backgroundColor: colors.secondarySystemBackground },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text variant="body" color="label">
                  {option.label}
                </Text>
                {lockTimeout === option.value && (
                  <View style={[styles.checkmark, { backgroundColor: colors.systemGreen }]}>
                    <Icon name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            ))}
          </ListSection>
        </>
      )}

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: colors.secondarySystemBackground }]}>
        <Icon name="shield-checkmark-outline" size={20} color={colors.secondaryLabel} />
        <Text variant="caption1" style={{ color: colors.secondaryLabel, marginLeft: 10, flex: 1 }}>
          {biometricType} data never leaves your device. Authentication is handled securely by your device's secure enclave.
        </Text>
      </View>

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
  mainToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
  },
  mainToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    marginLeft: 14,
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionNote: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  timeoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
  },
});
