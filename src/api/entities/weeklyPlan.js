import { getJourney } from '@/api/entities/journeys';
import { ensureGlobalPlan } from '@/api/entities/globalPlan';
import { listPlanOverrides } from '@/api/entities/planOverrides';
import { getPreferences } from '@/api/entities/preferences';
import { getEffectivePlanSnapshot, projectJourneyFromGlobal } from '@/utils/planner/getEffectivePlanSnapshot';
import { queryKeys } from '@/api/query-keys';

/**
 * Return cached plan or rebuild via global planner.
 * Applies active overrides on top of the stored journey snapshot when possible.
 */
export async function ensureWeeklyPlan(journeyId) {
  const { globalSnapshot, preferences } = await ensureGlobalPlan();
  const journey = await getJourney(journeyId);
  if (!journey) throw new Error(`Journey not found: ${journeyId}`);

  const weekKey = journey.weeklyPlanWeekKey ?? globalSnapshot?.weekKey;
  const overrides = weekKey
    ? await listPlanOverrides(weekKey).catch(() => [])
    : [];
  const prefs = preferences ?? await getPreferences().catch(() => null);
  const unavailableWeekdays = prefs?.unavailableWeekdays ?? [];

  let snapshot = journey.weeklyPlanSnapshot;
  if (globalSnapshot?.days?.length) {
    const effectiveGlobal = getEffectivePlanSnapshot(globalSnapshot, {
      overrides,
      unavailableWeekdays,
    });
    const projected = projectJourneyFromGlobal(effectiveGlobal, journeyId);
    if (projected) {
      snapshot = {
        ...(journey.weeklyPlanSnapshot ?? {}),
        ...projected,
        mode: journey.weeklyPlanMode ?? projected.mode ?? 'normal',
        weekKey: weekKey ?? projected.weekKey,
        weekStrategy: journey.weeklyPlanSnapshot?.weekStrategy,
        moduleSummaries: journey.weeklyPlanSnapshot?.moduleSummaries,
      };
    }
  } else if (snapshot?.days?.length && overrides.length) {
    snapshot = getEffectivePlanSnapshot(snapshot, {
      overrides,
      unavailableWeekdays,
    });
  }

  return {
    journey,
    snapshot,
    mode: journey.weeklyPlanMode ?? 'normal',
    weekKey: journey.weeklyPlanWeekKey,
    builtAt: journey.weeklyPlanBuiltAt,
  };
}

export function invalidateWeeklyPlan(queryClient, journeyId) {
  queryClient.invalidateQueries({ queryKey: queryKeys.studyPlan(journeyId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.weeklyPlan(journeyId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.dueToday });
}
