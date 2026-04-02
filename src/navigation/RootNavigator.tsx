import React, { useEffect, useState } from 'react';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { linking } from './linking';
import { persistNavigationState, restoreNavigationState } from './persistence';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  // TEMPORARY: Skip auth for testing - set to true to bypass login
  const SKIP_AUTH_FOR_TESTING = false;

  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState<NavigationState | undefined>(
    undefined
  );

  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedState = await restoreNavigationState();
        setInitialState(savedState);
      } catch (error) {
        console.error('Failed to restore navigation state:', error);
      } finally {
        setIsReady(true);
      }
    };

    restoreState();
  }, []);

  const onStateChange = (state: NavigationState | undefined) => {
    persistNavigationState(state).catch(error => {
      console.error('Failed to save navigation state:', error);
    });
  };

  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer
      linking={linking}
      initialState={initialState}
      onStateChange={onStateChange}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated && !SKIP_AUTH_FOR_TESTING ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
