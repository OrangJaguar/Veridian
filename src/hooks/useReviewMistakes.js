import { useQuery } from '@tanstack/react-query';
import { listAllSessions, listSessionsByJourney } from '@/api/entities/sessions';
import { queryKeys } from '@/api/query-keys';
import { aggregateMistakes } from '@/utils/study/aggregateMistakes';
import { useMemo } from 'react';

export function useReviewMistakes(journeyId) {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: journeyId
      ? queryKeys.sessions.byJourney(journeyId)
      : queryKeys.catalog.allSessions,
    queryFn: () => journeyId ? listSessionsByJourney(journeyId) : listAllSessions(),
    staleTime: 60_000,
  });

  const mistakes = useMemo(
    () => aggregateMistakes(sessions, journeyId),
    [sessions, journeyId],
  );

  return { mistakes, isLoading, isEmpty: !isLoading && mistakes.length === 0 };
}
