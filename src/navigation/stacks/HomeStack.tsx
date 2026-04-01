import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@navigation/types';
import { PropertyCommandCenter } from '@screens/home';
import { DeviceFingerprintScreen } from '@screens/fingerprint';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="PropertyCommandCenter"
        component={PropertyCommandCenter}
      />
      <Stack.Screen
        name="DeviceFingerprint"
        component={DeviceFingerprintScreen}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;
