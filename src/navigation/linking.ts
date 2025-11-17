import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
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
              AlertFilter: 'alerts/filter',
            },
          },
          RadarTab: {
            screens: {
              LiveRadar: 'radar',
              RadarSettings: 'radar/settings',
            },
          },
          DevicesTab: {
            screens: {
              DeviceList: 'devices',
              DeviceDetail: 'devices/:deviceId',
              AddDevice: 'devices/add',
            },
          },
          AnalyticsTab: {
            screens: {
              Dashboard: 'analytics',
              Heatmap: 'analytics/heatmap',
              Reports: 'analytics/reports',
            },
          },
          SettingsTab: {
            screens: {
              Settings: 'settings',
              Profile: 'settings/profile',
              Whitelist: 'settings/whitelist',
              NotificationSettings: 'settings/notifications',
            },
          },
        },
      },
    },
  },
};
