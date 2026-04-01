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
};

export type AlertsStackParamList = {
  AlertList: undefined;
  AlertDetail: { alertId: string };
  AlertFilter: undefined;
};

export type RadarStackParamList = {
  LiveRadar: undefined;
  RadarSettings: undefined;
};

export type DevicesStackParamList = {
  DeviceList: undefined;
  DeviceDetail: { deviceId: string };
  DeviceHistory: { id: string };
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
  Whitelist: undefined;
  NotificationSettings: undefined;
  Theme: undefined;
  AlertSound: undefined;
  Biometric: undefined;
  Security: undefined;
  Sensitivity: undefined;
  QuietHours: undefined;
  VacationMode: undefined;
  AddWhitelist: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
  Profile: undefined;
  Whitelist: undefined;
  NotificationSettings: undefined;
  Theme: undefined;
  AlertSound: undefined;
  Biometric: undefined;
  Security: undefined;
  Sensitivity: undefined;
  QuietHours: undefined;
  VacationMode: undefined;
  AddWhitelist: undefined;
};

export type AIStackParamList = {
  TrailSenseAI: undefined;
};
