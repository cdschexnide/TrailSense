import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreStackParamList } from '@navigation/types';
import { MoreMenuScreen } from '@screens/more';
import {
  DashboardScreen,
  HeatmapScreen,
  ReportsScreen,
} from '@screens/analytics';
import { AIAssistantScreen } from '@screens/ai';
import {
  SettingsScreen,
  ProfileScreen,
  WhitelistScreen,
  NotificationSettingsScreen,
  ThemeScreen,
  AlertSoundScreen,
  BiometricScreen,
  SecurityScreen,
  SensitivityScreen,
  QuietHoursScreen,
  VacationModeScreen,
  AddWhitelistScreen,
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
      <Stack.Screen name="TrailSenseAI" component={AIAssistantScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Whitelist" component={WhitelistScreen} />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
      />
      <Stack.Screen name="Theme" component={ThemeScreen} />
      <Stack.Screen name="AlertSound" component={AlertSoundScreen} />
      <Stack.Screen name="Biometric" component={BiometricScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="Sensitivity" component={SensitivityScreen} />
      <Stack.Screen name="QuietHours" component={QuietHoursScreen} />
      <Stack.Screen name="VacationMode" component={VacationModeScreen} />
      <Stack.Screen name="AddWhitelist" component={AddWhitelistScreen} />
    </Stack.Navigator>
  );
};

export default MoreStack;
