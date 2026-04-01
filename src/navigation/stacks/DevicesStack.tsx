import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DevicesStackParamList } from '@navigation/types';
import { DeviceFingerprintScreen } from '@screens/fingerprint';
import {
  DeviceListScreen,
  DeviceDetailScreen,
  AddDeviceScreen,
} from '@screens/devices';

const Stack = createNativeStackNavigator<DevicesStackParamList>();

export const DevicesStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="DeviceList"
        component={DeviceListScreen}
        options={{ title: 'Devices' }}
      />
      <Stack.Screen
        name="DeviceDetail"
        component={DeviceDetailScreen}
        options={{ title: 'Device Detail' }}
      />
      <Stack.Screen
        name="DeviceFingerprint"
        component={DeviceFingerprintScreen}
        options={{ title: 'Device Fingerprint' }}
      />
      <Stack.Screen
        name="AddDevice"
        component={AddDeviceScreen}
        options={{ title: 'Add Device' }}
      />
    </Stack.Navigator>
  );
};

export default DevicesStack;
