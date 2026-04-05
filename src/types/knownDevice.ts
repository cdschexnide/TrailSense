export type KnownDeviceCategory = 'family' | 'guests' | 'service' | 'other';

export interface KnownDevice {
  id: string;
  name: string;
  fingerprintHash: string;
  category: KnownDeviceCategory;
  notes?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnownDeviceDTO {
  name: string;
  fingerprintHash: string;
  category: KnownDeviceCategory;
  notes?: string;
  expiresAt?: string;
}
