import { NORMAL_BUDGET_MIN } from '@/utils/weeklyPlan/constants';
import { isExamWeek, getDateKey } from '@/utils/weeklyPlan/weekKey';
import { buildAllModuleContexts } from '@/utils/weeklyPlan/moduleContext';
import { buildNormalWeekPlan } from '@/utils/weeklyPlan/buildNormalWeekPlan';
import { getPlanWeekKey } from '@/utils/weeklyPlan/planStale';

/**
 * Build weekly plan snapshot for a journey (pure computation).
 * Exam week uses the same 7-day grid as normal; denser packing is handled
 * by the global planner. Legacy single-day cram packing is no longer the default.
 */
export function buildWeeklyPlan({
  journey,
  modules,
  activities,
  sessions,
  cards,
  dailyBudgetMin = NORMAL_BUDGET_MIN,
  now = new Date(),
}) {
  const moduleContexts = buildAllModuleContexts(modules, activities, sessions, journey);
  const examWeek = isExamWeek(journey.examDate, now);
  const budget = dailyBudgetMin ?? NORMAL_BUDGET_MIN;

  const snapshot = buildNormalWeekPlan({
    journey,
    moduleContexts,
    cards,
    dailyBudgetMin: budget,
    now,
  });

  if (examWeek) {
    snapshot.mode = 'examWeek';
  }

  return {
    snapshot,
    weekKey: getPlanWeekKey(journey, now),
    mode: examWeek ? 'examWeek' : 'normal',
    builtAt: now.getTime(),
  };
}

/**
 * Get today's plan day from a snapshot.
 */
export function getTodayPlanDay(snapshot, now = new Date()) {
  if (!snapshot?.days?.length) return null;
  const todayKey = getDateKey(now);
  return snapshot.days.find((d) => d.dateKey === todayKey)
    ?? snapshot.days.find((d) => !d.isRestDay)
    ?? snapshot.days[0];
}
