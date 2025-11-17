import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { apiClient } from '@api/client';

export class NotificationService {
  static async requestPermission() {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    }
    return true; // Android doesn't require permission request
  }

  static async getFCMToken() {
    const token = await messaging().getToken();
    return token;
  }

  static async registerDevice(fcmToken: string) {
    // Send FCM token to backend to associate with user
    await apiClient.post('/devices/fcm-token', { token: fcmToken });
  }

  static onMessage(callback: (message: any) => void) {
    return messaging().onMessage(callback);
  }

  static onBackgroundMessage(callback: (message: any) => void) {
    messaging().setBackgroundMessageHandler(callback);
  }
}
