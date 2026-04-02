import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Switch } from 'react-native';
import { Text, Button, Input, Card } from '@components/atoms';
import { ScreenLayout } from '@components/templates';
import { useAddKnownDevice } from '@hooks/api/useKnownDevices';
import { AnalyticsEvents, logEvent } from '@services/analyticsEvents';
import { KnownDeviceCategory } from '@types';

const CATEGORIES = [
  { value: 'family', label: 'Family' },
  { value: 'guests', label: 'Guests' },
  { value: 'service', label: 'Service' },
  { value: 'other', label: 'Other' },
] as const satisfies ReadonlyArray<{
  value: KnownDeviceCategory;
  label: string;
}>;

export const AddKnownDeviceScreen = ({ navigation, route }: any) => {
  const { macAddress: initialMac, deviceId: initialDeviceId } =
    route.params || {};
  const addKnownDevice = useAddKnownDevice();

  const [name, setName] = useState('');
  const [macAddress, setMacAddress] = useState(initialMac || '');
  const [category, setCategory] = useState<KnownDeviceCategory>('family');
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

    const knownDevice = {
      name,
      macAddress,
      category,
      expiresAt: isTemporary
        ? new Date(
            Date.now() + parseInt(expiresInDays) * 24 * 60 * 60 * 1000
          ).toISOString()
        : undefined,
    };

    try {
      await addKnownDevice.mutateAsync(knownDevice);
      logEvent(AnalyticsEvents.DEVICE_ADDED_TO_KNOWN, {
        macAddress,
        deviceId: initialDeviceId,
      });
      Alert.alert('Success', 'Device added to Known Devices', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add known device');
    }
  };

  return (
    <ScreenLayout
      header={{
        title: 'Add Known Device',
        showBack:
          typeof navigation.canGoBack === 'function'
            ? navigation.canGoBack()
            : true,
        onBackPress: () => navigation.goBack(),
      }}
      scrollable={false}
    >
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
            <Text variant="title3" style={styles.sectionTitle}>
              Category
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <Button
                  key={cat.value}
                  buttonStyle={category === cat.value ? 'filled' : 'gray'}
                  size="small"
                  onPress={() => setCategory(cat.value)}
                  style={styles.categoryButton}
                >
                  {cat.label}
                </Button>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text variant="title3">Temporary Access</Text>
              <Switch value={isTemporary} onValueChange={setIsTemporary} />
            </View>
            <Text variant="caption1" style={styles.description}>
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
          <Text variant="title3" style={styles.sectionTitle}>
            MAC Address Format
          </Text>
          <Text variant="caption1">- Use format: XX:XX:XX:XX:XX:XX</Text>
          <Text variant="caption1">- Example: A1:B2:C3:D4:E5:F6</Text>
          <Text variant="caption1">
            - Each X represents a hexadecimal digit (0-9, A-F)
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button buttonStyle="gray" onPress={() => navigation.goBack()} style={styles.button}>
            Cancel
          </Button>
          <Button onPress={handleAdd} style={styles.button}>
            Add Known Device
          </Button>
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
