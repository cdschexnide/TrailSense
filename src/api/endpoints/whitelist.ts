import { apiClient } from '../client';
import { WhitelistEntry, CreateWhitelistDTO } from '@types';

export const whitelistApi = {
  getWhitelist: async (): Promise<WhitelistEntry[]> => {
    const { data } = await apiClient.get('/whitelist');
    return data;
  },

  getWhitelistById: async (id: string): Promise<WhitelistEntry> => {
    const { data } = await apiClient.get(`/whitelist/${id}`);
    return data;
  },

  addWhitelist: async (entry: CreateWhitelistDTO): Promise<WhitelistEntry> => {
    const { data } = await apiClient.post('/whitelist', entry);
    return data;
  },

  updateWhitelist: async (
    id: string,
    updates: Partial<WhitelistEntry>
  ): Promise<WhitelistEntry> => {
    const { data } = await apiClient.patch(`/whitelist/${id}`, updates);
    return data;
  },

  deleteWhitelist: async (id: string): Promise<void> => {
    await apiClient.delete(`/whitelist/${id}`);
  },
};
