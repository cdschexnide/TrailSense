import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, Text } from '@components/atoms';
import { logEvent, AnalyticsEvents } from '@services/analyticsEvents';

export const OfflineBanner: React.FC = () => {
  const insets = useSafeAreaInsets();
  const hasLogged = useRef(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !(
        state.isConnected && state.isInternetReachable !== false
      );
      setIsOffline(offline);

      if (offline && !hasLogged.current) {
        hasLogged.current = true;
        logEvent(AnalyticsEvents.OFFLINE_BANNER_SHOWN);
      }

      if (!offline) {
        hasLogged.current = false;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      <Icon name="cloud-offline-outline" size={14} color="white" />
      <Text variant="caption1" weight="semibold" style={styles.text}>
        Offline - showing cached data
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(107, 107, 78, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 6,
    gap: 6,
  },
  text: {
    color: '#FFFFFF',
  },
});
