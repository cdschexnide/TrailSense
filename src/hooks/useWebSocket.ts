import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { websocketService } from '@api/websocket';
import { isDemoOrMockMode } from '@/config/demoModeRuntime';
import { Alert, Device } from '@types';
import { ALERTS_QUERY_KEY } from './api/useAlerts';
import { DEVICES_QUERY_KEY } from './api/useDevices';
import { POSITIONS_QUERY_KEY } from './api/usePositions';

export const useWebSocket = (token: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    // Connect WebSocket
    websocketService.connect(token);

    // In mock/demo mode, skip invalidation — the mock adapter returns
    // seeded data which would overwrite the WebSocket-appended updates,
    // causing a visible glitch as the UI snaps back to the original state.
    const skipInvalidation = isDemoOrMockMode();

    // Handle new alerts
    const handleAlert = (alert: Alert) => {
      // Add new alert to cache
      queryClient.setQueryData<Alert[]>([ALERTS_QUERY_KEY], oldData => {
        if (!oldData) return [alert];
        return [alert, ...oldData];
      });

      // Also update the unfiltered key so usePropertyStatus picks it up
      queryClient.setQueryData<Alert[]>(
        [ALERTS_QUERY_KEY, undefined],
        oldData => {
          if (!oldData) return [alert];
          return [alert, ...oldData];
        }
      );

      if (!skipInvalidation) {
        queryClient.invalidateQueries({ queryKey: [ALERTS_QUERY_KEY] });
      }
    };

    // Handle device status updates
    const handleDeviceStatus = (status: Partial<Device> & { id: string }) => {
      // Patch individual device cache
      queryClient.setQueryData<Device>(
        [DEVICES_QUERY_KEY, status.id],
        oldData => {
          if (!oldData) return oldData;
          return { ...oldData, ...status };
        }
      );

      // Patch the device list cache directly
      queryClient.setQueryData<Device[]>([DEVICES_QUERY_KEY], oldData => {
        if (!oldData) return oldData;
        return oldData.map(d => (d.id === status.id ? { ...d, ...status } : d));
      });

      if (!skipInvalidation) {
        queryClient.invalidateQueries({
          queryKey: [DEVICES_QUERY_KEY],
        });
      }
    };

    // Handle positions-updated event
    const handlePositionsUpdated = (data: {
      deviceId: string;
      positions: any[];
    }) => {
      console.log(
        '[WebSocket] Positions updated:',
        data.deviceId,
        data.positions.length
      );

      if (skipInvalidation) {
        // Directly update the positions cache
        queryClient.setQueryData([POSITIONS_QUERY_KEY, data.deviceId], {
          positions: data.positions,
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: [POSITIONS_QUERY_KEY, data.deviceId],
        });
      }
    };

    // Subscribe to events
    websocketService.on('alert', handleAlert);
    websocketService.on('device-status', handleDeviceStatus);
    websocketService.on('positions-updated', handlePositionsUpdated);

    // Cleanup on unmount
    return () => {
      websocketService.off('alert', handleAlert);
      websocketService.off('device-status', handleDeviceStatus);
      websocketService.off('positions-updated', handlePositionsUpdated);
      websocketService.disconnect();
    };
  }, [token, queryClient]);
};
