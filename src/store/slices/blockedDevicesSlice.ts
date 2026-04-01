import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BlockedDevice {
  macAddress: string;
  blockedAt: string;
  reason?: string;
}

export interface BlockedDevicesState {
  devices: Record<string, BlockedDevice>;
}

const initialState: BlockedDevicesState = {
  devices: {},
};

const blockedDevicesSlice = createSlice({
  name: 'blockedDevices',
  initialState,
  reducers: {
    blockDevice: (
      state,
      action: PayloadAction<{ macAddress: string; reason?: string }>
    ) => {
      state.devices[action.payload.macAddress] = {
        macAddress: action.payload.macAddress,
        blockedAt: new Date().toISOString(),
        reason: action.payload.reason,
      };
    },
    unblockDevice: (state, action: PayloadAction<string>) => {
      delete state.devices[action.payload];
    },
  },
});

export const { blockDevice, unblockDevice } = blockedDevicesSlice.actions;

/**
 * Check if a MAC address is blocked.
 * NOTE: Blocking is UI-only suppression. Server-generated push notifications
 * will still arrive for blocked devices. Backend sync for push suppression
 * is deferred to a future workstream.
 */
export const isDeviceBlocked = (
  state: { blockedDevices: BlockedDevicesState },
  macAddress: string
): boolean => macAddress in state.blockedDevices.devices;

export default blockedDevicesSlice.reducer;
