import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { linking } from './linking';
import {
  clearNavigationState,
  persistNavigationState,
  restoreNavigationState,
  sanitizeNavigationState,
} from './persistence';

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
  const authStateAtRestoreRef = useRef(isAuthenticated);

  useEffect(() => {
    const restoreState = async () => {
      const authStateAtRestore = authStateAtRestoreRef.current;

      console.warn('[Navigation] Starting navigation state restore', {
        isAuthenticated: authStateAtRestore,
      });

      try {
        const savedState = await restoreNavigationState();
        const sanitizedState = sanitizeNavigationState(
          savedState,
          authStateAtRestore
        );

        if (savedState && !sanitizedState) {
          await clearNavigationState();
        }

        setInitialState(sanitizedState);
        console.warn('[Navigation] Navigation state restore complete', {
          isAuthenticated: authStateAtRestore,
          restored: Boolean(savedState),
          applied: Boolean(sanitizedState),
        });
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
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Restoring navigation…</Text>
      </View>
    );
  }

  console.warn('[Navigation] Rendering root navigator', {
    isAuthenticated,
    hasInitialState: Boolean(initialState),
  });

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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111',
    gap: 12,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
});
