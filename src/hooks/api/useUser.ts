import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@api/endpoints';
import { User } from '@types';

export const USER_QUERY_KEY = 'user';

export const useProfile = () => {
  return useQuery({
    queryKey: [USER_QUERY_KEY, 'profile'],
    queryFn: () => userApi.getProfile(),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<User>) => userApi.updateProfile(updates),
    onSuccess: data => {
      // Update profile in cache
      queryClient.setQueryData<User>([USER_QUERY_KEY, 'profile'], data);
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({
      oldPassword,
      newPassword,
    }: {
      oldPassword: string;
      newPassword: string;
    }) => userApi.changePassword(oldPassword, newPassword),
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userApi.deleteAccount(),
    onSuccess: () => {
      // Clear all queries on account deletion
      queryClient.clear();
    },
  });
};
