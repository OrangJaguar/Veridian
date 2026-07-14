import {
  getWeekKey,
  getDateKey,
  isExamWeek,
  normalizePlanMode,
  isExamWeekMode,
} from '@/utils/weeklyPlan/weekKey';

/**
 * Determine if a stored weekly plan should be rebuilt.
 */
export function shouldRebuildPlan(journey, now = new Date()) {
  if (!journey?.weeklyPlanSnapshot || !journey.weeklyPlanWeekKey) {
    return true;
  }

  const examWeek = isExamWeek(journey.examDate, now);
  const storedMode = normalizePlanMode(journey.weeklyPlanMode);

  if (examWeek) {
    return journey.weeklyPlanWeekKey !== getWeekKey(now)
      || storedMode !== 'examWeek';
  }

  return journey.weeklyPlanWeekKey !== getWeekKey(now)
    || isExamWeekMode(journey.weeklyPlanMode);
}

export function getPlanWeekKey(journey, now = new Date()) {
  return getWeekKey(now);
}
