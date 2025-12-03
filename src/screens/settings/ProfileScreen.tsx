import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Button, Input, Card } from '@components/atoms';
import { ScreenLayout } from '@components/templates';
import { useAppSelector } from '@store';

export const ProfileScreen = ({ navigation }: any) => {
  const user = useAppSelector(state => state.auth.user);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleSave = async () => {
    try {
      // TODO: Implement API call to update profile
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement account deletion
            console.log('Deleting account...');
          },
        },
      ]
    );
  };

  return (
    <ScreenLayout title="Profile">
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Text variant="h3" style={styles.sectionTitle}>
            Personal Information
          </Text>

          <Input
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <Input
            label="Email"
            placeholder="john@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <Input
            label="Phone Number"
            placeholder="+1 (555) 123-4567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Button
            title="Save Changes"
            variant="primary"
            onPress={handleSave}
            style={styles.button}
          />
        </Card>

        <Card style={styles.card}>
          <Text variant="h3" style={styles.sectionTitle}>
            Security
          </Text>

          <Button
            title="Change Password"
            variant="outline"
            onPress={handleChangePassword}
            style={styles.button}
          />
        </Card>

        <Card style={[styles.card, styles.dangerCard]}>
          <Text variant="h3" style={styles.sectionTitle}>
            Danger Zone
          </Text>

          <Text variant="caption" style={styles.dangerText}>
            Once you delete your account, there is no going back. Please be
            certain.
          </Text>

          <Button
            title="Delete Account"
            variant="ghost"
            onPress={handleDeleteAccount}
            style={styles.button}
          />
        </Card>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
  },
  dangerCard: {
    borderColor: '#ff3b30',
    borderWidth: 1,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  dangerText: {
    color: '#ff3b30',
    marginBottom: 16,
  },
});
