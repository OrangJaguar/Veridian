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
  },
  cards: {
    byJourney: (journeyId) => ['cards', journeyId],
    byActivity: (activityId) => ['cards', 'activity', activityId],
  },
  sessions: {
    byJourney: (journeyId) => ['sessions', journeyId],
  },
  preferences: ['preferences'],
};
