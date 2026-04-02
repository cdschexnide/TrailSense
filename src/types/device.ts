export interface Device {
  id: string;
  name: string;
  online: boolean;
  batteryPercent?: number;
  battery?: number; // Legacy field
  signalStrength?: string;
  detectionCount?: number;
  latitude?: number; // GPS latitude from device (null if no fix yet)
  longitude?: number; // GPS longitude from device (null if no fix yet)
  lastSeen?: string;
  firmwareVersion?: string;
  firmware?: string; // Legacy field
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
