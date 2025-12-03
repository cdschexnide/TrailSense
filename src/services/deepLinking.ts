import messaging from '@react-native-firebase/messaging';
import { Linking } from 'react-native';

export interface NotificationData {
  type: 'alert' | 'device' | 'general';
  id?: string;
  screen?: string;
}

export class DeepLinkingService {
  /**
   * Handle initial notification when app is opened from quit state
   */
  static async getInitialNotification() {
    const remoteMessage = await messaging().getInitialNotification();
    if (remoteMessage) {
      return this.parseNotificationData(remoteMessage.data);
    }
    return null;
  }

  /**
   * Handle notification tap when app is in background/foreground
   */
  static onNotificationOpenedApp(callback: (data: NotificationData) => void) {
    return messaging().onNotificationOpenedApp(remoteMessage => {
      const data = this.parseNotificationData(remoteMessage.data);
      if (data) {
        callback(data);
      }
    });
  }

  /**
   * Handle deep links from other sources (SMS, email, etc.)
   */
  static async getInitialURL() {
    return await Linking.getInitialURL();
  }

  /**
   * Listen for deep link events
   */
  static addEventListener(callback: (url: string) => void) {
    return Linking.addEventListener('url', ({ url }) => callback(url));
  }

  /**
   * Parse notification data
   */
  private static parseNotificationData(data: any): NotificationData | null {
    if (!data) return null;

    return {
      type: data.type || 'general',
      id: data.id,
      screen: data.screen,
    };
  }

  /**
   * Navigate to screen based on notification data
   */
  static getNavigationRoute(
    data: NotificationData
  ): { screen: string; params?: any } | null {
    switch (data.type) {
      case 'alert':
        return {
          screen: 'AlertDetail',
          params: { alertId: data.id },
        };
      case 'device':
        return {
          screen: 'DeviceDetail',
          params: { deviceId: data.id },
        };
      default:
        if (data.screen) {
          return { screen: data.screen };
        }
        return null;
    }
  }
}
