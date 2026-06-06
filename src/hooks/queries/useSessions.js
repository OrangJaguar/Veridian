import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { listSessionsByJourney, getSession } from '@/api/entities/sessions';
import { useAuth } from '@/hooks/useAuth';

export function useSessions(journeyId) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.sessions.byJourney(journeyId),
    queryFn: () => listSessionsByJourney(journeyId),
    enabled: isAuthenticated && !!journeyId,
    staleTime: 30_000,
  });
}

export function useSession(sessionId) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['sessions', 'detail', sessionId],
    queryFn: () => getSession(sessionId),
    enabled: isAuthenticated && !!sessionId,
    staleTime: 30_000,
  });
}
