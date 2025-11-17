import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whitelistApi } from '@api/endpoints';
import { WhitelistEntry, CreateWhitelistDTO } from '@types';

export const WHITELIST_QUERY_KEY = 'whitelist';

export const useWhitelist = () => {
  return useQuery({
    queryKey: [WHITELIST_QUERY_KEY],
    queryFn: () => whitelistApi.getWhitelist(),
  });
};

export const useWhitelistEntry = (id: string) => {
  return useQuery({
    queryKey: [WHITELIST_QUERY_KEY, id],
    queryFn: () => whitelistApi.getWhitelistById(id),
    enabled: !!id,
  });
};

export const useAddWhitelist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: CreateWhitelistDTO) => whitelistApi.addWhitelist(entry),
    onSuccess: () => {
      // Invalidate whitelist to refetch
      queryClient.invalidateQueries({ queryKey: [WHITELIST_QUERY_KEY] });
    },
  });
};

export const useUpdateWhitelist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<WhitelistEntry> }) =>
      whitelistApi.updateWhitelist(id, updates),
    onSuccess: (data, variables) => {
      // Update specific entry in cache
      queryClient.setQueryData<WhitelistEntry>([WHITELIST_QUERY_KEY, variables.id], data);
      
      // Invalidate whitelist
      queryClient.invalidateQueries({ queryKey: [WHITELIST_QUERY_KEY] });
    },
  });
};

export const useDeleteWhitelist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => whitelistApi.deleteWhitelist(id),
    onSuccess: () => {
      // Invalidate whitelist to refetch
      queryClient.invalidateQueries({ queryKey: [WHITELIST_QUERY_KEY] });
    },
  });
};
