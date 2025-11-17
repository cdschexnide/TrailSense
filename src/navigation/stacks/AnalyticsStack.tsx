import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AnalyticsStackParamList } from '@navigation/types';
import {
  DashboardScreen,
  HeatmapScreen,
  ReportsScreen,
} from '@screens/analytics';

const Stack = createNativeStackNavigator<AnalyticsStackParamList>();

export const AnalyticsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Analytics' }}
      />
      <Stack.Screen
        name="Heatmap"
        component={HeatmapScreen}
        options={{ title: 'Heatmap' }}
      />
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: 'Reports' }}
      />
    </Stack.Navigator>
  );
};

export default AnalyticsStack;
