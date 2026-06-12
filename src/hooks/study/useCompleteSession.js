import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUpdateSession } from '@/hooks/mutations/useSessionMutations';
import { getActivity } from '@/api/entities/activities';
import { runPostSessionEffects } from '@/utils/study/postSession';
import { queryKeys } from '@/api/query-keys';
import { useStudySessionStore } from '@/store/studySessionStore';

export function useCompleteSession() {
  const updateSession = useUpdateSession();
  const queryClient = useQueryClient();
  const reset = useStudySessionStore((s) => s.reset);

  const completeSession = useCallback(
    async ({
      sessionId,
      journeyId,
      activityId,
      activity: activityOverride,
      sessionData,
      score,
      outcomeSummary,
      startedAt,
    }) => {
      const endedAt = Date.now();
      const durationSec = startedAt ? Math.round((endedAt - startedAt) / 1000) : 0;

      await updateSession.mutateAsync({
        sessionId,
        journeyId,
        patch: {
          status: 'completed',
          endedAt,
          durationSec,
          sessionData,
          score,
          outcomeSummary,
        },
      });

      const activity = activityOverride ?? await getActivity(activityId);
      if (activity) {
        await runPostSessionEffects(
          {
            sessionId,
            journeyId,
            moduleId: activity.moduleId,
            activityId,
            activityType: activity.type,
            endedAt,
            score,
            outcomeSummary,
            sessionData,
          },
          activity,
        );
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.dueToday });
      queryClient.invalidateQueries({ queryKey: queryKeys.studyPlan(journeyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.byJourney(journeyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.byJourney(journeyId) });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'detail', sessionId] });

      reset();
    },
    [updateSession, queryClient, reset],
  );

  const completeSessionInBackground = useCallback(
    (params) => {
      completeSession(params).catch(() => {
        toast.error('Could not save session results. Your progress may not sync until you retry.');
      });
    },
    [completeSession],
  );

  return { completeSession, completeSessionInBackground };
}
