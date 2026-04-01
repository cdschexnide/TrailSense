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
          HomeTab: {
            screens: {
              PropertyCommandCenter: 'home',
            },
          },
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
          MoreTab: {
            screens: {
              MoreMenu: 'more',
              Dashboard: 'analytics',
              Heatmap: 'analytics/heatmap',
              Reports: 'analytics/reports',
              TrailSenseAI: 'ai',
              Settings: 'settings',
              Profile: 'settings/profile',
              Whitelist: 'settings/whitelist',
              NotificationSettings: 'settings/notifications',
              Theme: 'settings/theme',
              AlertSound: 'settings/alert-sound',
              Biometric: 'settings/biometric',
              Security: 'settings/security',
              Sensitivity: 'settings/sensitivity',
              QuietHours: 'settings/quiet-hours',
              VacationMode: 'settings/vacation-mode',
              AddWhitelist: 'settings/whitelist/add',
            },
          },
        },
      },
    },
  },
};
