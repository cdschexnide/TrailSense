import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useAlerts,
  useAlertById,
  useMarkAlertReviewed,
  useDeleteAlert,
} from '@hooks/useAlerts';
import { alertsApi } from '@api/endpoints/alerts';

jest.mock('@api/endpoints/alerts');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'AlertsTestWrapper';
  return Wrapper;
};

describe('useAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch alerts successfully', async () => {
    const mockAlerts = {
      alerts: [
        {
          id: '1',
          deviceId: 'device1',
          type: 'intrusion',
          severity: 'high' as const,
          message: 'Test alert',
          timestamp: '2024-01-01T00:00:00Z',
          reviewed: false,
        },
      ],
      total: 1,
      hasMore: false,
    };

    (alertsApi.getAlerts as jest.Mock).mockResolvedValue(mockAlerts);

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAlerts);
  });

  it('should fetch alerts with filters', async () => {
    const filters = { severity: ['high'], reviewed: false };
    const mockAlerts = {
      alerts: [],
      total: 0,
      hasMore: false,
    };

    (alertsApi.getAlerts as jest.Mock).mockResolvedValue(mockAlerts);

    const { result } = renderHook(() => useAlerts(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(alertsApi.getAlerts).toHaveBeenCalledWith(filters);
  });
});

describe('useAlertById', () => {
  it('should fetch a single alert by id', async () => {
    const mockAlert = {
      id: '1',
      deviceId: 'device1',
      type: 'intrusion',
      severity: 'high' as const,
      message: 'Test alert',
      timestamp: '2024-01-01T00:00:00Z',
      reviewed: false,
    };

    (alertsApi.getAlertById as jest.Mock).mockResolvedValue(mockAlert);

    const { result } = renderHook(() => useAlertById('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAlert);
  });

  it('should not fetch when id is empty', () => {
    const { result } = renderHook(() => useAlertById(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useMarkAlertReviewed', () => {
  it('should mark an alert as reviewed', async () => {
    const mockAlert = {
      id: '1',
      deviceId: 'device1',
      type: 'intrusion',
      severity: 'high' as const,
      message: 'Test alert',
      timestamp: '2024-01-01T00:00:00Z',
      reviewed: true,
      reviewedAt: '2024-01-01T01:00:00Z',
    };

    (alertsApi.markReviewed as jest.Mock).mockResolvedValue(mockAlert);

    const { result } = renderHook(() => useMarkAlertReviewed(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      result.current.mutate('1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(alertsApi.markReviewed).toHaveBeenCalledWith('1');
  });
});

describe('useDeleteAlert', () => {
  it('should delete an alert', async () => {
    (alertsApi.deleteAlert as jest.Mock).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDeleteAlert(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      result.current.mutate('1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(alertsApi.deleteAlert).toHaveBeenCalledWith('1');
  });
});
