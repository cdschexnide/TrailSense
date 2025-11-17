import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AlertsStackParamList } from '@navigation/types';
import {
  AlertListScreen,
  AlertDetailScreen,
  AlertFilterScreen,
} from '@screens/alerts';

const Stack = createNativeStackNavigator<AlertsStackParamList>();

export const AlertsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AlertList"
        component={AlertListScreen}
        options={{ title: 'Alerts' }}
      />
      <Stack.Screen
        name="AlertDetail"
        component={AlertDetailScreen}
        options={{ title: 'Alert Detail' }}
      />
      <Stack.Screen
        name="AlertFilter"
        component={AlertFilterScreen}
        options={{ title: 'Filter Alerts' }}
      />
    </Stack.Navigator>
  );
};

export default AlertsStack;
