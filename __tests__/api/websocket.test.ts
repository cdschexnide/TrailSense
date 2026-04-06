import { mapDeviceStatusEvent } from '@api/websocket';

describe('mapDeviceStatusEvent', () => {
  it('maps detectionCount to alertCount when alertCount is absent', () => {
    const raw = { id: 'dev-1', online: true, detectionCount: 42 };

    const mapped = mapDeviceStatusEvent(raw);

    expect(mapped.alertCount).toBe(42);
    expect(mapped).not.toHaveProperty('detectionCount');
  });

  it('passes through when alertCount is already present', () => {
    const raw = { id: 'dev-1', online: true, alertCount: 10 };

    const mapped = mapDeviceStatusEvent(raw);

    expect(mapped.alertCount).toBe(10);
    expect(mapped).not.toHaveProperty('detectionCount');
  });

  it('passes through when neither field is present', () => {
    const raw = { id: 'dev-1', online: true };

    const mapped = mapDeviceStatusEvent(raw);

    expect(mapped.alertCount).toBeUndefined();
    expect(mapped).not.toHaveProperty('detectionCount');
  });

  it('prefers existing alertCount and strips detectionCount', () => {
    const raw = {
      id: 'dev-1',
      online: true,
      alertCount: 10,
      detectionCount: 42,
    };

    const mapped = mapDeviceStatusEvent(raw);

    expect(mapped.alertCount).toBe(10);
    expect(mapped).not.toHaveProperty('detectionCount');
  });

  it('preserves all other fields', () => {
    const raw = {
      id: 'dev-1',
      online: true,
      detectionCount: 5,
      name: 'North Gate',
      battery: 87,
      lastSeen: '2026-04-05T12:00:00Z',
    };

    const mapped = mapDeviceStatusEvent(raw);

    expect(mapped).toEqual({
      id: 'dev-1',
      online: true,
      alertCount: 5,
      name: 'North Gate',
      battery: 87,
      lastSeen: '2026-04-05T12:00:00Z',
    });
  });
});
