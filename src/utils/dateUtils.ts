import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Format a timestamp string to a human-readable format
 * @param timestamp - ISO timestamp string
 * @param formatString - Optional date-fns format string (default: 'MMM d, yyyy h:mm a')
 * @returns Formatted date string
 */
export const formatTimestamp = (
  timestamp: string,
  formatString: string = 'MMM d, yyyy h:mm a'
): string => {
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
