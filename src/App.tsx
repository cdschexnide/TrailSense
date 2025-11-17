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
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import RootNavigator from '@navigation/RootNavigator';
import { isMockMode, logMockStatus } from '@/config/mockConfig';
import { seedMockData } from '@/utils/seedMockData';
import { websocketService } from '@api/websocket';

export default function App() {
  const [isMockDataReady, setIsMockDataReady] = useState(!isMockMode);

  useEffect(() => {
    // Log mock mode status
    logMockStatus();

    // Seed mock data if enabled
    if (isMockMode) {
      seedMockData({ queryClient, store })
        .then(() => {
          setIsMockDataReady(true);

          // Initialize WebSocket after mock data is ready
          // Use a mock token for testing
          console.log('[App] Initializing WebSocket...');
          websocketService.connect('mock-token-for-testing');
        })
        .catch((error) => {
          console.error('[App] Failed to seed mock data:', error);
          setIsMockDataReady(true); // Continue anyway
        });
    }

    // Cleanup on unmount
    return () => {
      if (isMockMode) {
        websocketService.disconnect();
      }
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
                <StatusBar style="auto" />
                <RootNavigator />
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
