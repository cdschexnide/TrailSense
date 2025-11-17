import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { websocketService } from '@api/websocket';
import { Alert, Device } from '@types';
import { ALERTS_QUERY_KEY } from './api/useAlerts';
import { DEVICES_QUERY_KEY } from './api/useDevices';

export const useWebSocket = (token: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    // Connect WebSocket
    websocketService.connect(token);

    // Handle new alerts
    const handleAlert = (alert: Alert) => {
      // Add new alert to cache
      queryClient.setQueryData<Alert[]>([ALERTS_QUERY_KEY], (oldData) => {
        if (!oldData) return [alert];
        return [alert, ...oldData];
      });

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: [ALERTS_QUERY_KEY] });
    };

    // Handle device status updates
    const handleDeviceStatus = (status: Partial<Device> & { id: string }) => {
      // Update specific device in cache
      queryClient.setQueryData<Device>([DEVICES_QUERY_KEY, status.id], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, ...status };
      });

      // Update device in devices list
      queryClient.setQueryData<Device[]>([DEVICES_QUERY_KEY], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((device) =>
          device.id === status.id ? { ...device, ...status } : device
        );
      });
    };

    // Subscribe to events
    websocketService.on('alert', handleAlert);
    websocketService.on('device-status', handleDeviceStatus);

    // Cleanup on unmount
    return () => {
      websocketService.off('alert', handleAlert);
      websocketService.off('device-status', handleDeviceStatus);
      websocketService.disconnect();
    };
  }, [token, queryClient]);
};
