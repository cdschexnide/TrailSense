import { apiClient } from './client';

interface VacationModeSettings {
  enabled: boolean;
  startDate?: Date;
  endDate?: Date;
  sensitivity: 'low' | 'medium' | 'high';
  alertPriority: 'low' | 'medium' | 'high' | 'critical';
  notificationVolume: 'muted' | 'low' | 'medium' | 'max';
}

interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

interface DetectionSettings {
  cellular: boolean;
  wifi: boolean;
  bluetooth: boolean;
  minRSSI: number;
  scanInterval: number;
}

export const settingsApi = {
  async getVacationMode(): Promise<VacationModeSettings> {
    const response = await apiClient.get('/settings/vacation-mode');
    return response.data;
  },

  async updateVacationMode(
    settings: Partial<VacationModeSettings>
  ): Promise<VacationModeSettings> {
    const response = await apiClient.put('/settings/vacation-mode', {
      ...settings,
      startDate: settings.startDate?.toISOString(),
      endDate: settings.endDate?.toISOString(),
    });
    return response.data;
  },

  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await apiClient.get('/settings/notifications');
    return response.data;
  },

  async updateNotificationSettings(
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    const response = await apiClient.put('/settings/notifications', settings);
    return response.data;
  },

  async getDetectionSettings(): Promise<DetectionSettings> {
    const response = await apiClient.get('/settings/detection');
    return response.data;
  },

  async updateDetectionSettings(
    settings: Partial<DetectionSettings>
  ): Promise<DetectionSettings> {
    const response = await apiClient.put('/settings/detection', settings);
    return response.data;
  },

  async resetToDefaults(): Promise<void> {
    await apiClient.post('/settings/reset');
  },

  async exportSettings(): Promise<Blob> {
    const response = await apiClient.get('/settings/export', {
      responseType: 'blob',
    });
    return response.data;
  },

  async importSettings(file: Blob): Promise<void> {
    const formData = new FormData();
    formData.append('settings', file);

    await apiClient.post('/settings/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
