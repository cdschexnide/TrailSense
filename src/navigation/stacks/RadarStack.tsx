import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RadarStackParamList } from '@navigation/types';
import { ProximityHeatmapScreen, RadarSettingsScreen } from '@screens/radar';

const Stack = createNativeStackNavigator<RadarStackParamList>();

export const RadarStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="LiveRadar" component={ProximityHeatmapScreen} />
      <Stack.Screen name="RadarSettings" component={RadarSettingsScreen} />
    </Stack.Navigator>
  );
};

export default RadarStack;
