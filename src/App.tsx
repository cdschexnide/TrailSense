import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@theme/index';
import { store, persistor } from '@store/index';
import { queryClient } from '@api/queryClient';
import { StyleSheet, ActivityIndicator, View, Platform } from 'react-native';
import RootNavigator from '@navigation/RootNavigator';
import { isMockMode, logMockStatus } from '@/config/mockConfig';
import { seedMockData } from '@/utils/seedMockData';
import { websocketService } from '@api/websocket';
import { featureFlagsManager } from '@/config/featureFlags';
import { AuthService } from '@services/authService';
import { login as loginAction } from '@store/slices/authSlice';
import { AIProvider } from '@/services/llm';

// Initialize react-native-executorch early (Android and iOS)
if (Platform.OS === 'android' || Platform.OS === 'ios') {
  try {
    require('react-native-executorch');
    console.log('[App] react-native-executorch initialized for', Platform.OS);
  } catch (error) {
    console.warn('[App] Failed to initialize react-native-executorch:', error);
  }
}

export default function App() {
  const [isMockDataReady, setIsMockDataReady] = useState(!isMockMode);

  useEffect(() => {
    // Log mock mode status
    logMockStatus();

    // LLM mock mode disabled - using real Llama 3.2 1B model
    // if (__DEV__) {
    //   console.log('[App] Enabling LLM mock mode for development');
    //   featureFlagsManager.enableMockMode();
    // }
    console.log('[App] LLM using real Llama 3.2 1B model (mock mode disabled)');

    // Seed mock data if enabled
    if (isMockMode) {
      seedMockData({ queryClient, store })
        .then(() => {
          setIsMockDataReady(true);

          // Initialize WebSocket after mock data is ready
          // Use a mock token for testing
          console.log('[App] Initializing mock WebSocket...');
          websocketService.connect('mock-token-for-testing');
        })
        .catch(error => {
          console.error('[App] Failed to seed mock data:', error);
          setIsMockDataReady(true); // Continue anyway
        });
    } else {
      // Real API mode - WebSocket will be initialized after user logs in
      // The WebSocket requires a real JWT token from the backend
      console.log(
        '[App] Real API mode - WebSocket will connect after authentication'
      );
    }

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);

  // Show loading screen while mock data is being seeded
  if (!isMockDataReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ReduxProvider store={store}>
            <PersistGate
              loading={
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" />
                </View>
              }
              persistor={persistor}
            >
              <QueryClientProvider client={queryClient}>
                <AIProvider>
                  <StatusBar style="auto" />
                  <RootNavigator />
                </AIProvider>
              </QueryClientProvider>
            </PersistGate>
          </ReduxProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
