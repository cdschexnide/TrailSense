import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Format a timestamp string to a human-readable format
 * @param timestamp - ISO timestamp string
 * @param formatString - Optional date-fns format string (default: 'MMM d, yyyy h:mm a')
 * @returns Formatted date string
 */
export const formatTimestamp = (
  timestamp: string | undefined | null,
  formatString: string = 'MMM d, yyyy h:mm a'
): string => {
  if (!timestamp) return '--';
  try {
    const date = parseISO(timestamp);
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return timestamp;
  }
};

/**
 * Format a timestamp as relative time (e.g., "2 hours ago")
 * @param timestamp - ISO timestamp string
 * @returns Relative time string
 */
export const formatRelativeTime = (timestamp: string): string => {
  try {
    const date = parseISO(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return timestamp;
  }
};

/**
 * Format a date to a short format (e.g., "Jan 15, 2024")
 * @param timestamp - ISO timestamp string
 * @returns Short formatted date string
 */
export const formatShortDate = (timestamp: string): string => {
  return formatTimestamp(timestamp, 'MMM d, yyyy');
};

/**
 * Format a time only (e.g., "3:45 PM")
 * @param timestamp - ISO timestamp string
 * @returns Time string
 */
export const formatTime = (timestamp: string): string => {
  return formatTimestamp(timestamp, 'h:mm a');
};

/**
 * Threshold for considering a device offline (5 minutes)
 */
export const DEVICE_OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Calculate if a device is online based on lastSeen timestamp
 * Device is online if lastSeen is within the threshold (default 5 minutes)
 * @param lastSeen - ISO timestamp string of last heartbeat
 * @returns true if device is online, false if offline or never seen
 */
export const isDeviceOnline = (lastSeen?: string | null): boolean => {
  if (!lastSeen) return false;

  try {
    const lastSeenDate = parseISO(lastSeen);
    const timeSinceLastSeen = Date.now() - lastSeenDate.getTime();
    return timeSinceLastSeen < DEVICE_OFFLINE_THRESHOLD_MS;
  } catch (error) {
    console.error('Error calculating device online status:', error);
    return false;
  }
};
