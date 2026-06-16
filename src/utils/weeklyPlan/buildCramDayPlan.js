import {
  CRAM_BUDGET_MIN,
  CRAM_MAX_NON_FSRS,
  ESTIMATED_MIN,
} from '@/utils/weeklyPlan/constants';
import { getDateKey } from '@/utils/weeklyPlan/weekKey';
import { assignActivityType } from '@/utils/weeklyPlan/assignActivityType';
import { buildModuleNumberMap } from '@/utils/weeklyPlan/moduleContext';
import { sortModulesByUrgency } from '@/utils/weeklyPlan/moduleUrgency';
import { buildModuleSummaries } from '@/utils/weeklyPlan/modulePriorityText';
import { getDueCards } from '@/utils/fsrs';

/**
 * Cram mode: every active module gets attention today, up to 2 non-FSRS slots.
 */
export function buildCramDayPlan({
  journey,
  moduleContexts,
  cards = [],
  dailyBudgetMin = CRAM_BUDGET_MIN,
  now = new Date(),
}) {
  const dateKey = getDateKey(now);
  const daysUntilExam = journey.examDate
    ? Math.max(0, Math.ceil((journey.examDate - now.getTime()) / 86400000))
    : null;

  const sorted = sortModulesByUrgency(moduleContexts, daysUntilExam);
  const moduleNumberMap = buildModuleNumberMap(moduleContexts.map((ctx) => ctx.module));
  const assignments = [];

  for (let i = 0; i < sorted.length && assignments.length < CRAM_MAX_NON_FSRS; i += 1) {
    const ctx = sorted[i];
    const pick = assignActivityType(ctx, i);
    if (!pick?.activity) continue;

    assignments.push({
      moduleId: ctx.module.moduleId,
      moduleName: ctx.module.name,
      moduleNumber: moduleNumberMap[ctx.module.moduleId],
      activityId: pick.activity.activityId,
      activityType: pick.activityType,
      reasonCode: pick.reasonCode,
    });
  }

  const fsrsCardCount = getDueCards(cards).length;
  const assignMin = assignments.reduce(
    (sum, a) => sum + (ESTIMATED_MIN[a.activityType] ?? 15),
    0,
  );
  const fsrsMin = fsrsCardCount > 0 ? Math.min(15, Math.ceil(fsrsCardCount * 0.5)) : 0;

  const day = {
    dayIndex: (now.getDay() + 6) % 7,
    dateKey,
    estimatedMin: assignMin + fsrsMin,
    assignments,
    fsrsCardCount,
    isRestDay: assignments.length === 0 && fsrsCardCount === 0,
  };

  const cramDays = Array.from({ length: 7 }, (_, dayIndex) => ({
    ...day,
    dayIndex,
    dateKey,
    assignments: dayIndex === day.dayIndex ? assignments : [],
    estimatedMin: dayIndex === day.dayIndex ? day.estimatedMin : 0,
    fsrsCardCount: dayIndex === day.dayIndex ? fsrsCardCount : 0,
    isRestDay: dayIndex !== day.dayIndex,
  }));

  return {
    mode: 'cram',
    weekKey: dateKey,
    builtAt: now.getTime(),
    dailyBudgetMin,
    daysUntilExam,
    days: cramDays,
    moduleSummaries: buildModuleSummaries(sorted, [day]),
  };
}
