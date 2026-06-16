import { addDays } from 'date-fns';
import {
  ESTIMATED_MIN,
  MAX_NON_FSRS_PER_DAY,
  NORMAL_BUDGET_MIN,
} from '@/utils/weeklyPlan/constants';
import { getMondayStart, getWeekDayKeys, getWeekKey } from '@/utils/weeklyPlan/weekKey';
import { assignActivityType } from '@/utils/weeklyPlan/assignActivityType';
import { buildModuleNumberMap } from '@/utils/weeklyPlan/moduleContext';
import { sortModulesByUrgency } from '@/utils/weeklyPlan/moduleUrgency';
import { buildModuleSummaries } from '@/utils/weeklyPlan/modulePriorityText';
import { getDueCards } from '@/utils/fsrs';
import { endOfTodayMs } from '@/utils/dueToday/endOfToday';

function estimateAssignmentMin(activityType, cardCount = 0) {
  if (activityType === 'flashcardSet') {
    return Math.max(5, Math.ceil(cardCount * 0.5));
  }
  return ESTIMATED_MIN[activityType] ?? 15;
}

function countFsrsForDay(cards, dayDate) {
  const end = new Date(dayDate);
  end.setHours(23, 59, 59, 999);
  return getDueCards(cards, end.getTime()).length;
}

/**
 * Build 7-day normal weekly plan with module rotation.
 */
export function buildNormalWeekPlan({
  journey,
  moduleContexts,
  cards = [],
  dailyBudgetMin = NORMAL_BUDGET_MIN,
  now = new Date(),
}) {
  const monday = getMondayStart(now);
  const dateKeys = getWeekDayKeys(monday);
  const daysUntilExam = journey.examDate
    ? Math.max(0, Math.ceil((journey.examDate - now.getTime()) / 86400000))
    : null;

  const sorted = sortModulesByUrgency(moduleContexts, daysUntilExam);
  const moduleNumberMap = buildModuleNumberMap(moduleContexts.map((ctx) => ctx.module));
  const activeModules = sorted.filter((ctx) => {
    if (ctx.stage === 'A' && !ctx.learningGuideActivity && !ctx.guideComplete) return false;
    return assignActivityType(ctx, 0) != null || (ctx.stage === 'A' && ctx.learningGuideActivity);
  });

  const days = dateKeys.map((dateKey, dayIndex) => {
    const dayDate = addDays(monday, dayIndex);
    const fsrsCardCount = countFsrsForDay(cards, dayDate);
    return {
      dayIndex,
      dateKey,
      estimatedMin: 0,
      assignments: [],
      fsrsCardCount,
      isRestDay: false,
    };
  });

  if (activeModules.length === 0) {
    days.forEach((d) => { d.isRestDay = true; });
    return {
      mode: 'normal',
      weekKey: getWeekKey(monday),
      builtAt: now.getTime(),
      dailyBudgetMin,
      daysUntilExam,
      days,
      moduleSummaries: [],
    };
  }

  let moduleIdx = 0;
  for (let round = 0; round < activeModules.length * 2; round += 1) {
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const day = days[dayIndex];
      if (day.assignments.length >= MAX_NON_FSRS_PER_DAY) continue;

      const ctx = activeModules[moduleIdx % activeModules.length];
      moduleIdx += 1;

      const alreadyAssigned = day.assignments.some((a) => a.moduleId === ctx.module.moduleId);
      if (alreadyAssigned) continue;

      const pick = assignActivityType(ctx, dayIndex);
      if (!pick?.activity) continue;

      day.assignments.push({
        moduleId: ctx.module.moduleId,
        moduleName: ctx.module.name,
        moduleNumber: moduleNumberMap[ctx.module.moduleId],
        activityId: pick.activity.activityId,
        activityType: pick.activityType,
        reasonCode: pick.reasonCode,
      });
    }
  }

  days.forEach((day) => {
    const assignMin = day.assignments.reduce(
      (sum, a) => sum + estimateAssignmentMin(a.activityType),
      0,
    );
    const fsrsMin = day.fsrsCardCount > 0
      ? Math.min(15, Math.ceil(day.fsrsCardCount * 0.5))
      : 0;
    day.estimatedMin = assignMin + fsrsMin;
    day.isRestDay = day.assignments.length === 0 && day.fsrsCardCount === 0;
  });

  const moduleSummaries = buildModuleSummaries(sorted, days);

  return {
    mode: 'normal',
    weekKey: getWeekKey(monday),
    builtAt: now.getTime(),
    dailyBudgetMin,
    daysUntilExam,
    days,
    moduleSummaries,
  };
}
