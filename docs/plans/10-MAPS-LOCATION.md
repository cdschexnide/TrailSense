# TrailSense Mobile App - Maps & Location

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Prerequisites**: [09-NOTIFICATIONS.md](./09-NOTIFICATIONS.md)

---

## Maps & Location Features

1. Device Location Display
2. Detection Markers
3. Heatmap Overlay
4. Geofencing
5. Background Location Tracking

---

## Map Integration

```typescript
// src/screens/devices/DeviceMapScreen.tsx

import React, { useEffect, useState } from 'react';
import MapView, { Marker, Circle, Heatmap } from 'react-native-maps';
import { useDevices } from '@hooks/useDevices';
import { useAlerts } from '@hooks/useAlerts';

export const DeviceMapScreen = () => {
  const { data: devices } = useDevices();
  const { data: alerts } = useAlerts({ period: 'today' });

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      {/* Device markers */}
      {devices?.map(device => (
        <Marker
          key={device.id}
          coordinate={{
            latitude: device.location.latitude,
            longitude: device.location.longitude,
          }}
          title={device.name}
          description={device.online ? 'Online' : 'Offline'}
        >
          <CustomDeviceMarker device={device} />
        </Marker>
      ))}

      {/* Detection range circles */}
      {devices?.map(device => (
        <Circle
          key={`range-${device.id}`}
          center={{
            latitude: device.location.latitude,
            longitude: device.location.longitude,
          }}
          radius={243.84} // 800 feet in meters
          strokeColor="rgba(76, 175, 80, 0.3)"
          fillColor="rgba(76, 175, 80, 0.1)"
        />
      ))}

      {/* Recent detection markers */}
      {alerts?.map(alert => (
        <Marker
          key={alert.id}
          coordinate={{
            latitude: alert.location.latitude,
            longitude: alert.location.longitude,
          }}
          pinColor={getThreatColor(alert.threatLevel)}
        />
      ))}

      {/* Heatmap */}
      <Heatmap
        points={getHeatmapPoints(alerts)}
        radius={50}
        opacity={0.6}
      />
    </MapView>
  );
};
```

---

## Geofencing

```typescript
// src/services/geofencingService.ts

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { settingsApi } from '@api/endpoints/settings';

const GEOFENCE_TASK = 'PROPERTY_GEOFENCE';

export class GeofencingService {
  static async setupGeofence(
    deviceId: string,
    latitude: number,
    longitude: number,
    radius: number = 800 // feet
  ) {
    // Request permissions
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Background location permission denied');
    }

    // Define geofence region
    await Location.startGeofencingAsync(GEOFENCE_TASK, [
      {
        identifier: deviceId,
        latitude,
        longitude,
        radius: radius * 0.3048, // feet to meters
        notifyOnEnter: true,
        notifyOnExit: true,
      },
    ]);
  }

  static async removeGeofence() {
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
  }

  static async checkIfAtProperty(): Promise<boolean> {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    // Check if within any property geofence
    const devices = await getDevices();
    return devices.some(device =>
      this.isWithinRadius(
        location.coords.latitude,
        location.coords.longitude,
        device.location.latitude,
        device.location.longitude,
        800 // feet
      )
    );
  }

  private static isWithinRadius(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    radiusFeet: number
  ): boolean {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    return distance <= radiusFeet;
  }

  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Haversine formula - returns distance in feet
    const R = 20902231; // Earth radius in feet
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Register geofence task
TaskManager.defineTask(
  GEOFENCE_TASK,
  ({ data: { eventType, region }, error }) => {
    if (error) {
      console.error('Geofence task error:', error);
      return;
    }

    if (eventType === Location.GeofencingEventType.Enter) {
      console.log('Entered property geofence');
      // User arrived at property
      // Could auto-disable vacation mode
    } else if (eventType === Location.GeofencingEventType.Exit) {
      console.log('Exited property geofence');
      // User left property
      // Could auto-enable heightened alerting
    }
  }
);
```

---

## Background Location Tracking

```typescript
// src/services/locationService.ts

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

export class LocationService {
  static async startBackgroundTracking() {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Background location permission denied');
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 300000, // 5 minutes
      distanceInterval: 100, // meters
      foregroundService: {
        notificationTitle: 'TrailSense',
        notificationBody: 'Monitoring property location',
        notificationColor: '#4CAF50',
      },
    });
  }

  static async stopBackgroundTracking() {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }

  static async getCurrentLocation() {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  }
}

// Register background location task
TaskManager.defineTask(LOCATION_TASK, ({ data, error }) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as any;
    const location = locations[0];

    // Check if near property
    GeofencingService.checkIfAtProperty().then(isAtProperty => {
      // Update user location state
      // Could adjust alert sensitivity based on location
    });
  }
});
```

---

## Custom Map Markers

```typescript
// src/components/atoms/DeviceMarker.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Icon } from '@components/atoms';

export const DeviceMarker: React.FC<{ device: Device }> = ({ device }) => {
  const getColor = () => {
    if (!device.online) return '#9E9E9E';
    if (device.battery < 20) return '#FF5722';
    return '#4CAF50';
  };

  return (
    <View style={[styles.marker, { borderColor: getColor() }]}>
      <Icon
        name="device"
        size={20}
        color={getColor()}
      />
      {device.battery < 20 && (
        <View style={styles.badge}>
          <Icon name="battery-alert" size={12} color="#FFF" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF5722',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

---

## TODO Checklist

### Map Setup

- [ ] **1.1** Install react-native-maps
- [ ] **1.2** Configure Google Maps API key (Android)
- [ ] **1.3** Configure Apple Maps (iOS)
- [ ] **1.4** Add map permissions to app.json
- [ ] **1.5** Create DeviceMapScreen
- [ ] **1.6** Test map rendering on iOS
- [ ] **1.7** Test map rendering on Android

### Markers & Overlays

- [ ] **2.1** Create custom device markers
- [ ] **2.2** Add detection range circles
- [ ] **2.3** Add alert markers
- [ ] **2.4** Implement heatmap overlay
- [ ] **2.5** Add marker clustering for many devices
- [ ] **2.6** Add marker info windows

### Geofencing

- [ ] **3.1** Request background location permissions
- [ ] **3.2** Define geofence regions for devices
- [ ] **3.3** Register geofence task
- [ ] **3.4** Handle enter/exit events
- [ ] **3.5** Test geofencing on iOS
- [ ] **3.6** Test geofencing on Android
- [ ] **3.7** Add geofence status to UI

### Location Services

- [ ] **4.1** Request foreground location permission
- [ ] **4.2** Request background location permission
- [ ] **4.3** Implement getCurrentLocation
- [ ] **4.4** Implement background location tracking
- [ ] **4.5** Register background task
- [ ] **4.6** Test battery impact
- [ ] **4.7** Optimize tracking intervals

### UI Features

- [ ] **5.1** Add map zoom controls
- [ ] **5.2** Add "Center on devices" button
- [ ] **5.3** Add map type selector (standard/satellite/hybrid)
- [ ] **5.4** Add distance measurement tool
- [ ] **5.5** Add property boundary drawing

### Testing

- [ ] **6.1** Test map performance with many markers
- [ ] **6.2** Test geofencing accuracy
- [ ] **6.3** Test background location tracking
- [ ] **6.4** Test with location services disabled
- [ ] **6.5** Test battery consumption

---

**Next Document**: [11-DATA-PERSISTENCE.md](./11-DATA-PERSISTENCE.md)
