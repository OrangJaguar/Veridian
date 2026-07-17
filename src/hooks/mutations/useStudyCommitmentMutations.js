import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/api/query-keys';
import {
  createStudyCommitment,
  updateStudyCommitment,
  linkSessionToCommitment,
} from '@/api/entities/studyCommitments';
import { ensureEffectiveGlobalPlan } from '@/api/entities/globalPlan';
import { updatePreferences } from '@/api/entities/preferences';
import {
  commitmentsFromPlanSnapshot,
} from '@/utils/accountability/computeCommitmentAdherence';
import { getWeekKey } from '@/utils/weeklyPlan/weekKey';
import { addDays, parseISO } from 'date-fns';
import { getDateKey } from '@/utils/weeklyPlan/weekKey';

function invalidateCommitments(queryClient, weekKey) {
  queryClient.invalidateQueries({ queryKey: queryKeys.studyCommitments.all });
  if (weekKey) {
    queryClient.invalidateQueries({ queryKey: queryKeys.studyCommitments.byWeek(weekKey) });
  }
  queryClient.invalidateQueries({ queryKey: queryKeys.studyCommitments.open });
  queryClient.invalidateQueries({ queryKey: ['preferences'] });
}

export function useCreateStudyCommitment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudyCommitment,
    onSuccess: (row) => invalidateCommitments(queryClient, row?.weekKey),
    onError: () => toast.error("Couldn't save commitment"),
  });
}

export function useAcceptWeeklyCommitments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      weeklyTargetSessions,
      weeklyTargetMinutes,
      weekKey = getWeekKey(),
    } = {}) => {
      const { globalSnapshot } = await ensureEffectiveGlobalPlan();
      const payloads = commitmentsFromPlanSnapshot(globalSnapshot);

      let selected = payloads;
      if (weeklyTargetSessions != null && weeklyTargetSessions > 0) {
        selected = payloads.slice(0, weeklyTargetSessions);
      }

      const created = [];
      for (const payload of selected) {
        created.push(await createStudyCommitment(payload));
      }

      await updatePreferences({
        weeklyTargetSessions: weeklyTargetSessions ?? selected.length,
        weeklyTargetMinutes: weeklyTargetMinutes ?? undefined,
        commitmentWeekKey: weekKey,
        commitmentAcceptedAt: Date.now(),
      });

      return { created, weekKey };
    },
    onSuccess: (result) => {
      invalidateCommitments(queryClient, result.weekKey);
      toast.success('Weekly commitment set');
    },
    onError: () => toast.error("Couldn't set weekly commitment"),
  });
}

/**
 * Schedule the prescribed next activity as a durable commitment (and optional plan note).
 */
export function useScheduleNextSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nextActivity) => {
      if (!nextActivity?.activityId || !nextActivity?.journeyId) {
        throw new Error('Missing next activity');
      }
      const scheduledDateKey = nextActivity.scheduledDateKey
        ?? getDateKey(addDays(new Date(), 1));
      const weekKey = nextActivity.weekKey ?? getWeekKey(parseISO(scheduledDateKey));

      return createStudyCommitment({
        assignmentId: nextActivity.assignmentId ?? null,
        weekKey,
        journeyId: nextActivity.journeyId,
        moduleId: nextActivity.moduleId ?? null,
        activityId: nextActivity.activityId,
        activityType: nextActivity.activityType,
        scheduledDateKey,
        estimatedMin: nextActivity.estimatedMin ?? 15,
        source: 'schedule_next',
        status: 'planned',
        reason: nextActivity.reason ?? null,
      });
    },
    onSuccess: (row) => {
      invalidateCommitments(queryClient, row?.weekKey);
      toast.success('Next session scheduled');
    },
    onError: () => toast.error("Couldn't schedule next session"),
  });
}

export function useLinkSessionCommitment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commitmentId, sessionId }) => linkSessionToCommitment(commitmentId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studyCommitments.all });
    },
  });
}

export function useUpdateStudyCommitment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commitmentId, patch }) => updateStudyCommitment(commitmentId, patch),
    onSuccess: (row) => invalidateCommitments(queryClient, row?.weekKey),
  });
}
