export interface Device {
  id: string;
  name: string;
  online: boolean;
  batteryPercent?: number;
  battery?: number; // Legacy field
  signalStrength?: string;
  alertCount?: number;
  latitude?: number; // GPS latitude from device (null if no fix yet)
  longitude?: number; // GPS longitude from device (null if no fix yet)
  lastSeen?: string;
  firmwareVersion?: string;
  firmware?: string; // Legacy field
  uptimeSeconds?: number; // Seconds since last boot, from heartbeat
  lastBootAt?: string; // ISO 8601 timestamp of last boot
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeviceDTO {
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  deviceKey?: string;
}
