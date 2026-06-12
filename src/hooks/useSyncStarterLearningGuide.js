import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useJourneys } from '@/hooks/queries/useJourneys';
import { useQueryClient } from '@tanstack/react-query';
import { syncStarterLearningGuideContent } from '@/api/entities/syncStarterLearningGuide';
import { STARTER_JOURNEY_META } from '@/fixtures/starterJourney/aiJourneyContent';
import { queryKeys } from '@/api/query-keys';

/**
 * One-time background sync of starter learning guide content for existing accounts.
 */
export function useSyncStarterLearningGuide() {
  const { isAuthenticated } = useAuth();
  const { data: journeys = [], isLoading } = useJourneys({ archived: false });
  const queryClient = useQueryClient();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || isLoading || syncedRef.current) return;
    const starter = journeys.find((j) => j.title === STARTER_JOURNEY_META.title);
    if (!starter) return;

    syncedRef.current = true;
    let cancelled = false;

    syncStarterLearningGuideContent()
      .then((updated) => {
        if (cancelled || !updated) return;
        queryClient.invalidateQueries({ queryKey: queryKeys.activities.byJourney(starter.journeyId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.dueToday });
      })
      .catch(() => {
        syncedRef.current = false;
      });

    return () => { cancelled = true; };
  }, [isAuthenticated, isLoading, journeys, queryClient]);
}
