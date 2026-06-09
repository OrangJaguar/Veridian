import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useJourneys } from '@/hooks/queries/useJourneys';
import { provisionStarterJourney } from '@/api/entities/starterJourney';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';

/**
 * Auto-provisions the starter AI journey when an authenticated user has no journeys.
 */
export function useEnsureStarterJourney() {
  const { isAuthenticated } = useAuth();
  const { data: journeys = [], isLoading } = useJourneys({ archived: false });
  const queryClient = useQueryClient();
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState(null);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || isLoading || attemptedRef.current) return;
    if (journeys.length > 0) return;

    attemptedRef.current = true;
    let cancelled = false;
    setProvisioning(true);
    setError(null);

    provisionStarterJourney()
      .then(() => {
        if (cancelled) return;
        queryClient.invalidateQueries({ queryKey: queryKeys.journeys.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.dueToday });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          attemptedRef.current = false;
        }
      })
      .finally(() => {
        if (!cancelled) setProvisioning(false);
      });

    return () => { cancelled = true; };
  }, [isAuthenticated, isLoading, journeys.length, queryClient]);

  return { provisioning, error };
}
