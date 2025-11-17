export interface Device {
  id: string;
  name: string;
  online: boolean;
  battery?: number;
  signalStrength?: string;
  detectionCount?: number;
  location: {
    latitude: number;
    longitude: number;
  };
  lastSeen?: string;
  firmware?: string;
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
