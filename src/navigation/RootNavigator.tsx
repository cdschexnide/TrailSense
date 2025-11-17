import React, { useEffect, useState } from 'react';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '@store/index';
import { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { linking } from './linking';

const NAVIGATION_STATE_KEY = '@trailsense:navigation_state';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  // TEMPORARY: Skip auth for testing - set to true to bypass login
  const SKIP_AUTH_FOR_TESTING = true;

  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState<NavigationState | undefined>(
    undefined
  );

  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedStateString =
          await AsyncStorage.getItem(NAVIGATION_STATE_KEY);

        if (savedStateString) {
          const savedState = JSON.parse(savedStateString);
          setInitialState(savedState);
        }
      } catch (error) {
        console.error('Failed to restore navigation state:', error);
      } finally {
        setIsReady(true);
      }
    };

    restoreState();
  }, []);

  const onStateChange = (state: NavigationState | undefined) => {
    AsyncStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state)).catch(
      error => {
        console.error('Failed to save navigation state:', error);
      }
    );
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
