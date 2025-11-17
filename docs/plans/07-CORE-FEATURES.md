# TrailSense Mobile App - Core Features

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Prerequisites**: [06-BACKEND-INTEGRATION.md](./06-BACKEND-INTEGRATION.md)

---

## Core Features Overview

1. Alert Management
2. Device Management
3. Whitelist Management
4. Settings & Configuration

---

## 1. Alert Management

### Alert List Screen

```typescript
// src/screens/alerts/AlertListScreen.tsx

import React from 'react';
import { FlatList } from 'react-native';
import { useAlerts } from '@hooks/useAlerts';
import { AlertCard } from '@components/organisms';
import { ScreenLayout, EmptyState, LoadingState } from '@components/templates';

export const AlertListScreen = () => {
  const { data: alerts, isLoading, error } = useAlerts();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <ScreenLayout title="Alerts">
      <FlatList
        data={alerts}
        renderItem={({ item }) => <AlertCard alert={item} />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState message="No alerts yet" />}
        refreshing={isLoading}
        onRefresh={refetch}
      />
    </ScreenLayout>
  );
};
```

### Alert Card Component

```typescript
// src/components/organisms/AlertCard/AlertCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Alert } from '@types';
import { Card, Badge, Button } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface AlertCardProps {
  alert: Alert;
  onPress?: () => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onPress }) => {
  const { colors } = useTheme();

  const getThreatColor = () => {
    return colors.threat[alert.threatLevel];
  };

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Badge
          label={alert.threatLevel.toUpperCase()}
          color={getThreatColor()}
        />
        <Text style={styles.timestamp}>
          {formatTimestamp(alert.timestamp)}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {alert.detectionType} Detection
        </Text>
        <Text style={styles.details}>
          Device: {alert.deviceId}
        </Text>
        <Text style={styles.details}>
          Signal: {alert.rssi} dBm
        </Text>
        {alert.macAddress && (
          <Text style={styles.mac}>{alert.macAddress}</Text>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          title="Dismiss"
          variant="ghost"
          size="sm"
          onPress={() => handleDismiss(alert.id)}
        />
        <Button
          title="Whitelist"
          variant="outline"
          size="sm"
          onPress={() => handleWhitelist(alert)}
        />
        <Button
          title="View"
          variant="primary"
          size="sm"
          onPress={onPress}
        />
      </View>
    </Card>
  );
};
```

---

## 2. Device Management

### Device List Screen

```typescript
// src/screens/devices/DeviceListScreen.tsx

import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useDevices } from '@hooks/useDevices';
import { DeviceCard } from '@components/organisms';
import { ScreenLayout, FAB } from '@components/atoms';

export const DeviceListScreen = ({ navigation }) => {
  const { data: devices, isLoading } = useDevices();

  return (
    <ScreenLayout title="Devices">
      <FlatList
        data={devices}
        renderItem={({ item }) => (
          <DeviceCard
            device={item}
            onPress={() => navigation.navigate('DeviceDetail', {
              deviceId: item.id
            })}
          />
        )}
        keyExtractor={(item) => item.id}
      />
      <FAB
        icon="plus"
        onPress={() => navigation.navigate('AddDevice')}
      />
    </ScreenLayout>
  );
};
```

### Device Card Component

```typescript
// src/components/organisms/DeviceCard/DeviceCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Device } from '@types';
import { Card, Badge, Icon } from '@components/atoms';

export const DeviceCard: React.FC<{ device: Device }> = ({ device }) => {
  const getStatusColor = () => {
    return device.online ? 'success' : 'offline';
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{device.name}</Text>
        <Badge
          label={device.online ? 'ONLINE' : 'OFFLINE'}
          color={getStatusColor()}
        />
      </View>

      <View style={styles.stats}>
        <Stat icon="battery" value={`${device.battery}%`} />
        <Stat icon="signal" value={device.signalStrength} />
        <Stat icon="eye" value={`${device.detectionCount} today`} />
      </View>

      <Text style={styles.location}>
        {device.location.latitude}, {device.location.longitude}
      </Text>
    </Card>
  );
};
```

