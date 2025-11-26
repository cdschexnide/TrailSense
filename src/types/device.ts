export interface Device {
  id: string;
  name: string;
  online: boolean;
  batteryPercent?: number;
  battery?: number; // Legacy field
  signalStrength?: string;
  detectionCount?: number;
  latitude: number;
  longitude: number;
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
