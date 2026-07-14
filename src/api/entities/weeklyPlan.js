import { getJourney } from '@/api/entities/journeys';
import { ensureGlobalPlan } from '@/api/entities/globalPlan';
import { queryKeys } from '@/api/query-keys';

/**
 * Return cached plan or rebuild via global planner.
 */
export async function ensureWeeklyPlan(journeyId) {
  await ensureGlobalPlan();
  const journey = await getJourney(journeyId);
  if (!journey) throw new Error(`Journey not found: ${journeyId}`);

  return {
    journey,
    snapshot: journey.weeklyPlanSnapshot,
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
