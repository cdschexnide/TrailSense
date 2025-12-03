import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { MainTabParamList } from './types';
import AlertsStack from './stacks/AlertsStack';
import RadarStack from './stacks/RadarStack';
import DevicesStack from './stacks/DevicesStack';
import AIStack from './stacks/AIStack';
import SettingsStack from './stacks/SettingsStack';
import { AnalyticsStack } from './stacks/AnalyticsStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tab.Screen
        name="AlertsTab"
        component={AlertsStack}
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => (
            <Icon name="alert-circle" color={color} size="base" />
          ),
        }}
      />
      <Tab.Screen
        name="DevicesTab"
        component={DevicesStack}
        options={{
          title: 'Devices',
          tabBarIcon: ({ color }) => (
            <Icon name="hardware-chip" color={color} size="base" />
          ),
        }}
      />
      <Tab.Screen
        name="RadarTab"
        component={RadarStack}
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => (
            <Icon name="map-outline" color={color} size="base" />
          ),
        }}
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsStack}
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => (
            <Icon name="analytics" color={color} size="base" />
          ),
        }}
      />
      <Tab.Screen
        name="AITab"
        component={AIStack}
        options={{
          title: 'TrailSenseAI',
          tabBarIcon: ({ color }) => (
            <Icon name="sparkles-outline" color={color} size="base" />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStack}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Icon name="settings" color={color} size="base" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
