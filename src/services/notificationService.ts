import { Platform } from 'react-native';
import { apiClient } from '@api/client';
import { getMessagingModule, RemoteMessage } from './firebaseMessaging';

export class NotificationService {
  static async requestPermission() {
    const messaging = getMessagingModule();
    if (!messaging) {
      return false;
    }

    if (Platform.OS === 'ios') {
      const authStatus = await messaging.requestPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    }
    return true; // Android doesn't require permission request
  }

  static async getFCMToken() {
    const messaging = getMessagingModule();
    if (!messaging) {
      return '';
    }

    const token = await messaging.getToken();
    return token;
  }

  static async registerDevice(fcmToken: string) {
    if (!fcmToken) {
      return;
    }

    // Send FCM token to backend to associate with user
    await apiClient.post('/devices/fcm-token', { token: fcmToken });
  }

  static onMessage(callback: (message: RemoteMessage) => void) {
    const messaging = getMessagingModule();
    if (!messaging) {
      return () => undefined;
    }

    return messaging.onMessage(callback);
  }

  static onBackgroundMessage(
    callback: (message: RemoteMessage) => Promise<void>
  ) {
    const messaging = getMessagingModule();
    if (!messaging) {
      return;
    }

    messaging.setBackgroundMessageHandler(callback);
  }
}
