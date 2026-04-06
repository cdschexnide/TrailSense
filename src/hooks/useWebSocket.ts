import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { websocketService } from '@api/websocket';
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

    // Handle new alerts
    const handleAlert = (alert: Alert) => {
      // Add new alert to cache
      queryClient.setQueryData<Alert[]>([ALERTS_QUERY_KEY], oldData => {
        if (!oldData) return [alert];
        return [alert, ...oldData];
      });

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: [ALERTS_QUERY_KEY] });
    };

    // Handle device status updates
    const handleDeviceStatus = (status: Partial<Device> & { id: string }) => {
      // Patch individual device cache instantly
      queryClient.setQueryData<Device>(
        [DEVICES_QUERY_KEY, status.id],
        oldData => {
          if (!oldData) return oldData;
          return { ...oldData, ...status };
        }
      );

      // Invalidate all device queries so lists, filtered lists, and unknown
      // devices refetch consistently after each status event.
      queryClient.invalidateQueries({
        queryKey: [DEVICES_QUERY_KEY],
      });
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
      // Invalidate React Query cache for positions
      // This will trigger a refetch on any component using usePositions
      queryClient.invalidateQueries({
        queryKey: [POSITIONS_QUERY_KEY, data.deviceId],
      });
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
