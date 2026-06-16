import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateSession } from '@/hooks/mutations/useSessionMutations';
import { buildSessionResearchFields } from '@/utils/study/sessionResearchFields';
import { queryKeys } from '@/api/query-keys';
import { useStudySessionStore } from '@/store/studySessionStore';

function getResearchFieldsIfConsented(queryClient, params) {
  const prefs = queryClient.getQueryData(queryKeys.preferences);
  if (!prefs?.researchConsent) return {};
  return buildSessionResearchFields(params);
}

export function useAbandonSession() {
  const updateSession = useUpdateSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reset = useStudySessionStore((s) => s.reset);

  return useCallback(
    async ({ sessionId, journeyId, returnPath }) => {
      const { startedAt, sessionData, answers } = useStudySessionStore.getState();
      const endedAt = Date.now();
      const mergedSessionData = {
        ...sessionData,
        ...(answers.length > 0 ? { answers } : {}),
      };
      const researchFields = getResearchFieldsIfConsented(queryClient, {
        sessionData: mergedSessionData,
        startedAt,
        endedAt,
        status: 'abandoned',
      });

      try {
        await updateSession.mutateAsync({
          sessionId,
          journeyId,
          patch: {
            status: 'abandoned',
            endedAt,
            ...researchFields,
          },
        });
      } catch {
        // still navigate away
      }
      reset();
      navigate(returnPath ?? '/home');
    },
    [updateSession, navigate, reset, queryClient],
  );
}
