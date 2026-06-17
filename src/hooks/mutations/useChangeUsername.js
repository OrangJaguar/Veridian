import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { changeUsername } from '@/api/entities/username';
import { queryKeys } from '@/api/query-keys';

export function useChangeUsername() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username) => changeUsername(username),
    onMutate: async (username) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.preferences });
      const prev = queryClient.getQueryData(queryKeys.preferences);
      queryClient.setQueryData(queryKeys.preferences, (old) => (
        old ? { ...old, username } : old
      ));
      return { prev };
    },
    onError: (err, _username, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(queryKeys.preferences, ctx.prev);
      }
      toast.error(err?.message || 'Could not update username');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      toast.success('Username updated');
    },
  });
}
