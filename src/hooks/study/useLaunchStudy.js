import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateSession } from '@/hooks/mutations/useSessionMutations';

/**
 * Create an in-progress session and navigate to the study shell.
 */
export function useLaunchStudy() {
  const navigate = useNavigate();
  const createSession = useCreateSession();

  return useCallback(
    async ({ journeyId, activity, moduleId = null, initialSessionData = {} }) => {
      const session = await createSession.mutateAsync({
        journeyId,
        input: {
          activityId: activity.activityId,
          activityType: activity.type,
          moduleId: moduleId ?? activity.moduleId ?? undefined,
          startedAt: Date.now(),
          status: 'in_progress',
          sessionData: initialSessionData,
        },
      });
      const sid = session.sessionId ?? session.id;
      navigate(`/study/${sid}`);
      return session;
    },
    [createSession, navigate],
  );
}
