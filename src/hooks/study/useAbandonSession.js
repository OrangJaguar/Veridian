import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpdateSession } from '@/hooks/mutations/useSessionMutations';
import { useStudySessionStore } from '@/store/studySessionStore';

export function useAbandonSession() {
  const updateSession = useUpdateSession();
  const navigate = useNavigate();
  const reset = useStudySessionStore((s) => s.reset);

  return useCallback(
    async ({ sessionId, journeyId, returnPath }) => {
      try {
        await updateSession.mutateAsync({
          sessionId,
          journeyId,
          patch: {
            status: 'abandoned',
            endedAt: Date.now(),
          },
        });
      } catch {
        // still navigate away
      }
      reset();
      navigate(returnPath ?? '/home');
    },
    [updateSession, navigate, reset],
  );
}
