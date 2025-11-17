import { apiClient } from '../client';
import { User } from '@types';

export const userApi = {
  getProfile: async (): Promise<User> => {
    const { data } = await apiClient.get('/user/profile');
    return data;
  },

  updateProfile: async (updates: Partial<User>): Promise<User> => {
    const { data } = await apiClient.patch('/user/profile', updates);
    return data;
  },

  changePassword: async (
    oldPassword: string,
    newPassword: string
  ): Promise<void> => {
    await apiClient.post('/user/change-password', {
      oldPassword,
      newPassword,
    });
  },

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/user/account');
  },
};
