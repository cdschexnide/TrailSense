import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AlertsStackParamList } from '@navigation/types';
import { DeviceFingerprintScreen } from '@screens/fingerprint';
import {
  AlertListScreen,
  AlertDetailScreen,
  AlertFilterScreen,
} from '@screens/alerts';

const Stack = createNativeStackNavigator<AlertsStackParamList>();

export const AlertsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AlertList" component={AlertListScreen} />
      <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
      <Stack.Screen name="AlertFilter" component={AlertFilterScreen} />
      <Stack.Screen
        name="DeviceFingerprint"
        component={DeviceFingerprintScreen}
      />
    </Stack.Navigator>
  );
};

export default AlertsStack;
