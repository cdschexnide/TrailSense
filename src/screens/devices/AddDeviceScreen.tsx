import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Button, Input, Card } from '@components/atoms';
import { ScreenLayout } from '@components/templates';
import { useTheme } from '@hooks/useTheme';

export const AddDeviceScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [deviceName, setDeviceName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleScanQR = () => {
    setShowScanner(true);
    // TODO: Implement QR code scanner
    // This would typically use react-native-camera or expo-barcode-scanner
    Alert.alert('QR Scanner', 'QR code scanning coming soon');
  };

  const handleManualAdd = async () => {
    if (!deviceName.trim() || !deviceId.trim()) {
      Alert.alert('Error', 'Please enter both device name and ID');
      return;
    }

    try {
      // TODO: Implement API call to add device
      Alert.alert('Success', 'Device added successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add device');
    }
  };

  return (
    <ScreenLayout title="Add Device">
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Text variant="h3" style={styles.sectionTitle}>
            Scan QR Code
          </Text>
          <Text variant="caption" style={styles.description}>
            Scan the QR code on your TrailSense device to automatically
            configure it.
          </Text>
          <Button
            title="Open QR Scanner"
            variant="primary"
            onPress={handleScanQR}
            style={styles.button}
          />
        </Card>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text variant="caption" style={styles.dividerText}>
            OR
          </Text>
          <View style={styles.dividerLine} />
        </View>

        <Card style={styles.card}>
          <Text variant="h3" style={styles.sectionTitle}>
            Manual Entry
          </Text>
          <Text variant="caption" style={styles.description}>
            Enter device details manually if you can't scan the QR code.
          </Text>

          <Input
            label="Device Name"
            placeholder="e.g., Living Room Sensor"
            value={deviceName}
            onChangeText={setDeviceName}
            style={styles.input}
          />

          <Input
            label="Device ID"
            placeholder="e.g., TS-12345678"
            value={deviceId}
            onChangeText={setDeviceId}
            style={styles.input}
          />

          <Button
            title="Add Device"
            variant="primary"
            onPress={handleManualAdd}
            style={styles.button}
          />
        </Card>

        <Card style={styles.helpCard}>
          <Text variant="h3" style={styles.sectionTitle}>
            Need Help?
          </Text>
          <Text variant="caption">
            - The QR code can be found on the back of your device
          </Text>
          <Text variant="caption">
            - The Device ID is printed below the QR code
          </Text>
          <Text variant="caption">
            - Make sure your device is powered on before adding
          </Text>
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
    marginBottom: 8,
  },
  helpCard: {
    margin: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  sectionTitle: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dividerText: {
    marginHorizontal: 16,
    opacity: 0.5,
  },
});
