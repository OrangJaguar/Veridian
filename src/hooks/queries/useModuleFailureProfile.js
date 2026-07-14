import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { useModules } from '@/hooks/queries/useModules';
import { useSessions } from '@/hooks/queries/useSessions';
import { useCardsByJourney } from '@/hooks/queries/useCards';
import { computeFailureProfile } from '@/utils/failures/computeFailureProfile';
import { backfillModuleEvidence } from '@/api/entities/failureEvidence';
import { useAuth } from '@/hooks/useAuth';

export function useModuleFailureProfile(moduleId, journeyId) {
  const { isAuthenticated } = useAuth();
  const { data: modules = [] } = useModules(journeyId);
  const { data: sessions = [] } = useSessions(journeyId);
  const { data: cards = [] } = useCardsByJourney(journeyId);

  const module = modules.find((m) => m.moduleId === moduleId);

  return useQuery({
    queryKey: queryKeys.failureProfile(moduleId),
    queryFn: async () => {
      if (!module) return computeFailureProfile(null);

      const hasEvidence = Boolean(
        module.failureEvidence && module.failureEvidence !== '{}',
      );

      if (!hasEvidence && sessions.length > 0) {
        const evidence = await backfillModuleEvidence(module, sessions, cards);
        return computeFailureProfile({
          ...module,
          failureEvidence: JSON.stringify(evidence),
        });
      }

      return computeFailureProfile(module);
    },
    enabled: isAuthenticated && !!moduleId && !!module,
    staleTime: 30_000,
  });
}
