import { listJourneys } from '@/api/entities/journeys';
import { listAllModules } from '@/api/entities/modules';
import { listAllActivities } from '@/api/entities/activities';
import { listAllSessions } from '@/api/entities/sessions';
import { listAllCards } from '@/api/entities/cards';
import { getPreferences, updatePreferences } from '@/api/entities/preferences';
import { updateJourney } from '@/api/entities/journeys';
import { buildGlobalPlan } from '@/utils/planner/buildGlobalPlan';
import { shouldRebuildGlobalPlan, getGlobalPlanWeekKey } from '@/utils/planner/planStale';
import { budgetMinFromTier } from '@/utils/planner/constants';
import { queryKeys } from '@/api/query-keys';

export async function loadGlobalPlanInputs() {
  const [journeys, modules, activities, sessions, cards, preferences] = await Promise.all([
    listJourneys({ archived: false }),
    listAllModules(),
    listAllActivities(),
    listAllSessions(),
    listAllCards(),
    getPreferences().catch(() => null),
  ]);

  return {
    journeys,
    modules,
    activities,
    sessions,
    cards,
    preferences,
    studyBudgetTier: preferences?.studyBudgetTier,
    dailyBudgetMin: budgetMinFromTier(
      preferences?.studyBudgetTier,
      preferences?.dailyTimeBudgetMin,
    ),
  };
}

/**
 * Recompute global plan and project to each journey's weeklyPlanSnapshot.
 */
export async function rebuildGlobalPlan({ force = false } = {}) {
  const inputs = await loadGlobalPlanInputs();
  const { preferences, journeys } = inputs;

  if (!force && preferences && !shouldRebuildGlobalPlan(preferences, journeys)) {
    return {
      globalSnapshot: preferences.globalPlanSnapshot,
      journeyProjections: null,
      preferences,
    };
  }

  const built = buildGlobalPlan(inputs);
  const weekKey = getGlobalPlanWeekKey(journeys);

  if (preferences?.userEmail) {
    await updatePreferences({
      globalPlanSnapshot: built.globalSnapshot,
      globalPlanWeekKey: weekKey,
      globalPlanBuiltAt: built.builtAt,
      globalPlanMode: built.mode,
      dailyTimeBudgetMin: built.globalSnapshot.dailyBudgetMin,
    });
  }

  await Promise.all(
    Object.entries(built.journeyProjections).map(([journeyId, snapshot]) =>
      updateJourney(journeyId, {
        weeklyPlanSnapshot: snapshot,
        weeklyPlanWeekKey: snapshot.weekKey,
        weeklyPlanBuiltAt: snapshot.builtAt,
        weeklyPlanMode: snapshot.mode,
      }),
    ),
  );

  return {
    globalSnapshot: built.globalSnapshot,
    journeyProjections: built.journeyProjections,
    preferences,
  };
}

export async function ensureGlobalPlan() {
  const inputs = await loadGlobalPlanInputs();
  const { preferences, journeys } = inputs;

  if (preferences?.globalPlanSnapshot && !shouldRebuildGlobalPlan(preferences, journeys)) {
    return {
      globalSnapshot: preferences.globalPlanSnapshot,
      preferences,
    };
  }

  return rebuildGlobalPlan({ force: true });
}

export function invalidateGlobalPlan(queryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.globalPlan });
  queryClient.invalidateQueries({ queryKey: queryKeys.dueToday });
  queryClient.invalidateQueries({ queryKey: ['studyPlan'] });
}
