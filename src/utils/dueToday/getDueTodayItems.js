import { generateStudyPlan, sortByGlobalUrgency } from '@/utils/studyPlanner';

/**
 * Merge study planner todayItems across all active journeys for Home Due Today.
 * @param {{ journeys: object[], modules: object[], activities: object[], sessions: object[], cards: object[] }} input
 * @returns {import('./types.js').DueTodayItem[]}
 */
export function getDueTodayItems({ journeys, modules, activities, sessions = [], cards }) {
  const activeJourneys = journeys.filter((j) => !j.archived);

  const allItems = activeJourneys.flatMap((journey) => {
    const journeyModules = modules.filter((m) => m.journeyId === journey.journeyId);
    const journeyActivities = activities.filter((a) => a.journeyId === journey.journeyId);
    const journeySessions = sessions.filter((s) => s.journeyId === journey.journeyId);
    const journeyCards = cards.filter((c) => c.journeyId === journey.journeyId);

    const plan = generateStudyPlan(
      journey,
      journeyModules,
      journeyActivities,
      journeySessions,
      journeyCards,
    );
    return plan.todayItems;
  });

  return sortByGlobalUrgency(allItems);
}
