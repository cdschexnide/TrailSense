import { settingsApi } from '@api/settings';

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

    // TODO: Re-enable when expo-notifications is available with paid Apple Developer account
    // Schedule local notification reminders
    console.log('Vacation mode enabled:', startDate, '-', endDate);
  }

  static async disableVacationMode(): Promise<void> {
    await settingsApi.updateVacationMode({ enabled: false });

    // TODO: Re-enable when expo-notifications is available
    console.log('Vacation mode disabled');
  }

  static async getVacationModeStatus(): Promise<VacationModeSettings> {
    return await settingsApi.getVacationMode();
  }

  static async updateVacationModeSettings(
    settings: Partial<VacationModeSettings>
  ): Promise<void> {
    await settingsApi.updateVacationMode(settings);
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
