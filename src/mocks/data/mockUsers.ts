import type { User, AuthTokens } from '@/types/auth';

export const mockUsers: User[] = [
  {
    id: 'user-001',
    email: 'admin@trailsense.com',
    name: 'John Anderson',
    role: 'admin',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-11-16T08:30:00Z',
  },
  {
    id: 'user-002',
    email: 'user@trailsense.com',
    name: 'Sarah Mitchell',
    role: 'user',
    createdAt: '2025-02-20T14:30:00Z',
    updatedAt: '2025-11-15T18:45:00Z',
  },
];

export const mockAdminUser = mockUsers[0];
export const mockRegularUser = mockUsers[1];

export const mockAuthTokens: AuthTokens = {
  accessToken: 'mock-access-token-' + Date.now(),
  refreshToken: 'mock-refresh-token-' + Date.now(),
};

// Mock login credentials for testing
export const mockCredentials = {
  admin: {
    email: 'admin@trailsense.com',
    password: 'admin123',
  },
  user: {
    email: 'user@trailsense.com',
    password: 'user123',
  },
};
