/**
 * Signal type constants shared across map components
 */

import type { IconName } from '@components/atoms/Icon/Icon';
import { TriangulationSignalType } from '@/types/triangulation';

export const SIGNAL_COLORS: Record<TriangulationSignalType, string> = {
  wifi: '#007AFF',
  bluetooth: '#5856D6',
  cellular: '#FF9500',
};

export const SIGNAL_ICONS: Record<TriangulationSignalType, IconName> = {
  wifi: 'wifi',
  bluetooth: 'bluetooth',
  cellular: 'cellular',
};

export const SIGNAL_LABELS: Record<TriangulationSignalType, string> = {
  wifi: 'WiFi',
  bluetooth: 'Bluetooth',
  cellular: 'Cellular',
};
