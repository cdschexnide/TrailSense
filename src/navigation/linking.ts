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
              DeviceFingerprint: 'home/fingerprint/:fingerprintHash',
            },
          },
          AlertsTab: {
            screens: {
              AlertList: 'alerts',
              AlertDetail: 'alerts/:alertId',
              AlertFilter: 'alerts/filter',
              DeviceFingerprint: 'alerts/fingerprint/:fingerprintHash',
            },
          },
          AITab: {
            screens: {
              TrailSenseAI: 'ai',
            },
          },
          RadarTab: {
            screens: {
              LiveRadar: 'radar',
              RadarSettings: 'radar/settings',
              DeviceFingerprint: 'radar/fingerprint/:fingerprintHash',
            },
          },
          DevicesTab: {
            screens: {
              DeviceList: 'devices',
              DeviceDetail: 'devices/:deviceId',
              AddDevice: 'devices/add',
              DeviceFingerprint: 'devices/fingerprint/:fingerprintHash',
            },
          },
          MoreTab: {
            screens: {
              MoreMenu: 'more',
              Dashboard: 'analytics',
              Heatmap: 'analytics/heatmap',
              Reports: 'analytics/reports',
              Settings: 'settings',
              Profile: 'settings/profile',
              KnownDevices: 'settings/known-devices',
              NotificationSettings: 'settings/notifications',
              AlertSound: 'settings/alert-sound',
              Biometric: 'settings/biometric',
              Security: 'settings/security',
              Sensitivity: 'settings/sensitivity',
              QuietHours: 'settings/quiet-hours',
              VacationMode: 'settings/vacation-mode',
              AddKnownDevice: 'settings/known-devices/add',
              DeviceFingerprint: 'more/fingerprint/:fingerprintHash',
            },
          },
        },
      },
    },
  },
};
