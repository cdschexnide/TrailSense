export type WhitelistCategory = 'family' | 'guests' | 'service' | 'other';

export interface WhitelistEntry {
  id: string;
  name: string;
  macAddress: string;
  category: WhitelistCategory;
  notes?: string;
  expiresAt?: string; // For temporary whitelist entries
  createdAt: string;
  updatedAt: string;
}

export interface CreateWhitelistDTO {
  name: string;
  macAddress: string;
  category: WhitelistCategory;
  notes?: string;
  expiresAt?: string;
}
