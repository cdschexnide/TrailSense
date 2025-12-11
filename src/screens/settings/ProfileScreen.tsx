/**
 * ProfileScreen - REDESIGNED
 *
 * Beautiful profile management with:
 * - Avatar with gradient
 * - Clean form layout
 * - Card-based sections
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert, TextInput, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { Button } from '@components/atoms/Button';
import { ScreenLayout } from '@components/templates';
import { ListSection } from '@components/molecules/ListSection';
import { useAppSelector } from '@store';
import { useTheme } from '@hooks/useTheme';

export const ProfileScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const user = useAppSelector(state => state.auth.user);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleChangePassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ChangePassword');
  };

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('Deleting account...');
          },
        },
      ]
    );
  };

  return (
    <ScreenLayout
      header={{
        title: 'Profile',
        showBack: true,
        onBackPress: () => navigation.goBack(),
      }}
      scrollable
    >
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <LinearGradient
          colors={['#667EEA', '#764BA2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text variant="largeTitle" weight="bold" style={{ color: '#FFFFFF' }}>
            {name.charAt(0).toUpperCase() || 'U'}
          </Text>
        </LinearGradient>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={({ pressed }) => [
            styles.changeAvatarButton,
            { backgroundColor: colors.systemBlue },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Icon name="camera" size={16} color="#FFFFFF" />
        </Pressable>
        <Text variant="headline" weight="semibold" color="label" style={{ marginTop: 16 }}>
          {name || 'Your Name'}
        </Text>
        <Text variant="subheadline" style={{ color: colors.secondaryLabel, marginTop: 4 }}>
          {email || 'email@example.com'}
        </Text>
      </View>

      {/* Personal Information */}
      <ListSection header="PERSONAL INFORMATION" style={styles.section}>
        <View style={[styles.inputCard, { backgroundColor: colors.secondarySystemBackground }]}>
          <View style={styles.inputRow}>
            <View style={[styles.inputIconBox, { backgroundColor: colors.systemBlue + '20' }]}>
              <Icon name="person-outline" size={18} color={colors.systemBlue} />
            </View>
            <View style={styles.inputContent}>
              <Text variant="caption1" style={{ color: colors.secondaryLabel }}>
                Full Name
              </Text>
              <TextInput
                style={[styles.input, { color: colors.label }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.placeholderText}
              />
            </View>
          </View>
        </View>

        <View style={[styles.inputCard, { backgroundColor: colors.secondarySystemBackground }]}>
          <View style={styles.inputRow}>
            <View style={[styles.inputIconBox, { backgroundColor: colors.systemOrange + '20' }]}>
              <Icon name="mail-outline" size={18} color={colors.systemOrange} />
            </View>
            <View style={styles.inputContent}>
              <Text variant="caption1" style={{ color: colors.secondaryLabel }}>
                Email Address
              </Text>
              <TextInput
                style={[styles.input, { color: colors.label }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={colors.placeholderText}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        <View style={[styles.inputCard, { backgroundColor: colors.secondarySystemBackground }]}>
          <View style={styles.inputRow}>
            <View style={[styles.inputIconBox, { backgroundColor: colors.systemGreen + '20' }]}>
              <Icon name="call-outline" size={18} color={colors.systemGreen} />
            </View>
            <View style={styles.inputContent}>
              <Text variant="caption1" style={{ color: colors.secondaryLabel }}>
                Phone Number
              </Text>
              <TextInput
                style={[styles.input, { color: colors.label }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone"
                placeholderTextColor={colors.placeholderText}
                keyboardType="phone-pad"
              />
            </View>
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

      {/* Security Section */}
      <ListSection header="SECURITY" style={styles.section}>
        <Pressable
          onPress={handleChangePassword}
          style={({ pressed }) => [
            styles.actionCard,
            { backgroundColor: colors.secondarySystemBackground },
            pressed && { opacity: 0.7 },
          ]}
        >
          <View style={[styles.actionIconBox, { backgroundColor: colors.systemIndigo + '20' }]}>
            <Icon name="key-outline" size={20} color={colors.systemIndigo} />
          </View>
          <View style={styles.actionContent}>
            <Text variant="body" weight="semibold" color="label">
              Change Password
            </Text>
            <Text variant="caption1" style={{ color: colors.secondaryLabel, marginTop: 2 }}>
              Update your account password
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.tertiaryLabel} />
        </Pressable>
      </ListSection>

      {/* Danger Zone */}
      <ListSection header="DANGER ZONE" style={styles.section}>
        <Pressable
          onPress={handleDeleteAccount}
          style={({ pressed }) => [
            styles.dangerCard,
            { backgroundColor: colors.systemRed + '10', borderColor: colors.systemRed + '30' },
            pressed && { opacity: 0.7 },
          ]}
        >
          <View style={[styles.actionIconBox, { backgroundColor: colors.systemRed + '20' }]}>
            <Icon name="trash-outline" size={20} color={colors.systemRed} />
          </View>
          <View style={styles.actionContent}>
            <Text variant="body" weight="semibold" style={{ color: colors.systemRed }}>
              Delete Account
            </Text>
            <Text variant="caption1" style={{ color: colors.systemRed + 'CC', marginTop: 2 }}>
              Permanently remove your account and data
            </Text>
          </View>
        </Pressable>
      </ListSection>

      <View style={{ height: 40 }} />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeAvatarButton: {
    position: 'absolute',
    top: 90,
    right: '50%',
    marginRight: -50,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  inputCard: {
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  inputIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContent: {
    flex: 1,
    marginLeft: 12,
  },
  input: {
    fontSize: 16,
    paddingVertical: 4,
    marginTop: 2,
  },
  saveSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
  },
  actionIconBox: {
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
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
});
