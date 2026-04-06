import { mockWebSocketService } from '@/mocks/mockWebSocket';

let unsubscribers: Array<() => void> = [];

function captureEvent<T>(event: string) {
  let payload: T | undefined;
  const handler = (data: T) => {
    payload = data;
  };

  mockWebSocketService.on(event, handler);
  const unsubscribe = () => mockWebSocketService.off(event, handler);
  unsubscribers.push(unsubscribe);

  return {
    getPayload: () => payload,
    unsubscribe,
  };
}

describe('mockWebSocketService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    unsubscribers = [];
  });

  afterEach(() => {
    unsubscribers.forEach(unsubscribe => unsubscribe());
    unsubscribers = [];
    mockWebSocketService.disconnect();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('emits device-status with raw battery plus status fields', () => {
    const capture = captureEvent<any>('device-status');

    mockWebSocketService.connect('test-token');
    jest.advanceTimersByTime(15000);

    const status = capture.getPayload();
    capture.unsubscribe();

    expect(status).toBeDefined();
    expect(status).toHaveProperty('id');
    expect(status).toHaveProperty('signalStrength');
    expect(status).toHaveProperty('lastBootAt');
    expect(status).toHaveProperty('latitude');
    expect(status).toHaveProperty('longitude');
    expect(status).toHaveProperty('battery');
  });

  it('emits alert with backend-format fingerprint and createdAt', () => {
    const capture = captureEvent<any>('alert');

    mockWebSocketService.connect('test-token');
    jest.advanceTimersByTime(5000);

    const alert = capture.getPayload();
    capture.unsubscribe();

    expect(alert).toBeDefined();
    expect(alert.fingerprintHash).toMatch(/^[wcb]_[a-f0-9]{8}$/);
    expect(alert).toHaveProperty('createdAt');
  });

  it('emits positions-updated with the expected payload shape', () => {
    const capture = captureEvent<any>('positions-updated');

    mockWebSocketService.connect('test-token');
    jest.advanceTimersByTime(10000);

    const data = capture.getPayload();
    capture.unsubscribe();

    expect(data).toBeDefined();
    expect(data).toHaveProperty('deviceId');
    expect(Array.isArray(data.positions)).toBe(true);
    expect(data.positions.length).toBeGreaterThan(0);

    const position = data.positions[0];
    expect(position).toHaveProperty('id');
    expect(position).toHaveProperty('fingerprintHash');
    expect(position).toHaveProperty('signalType');
    expect(position).toHaveProperty('latitude');
    expect(position).toHaveProperty('longitude');
    expect(position).toHaveProperty('accuracyMeters');
    expect(position).toHaveProperty('confidence');
    expect(position).toHaveProperty('measurementCount');
    expect(position).toHaveProperty('updatedAt');
    expect(position.fingerprintHash).toMatch(/^[wcb]_[a-f0-9]{8}$/);
  });
});
