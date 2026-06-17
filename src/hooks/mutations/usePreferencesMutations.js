import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { updatePreferences } from '@/api/entities/preferences';
import { toast } from 'sonner';

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch) => updatePreferences(patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.preferences });
      const prev = queryClient.getQueryData(queryKeys.preferences);
      queryClient.setQueryData(queryKeys.preferences, (old) => (
        old ? { ...old, ...patch } : old
      ));
      return { prev };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(queryKeys.preferences, ctx.prev);
      }
      toast.error("Changes couldn't be saved");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences });
    },
  });
}
