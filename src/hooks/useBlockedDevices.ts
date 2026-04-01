import { useCallback } from 'react';
import { useToast } from '@components/templates';
import { AnalyticsEvents, logEvent } from '@services/analyticsEvents';
import { useAppDispatch, useAppSelector } from '@store/index';
import {
  blockDevice,
  unblockDevice,
} from '@store/slices/blockedDevicesSlice';

export function useBlockedDevices() {
  const dispatch = useAppDispatch();
  const blockedDevices = useAppSelector(
    state => state.blockedDevices?.devices ?? {}
  );
  const { showToast } = useToast();

  const isBlocked = useCallback(
    (macAddress: string) => macAddress in blockedDevices,
    [blockedDevices]
  );

  const block = useCallback(
    (macAddress: string, reason?: string) => {
      dispatch(blockDevice({ macAddress, reason }));
      logEvent(AnalyticsEvents.DEVICE_BLOCKED, { macAddress });
      showToast('Device blocked. Alerts from this device are now hidden.', 'info');
    },
    [dispatch, showToast]
  );

  const unblock = useCallback(
    (macAddress: string) => {
      dispatch(unblockDevice(macAddress));
      showToast('Device unblocked', 'success');
    },
    [dispatch, showToast]
  );

  return {
    blockedDevices,
    blockedCount: Object.keys(blockedDevices).length,
    block,
    unblock,
    isBlocked,
  };
}
