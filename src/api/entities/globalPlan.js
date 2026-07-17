import { listJourneys } from '@/api/entities/journeys';
import { listAllModules } from '@/api/entities/modules';
import { listAllActivities } from '@/api/entities/activities';
import { listAllSessions } from '@/api/entities/sessions';
import { listAllCards } from '@/api/entities/cards';
import { getPreferences, updatePreferences } from '@/api/entities/preferences';
import { updateJourney } from '@/api/entities/journeys';
import { listPlanOverrides, createPlanOverride } from '@/api/entities/planOverrides';
import { buildGlobalPlan } from '@/utils/planner/buildGlobalPlan';
import { shouldRebuildGlobalPlan, getGlobalPlanWeekKey } from '@/utils/planner/planStale';
import { budgetMinFromTier } from '@/utils/planner/constants';
import { getEffectivePlanSnapshot } from '@/utils/planner/getEffectivePlanSnapshot';
import { applyRecoveryRepack } from '@/utils/planner/applyPlanOverrides';
import { getDateKey } from '@/utils/weeklyPlan/weekKey';
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
    unavailableWeekdays: preferences?.unavailableWeekdays ?? [],
    weeklyTargetMinutes: preferences?.weeklyTargetMinutes ?? null,
  };
}

/**
 * Recompute global plan and project to each journey's weeklyPlanSnapshot.
 * Stores the base plan only; overrides are applied at read time.
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

/**
 * Base snapshot + active overrides for Due Today / UI.
 */
export async function ensureEffectiveGlobalPlan() {
  const result = await ensureGlobalPlan();
  const base = result.globalSnapshot;
  const prefs = result.preferences;
  const weekKey = base?.weekKey;
  const overrides = weekKey
    ? await listPlanOverrides(weekKey).catch(() => [])
    : [];

  const effectiveSnapshot = getEffectivePlanSnapshot(base, {
    overrides,
    unavailableWeekdays: prefs?.unavailableWeekdays ?? [],
  });

  return {
    ...result,
    globalSnapshot: effectiveSnapshot,
    baseSnapshot: base,
    overrides,
  };
}

/**
 * Recovery replan: densify remaining week and persist as move overrides.
 * Pins and explicit moves are preserved by the packer.
 */
export async function runRecoveryReplan({ fromDateKey = getDateKey() } = {}) {
  const ensured = await ensureGlobalPlan();
  const baseSnapshot = ensured.globalSnapshot;
  const preferences = ensured.preferences;
  if (!baseSnapshot) return null;

  const weekKey = baseSnapshot.weekKey;
  const overrides = weekKey
    ? await listPlanOverrides(weekKey).catch(() => [])
    : [];

  const before = getEffectivePlanSnapshot(baseSnapshot, {
    overrides,
    unavailableWeekdays: preferences?.unavailableWeekdays ?? [],
  });

  const after = applyRecoveryRepack(before, {
    fromDateKey,
    dailyBudgetMin: before.dailyBudgetMin ?? preferences?.dailyTimeBudgetMin,
  });

  const beforeLoc = new Map();
  for (const day of before.days ?? []) {
    for (const a of day.assignments ?? []) {
      if (a.assignmentId) beforeLoc.set(a.assignmentId, day.dateKey);
    }
  }

  for (const day of after.days ?? []) {
    for (const a of day.assignments ?? []) {
      if (!a.assignmentId) continue;
      const prev = beforeLoc.get(a.assignmentId);
      if (prev && prev !== day.dateKey) {
        await createPlanOverride({
          assignmentId: a.assignmentId,
          weekKey: after.weekKey,
          originalDateKey: prev,
          action: 'move',
          targetDateKey: day.dateKey,
          journeyId: a.journeyId,
          moduleId: a.moduleId ?? null,
          activityId: a.activityId,
        });
      }
    }
  }

  return after;
}

export function invalidateGlobalPlan(queryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.globalPlan });
  queryClient.invalidateQueries({ queryKey: queryKeys.dueToday });
  queryClient.invalidateQueries({ queryKey: ['studyPlan'] });
  queryClient.invalidateQueries({ queryKey: queryKeys.planOverrides.all });
}
