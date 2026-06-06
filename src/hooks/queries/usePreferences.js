import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { getPreferences } from '@/api/entities/preferences';
import { useAuth } from '@/hooks/useAuth';

export function usePreferences() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.preferences,
    queryFn: getPreferences,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}
