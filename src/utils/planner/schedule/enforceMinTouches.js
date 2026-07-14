import { assignActivityType } from '@/utils/weeklyPlan/assignActivityType';
import { buildModuleNumberMap } from '@/utils/weeklyPlan/moduleContext';

/**
 * Ensure each journey has minimum assignments across the week.
 */
export function enforceMinJourneyTouches(globalDays, journeyInputs, minTouches) {
  for (const input of journeyInputs) {
    const { journey, moduleContexts, activities } = input;
    const journeyId = journey.journeyId;
    let count = 0;
    for (const day of globalDays) {
      count += (day.assignments ?? []).filter((a) => a.journeyId === journeyId).length;
    }
    if (count >= minTouches || !moduleContexts.length) continue;

    const moduleNumberMap = buildModuleNumberMap(moduleContexts.map((c) => c.module));
    let added = 0;
    for (const day of globalDays) {
      if (count + added >= minTouches) break;
      for (const ctx of moduleContexts) {
        if (count + added >= minTouches) break;
        const pick = assignActivityType(ctx, day.dayIndex);
        if (!pick?.activity) continue;
        if ((day.assignments ?? []).some(
          (a) => a.journeyId === journeyId && a.moduleId === ctx.module.moduleId,
        )) continue;

        day.assignments.push({
          journeyId,
          journeyTitle: journey.title,
          moduleId: ctx.module.moduleId,
          moduleName: ctx.module.name,
          moduleNumber: moduleNumberMap[ctx.module.moduleId],
          activityId: pick.activity.activityId,
          activityType: pick.activityType,
          reasonCode: pick.reasonCode ?? 'min_touch',
          estimatedMin: 15,
        });
        day.isRestDay = false;
        added += 1;
      }
    }
  }
}
