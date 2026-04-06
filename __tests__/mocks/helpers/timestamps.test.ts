import {
  daysAgo,
  hoursAgo,
  minutesAgo,
  now,
  todayAt,
} from '@/mocks/helpers/timestamps';

describe('timestamp helpers', () => {
  it('now() returns the current ISO string', () => {
    const before = Date.now();
    const result = now();
    const after = Date.now();
    const timestamp = new Date(result).getTime();

    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('minutesAgo(5) returns a time about 5 minutes in the past', () => {
    const result = minutesAgo(5);
    const diff = Date.now() - new Date(result).getTime();

    expect(diff).toBeGreaterThanOrEqual(5 * 60 * 1000 - 1000);
    expect(diff).toBeLessThanOrEqual(5 * 60 * 1000 + 1000);
  });

  it('hoursAgo(2) returns a time about 2 hours in the past', () => {
    const result = hoursAgo(2);
    const diff = Date.now() - new Date(result).getTime();

    expect(diff).toBeGreaterThanOrEqual(2 * 60 * 60 * 1000 - 1000);
    expect(diff).toBeLessThanOrEqual(2 * 60 * 60 * 1000 + 1000);
  });

  it('daysAgo(3) returns a time about 3 days in the past', () => {
    const result = daysAgo(3);
    const diff = Date.now() - new Date(result).getTime();

    expect(diff).toBeGreaterThanOrEqual(3 * 24 * 60 * 60 * 1000 - 1000);
    expect(diff).toBeLessThanOrEqual(3 * 24 * 60 * 60 * 1000 + 1000);
  });

  it('todayAt(10, 30) returns today at 10:30 local time', () => {
    const result = todayAt(10, 30);
    const date = new Date(result);
    const today = new Date();

    expect(date.getFullYear()).toBe(today.getFullYear());
    expect(date.getMonth()).toBe(today.getMonth());
    expect(date.getDate()).toBe(today.getDate());
    expect(date.getHours()).toBe(10);
    expect(date.getMinutes()).toBe(30);
  });

  it('all helpers return valid ISO 8601 strings', () => {
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

    expect(now()).toMatch(isoRegex);
    expect(minutesAgo(1)).toMatch(isoRegex);
    expect(hoursAgo(1)).toMatch(isoRegex);
    expect(daysAgo(1)).toMatch(isoRegex);
    expect(todayAt(12, 0)).toMatch(isoRegex);
  });
});
