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
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Heatmap" component={HeatmapScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
    </Stack.Navigator>
  );
};

export default AnalyticsStack;
