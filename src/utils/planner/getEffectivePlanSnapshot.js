import { stampSnapshotAssignmentIds } from '@/utils/planner/assignmentId';
import { applyPlanOverrides } from '@/utils/planner/applyPlanOverrides';

/**
 * Stamp assignment IDs and apply active overrides + unavailable days.
 * Does not mutate the stored base plan snapshot.
 */
export function getEffectivePlanSnapshot(baseSnapshot, {
  overrides = [],
  unavailableWeekdays = [],
} = {}) {
  if (!baseSnapshot) return baseSnapshot;
  const stamped = stampSnapshotAssignmentIds(baseSnapshot);
  return applyPlanOverrides(stamped, overrides, { unavailableWeekdays });
}

/**
 * Project one journey's week view from an effective (override-aware) global snapshot.
 */
export function projectJourneyFromGlobal(effectiveSnapshot, journeyId) {
  if (!effectiveSnapshot?.days) return null;
  return {
    ...effectiveSnapshot,
    days: effectiveSnapshot.days.map((day) => {
      const assignments = (day.assignments ?? [])
        .filter((a) => a.journeyId === journeyId)
        .map(({ journeyId: _j, journeyTitle: _t, estimatedMin: _e, ...rest }) => rest);
      const assignMin = assignments.reduce(
        (s, a) => s + (a.estimatedMin ?? (a.activityType === 'flashcardSet' ? 10 : 15)),
        0,
      );
      return {
        ...day,
        assignments,
        estimatedMin: assignMin + Math.min(20, Math.ceil((day.fsrsCardCount ?? 0) * 0.45)),
        isRestDay: assignments.length === 0 && (day.fsrsCardCount ?? 0) === 0,
      };
    }),
  };
}
