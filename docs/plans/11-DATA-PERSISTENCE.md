# TrailSense Mobile App - Data Persistence & Offline Support

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Prerequisites**: [10-MAPS-LOCATION.md](./10-MAPS-LOCATION.md)

---

## Data Persistence Strategy

### Storage Layers

1. **SecureStore**: Auth tokens, sensitive data (encrypted)
2. **AsyncStorage**: User preferences, cache
3. **SQLite**: Offline alert/device data (relational)
4. **React Query Cache**: Server data (in-memory)

---

## SecureStore (Encrypted Storage)

```typescript
// src/utils/secureStorage.ts

import * as SecureStore from 'expo-secure-store';

export class SecureStorage {
  static async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  }

  static async get(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  }

  static async delete(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }

  static async setObject(key: string, value: object): Promise<void> {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
  }

  static async getObject<T>(key: string): Promise<T | null> {
    const value = await SecureStore.getItemAsync(key);
    return value ? JSON.parse(value) : null;
  }
}

// Usage
await SecureStorage.setObject('auth_tokens', { accessToken, refreshToken });
const tokens = await SecureStorage.getObject<AuthTokens>('auth_tokens');
```

---

## AsyncStorage (Key-Value Cache)

```typescript
// src/utils/asyncStorage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

export class CacheStorage {
  static async set(key: string, value: any): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  static async get<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }

  static async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  static async clear(): Promise<void> {
    await AsyncStorage.clear();
  }

  static async getAllKeys(): Promise<readonly string[]> {
    return await AsyncStorage.getAllKeys();
  }
}

// Settings storage
export const saveSettings = async (settings: AppSettings) => {
  await CacheStorage.set('app_settings', settings);
};

export const loadSettings = async (): Promise<AppSettings | null> => {
  return await CacheStorage.get<AppSettings>('app_settings');
};
```

---

## SQLite Database

```typescript
// src/database/db.ts

import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('trailsense.db');

export class Database {
  static initialize() {
    return new Promise((resolve, reject) => {
      db.transaction(
        tx => {
          // Alerts table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS alerts (
              id TEXT PRIMARY KEY,
              deviceId TEXT,
              timestamp TEXT,
              detectionType TEXT,
              threatLevel TEXT,
              rssi INTEGER,
              macAddress TEXT,
              location TEXT,
              reviewed INTEGER DEFAULT 0,
              synced INTEGER DEFAULT 0,
              createdAt TEXT
            );
          `);

          // Devices table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS devices (
              id TEXT PRIMARY KEY,
              name TEXT,
              location TEXT,
              online INTEGER,
              battery INTEGER,
              lastSeen TEXT,
              synced INTEGER DEFAULT 0
            );
          `);

          // Whitelist table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS whitelist (
              id TEXT PRIMARY KEY,
              macAddress TEXT UNIQUE,
              name TEXT,
              category TEXT,
              expiresAt TEXT,
              createdAt TEXT
            );
          `);

          // Create indexes
          tx.executeSql(
            'CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);'
          );
          tx.executeSql(
            'CREATE INDEX IF NOT EXISTS idx_alerts_synced ON alerts(synced);'
          );
        },
        error => reject(error),
        () => resolve(true)
      );
    });
  }

  // Alert operations
  static async saveAlert(alert: Alert): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO alerts
           (id, deviceId, timestamp, detectionType, threatLevel, rssi, macAddress, location, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            alert.id,
            alert.deviceId,
            alert.timestamp,
            alert.detectionType,
            alert.threatLevel,
            alert.rssi,
            alert.macAddress || null,
            JSON.stringify(alert.location),
            new Date().toISOString(),
          ],
          (_, result) => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  static async getAlerts(limit: number = 50): Promise<Alert[]> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?',
          [limit],
          (_, { rows }) => {
            const alerts = rows._array.map(row => ({
              ...row,
              location: JSON.parse(row.location),
              reviewed: Boolean(row.reviewed),
            }));
            resolve(alerts);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  static async markAlertReviewed(alertId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'UPDATE alerts SET reviewed = 1, synced = 0 WHERE id = ?',
          [alertId],
          (_, result) => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  static async getUnsyncedAlerts(): Promise<Alert[]> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM alerts WHERE synced = 0',
          [],
          (_, { rows }) => resolve(rows._array),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  static async markAsSynced(alertIds: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        const placeholders = alertIds.map(() => '?').join(',');
        tx.executeSql(
          `UPDATE alerts SET synced = 1 WHERE id IN (${placeholders})`,
          alertIds,
          (_, result) => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
}
```

---

## Background Sync

```typescript
// src/services/backgroundSyncService.ts

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import NetInfo from '@react-native-community/netinfo';
import { Database } from '@database/db';
import { apiClient } from '@api/client';

const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC';

export class BackgroundSyncService {
  static async register() {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }

  static async unregister() {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
  }

  static async syncNow() {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('No network connection, skipping sync');
      return;
    }

    try {
      // Get unsynced data
      const unsyncedAlerts = await Database.getUnsyncedAlerts();

      if (unsyncedAlerts.length > 0) {
        // Sync to server
        await apiClient.post('/alerts/sync', { alerts: unsyncedAlerts });

        // Mark as synced
        await Database.markAsSynced(unsyncedAlerts.map(a => a.id));

        console.log(`Synced ${unsyncedAlerts.length} alerts`);
      }

      // Fetch new data from server
      const { data } = await apiClient.get('/alerts/recent');
      for (const alert of data) {
        await Database.saveAlert(alert);
      }
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }
}

// Register task
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    await BackgroundSyncService.syncNow();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});
```

---

## React Query Persistence

```typescript
// src/api/queryClient.ts

import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistQueryClient } from '@tanstack/react-query-persist-client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

