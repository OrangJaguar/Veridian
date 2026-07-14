import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { ensureWeeklyPlan } from '@/api/entities/weeklyPlan';
import { daysUntilExam, isExamWeekMode } from '@/utils/weeklyPlan/weekKey';
import { useAuth } from '@/hooks/useAuth';

/**
 * Per-journey study plan — reads persisted weekly plan snapshot.
 */
export function useStudyPlan(journeyId) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.studyPlan(journeyId),
    queryFn: async () => {
      const result = await ensureWeeklyPlan(journeyId);
      const journey = result.journey;
      const snapshot = result.snapshot;
      return {
        snapshot,
        mode: result.mode,
        weekKey: result.weekKey,
        builtAt: result.builtAt,
        daysUntilExam: daysUntilExam(journey?.examDate),
        weekPriorities: snapshot?.moduleSummaries?.map((s) => ({
          moduleId: s.moduleId,
          moduleName: s.moduleName,
          note: s.priorityText,
        })) ?? [],
        weekStrategy: snapshot?.weekStrategy ?? '',
        overallStatus: isExamWeekMode(snapshot?.mode) || isExamWeekMode(result.mode)
          ? 'needsAttention'
          : 'onTrack',
      };
    },
    enabled: isAuthenticated && !!journeyId,
    staleTime: Infinity,
  });
}
