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
import { getIsMockMode, logMockStatus } from '@/config/mockConfig';
import { seedMockData } from '@/utils/seedMockData';
import { websocketService } from '@api/websocket';
import { featureFlagsManager } from '@/config/featureFlags';
import { AIProvider } from '@/services/llm';
import { OfflineBanner } from '@components/molecules';
import { ToastProvider } from '@components/templates';
import { initDemoMode } from '@/config/demoMode';

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
  const [isMockDataReady, setIsMockDataReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      await initDemoMode();
      await featureFlagsManager.loadFromStorage();
      featureFlagsManager.updateFlags({
        DEMO_MODE: getIsMockMode(),
      });

      logMockStatus();
      console.log(
        '[App] LLM using real Llama 3.2 1B model (mock mode disabled)'
      );

      if (getIsMockMode()) {
        try {
          await seedMockData({ queryClient, store });
          if (!mounted) {
            return;
          }
          console.log('[App] Initializing mock WebSocket...');
          websocketService.connect('mock-token-for-testing');
        } catch (error) {
          console.error('[App] Failed to seed mock data:', error);
        } finally {
          if (mounted) {
            setIsMockDataReady(true);
          }
        }
        return;
      }

      console.log(
        '[App] Real API mode - WebSocket will connect after authentication'
      );
      if (mounted) {
        setIsMockDataReady(true);
      }
    };

    void initializeApp();

    // Cleanup on unmount
    return () => {
      mounted = false;
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
                  <OfflineBanner />
                  <ToastProvider>
                    <RootNavigator />
                  </ToastProvider>
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