---

## 3. Whitelist Management

### Whitelist Screen

```typescript
// src/screens/settings/WhitelistScreen.tsx

import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useWhitelist } from '@hooks/useWhitelist';
import { WhitelistItem } from '@components/molecules';
import { ScreenLayout, SearchBar, FAB } from '@components/atoms';

export const WhitelistScreen = () => {
  const { data: whitelist, isLoading } = useWhitelist();
  const [search, setSearch] = useState('');

  const filteredList = whitelist?.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.macAddress.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScreenLayout title="Whitelist">
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search devices..."
      />
      <FlatList
        data={filteredList}
        renderItem={({ item }) => (
          <WhitelistItem
            item={item}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
      />
      <FAB
        icon="plus"
        onPress={() => openAddModal()}
      />
    </ScreenLayout>
  );
};
```

---

## 4. Settings Screen

```typescript
// src/screens/settings/SettingsScreen.tsx

import React from 'react';
import { ScrollView, View } from 'react-native';
import { useAppSelector, useAppDispatch } from '@store';
import { ScreenLayout, ListItem, Switch } from '@components/atoms';

export const SettingsScreen = ({ navigation }) => {
  const settings = useAppSelector(state => state.settings);
  const dispatch = useAppDispatch();

  return (
    <ScreenLayout title="Settings">
      <ScrollView>
        <Section title="Detection">
          <ListItem
            title="Detection Sensitivity"
            subtitle={settings.sensitivity}
            onPress={() => navigation.navigate('Sensitivity')}
          />
          <ListItem
            title="Quiet Hours"
            subtitle={settings.quietHours}
            onPress={() => navigation.navigate('QuietHours')}
          />
        </Section>

        <Section title="Notifications">
          <ListItem
            title="Push Notifications"
            right={<Switch value={settings.pushEnabled} />}
          />
          <ListItem
            title="Alert Sound"
            right={<Switch value={settings.soundEnabled} />}
          />
        </Section>

        <Section title="Account">
          <ListItem
            title="Profile"
            onPress={() => navigation.navigate('Profile')}
          />
          <ListItem
            title="Security"
            onPress={() => navigation.navigate('Security')}
          />
          <ListItem
            title="Logout"
            onPress={handleLogout}
          />
        </Section>
      </ScrollView>
    </ScreenLayout>
  );
};
```

---

## TODO Checklist

### Alert Management

- [x] **1.1** Create AlertListScreen with filtering
- [x] **1.2** Create AlertDetailScreen with full info
- [x] **1.3** Create AlertCard component
- [x] **1.4** Implement alert actions (dismiss, whitelist, view)
- [x] **1.5** Add pull-to-refresh
- [x] **1.6** Add infinite scroll pagination
- [x] **1.7** Add filter modal (threat level, type, date)
- [x] **1.8** Add search functionality

### Device Management

- [x] **2.1** Create DeviceListScreen
- [x] **2.2** Create DeviceDetailScreen
- [x] **2.3** Create AddDeviceScreen with QR scan
- [x] **2.4** Create DeviceCard component
- [x] **2.5** Implement device status monitoring
- [x] **2.6** Add device configuration options
- [x] **2.7** Add device deletion with confirmation

### Whitelist Management

- [x] **3.1** Create WhitelistScreen
- [x] **3.2** Create add whitelist modal
- [x] **3.3** Implement MAC address validation
- [x] **3.4** Add categories (family, guests, service)
- [x] **3.5** Add temporary whitelist (time-based)
- [x] **3.6** Implement import/export

### Settings

- [x] **4.1** Create SettingsScreen
- [x] **4.2** Create ProfileScreen
- [x] **4.3** Create NotificationSettingsScreen
- [x] **4.4** Implement sensitivity adjustment
- [x] **4.5** Implement quiet hours configuration
- [x] **4.6** Add theme toggle (dark/light)
- [x] **4.7** Add biometric toggle

---

**Next Document**: [08-ADVANCED-FEATURES.md](./08-ADVANCED-FEATURES.md)
