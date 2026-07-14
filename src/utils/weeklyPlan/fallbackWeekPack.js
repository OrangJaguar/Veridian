import { assignActivityType } from '@/utils/weeklyPlan/assignActivityType';

/**
 * When greedy packing yields all rest days but modules exist, spread minimum assignments.
 */
export function applyFallbackWeekPack(days, activeModules, moduleNumberMap) {
  const totalAssignments = days.reduce((n, d) => n + (d.assignments?.length ?? 0), 0);
  if (totalAssignments > 0 || !activeModules.length) return;

  const stageAModules = activeModules.filter(
    (ctx) => ctx.stage === 'A' && !ctx.guideComplete && ctx.learningGuideActivity,
  );
  const otherModules = activeModules.filter((ctx) => !stageAModules.includes(ctx));

  let dayIndex = 0;
  const maxDay = days.length;

  function pushAssignment(ctx, dayIdx) {
    const day = days[dayIdx];
    if (!day) return;
    const pick = assignActivityType(ctx, dayIdx);
    if (!pick?.activity) return;
    if (day.assignments.some((a) => a.moduleId === ctx.module.moduleId)) return;

    day.assignments.push({
      moduleId: ctx.module.moduleId,
      moduleName: ctx.module.name,
      moduleNumber: moduleNumberMap[ctx.module.moduleId],
      activityId: pick.activity.activityId,
      activityType: pick.activityType,
      reasonCode: pick.reasonCode ?? 'fallback_spread',
    });
    day.isRestDay = false;
  }

  for (const ctx of stageAModules) {
    pushAssignment(ctx, dayIndex % maxDay);
    dayIndex += 1;
    if (stageAModules.length > 1) {
      pushAssignment(ctx, (dayIndex + 1) % maxDay);
      dayIndex += 1;
    }
  }

  for (const ctx of otherModules) {
    pushAssignment(ctx, dayIndex % maxDay);
    dayIndex += 1;
  }

  days.forEach((day) => {
    if (day.assignments.length > 0) day.isRestDay = false;
  });
}
