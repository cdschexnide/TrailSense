import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '@navigation/types';
import {
  SettingsScreen,
  ProfileScreen,
  WhitelistScreen,
  NotificationSettingsScreen,
} from '@screens/settings';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="Whitelist"
        component={WhitelistScreen}
        options={{ title: 'Whitelist' }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'Notifications' }}
      />
    </Stack.Navigator>
  );
};

export default SettingsStack;
