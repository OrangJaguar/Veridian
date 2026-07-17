import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/api/query-keys';
import {
  createPlanOverride,
  deactivatePlanOverride,
  deactivateOverridesForAssignment,
  clearActiveOverridesForWeek,
} from '@/api/entities/planOverrides';
import { cancelCommitmentsForAssignment } from '@/api/entities/studyCommitments';
import { addDays, parseISO } from 'date-fns';
import { getDateKey } from '@/utils/weeklyPlan/weekKey';

function invalidatePlanSurfaces(queryClient, weekKey) {
  queryClient.invalidateQueries({ queryKey: queryKeys.planOverrides.all });
  if (weekKey) {
    queryClient.invalidateQueries({ queryKey: queryKeys.planOverrides.byWeek(weekKey) });
  }
  queryClient.invalidateQueries({ queryKey: queryKeys.dueToday });
  queryClient.invalidateQueries({ queryKey: queryKeys.globalPlan });
  queryClient.invalidateQueries({ queryKey: ['studyPlan'] });
}

export function useCreatePlanOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlanOverride,
    onSuccess: (row) => {
      invalidatePlanSurfaces(queryClient, row?.weekKey);
    },
    onError: () => toast.error("Couldn't update the plan"),
  });
}

export function useDeactivatePlanOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivatePlanOverride,
    onSuccess: () => invalidatePlanSurfaces(queryClient),
    onError: () => toast.error("Couldn't undo that change"),
  });
}

export function useClearWeekOverrides() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (weekKey) => clearActiveOverridesForWeek(weekKey),
    onSuccess: (_data, weekKey) => {
      invalidatePlanSurfaces(queryClient, weekKey);
      toast.success('Plan controls reset for this week');
    },
    onError: () => toast.error("Couldn't reset plan controls"),
  });
}

/**
 * High-level planner control actions for an assignment.
 */
export function usePlanAssignmentControls() {
  const createOverride = useCreatePlanOverride();
  const queryClient = useQueryClient();

  const run = async (action, assignment, extras = {}) => {
    if (!assignment?.assignmentId) {
      toast.error('This item cannot be adjusted yet');
      return null;
    }

    const weekKey = assignment.weekKey ?? extras.weekKey;
    const originalDateKey = assignment.dateKey ?? extras.dateKey ?? getDateKey();
    const base = {
      assignmentId: assignment.assignmentId,
      weekKey,
      originalDateKey,
      journeyId: assignment.journeyId,
      moduleId: assignment.moduleId ?? null,
      activityId: assignment.activityId,
    };

    let payload;
    if (action === 'skip') {
      payload = { ...base, action: 'skip' };
      await cancelCommitmentsForAssignment(assignment.assignmentId).catch(() => {});
    } else if (action === 'snooze') {
      const days = extras.days ?? 1;
      const target = getDateKey(addDays(parseISO(originalDateKey), days));
      payload = {
        ...base,
        action: 'snooze',
        targetDateKey: extras.targetDateKey ?? target,
      };
    } else if (action === 'move') {
      if (!extras.targetDateKey) throw new Error('targetDateKey required');
      payload = {
        ...base,
        action: 'move',
        targetDateKey: extras.targetDateKey,
      };
    } else if (action === 'pin') {
      payload = { ...base, action: 'pin' };
    } else if (action === 'swap') {
      payload = {
        ...base,
        action: 'swap',
        swapActivityType: extras.swapActivityType ?? 'practiceQuiz',
        swapActivityId: extras.swapActivityId ?? assignment.activityId,
      };
    } else if (action === 'undo') {
      await deactivateOverridesForAssignment(assignment.assignmentId);
      invalidatePlanSurfaces(queryClient, weekKey);
      toast.success('Override removed');
      return null;
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    const row = await createOverride.mutateAsync(payload);
    const labels = {
      skip: 'Skipped for this week',
      snooze: 'Snoozed to another day',
      move: 'Moved',
      pin: 'Pinned',
      swap: 'Swapped activity',
    };
    toast.success(labels[action] ?? 'Plan updated');
    return row;
  };

  return {
    run,
    isPending: createOverride.isPending,
  };
}
