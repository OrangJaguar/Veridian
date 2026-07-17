import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { listPlanOverrides } from '@/api/entities/planOverrides';
import { useAuth } from '@/hooks/useAuth';

export function usePlanOverrides(weekKey) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.planOverrides.byWeek(weekKey),
    queryFn: () => listPlanOverrides(weekKey),
    enabled: isAuthenticated && !!weekKey,
    staleTime: 30_000,
  });
}
