import React, { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
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
import { initDemoMode, isDemoMode } from '@/config/demoMode';
import { applyDemoModeConfig } from '@/config/demoModeRuntime';
import { setMockAdapterQueryClient } from '@api/client';
import { useAuth } from '@hooks/useAuth';
import { llmLogger } from '@/utils/llmLogger';

// Initialize react-native-executorch with Expo resource fetcher adapter
if (Platform.OS === 'android' || Platform.OS === 'ios') {
  try {
    const { initExecutorch } = require('react-native-executorch');
    const {
      ExpoResourceFetcher,
    } = require('react-native-executorch-expo-resource-fetcher');
    initExecutorch({ resourceFetcher: ExpoResourceFetcher });
    llmLogger.info(
      'react-native-executorch initialized with Expo resource fetcher',
      {
        platform: Platform.OS,
      }
    );
  } catch (error) {
    llmLogger.warn('Failed to initialize react-native-executorch', error);
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
      llmLogger.info('LLM using configured on-device model runtime');

      if (isDemoMode()) {
        llmLogger.info('Persisted demo session detected');
        applyDemoModeConfig(queryClient);
        try {
          await seedMockData({ queryClient, store });
        } catch (error) {
          console.error('[App] Failed to seed mock data on demo restore:', error);
        }
        websocketService.connect('mock-token-for-testing');
        if (mounted) {
          setIsMockDataReady(true);
        }
        return;
      }

      if (getIsMockMode()) {
        try {
          setMockAdapterQueryClient(queryClient);
          await seedMockData({ queryClient, store });
          if (!mounted) {
            return;
          }
          llmLogger.info('Initializing mock WebSocket');
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

      llmLogger.info(
        'Real API mode enabled; WebSocket connects after authentication'
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
  // Hide splash screen once app is ready
  useEffect(() => {
    if (isMockDataReady) {
      SplashScreen.hideAsync();
    }
  }, [isMockDataReady]);

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
              onBeforeLift={() => {
                console.log('[App] PersistGate rehydrated');
              }}
              persistor={persistor}
            >
              <QueryClientProvider client={queryClient}>
                <AuthLifecycle />
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

function AuthLifecycle() {
  useAuth();
  return null;
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
