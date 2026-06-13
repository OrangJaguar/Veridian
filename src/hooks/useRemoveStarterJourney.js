import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { removeStarterJourneyIfPresent } from '@/api/entities/removeStarterJourney';
import { queryKeys } from '@/api/query-keys';

/**
 * One-time cleanup: removes the deprecated starter journey for the signed-in user.
 */
export function useRemoveStarterJourney() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const ranRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || ranRef.current) return;
    ranRef.current = true;

    removeStarterJourneyIfPresent()
      .then((removed) => {
        if (!removed) return;
        queryClient.invalidateQueries({ queryKey: queryKeys.journeys.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.journeys.archived });
        queryClient.invalidateQueries({ queryKey: queryKeys.dueToday });
        queryClient.invalidateQueries({ queryKey: ['catalog'] });
      })
      .catch(() => {
        ranRef.current = false;
      });
  }, [isAuthenticated, queryClient]);
}
