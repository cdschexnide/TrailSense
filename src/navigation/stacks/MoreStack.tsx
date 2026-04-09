import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreStackParamList } from '@navigation/types';
import { MoreMenuScreen } from '@screens/more';
import {
  BriefScreen,
  DashboardScreen,
  HeatmapScreen,
  ReportBuilderScreen,
  ReportPreviewScreen,
  ReportsScreen,
} from '@screens/analytics';
import { DeviceFingerprintScreen } from '@screens/fingerprint';
import {
  SettingsScreen,
  ProfileScreen,
  KnownDevicesScreen,
  NotificationSettingsScreen,
  AlertSoundScreen,
  BiometricScreen,
  SecurityScreen,
  SensitivityScreen,
  QuietHoursScreen,
  VacationModeScreen,
  AddKnownDeviceScreen,
} from '@screens/settings';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export const MoreStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MoreMenu" component={MoreMenuScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Heatmap" component={HeatmapScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="ReportBuilder" component={ReportBuilderScreen} />
      <Stack.Screen name="ReportPreview" component={ReportPreviewScreen} />
      <Stack.Screen name="Brief" component={BriefScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="KnownDevices" component={KnownDevicesScreen} />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
      />
      <Stack.Screen name="AlertSound" component={AlertSoundScreen} />
      <Stack.Screen name="Biometric" component={BiometricScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="Sensitivity" component={SensitivityScreen} />
      <Stack.Screen name="QuietHours" component={QuietHoursScreen} />
      <Stack.Screen name="VacationMode" component={VacationModeScreen} />
      <Stack.Screen name="AddKnownDevice" component={AddKnownDeviceScreen} />
      <Stack.Screen
        name="DeviceFingerprint"
        component={DeviceFingerprintScreen}
      />
    </Stack.Navigator>
  );
};

export default MoreStack;
