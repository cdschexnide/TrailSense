import { Linking } from 'react-native';
import { getMessagingModule, RemoteMessage } from './firebaseMessaging';

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
    const messaging = getMessagingModule();
    if (!messaging) {
      return null;
    }

    const remoteMessage = await messaging.getInitialNotification();
    if (remoteMessage) {
      return this.parseNotificationData(remoteMessage.data);
    }
    return null;
  }

  /**
   * Handle notification tap when app is in background/foreground
   */
  static onNotificationOpenedApp(callback: (data: NotificationData) => void) {
    const messaging = getMessagingModule();
    if (!messaging) {
      return () => undefined;
    }

    return messaging.onNotificationOpenedApp((remoteMessage: RemoteMessage) => {
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
  private static parseNotificationData(
    data?: RemoteMessage['data']
  ): NotificationData | null {
    if (!data) return null;

    return {
      type:
        data.type === 'alert' || data.type === 'device' ? data.type : 'general',
      id: data.id,
      screen: data.screen,
    };
  }

  /**
   * Navigate to screen based on notification data
   */
  static getNavigationRoute(
    data: NotificationData
  ): { screen: string; params?: Record<string, string | undefined> } | null {
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
