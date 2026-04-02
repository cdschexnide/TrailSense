import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NotificationService } from '@services/notificationService';

export const useNotifications = () => {
  const navigation = useNavigation();

  useEffect(() => {
    let unsubscribeForeground: (() => void) | undefined;

    const setupNotifications = async () => {
      // Request notification permissions
      const hasPermission = await NotificationService.requestPermission();

      if (!hasPermission) {
        return;
      }

      // Get FCM token
      const fcmToken = await NotificationService.getFCMToken();

      // Register device with backend
      await NotificationService.registerDevice(fcmToken);

      // Handle foreground notifications
      unsubscribeForeground = NotificationService.onMessage(async () => {
        // Show local notification or update UI
        // You can use expo-notifications here if needed
      });

      // Handle background notifications
      NotificationService.onBackgroundMessage(async () => {});
    };

    setupNotifications().catch(console.error);

    return () => {
      if (unsubscribeForeground) {
        unsubscribeForeground();
      }
    };
  }, [navigation]);
};
