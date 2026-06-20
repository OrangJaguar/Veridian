import { useCurrentUser } from '@/hooks/queries/useCurrentUser';

export function useIsAdmin() {
  const { data: user, isLoading } = useCurrentUser();
  return {
    isAdmin: user?.role === 'admin',
    isLoading,
    user,
  };
}
