import type { KnownDevice } from '@types';

export const mockKnownDevices: KnownDevice[] = [
  // Family members
  {
    id: 'known-001',
    name: "John's iPhone",
    fingerprintHash: 'fp-family-john',
    category: 'family',
    notes: 'Primary owner phone',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'known-002',
    name: "Sarah's iPhone",
    fingerprintHash: 'fp-family-sarah',
    category: 'family',
    notes: 'Spouse phone',
    createdAt: '2025-01-15T10:05:00Z',
    updatedAt: '2025-01-15T10:05:00Z',
  },
  {
    id: 'known-003',
    name: 'Family iPad',
    fingerprintHash: 'fp-family-ipad',
    category: 'family',
    createdAt: '2025-01-20T14:00:00Z',
    updatedAt: '2025-01-20T14:00:00Z',
  },

  // Guests (some with expiration)
  {
    id: 'known-004',
    name: 'Mike Thompson',
    fingerprintHash: 'fp-guest-mike',
    category: 'guests',
    notes: 'Weekend guest - Nov 15-17',
    expiresAt: '2025-11-17T23:59:59Z',
    createdAt: '2025-11-14T16:00:00Z',
    updatedAt: '2025-11-14T16:00:00Z',
  },
  {
    id: 'known-005',
    name: 'Emily Davis',
    fingerprintHash: 'fp-guest-emily',
    category: 'guests',
    notes: 'Holiday visitor',
    expiresAt: '2025-12-01T23:59:59Z',
    createdAt: '2025-11-10T12:00:00Z',
    updatedAt: '2025-11-10T12:00:00Z',
  },
  {
    id: 'known-006',
    name: 'Robert Chen - Expired',
    fingerprintHash: 'fp-guest-robert',
    category: 'guests',
    notes: 'Thanksgiving weekend',
    expiresAt: '2025-11-10T23:59:59Z', // Expired
    createdAt: '2025-11-08T10:00:00Z',
    updatedAt: '2025-11-08T10:00:00Z',
  },

  // Service personnel
  {
    id: 'known-007',
    name: 'Property Manager - Tom Wilson',
    fingerprintHash: 'fp-service-manager',
    category: 'service',
    notes: 'Monthly property inspections',
    createdAt: '2025-02-01T09:00:00Z',
    updatedAt: '2025-02-01T09:00:00Z',
  },
  {
    id: 'known-008',
    name: 'Landscaping Crew',
    fingerprintHash: 'fp-service-landscaping',
    category: 'service',
    notes: 'Weekly lawn maintenance - Thursdays',
    createdAt: '2025-03-15T11:00:00Z',
    updatedAt: '2025-03-15T11:00:00Z',
  },

  // Other
  {
    id: 'known-009',
    name: 'Wildlife Camera',
    fingerprintHash: 'fp-other-trailcam',
    category: 'other',
    notes: 'Trail camera with WiFi - North sector',
    createdAt: '2025-04-10T08:00:00Z',
    updatedAt: '2025-04-10T08:00:00Z',
  },
  {
    id: 'known-010',
    name: 'Weather Station',
    fingerprintHash: 'fp-other-weather',
    category: 'other',
    notes: 'IoT weather monitoring device',
    createdAt: '2025-05-01T15:00:00Z',
    updatedAt: '2025-05-01T15:00:00Z',
  },
];

// Filtered collections
export const mockFamilyKnownDevices = mockKnownDevices.filter(
  w => w.category === 'family'
);
export const mockGuestsKnownDevices = mockKnownDevices.filter(
  w => w.category === 'guests'
);
export const mockServiceKnownDevices = mockKnownDevices.filter(
  w => w.category === 'service'
);
export const mockOtherKnownDevices = mockKnownDevices.filter(
  w => w.category === 'other'
);

export const mockActiveKnownDevices = mockKnownDevices.filter(w => {
  if (!w.expiresAt) return true;
  return new Date(w.expiresAt) > new Date();
});

export const mockExpiredKnownDevices = mockKnownDevices.filter(w => {
  if (!w.expiresAt) return false;
  return new Date(w.expiresAt) <= new Date();
});
