import { NavigatorScreenParams } from '@react-navigation/native';

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
  RadarTab: NavigatorScreenParams<RadarStackParamList>;
  DevicesTab: NavigatorScreenParams<DevicesStackParamList>;
  MoreTab: NavigatorScreenParams<MoreStackParamList>;
};

export type HomeStackParamList = {
  PropertyCommandCenter: undefined;
  DeviceFingerprint: { macAddress: string };
};

export type AlertsStackParamList = {
  AlertList: undefined;
  AlertDetail: { alertId: string };
  AlertFilter: undefined;
  DeviceFingerprint: { macAddress: string };
};

export type RadarStackParamList = {
  LiveRadar: { startHour?: number } | undefined;
  RadarSettings: undefined;
  DeviceFingerprint: { macAddress: string };
};

export type DevicesStackParamList = {
  DeviceList: undefined;
  DeviceDetail: { deviceId: string };
  DeviceFingerprint: { macAddress: string };
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
  TrailSenseAI: undefined;
  Settings: undefined;
  Profile: undefined;
  KnownDevices: undefined;
  NotificationSettings: undefined;
  Theme: undefined;
  AlertSound: undefined;
  Biometric: undefined;
  Security: undefined;
  Sensitivity: undefined;
  QuietHours: undefined;
  VacationMode: undefined;
  AddKnownDevice: { macAddress?: string; deviceId?: string } | undefined;
  DeviceFingerprint: { macAddress: string };
};

export type SettingsStackParamList = {
  Settings: undefined;
  Profile: undefined;
  KnownDevices: undefined;
  NotificationSettings: undefined;
  Theme: undefined;
  AlertSound: undefined;
  Biometric: undefined;
  Security: undefined;
  Sensitivity: undefined;
  QuietHours: undefined;
  VacationMode: undefined;
  AddKnownDevice: { macAddress?: string; deviceId?: string } | undefined;
};

export type AIStackParamList = {
  TrailSenseAI: undefined;
};
