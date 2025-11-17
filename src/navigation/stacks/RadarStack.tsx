import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RadarStackParamList } from '@navigation/types';
import { LiveRadarScreen, RadarSettingsScreen } from '@screens/radar';

const Stack = createNativeStackNavigator<RadarStackParamList>();

export const RadarStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="LiveRadar"
        component={LiveRadarScreen}
        options={{ title: 'Live Radar' }}
      />
      <Stack.Screen
        name="RadarSettings"
        component={RadarSettingsScreen}
        options={{ title: 'Radar Settings' }}
      />
    </Stack.Navigator>
  );
};

export default RadarStack;
