# TrailSense Mobile App - Notifications

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Prerequisites**: [08-ADVANCED-FEATURES.md](./08-ADVANCED-FEATURES.md)

---

## Notification Architecture

### Notification Types

1. **Push Notifications** (FCM) - Background/terminated app
2. **Local Notifications** - Foreground app
3. **Actionable Notifications** - One-tap actions
4. **Critical Alerts** - High-priority, sound/vibration

---

## Firebase Cloud Messaging Setup

```typescript
// src/services/fcmService.ts

import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export class FCMService {
  static async initialize() {
    // Request permission
    const enabled = await this.requestPermission();
    if (!enabled) return;

    // Get FCM token
    const token = await messaging().getToken();
    await this.registerToken(token);

    // Handle token refresh
    messaging().onTokenRefresh(async newToken => {
      await this.registerToken(newToken);
    });

    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
      await this.showLocalNotification(remoteMessage);
    });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background message:', remoteMessage);
    });

    // Handle notification press
    messaging().onNotificationOpenedApp(remoteMessage => {
      this.handleNotificationPress(remoteMessage);
    });

    // Check if app was opened from notification (killed state)
    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification) {
      this.handleNotificationPress(initialNotification);
    }
  }

  static async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      // Android 13+ requires permission
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    }

    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  static async showLocalNotification(remoteMessage: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: remoteMessage.notification.title,
        body: remoteMessage.notification.body,
        data: remoteMessage.data,
        sound: 'alert-critical.mp3',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null, // Show immediately
    });
  }

  static handleNotificationPress(remoteMessage: any) {
    const { alertId, deviceId, action } = remoteMessage.data;

    // Navigate to appropriate screen
    navigationRef.navigate('AlertDetail', { alertId });
  }
}
```

---

## Local Notifications

```typescript
// src/services/localNotificationService.ts

import * as Notifications from 'expo-notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class LocalNotificationService {
  static async scheduleAlert(alert: Alert) {
    const notification = {
      content: {
        title: this.getTitle(alert),
        body: this.getBody(alert),
        data: { alertId: alert.id, type: 'alert' },
        sound: this.getSound(alert.threatLevel),
        priority: this.getPriority(alert.threatLevel),
        badge: 1,
        categoryIdentifier: 'alert',
      },
      trigger: null, // Immediate
    };

    await Notifications.scheduleNotificationAsync(notification);
  }

  static getTitle(alert: Alert): string {
    switch (alert.threatLevel) {
      case 'critical':
        return '🚨 CRITICAL THREAT DETECTED';
      case 'high':
        return '⚠️ High Threat Detection';
      case 'medium':
        return '⚡ Suspicious Activity';
      default:
        return 'Device Detected';
    }
  }

  static getBody(alert: Alert): string {
    const type =
      alert.detectionType === 'cellular'
        ? 'Cellular device'
        : alert.detectionType === 'wifi'
          ? 'WiFi device'
          : 'Bluetooth device';
    return `${type} detected near ${alert.deviceName} (${alert.rssi} dBm)`;
  }

  static getSound(threatLevel: ThreatLevel): string {
    return threatLevel === 'critical' || threatLevel === 'high'
      ? 'alert-critical.mp3'
      : 'default';
  }

  static getPriority(threatLevel: ThreatLevel) {
    return threatLevel === 'critical' || threatLevel === 'high'
      ? Notifications.AndroidNotificationPriority.MAX
      : Notifications.AndroidNotificationPriority.HIGH;
  }
}
```

---

## Actionable Notifications

```typescript
// iOS/Android notification actions

// Define notification categories
await Notifications.setNotificationCategoryAsync('alert', [
  {
    identifier: 'dismiss',
    buttonTitle: 'Dismiss',
    options: {
      isDestructive: true,
    },
  },
  {
    identifier: 'whitelist',
    buttonTitle: 'Whitelist',
    options: {
      opensAppToForeground: false,
    },
  },
  {
    identifier: 'view',
    buttonTitle: 'View Details',
    options: {
      opensAppToForeground: true,
    },
  },
  {
    identifier: 'call911',
    buttonTitle: 'Call 911',
    options: {
      opensAppToForeground: true,
      isDestructive: false,
    },
  },
]);

// Handle action responses
Notifications.addNotificationResponseReceivedListener(response => {
  const { actionIdentifier, notification } = response;
  const { alertId } = notification.request.content.data;

  switch (actionIdentifier) {
    case 'dismiss':
      handleDismiss(alertId);
      break;
    case 'whitelist':
      handleWhitelist(alertId);
      break;
    case 'view':
      navigationRef.navigate('AlertDetail', { alertId });
      break;
    case 'call911':
      Linking.openURL('tel:911');
      break;
  }
});
```

---

## Critical Alerts (iOS)

