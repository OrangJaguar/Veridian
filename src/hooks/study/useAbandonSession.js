import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateSession } from '@/hooks/mutations/useSessionMutations';
import { buildSessionResearchFields } from '@/utils/study/sessionResearchFields';
import { useStudySessionStore } from '@/store/studySessionStore';
import { useAuth } from '@/hooks/useAuth';
import { readCachedPreferences } from '@/lib/preferencesCache';

function getResearchFieldsIfConsented(queryClient, email, params) {
  const prefs = readCachedPreferences(queryClient, email);
  if (!prefs?.researchConsent) return {};
  return buildSessionResearchFields(params);
}

export function useAbandonSession() {
  const updateSession = useUpdateSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const reset = useStudySessionStore((s) => s.reset);

  return useCallback(
    async ({ sessionId, journeyId, returnPath }) => {
      const { startedAt, sessionData, answers } = useStudySessionStore.getState();
      const endedAt = Date.now();
      const mergedSessionData = {
        ...sessionData,
        ...(answers.length > 0 ? { answers } : {}),
      };
      const researchFields = getResearchFieldsIfConsented(queryClient, user?.email, {
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
            sessionData: mergedSessionData,
            ...researchFields,
          },
        });
      } catch {
        // still navigate away
      }
      reset();
      navigate(returnPath ?? '/home');
    },
    [updateSession, navigate, reset, queryClient, user?.email],
  );
}
