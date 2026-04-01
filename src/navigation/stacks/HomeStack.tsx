import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@navigation/types';
import { PropertyCommandCenter } from '@screens/home';

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
    </Stack.Navigator>
  );
};

export default HomeStack;
