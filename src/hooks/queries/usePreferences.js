import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { getPreferences } from '@/api/entities/preferences';
import { useAuth } from '@/hooks/useAuth';

export function usePreferences() {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: queryKeys.preferences(user?.email),
    queryFn: getPreferences,
    enabled: isAuthenticated && !!user?.email,
    staleTime: 60_000,
  });
}
