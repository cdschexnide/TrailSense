import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { mockAlerts, mockDevices } from './src/mocks/data';

export default function TestApp() {
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    console.log('🎭 MOCK MODE - Test App Loaded');
    console.log(`✓ ${mockAlerts.length} alerts loaded`);
    console.log(`✓ ${mockDevices.length} devices loaded`);

    // Simulate WebSocket events
    const interval = setInterval(() => {
      const event = `Alert at ${new Date().toLocaleTimeString()}`;
      setEvents(prev => [event, ...prev].slice(0, 20));
      console.log('📡', event);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎭 TrailSense Mock Test</Text>
        <Text style={styles.subtitle}>Mock data is working!</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Mock Data Loaded</Text>
        <Text style={styles.text}>✓ {mockAlerts.length} alerts</Text>
        <Text style={styles.text}>✓ {mockDevices.length} devices</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Devices</Text>
        {mockDevices.map(device => (
          <Text key={device.id} style={styles.text}>
            {device.name} - {device.online ? '🟢 Online' : '🔴 Offline'} -{' '}
            {device.battery}%
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          📡 Recent Alerts ({mockAlerts.slice(0, 5).length})
        </Text>
        {mockAlerts.slice(0, 5).map(alert => (
          <Text key={alert.id} style={styles.text}>
            {alert.threatLevel.toUpperCase()} - {alert.detectionType}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔴 Live Events (every 5s)</Text>
        {events.length === 0 ? (
          <ActivityIndicator />
        ) : (
          events.map((event, i) => (
            <Text key={i} style={styles.text}>
              {event}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#4CAF50' },
  section: {
    marginBottom: 30,
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  text: { fontSize: 14, color: '#ccc', marginBottom: 5 },
});
