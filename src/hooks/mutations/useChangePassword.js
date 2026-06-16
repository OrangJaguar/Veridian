import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { changePassword } from '@/api/auth/password';

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password updated');
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.data?.message || err?.message;
      toast.error(typeof msg === 'string' ? msg : 'Could not change password');
    },
  });
}
