# TrailSense Mobile App - Navigation Structure

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Prerequisites**: [03-AUTHENTICATION.md](./03-AUTHENTICATION.md)

---

## Navigation Architecture

### Structure

```
RootNavigator
├── AuthStack (Unauthenticated)
│   ├── Login
│   ├── Register
│   └── ForgotPassword
└── MainNavigator (Authenticated)
    └── BottomTabs
        ├── AlertsStack
        │   ├── AlertList
        │   ├── AlertDetail
        │   └── AlertFilter
        ├── RadarStack
        │   ├── LiveRadar
        │   └── RadarSettings
        ├── DevicesStack
        │   ├── DeviceList
        │   ├── DeviceDetail
        │   └── AddDevice
        ├── AnalyticsStack
        │   ├── Dashboard
        │   ├── Heatmap
        │   └── Reports
        └── SettingsStack
            ├── Settings
            ├── Profile
            ├── Whitelist
            └── NotificationSettings
```

---

## Implementation

### 1. Navigation Types

```typescript
// src/navigation/types.ts

import { NavigatorScreenParams } from '@react-navigation/native';
import { Alert, Device } from '@types';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  AlertsTab: NavigatorScreenParams<AlertsStackParamList>;
  RadarTab: NavigatorScreenParams<RadarStackParamList>;
  DevicesTab: NavigatorScreenParams<DevicesStackParamList>;
  AnalyticsTab: NavigatorScreenParams<AnalyticsStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

export type AlertsStackParamList = {
  AlertList: undefined;
  AlertDetail: { alertId: string };
  AlertFilter: undefined;
};

export type DevicesStackParamList = {
  DeviceList: undefined;
  DeviceDetail: { deviceId: string };
  AddDevice: undefined;
};

// ... other stack types
```

### 2. Root Navigator

```typescript
// src/navigation/RootNavigator.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { linking } from './linking';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

### 3. Bottom Tabs Navigator

```typescript
// src/navigation/MainNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import AlertsStack from './stacks/AlertsStack';
import RadarStack from './stacks/RadarStack';
import DevicesStack from './stacks/DevicesStack';
import AnalyticsStack from './stacks/AnalyticsStack';
import SettingsStack from './stacks/SettingsStack';

const Tab = createBottomTabNavigator();

export const MainNavigator = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen
        name="AlertsTab"
        component={AlertsStack}
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => (
            <Icon name="alert-circle" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="RadarTab"
        component={RadarStack}
        options={{
          title: 'Radar',
          tabBarIcon: ({ color, size }) => (
            <Icon name="radar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="DevicesTab"
        component={DevicesStack}
        options={{
          title: 'Devices',
          tabBarIcon: ({ color, size }) => (
            <Icon name="devices" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsStack}
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <Icon name="bar-chart" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStack}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Icon name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
```

### 4. Deep Linking Configuration

```typescript
// src/navigation/linking.ts

import { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<any> = {
  prefixes: ['trailsense://', 'https://app.trailsense.com'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
        },
      },
      Main: {
        screens: {
          AlertsTab: {
            screens: {
              AlertList: 'alerts',
              AlertDetail: 'alerts/:alertId',
            },
          },
          DevicesTab: {
            screens: {
              DeviceList: 'devices',
              DeviceDetail: 'devices/:deviceId',
            },
          },
          // ... other tabs
        },
      },
    },
  },
};
```

---

## TODO Checklist

- [ ] **1.** Create navigation type definitions
- [ ] **2.** Implement RootNavigator
- [ ] **3.** Implement AuthNavigator
- [ ] **4.** Implement MainNavigator with bottom tabs
- [ ] **5.** Create all stack navigators
- [ ] **6.** Configure deep linking
- [ ] **7.** Add navigation persistence
- [ ] **8.** Test navigation on iOS/Android
- [ ] **9.** Test deep linking
- [ ] **10.** Test navigation state restoration

---

**Next Document**: [05-STATE-MANAGEMENT.md](./05-STATE-MANAGEMENT.md)
