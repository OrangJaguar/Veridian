import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { getPublishEligibility } from '@/api/entities/library';
import { useAuth } from '@/hooks/useAuth';

export function usePublishEligibility(journeyId) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.library.eligibility(journeyId),
    queryFn: () => getPublishEligibility(journeyId),
    enabled: isAuthenticated && !!journeyId,
    staleTime: 30_000,
  });
}
