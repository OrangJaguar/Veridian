import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUpdateSession } from '@/hooks/mutations/useSessionMutations';
import { getActivity } from '@/api/entities/activities';
import { runPostSessionEffects } from '@/utils/study/postSession';
import { buildSessionResearchFields } from '@/utils/study/sessionResearchFields';
import { queryKeys } from '@/api/query-keys';
import { useStudySessionStore } from '@/store/studySessionStore';
import { useAuth } from '@/hooks/useAuth';
import { readCachedPreferences } from '@/lib/preferencesCache';
import { assertConfidenceSliderPresent } from '@/utils/research/sessionConfidence';

function getResearchFieldsIfConsented(queryClient, email, params) {
  const prefs = readCachedPreferences(queryClient, email);
  if (!prefs?.researchConsent) return {};
  return buildSessionResearchFields(params);
}

export function useCompleteSession() {
  const updateSession = useUpdateSession();
  const queryClient = useQueryClient();
  const { user } = useAuth();
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
      activityType: activityTypeOverride,
    }) => {
      const activity = activityOverride ?? await getActivity(activityId);
      const activityType = activityTypeOverride ?? activity?.type;
      assertConfidenceSliderPresent(sessionData, activityType);
      const endedAt = Date.now();
      const durationSec = startedAt ? Math.round((endedAt - startedAt) / 1000) : 0;
      const researchFields = getResearchFieldsIfConsented(queryClient, user?.email, {
        sessionData,
        outcomeSummary,
        startedAt,
        endedAt,
        status: 'completed',
      });

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
          ...researchFields,
        },
      });

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
      queryClient.invalidateQueries({ queryKey: queryKeys.globalPlan });
      queryClient.invalidateQueries({ queryKey: queryKeys.studyPlan(journeyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.byJourney(journeyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.byJourney(journeyId) });
      if (activity?.moduleId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.failureProfile(activity.moduleId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.journeyFailureRollup(journeyId) });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'detail', sessionId] });

      reset();
    },
    [updateSession, queryClient, reset, user?.email],
  );

  const completeSessionInBackground = useCallback(
    (params) => {
      completeSession(params).catch((err) => {
        toast.error(err?.message || 'Could not save session results.', {
          duration: Infinity,
          action: {
            label: 'Save again',
            onClick: () => completeSession(params).catch(() => {
              toast.error('Still could not save. Check your connection and try again.');
            }),
          },
        });
      });
    },
    [completeSession],
  );

  return { completeSession, completeSessionInBackground };
}
