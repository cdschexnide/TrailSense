import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  whitelistApi,
  WhitelistFilters,
  AddWhitelistPayload,
} from '@api/endpoints/whitelist';

export const useWhitelist = (filters?: WhitelistFilters) => {
  return useQuery({
    queryKey: ['whitelist', filters],
    queryFn: () => whitelistApi.getWhitelist(filters),
  });
};

export const useAddToWhitelist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddWhitelistPayload) =>
      whitelistApi.addToWhitelist(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelist'] });
    },
  });
};

export const useRemoveFromWhitelist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => whitelistApi.removeFromWhitelist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelist'] });
    },
  });
};

export const useUpdateWhitelistEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<AddWhitelistPayload>;
    }) => whitelistApi.updateWhitelistEntry(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelist'] });
    },
  });
};
