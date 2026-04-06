/** Returns current time as an ISO 8601 string. */
export function now(): string {
  return new Date().toISOString();
}

/** Returns an ISO string for `n` minutes before now. */
export function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 1000).toISOString();
}

/** Returns an ISO string for `n` hours before now. */
export function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
}

/** Returns an ISO string for `n` days before now. */
export function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

/** Returns an ISO string for today at the given local hour and minute. */
export function todayAt(hour: number, minute: number): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}
