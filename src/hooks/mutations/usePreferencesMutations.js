import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { updatePreferences } from '@/api/entities/preferences';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const preferencesKey = queryKeys.preferences(user?.email);

  return useMutation({
    mutationFn: (patch) => updatePreferences(patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: preferencesKey });
      const prev = queryClient.getQueryData(preferencesKey);
      queryClient.setQueryData(preferencesKey, (old) => (
        old ? { ...old, ...patch } : old
      ));
      return { prev };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(preferencesKey, ctx.prev);
      }
      toast.error("Changes couldn't be saved");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });
}
