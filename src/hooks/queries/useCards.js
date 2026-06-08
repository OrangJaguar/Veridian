import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { listCardsByJourney, listCardsByActivity } from '@/api/entities/cards';
import { useAuth } from '@/hooks/useAuth';

export function useCardsByJourney(journeyId) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.cards.byJourney(journeyId),
    queryFn: () => listCardsByJourney(journeyId),
    enabled: isAuthenticated && !!journeyId,
    staleTime: 30_000,
  });
}

export function useCards(journeyId) {
  return useCardsByJourney(journeyId);
}

export function useCardsByActivity(activityId) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.cards.byActivity(activityId),
    queryFn: () => listCardsByActivity(activityId),
    enabled: isAuthenticated && !!activityId,
    staleTime: 30_000,
  });
}
