import { apiClient } from '@api/client';
import { devicesApi } from '@api/endpoints/devices';

jest.mock('@api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = apiClient.get as jest.Mock;
const mockPatch = apiClient.patch as jest.Mock;

describe('devicesApi mapper', () => {
  afterEach(() => jest.resetAllMocks());

  it('remaps backend detectionCount to frontend alertCount', async () => {
    mockGet.mockResolvedValue({
      data: [
        {
          id: 'd1',
          name: 'North Gate',
          detectionCount: 42,
          createdAt: '',
          updatedAt: '',
        },
      ],
    });

    const result = await devicesApi.getDevices();

    expect(result[0].alertCount).toBe(42);
    expect(result[0]).not.toHaveProperty('detectionCount');
  });

  it('passes through frontend-shaped alertCount without zeroing it', async () => {
    mockGet.mockResolvedValue({
      data: [
        {
          id: 'd1',
          name: 'North Gate',
          alertCount: 99,
          createdAt: '',
          updatedAt: '',
        },
      ],
    });

    const result = await devicesApi.getDevices();

    expect(result[0].alertCount).toBe(99);
  });

  it('remaps alertCount to detectionCount on PATCH request', async () => {
    mockPatch.mockResolvedValue({
      data: {
        id: 'd1',
        name: 'North Gate',
        detectionCount: 10,
        createdAt: '',
        updatedAt: '',
      },
    });

    const result = await devicesApi.updateDevice('d1', { alertCount: 10 });

    const requestBody = mockPatch.mock.calls[0][1] as Record<string, unknown>;
    expect(requestBody).toMatchObject({ detectionCount: 10 });
    expect(requestBody).not.toHaveProperty('alertCount');

    expect(result.alertCount).toBe(10);
    expect(result).not.toHaveProperty('detectionCount');
  });

  it('maps single device response in getDeviceById', async () => {
    mockGet.mockResolvedValue({
      data: {
        id: 'd1',
        name: 'North Gate',
        detectionCount: 7,
        createdAt: '',
        updatedAt: '',
      },
    });

    const result = await devicesApi.getDeviceById('d1');

    expect(result.alertCount).toBe(7);
    expect(result).not.toHaveProperty('detectionCount');
  });
});
