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

export type SettingsStackParamList = {
  Settings: undefined;
  Profile: undefined;
  Whitelist: undefined;
  NotificationSettings: undefined;
};
