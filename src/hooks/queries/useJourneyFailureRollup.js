import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { useModules } from '@/hooks/queries/useModules';
import { computeJourneyFailureRollup } from '@/utils/failures/computeJourneyFailureRollup';
import { useAuth } from '@/hooks/useAuth';

export function useJourneyFailureRollup(journey) {
  const { isAuthenticated } = useAuth();
  const journeyId = journey?.journeyId;
  const { data: modules = [] } = useModules(journeyId);

  return useQuery({
    queryKey: queryKeys.journeyFailureRollup(journeyId),
    queryFn: () => computeJourneyFailureRollup(journey, modules),
    enabled: isAuthenticated && !!journeyId && modules.length > 0,
    staleTime: 30_000,
  });
}

export function useJourneyFailureRollupMemo(journey, modules) {
  return useMemo(
    () => computeJourneyFailureRollup(journey, modules),
    [journey, modules],
  );
}
