import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { MainTabParamList } from './types';
import HomeStack from './stacks/HomeStack';
import AlertsStack from './stacks/AlertsStack';
import RadarStack from './stacks/RadarStack';
import DevicesStack from './stacks/DevicesStack';
import MoreStack from './stacks/MoreStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.brandAccent || theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondaryLabel,
        tabBarStyle: {
          backgroundColor: theme.colors.systemBackground,
          borderTopColor: theme.colors.separator,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Icon name="home-outline" color={color} size="base" />
          ),
        }}
      />
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
        name="RadarTab"
        component={RadarStack}
        options={{
          title: 'Radar',
          tabBarIcon: ({ color }) => (
            <Icon name="radio-outline" color={color} size="base" />
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
        name="MoreTab"
        component={MoreStack}
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => (
            <Icon name="ellipsis-horizontal" color={color} size="base" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
