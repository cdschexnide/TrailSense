import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useWhitelist,
  useAddToWhitelist,
  useRemoveFromWhitelist,
  useUpdateWhitelistEntry,
} from '@hooks/useWhitelist';
import { whitelistApi } from '@api/endpoints/whitelist';

jest.mock('@api/endpoints/whitelist');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useWhitelist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch whitelist successfully', async () => {
    const mockWhitelist = {
      entries: [
        {
          id: '1',
          deviceId: 'device1',
          deviceName: 'Test Device',
          reason: 'Authorized',
          addedBy: 'user1',
          addedAt: '2024-01-01T00:00:00Z',
          active: true,
        },
      ],
      total: 1,
      hasMore: false,
    };

    (whitelistApi.getWhitelist as jest.Mock).mockResolvedValue(mockWhitelist);

    const { result } = renderHook(() => useWhitelist(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockWhitelist);
  });

  it('should fetch whitelist with filters', async () => {
    const filters = { active: true, deviceId: 'device1' };
    const mockWhitelist = {
      entries: [],
      total: 0,
      hasMore: false,
    };

    (whitelistApi.getWhitelist as jest.Mock).mockResolvedValue(mockWhitelist);

    const { result } = renderHook(() => useWhitelist(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(whitelistApi.getWhitelist).toHaveBeenCalledWith(filters);
  });
});

describe('useAddToWhitelist', () => {
  it('should add device to whitelist', async () => {
    const mockEntry = {
      id: '1',
      deviceId: 'device1',
      deviceName: 'Test Device',
      reason: 'Authorized',
      addedBy: 'user1',
      addedAt: '2024-01-01T00:00:00Z',
      active: true,
    };

    (whitelistApi.addToWhitelist as jest.Mock).mockResolvedValue(mockEntry);

    const { result } = renderHook(() => useAddToWhitelist(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      result.current.mutate({
        deviceId: 'device1',
        reason: 'Authorized',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(whitelistApi.addToWhitelist).toHaveBeenCalledWith({
      deviceId: 'device1',
      reason: 'Authorized',
    });
  });
});

describe('useRemoveFromWhitelist', () => {
  it('should remove device from whitelist', async () => {
    (whitelistApi.removeFromWhitelist as jest.Mock).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() => useRemoveFromWhitelist(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      result.current.mutate('1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(whitelistApi.removeFromWhitelist).toHaveBeenCalledWith('1');
  });
});

describe('useUpdateWhitelistEntry', () => {
  it('should update a whitelist entry', async () => {
    const mockEntry = {
      id: '1',
      deviceId: 'device1',
      deviceName: 'Test Device',
      reason: 'Updated reason',
      addedBy: 'user1',
      addedAt: '2024-01-01T00:00:00Z',
      active: true,
    };

    (whitelistApi.updateWhitelistEntry as jest.Mock).mockResolvedValue(
      mockEntry
    );

    const { result } = renderHook(() => useUpdateWhitelistEntry(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      result.current.mutate({
        id: '1',
        payload: { reason: 'Updated reason' },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(whitelistApi.updateWhitelistEntry).toHaveBeenCalledWith('1', {
      reason: 'Updated reason',
    });
  });
});
