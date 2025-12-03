import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AIStackParamList } from '@navigation/types';
import { AIAssistantScreen } from '@screens/ai';

const Stack = createNativeStackNavigator<AIStackParamList>();

export const AIStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // AI screen has its own header
      }}
    >
      <Stack.Screen name="TrailSenseAI" component={AIAssistantScreen} />
    </Stack.Navigator>
  );
};

export default AIStack;
