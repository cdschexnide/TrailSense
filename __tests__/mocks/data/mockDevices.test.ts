import { getMockDevices } from '@/mocks/data/mockDevices';

describe('getMockDevices', () => {
  it('returns 5 devices', () => {
    expect(getMockDevices()).toHaveLength(5);
  });

  it('online devices have lastSeen within 5 minutes of now', () => {
    const devices = getMockDevices();
    const onlineDevices = devices.filter(device => device.online);
    const fiveMinutes = 5 * 60 * 1000;

    onlineDevices.forEach(device => {
      const diff = Date.now() - new Date(device.lastSeen!).getTime();
      expect(diff).toBeLessThan(fiveMinutes);
      expect(diff).toBeGreaterThanOrEqual(0);
    });
  });

  it('offline devices have lastSeen more than 1 day ago', () => {
    const devices = getMockDevices();
    const offlineDevices = devices.filter(device => !device.online);
    const oneDay = 24 * 60 * 60 * 1000;

    offlineDevices.forEach(device => {
      const diff = Date.now() - new Date(device.lastSeen!).getTime();
      expect(diff).toBeGreaterThan(oneDay);
    });
  });

  it('no device has signalStrength "offline"', () => {
    getMockDevices().forEach(device => {
      expect(device.signalStrength).not.toBe('offline');
    });
  });

  it('all devices include metadata as null', () => {
    getMockDevices().forEach(device => {
      expect(device).toHaveProperty('metadata', null);
    });
  });

  it('generates fresh timestamps on each call', () => {
    jest.useFakeTimers();

    jest.setSystemTime(new Date('2026-04-05T12:00:00Z'));
    const first = getMockDevices()[0].lastSeen;

    jest.setSystemTime(new Date('2026-04-05T12:00:05Z'));
    const second = getMockDevices()[0].lastSeen;

    expect(first).not.toBe(second);

    jest.useRealTimers();
  });
});
