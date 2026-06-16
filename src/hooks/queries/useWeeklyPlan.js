import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { ensureWeeklyPlan } from '@/api/entities/weeklyPlan';
import { useAuth } from '@/hooks/useAuth';

export function useWeeklyPlan(journeyId) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.weeklyPlan(journeyId),
    queryFn: () => ensureWeeklyPlan(journeyId),
    enabled: isAuthenticated && !!journeyId,
    staleTime: Infinity,
  });
}