```typescript
// For critical security alerts that bypass Do Not Disturb

import PushNotificationIOS from '@react-native-community/push-notification-ios';

export const sendCriticalAlert = async (alert: Alert) => {
  if (Platform.OS === 'ios') {
    PushNotificationIOS.addNotificationRequest({
      id: alert.id,
      title: '🚨 CRITICAL SECURITY ALERT',
      body: `Unauthorized device detected on property`,
      sound: 'alert-critical.mp3',
      critical: true, // Bypasses Do Not Disturb
      criticalSoundVolume: 1.0,
      badge: 1,
      userInfo: {
        alertId: alert.id,
      },
    });
  }
};
```

---

## Notification Preferences

```typescript
// src/screens/settings/NotificationSettingsScreen.tsx

import React from 'react';
import { ScrollView } from 'react-native';
import { Switch, ListItem, Slider } from '@components/atoms';
import { useAppSelector, useAppDispatch } from '@store';

export const NotificationSettingsScreen = () => {
  const settings = useAppSelector(state => state.settings.notifications);
  const dispatch = useAppDispatch();

  return (
    <ScrollView>
      <Section title="Push Notifications">
        <ListItem
          title="Enable Push Notifications"
          right={
            <Switch
              value={settings.enabled}
              onValueChange={(value) =>
                dispatch(updateNotificationSetting({ enabled: value }))
              }
            />
          }
        />
      </Section>

      <Section title="Alert Levels">
        <ListItem
          title="Critical Threats"
          subtitle="Always notify with sound"
          right={<Switch value={settings.critical} />}
        />
        <ListItem
          title="High Threats"
          right={<Switch value={settings.high} />}
        />
        <ListItem
          title="Medium Threats"
          right={<Switch value={settings.medium} />}
        />
        <ListItem
          title="Low Priority"
          subtitle="Known devices"
          right={<Switch value={settings.low} />}
        />
      </Section>

      <Section title="Sound & Vibration">
        <ListItem
          title="Sound"
          right={<Switch value={settings.sound} />}
        />
        <ListItem
          title="Vibration"
          right={<Switch value={settings.vibration} />}
        />
        <ListItem
          title="Volume"
          subtitle={`${settings.volume}%`}
        >
          <Slider
            value={settings.volume}
            onValueChange={(value) =>
              dispatch(updateNotificationSetting({ volume: value }))
            }
            minimumValue={0}
            maximumValue={100}
          />
        </ListItem>
      </Section>

      <Section title="Quiet Hours">
        <ListItem
          title="Enable Quiet Hours"
          right={<Switch value={settings.quietHoursEnabled} />}
        />
        <ListItem
          title="Start Time"
          subtitle={settings.quietHoursStart}
          onPress={() => showTimePicker('start')}
        />
        <ListItem
          title="End Time"
          subtitle={settings.quietHoursEnd}
          onPress={() => showTimePicker('end')}
        />
        <ListItem
          title="Allow Critical Alerts"
          subtitle="During quiet hours"
          right={<Switch value={settings.quietHoursCriticalOnly} />}
        />
      </Section>
    </ScrollView>
  );
};
```

---

## TODO Checklist

### FCM Setup

- [ ] **1.1** Add Firebase to project (iOS & Android)
- [ ] **1.2** Configure google-services.json
- [ ] **1.3** Configure GoogleService-Info.plist
- [ ] **1.4** Request notification permissions
- [ ] **1.5** Get FCM token on login
- [ ] **1.6** Send token to backend
- [ ] **1.7** Handle token refresh
- [ ] **1.8** Test foreground notifications
- [ ] **1.9** Test background notifications
- [ ] **1.10** Test notification press handling

### Local Notifications

- [ ] **2.1** Configure Expo Notifications
- [ ] **2.2** Create notification scheduling logic
- [ ] **2.3** Add custom sounds
- [ ] **2.4** Test notification display
- [ ] **2.5** Test notification badges

### Actionable Notifications

- [ ] **3.1** Define notification categories
- [ ] **3.2** Add action buttons (dismiss, whitelist, view, call 911)
- [ ] **3.3** Implement action handlers
- [ ] **3.4** Test actions on iOS
- [ ] **3.5** Test actions on Android

### Notification Settings

- [ ] **4.1** Create NotificationSettingsScreen
- [ ] **4.2** Add enable/disable toggle
- [ ] **4.3** Add threat level filters
- [ ] **4.4** Add sound/vibration settings
- [ ] **4.5** Add quiet hours configuration
- [ ] **4.6** Persist settings to Redux

### Testing

- [ ] **5.1** Test notification delivery rates
- [ ] **5.2** Test notification latency
- [ ] **5.3** Test with app in different states (foreground/background/killed)
- [ ] **5.4** Test critical alerts on iOS
- [ ] **5.5** Test quiet hours functionality
- [ ] **5.6** Test notification permissions flow

---

**Next Document**: [10-MAPS-LOCATION.md](./10-MAPS-LOCATION.md)
