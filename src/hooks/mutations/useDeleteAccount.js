import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { deleteUserAccount } from '@/api/account/deleteAccount';
import { useAuth } from '@/hooks/useAuth';
import { queryClient } from '@/lib/query-client';

export function useDeleteAccount() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: deleteUserAccount,
    onSuccess: async () => {
      queryClient.clear();
      await signOut();
      navigate('/', { replace: true });
      toast.success('Your account data has been deleted');
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.data?.message || err?.message;
      toast.error(typeof msg === 'string' ? msg : 'Could not delete account');
    },
  });
}
