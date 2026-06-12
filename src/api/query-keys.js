export const queryKeys = {
  journeys: {
    all: ['journeys'],
    archived: ['journeys', 'archived'],
    detail: (journeyId) => ['journeys', journeyId],
  },
  modules: {
    byJourney: (journeyId) => ['modules', journeyId],
    detail: (moduleId) => ['modules', 'detail', moduleId],
  },
  activities: {
    byModule: (moduleId) => ['activities', moduleId],
    byJourney: (journeyId) => ['activities', 'journey', journeyId],
  },
  studyPlan: (journeyId) => ['studyPlan', journeyId],
  cards: {
    byJourney: (journeyId) => ['cards', journeyId],
    byActivity: (activityId) => ['cards', 'activity', activityId],
  },
  sessions: {
    byJourney: (journeyId) => ['sessions', journeyId],
  },
  preferences: ['preferences'],
  dueToday: ['dueToday'],
  catalog: {
    allModules: ['catalog', 'modules'],
    allActivities: ['catalog', 'activities'],
    allCards: ['catalog', 'cards'],
    allSessions: ['catalog', 'sessions'],
  },
};
