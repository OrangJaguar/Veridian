import {
  getWeekKey,
  normalizePlanMode,
} from '@/utils/weeklyPlan/weekKey';
import {
  resolveGlobalPlanMode,
  resolveJourneyPacingMode,
} from '@/utils/planner/pacingMode';

/**
 * Prefer rebuild when week rolls, journey set changes, or global pacing mode
 * shifts (enter/leave examWeek / keepSharp).
 */
export function shouldRebuildGlobalPlan(preferences, journeys = [], now = new Date()) {
  if (!preferences?.globalPlanSnapshot || !preferences?.globalPlanWeekKey) {
    return true;
  }

  const weekKey = getWeekKey(now);
  if (preferences.globalPlanWeekKey !== weekKey) return true;

  const derivedMode = resolveGlobalPlanMode(journeys, now);
  const storedMode = normalizePlanMode(preferences.globalPlanMode);
  if (derivedMode !== storedMode) return true;

  const snapshotJourneyIds = preferences.globalPlanSnapshot?.journeyIds ?? [];
  const active = journeys.filter((j) => !j.archived && j.generationStatus !== 'processing');
  const activeIds = active.map((j) => j.journeyId).sort().join(',');
  const snapIds = [...snapshotJourneyIds].sort().join(',');
  if (activeIds !== snapIds) return true;

  // Catch open ↔ exam transitions that may share the same global mode label
  // (e.g. all keepSharp → one gains a far-future exam → global becomes "normal").
  const snapModes = preferences.globalPlanSnapshot?.journeyModesById ?? null;
  if (snapModes && typeof snapModes === 'object') {
    for (const j of active) {
      const current = resolveJourneyPacingMode(j.examDate, now);
      if (snapModes[j.journeyId] && snapModes[j.journeyId] !== current) {
        return true;
      }
    }
  }

  const dayCount = preferences.globalPlanSnapshot?.days?.length ?? 0;
  if (dayCount > 0 && dayCount < 7) return true;

  return false;
}

export function getGlobalPlanWeekKey(journeys, now = new Date()) {
  return getWeekKey(now);
}
