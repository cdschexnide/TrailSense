import { NavigatorScreenParams } from '@react-navigation/native';
import { ThreatLevel } from '@types';

export interface AlertFilterParams {
  threatLevels: ThreatLevel[];
  detectionTypes: string[];
}

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
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  AlertsTab: NavigatorScreenParams<AlertsStackParamList>;
  AITab: NavigatorScreenParams<AIStackParamList>;
  RadarTab: NavigatorScreenParams<RadarStackParamList>;
  DevicesTab: NavigatorScreenParams<DevicesStackParamList>;
  MoreTab: NavigatorScreenParams<MoreStackParamList>;
};

export type HomeStackParamList = {
  PropertyCommandCenter: undefined;
  DeviceFingerprint: { fingerprintHash: string };
};

export type AlertsStackParamList = {
  AlertList: { filters?: AlertFilterParams } | undefined;
  AlertDetail: { alertId: string };
  AlertFilter: { filters?: AlertFilterParams } | undefined;
  DeviceFingerprint: { fingerprintHash: string };
};

export type RadarStackParamList = {
  LiveRadar: { startHour?: number; deviceId?: string } | undefined;
  RadarSettings: undefined;
  DeviceFingerprint: { fingerprintHash: string };
};

export type DevicesStackParamList = {
  DeviceList: undefined;
  DeviceDetail: { deviceId: string };
  DeviceFingerprint: { fingerprintHash: string };
  DeviceSettings: { id: string };
  AddDevice: undefined;
};

export type AnalyticsStackParamList = {
  Dashboard: undefined;
  Heatmap: undefined;
  Reports: undefined;
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  Dashboard: undefined;
  Heatmap: undefined;
  Reports: undefined;
  Settings: undefined;
  Profile: undefined;
  KnownDevices: undefined;
  NotificationSettings: undefined;
  AlertSound: undefined;
  Biometric: undefined;
  Security: undefined;
  Sensitivity: undefined;
  QuietHours: undefined;
  VacationMode: undefined;
  AddKnownDevice: { fingerprintHash?: string; deviceId?: string } | undefined;
  DeviceFingerprint: { fingerprintHash: string };
};

export type SettingsStackParamList = {
  Settings: undefined;
  Profile: undefined;
  KnownDevices: undefined;
  NotificationSettings: undefined;
  AlertSound: undefined;
  Biometric: undefined;
  Security: undefined;
  Sensitivity: undefined;
  QuietHours: undefined;
  VacationMode: undefined;
  AddKnownDevice: { fingerprintHash?: string; deviceId?: string } | undefined;
};

export type AIStackParamList = {
  TrailSenseAI: undefined;
};
