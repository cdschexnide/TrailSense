import { settingsApi } from '@api/settings';
import * as Notifications from 'expo-notifications';

interface VacationModeSettings {
  enabled: boolean;
  startDate?: Date;
  endDate?: Date;
  sensitivity: 'low' | 'medium' | 'high';
  alertPriority: 'low' | 'medium' | 'high' | 'critical';
  notificationVolume: 'muted' | 'low' | 'medium' | 'max';
}

export class VacationModeService {
  static async enableVacationMode(
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    await settingsApi.updateVacationMode({
      enabled: true,
      startDate,
      endDate,
      sensitivity: 'high', // Increased sensitivity
      alertPriority: 'critical', // All alerts are critical
      notificationVolume: 'max',
    });

    // Schedule local notification reminders
    await this.scheduleNotification({
      title: 'Vacation Mode Active',
      body: 'TrailSense is monitoring your property with heightened sensitivity',
      date: startDate,
    });

    // Schedule reminder notification for end date
    await this.scheduleNotification({
      title: 'Vacation Mode Ending',
      body: 'Your vacation mode will end today. Welcome back!',
      date: endDate,
    });
  }

  static async disableVacationMode(): Promise<void> {
    await settingsApi.updateVacationMode({ enabled: false });

    // Cancel any scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  static async getVacationModeStatus(): Promise<VacationModeSettings> {
    return await settingsApi.getVacationMode();
  }

  static async updateVacationModeSettings(
    settings: Partial<VacationModeSettings>
  ): Promise<void> {
    await settingsApi.updateVacationMode(settings);
  }

  private static async scheduleNotification(params: {
    title: string;
    body: string;
    date: Date;
  }): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        date: params.date,
      },
    });
  }

  /**
   * Check if vacation mode should be auto-enabled based on calendar events
   */
  static async checkCalendarEvents(): Promise<void> {
    // This would integrate with device calendar
    // For now, this is a placeholder for future implementation
    console.log('Checking calendar for vacation events...');
  }

  /**
   * Check if user has left their home geofence
   */
  static async checkGeofenceStatus(): Promise<boolean> {
    // This would check if user is outside their home geofence
    // Placeholder for future implementation
    return false;
  }

  /**
   * Auto-enable vacation mode based on triggers
   */
  static async autoEnableIfNeeded(): Promise<void> {
    const isOutsideGeofence = await this.checkGeofenceStatus();

    if (isOutsideGeofence) {
      const now = new Date();
      const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await this.enableVacationMode(now, endDate);
    }
  }
}