// Persist query cache
persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
});
```

---

## Offline Detection

```typescript
// src/hooks/useNetworkStatus.ts

import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);
    });

    return () => unsubscribe();
  }, []);

  return { isOnline, isInternetReachable };
};

// Offline banner
export const OfflineBanner = () => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Icon name="cloud-off" color="#FFF" />
      <Text style={styles.text}>You are offline</Text>
    </View>
  );
};
```

---

## TODO Checklist

### SecureStore Setup

- [ ] **1.1** Install expo-secure-store
- [ ] **1.2** Create SecureStorage utility
- [ ] **1.3** Store auth tokens securely
- [ ] **1.4** Test encryption on iOS
- [ ] **1.5** Test encryption on Android

### AsyncStorage Setup

- [ ] **2.1** Install @react-native-async-storage/async-storage
- [ ] **2.2** Create CacheStorage utility
- [ ] **2.3** Persist user settings
- [ ] **2.4** Persist theme preference
- [ ] **2.5** Add cache cleanup logic

### SQLite Setup

- [ ] **3.1** Install expo-sqlite
- [ ] **3.2** Create database schema
- [ ] **3.3** Initialize database on app start
- [ ] **3.4** Create CRUD operations for alerts
- [ ] **3.5** Create CRUD operations for devices
- [ ] **3.6** Create CRUD operations for whitelist
- [ ] **3.7** Add database migrations

### Background Sync

- [ ] **4.1** Install expo-background-fetch
- [ ] **4.2** Register background sync task
- [ ] **4.3** Implement sync logic
- [ ] **4.4** Handle sync conflicts
- [ ] **4.5** Test background sync on iOS
- [ ] **4.6** Test background sync on Android

### React Query Persistence

- [ ] **5.1** Install @tanstack/query-persist-client
- [ ] **5.2** Configure query persistence
- [ ] **5.3** Test cache restoration
- [ ] **5.4** Add cache invalidation logic

### Offline Support

- [ ] **6.1** Install @react-native-community/netinfo
- [ ] **6.2** Create useNetworkStatus hook
- [ ] **6.3** Display offline banner
- [ ] **6.4** Queue mutations when offline
- [ ] **6.5** Retry failed requests when online
- [ ] **6.6** Test offline functionality

### Testing

- [ ] **7.1** Test data persistence across app restarts
- [ ] **7.2** Test offline mode
- [ ] **7.3** Test background sync
- [ ] **7.4** Test data migration
- [ ] **7.5** Test storage limits

---

**Next Document**: [12-TESTING.md](./12-TESTING.md)
