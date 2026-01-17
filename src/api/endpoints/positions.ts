/**
 * Positions API Endpoints
 *
 * Fetches triangulated device positions from backend
 */

import apiClient from '../client';
import { TriangulatedPosition } from '../../types/triangulation';

export interface PositionsResponse {
  positions: TriangulatedPosition[];
}

/**
 * Get positions for a specific TrailSense device
 */
export const getPositions = async (deviceId: string, signalType?: string): Promise<PositionsResponse> => {
  const params = new URLSearchParams({ deviceId });
  if (signalType) {
    params.append('signalType', signalType);
  }
  const response = await apiClient.get<PositionsResponse>(`/api/positions?${params.toString()}`);
  return response.data;
};

/**
 * Clear all positions for a device (reset for new patrol)
 */
export const clearPositions = async (deviceId: string): Promise<{ success: boolean; deleted: number }> => {
  const response = await apiClient.delete(`/api/positions?deviceId=${deviceId}`);
  return response.data;
};
