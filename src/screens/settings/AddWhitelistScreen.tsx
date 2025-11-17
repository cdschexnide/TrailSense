import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Switch } from 'react-native';
import { Text, Button, Input, Card } from '@components/atoms';
import { ScreenLayout } from '@components/templates';

const CATEGORIES = [
  { value: 'family', label: 'Family' },
  { value: 'guests', label: 'Guests' },
  { value: 'service', label: 'Service' },
  { value: 'other', label: 'Other' },
];

export const AddWhitelistScreen = ({ navigation, route }: any) => {
  const { macAddress: initialMac, deviceId: initialDeviceId } = route.params || {};

  const [name, setName] = useState('');
  const [macAddress, setMacAddress] = useState(initialMac || '');
  const [category, setCategory] = useState('family');
  const [isTemporary, setIsTemporary] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState('7');

  const validateMacAddress = (mac: string): boolean => {
    // MAC address validation: XX:XX:XX:XX:XX:XX
    const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
    return macRegex.test(mac);
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (!macAddress.trim()) {
      Alert.alert('Error', 'Please enter a MAC address');
      return;
    }

    if (!validateMacAddress(macAddress)) {
      Alert.alert('Error', 'Invalid MAC address format. Use XX:XX:XX:XX:XX:XX');
      return;
    }

    if (isTemporary && (!expiresInDays || parseInt(expiresInDays) <= 0)) {
      Alert.alert('Error', 'Please enter a valid number of days');
      return;
    }

    const whitelistItem = {
      name,
      macAddress,
      category,
      isTemporary,
      expiresAt: isTemporary
        ? new Date(Date.now() + parseInt(expiresInDays) * 24 * 60 * 60 * 1000).toISOString()
        : null,
    };

    try {
      // TODO: Implement API call to add whitelist item
      Alert.alert('Success', 'Device added to whitelist', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add device to whitelist');
    }
  };

  return (
    <ScreenLayout title="Add to Whitelist">
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Input
            label="Device Name"
            placeholder="e.g., My iPhone"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <Input
            label="MAC Address"
            placeholder="XX:XX:XX:XX:XX:XX"
            value={macAddress}
            onChangeText={setMacAddress}
            autoCapitalize="characters"
            style={styles.input}
          />

          <View style={styles.section}>
            <Text variant="h3" style={styles.sectionTitle}>
              Category
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.value}
                  title={cat.label}
                  variant={category === cat.value ? 'primary' : 'outline'}
                  size="sm"
                  onPress={() => setCategory(cat.value)}
                  style={styles.categoryButton}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text variant="h3">Temporary Whitelist</Text>
              <Switch value={isTemporary} onValueChange={setIsTemporary} />
            </View>
            <Text variant="caption" style={styles.description}>
              Automatically remove this device after a specified time
            </Text>
          </View>

          {isTemporary && (
            <Input
              label="Expires in (days)"
              placeholder="7"
              value={expiresInDays}
              onChangeText={setExpiresInDays}
              keyboardType="number-pad"
              style={styles.input}
            />
          )}
        </Card>

        <Card style={styles.helpCard}>
          <Text variant="h3" style={styles.sectionTitle}>
            MAC Address Format
          </Text>
          <Text variant="caption">
            - Use format: XX:XX:XX:XX:XX:XX
          </Text>
          <Text variant="caption">
            - Example: A1:B2:C3:D4:E5:F6
          </Text>
          <Text variant="caption">
            - Each X represents a hexadecimal digit (0-9, A-F)
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={styles.button}
          />
          <Button
            title="Add to Whitelist"
            variant="primary"
            onPress={handleAdd}
            style={styles.button}
          />
        </View>
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
  helpCard: {
    margin: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  input: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  description: {
    opacity: 0.7,
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    minWidth: '45%',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
