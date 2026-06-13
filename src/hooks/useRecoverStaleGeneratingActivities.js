import { useEffect, useRef } from 'react';
import { useUpdateActivity } from '@/hooks/mutations/useActivityMutations';

/**
 * Reset learning guides stuck on `generating` after the user leaves mid-generation.
 */
export function useRecoverStaleGeneratingActivities(journeyId, activities, sessions) {
  const updateActivity = useUpdateActivity();
  const recoveredRef = useRef(new Set());

  useEffect(() => {
    if (!journeyId || !activities.length) return;

    for (const activity of activities) {
      if (activity.type !== 'learningGuide') continue;
      if (activity.status !== 'generating') continue;
      if (activity.content?.sections?.length) continue;
      if (recoveredRef.current.has(activity.activityId)) continue;

      const hasActiveSession = sessions.some(
        (session) => session.activityId === activity.activityId
          && session.activityType === 'learningGuide'
          && session.status === 'in_progress',
      );
      if (hasActiveSession) continue;

      recoveredRef.current.add(activity.activityId);
      updateActivity.mutate({
        activityId: activity.activityId,
        journeyId,
        moduleId: activity.moduleId,
        patch: { status: 'notGenerated' },
      });
    }
  }, [journeyId, activities, sessions, updateActivity]);
}
