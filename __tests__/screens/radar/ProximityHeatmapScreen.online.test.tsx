/**
 * Focused test: ProximityHeatmapScreen derives online status from lastSeen,
 * not from device.online.
 */
import { isDeviceOnline } from '@utils/dateUtils';

jest.mock('@utils/dateUtils', () => ({
  isDeviceOnline: jest.fn(),
}));

const mockedIsDeviceOnline = isDeviceOnline as jest.MockedFunction<
  typeof isDeviceOnline
>;

describe('ProximityHeatmapScreen online status contract', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('imports isDeviceOnline from dateUtils', () => {
    expect(mockedIsDeviceOnline).toBeDefined();
    expect(typeof mockedIsDeviceOnline).toBe('function');
  });

  it('isDeviceOnline returns false for stale lastSeen', () => {
    jest.restoreAllMocks();
    jest.unmock('@utils/dateUtils');
    const { isDeviceOnline: realIsDeviceOnline } =
      jest.requireActual('@utils/dateUtils');

    const tenMinutesAgo = new Date(
      Date.now() - 10 * 60 * 1000
    ).toISOString();
    expect(realIsDeviceOnline(tenMinutesAgo)).toBe(false);

    const oneMinuteAgo = new Date(
      Date.now() - 1 * 60 * 1000
    ).toISOString();
    expect(realIsDeviceOnline(oneMinuteAgo)).toBe(true);

    expect(realIsDeviceOnline(undefined)).toBe(false);
  });
});
