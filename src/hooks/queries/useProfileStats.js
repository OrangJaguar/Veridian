import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { getProfileStats } from '@/api/entities/profileStats';
import { useAuth } from '@/hooks/useAuth';

export function useProfileStats() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.profile.stats,
    queryFn: getProfileStats,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}
