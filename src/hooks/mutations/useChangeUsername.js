import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { changeUsername } from '@/api/entities/username';
import { queryKeys } from '@/api/query-keys';

export function useChangeUsername() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username) => changeUsername(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      toast.success('Username updated');
    },
    onError: (err) => {
      toast.error(err?.message || 'Could not update username');
    },
  });
}
