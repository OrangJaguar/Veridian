import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { fetchDueTodayItems } from '@/api/entities/dueToday';
import { useAuth } from '@/hooks/useAuth';

export function useDueToday() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.dueToday,
    queryFn: fetchDueTodayItems,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}
