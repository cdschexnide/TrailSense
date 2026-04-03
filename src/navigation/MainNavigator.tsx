import React from 'react';
import { View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@components/atoms';
import type { IconName } from '@components/atoms/Icon';
import { useTheme } from '@hooks/useTheme';
import { useAlerts } from '@hooks/api/useAlerts';
import { useDevices } from '@hooks/api/useDevices';
import { isDeviceOnline } from '@utils/dateUtils';
import { MainTabParamList } from './types';
import HomeStack from './stacks/HomeStack';
import AlertsStack from './stacks/AlertsStack';
import AIStack from './stacks/AIStack';
import RadarStack from './stacks/RadarStack';
import DevicesStack from './stacks/DevicesStack';
import MoreStack from './stacks/MoreStack';

const Tab = createBottomTabNavigator<MainTabParamList>();
const MONO_FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

const StatusDot = ({ color }: { color: string }) => (
  <View
    style={{
      position: 'absolute',
      top: 2,
      right: -4,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: color,
    }}
  />
);

const AlertsTabIcon = ({ color }: { color: string }) => {
  const { data: alerts } = useAlerts();
  const criticalCount =
    alerts?.filter(
      alert =>
        !alert.isReviewed &&
        (alert.threatLevel === 'critical' || alert.threatLevel === 'high')
    ).length ?? 0;

  return (
    <View>
      <Icon name="alert-circle" color={color} size="base" />
      {criticalCount > 0 ? <StatusDot color="#ef4444" /> : null}
    </View>
  );
};

const DevicesTabIcon = ({ color }: { color: string }) => {
  const { data: devices } = useDevices();
  const offlineCount =
    devices?.filter(device => !isDeviceOnline(device.lastSeen)).length ?? 0;

  return (
    <View>
      <Icon name="hardware-chip" color={color} size="base" />
      {offlineCount > 0 ? <StatusDot color="#f59e0b" /> : null}
    </View>
  );
};

const SimpleTabIcon = ({ name, color }: { name: IconName; color: string }) => (
  <View>
    <Icon name={name} color={color} size="base" />
  </View>
);

export const MainNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.tertiaryLabel,
        tabBarLabelStyle: {
          fontFamily: MONO_FONT,
          fontSize: 10,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.separator,
          borderTopWidth: 1,
        },
        sceneStyle: {
          backgroundColor: theme.colors.systemBackground,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <SimpleTabIcon name="home-outline" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AlertsTab"
        component={AlertsStack}
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <AlertsTabIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="AITab"
        component={AIStack}
        options={{
          title: 'AI',
          tabBarIcon: ({ color }) => (
            <SimpleTabIcon name="sparkles-outline" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RadarTab"
        component={RadarStack}
        options={{
          title: 'Radar',
          tabBarIcon: ({ color }) => (
            <SimpleTabIcon name="radio-outline" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DevicesTab"
        component={DevicesStack}
        options={{
          title: 'Devices',
          tabBarIcon: ({ color }) => <DevicesTabIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreStack}
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => (
            <SimpleTabIcon name="settings-outline" color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
