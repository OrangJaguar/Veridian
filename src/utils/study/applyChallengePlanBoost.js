import { updateJourney } from '@/api/entities/journeys';
import { rebuildWeeklyPlan } from '@/api/entities/weeklyPlan';

/**
 * Boost weekly plan urgency for weak modules after a journey challenge.
 */
export async function applyChallengePlanBoost(journeyId, modules, perModuleAccuracy) {
  const boosts = {};
  const focusNames = [];

  for (const mod of modules) {
    const acc = perModuleAccuracy[mod.moduleId];
    if (acc == null) continue;
    if (acc < 60) {
      boosts[mod.moduleId] = 2;
      focusNames.push(mod.name);
    } else if (acc < 75) {
      boosts[mod.moduleId] = 1;
    }
  }

  const reweighted = focusNames.length > 0;
  if (reweighted) {
    await updateJourney(journeyId, { moduleFocusBoosts: boosts });
    await rebuildWeeklyPlan(journeyId, { force: true });
  }

  return {
    reweighted,
    focusModules: focusNames,
  };
}
