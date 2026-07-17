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
  weeklyPlan: (journeyId) => ['weeklyPlan', journeyId],
  globalPlan: ['globalPlan'],
  library: {
    list: (params) => ['library', 'list', params],
    preview: (journeyId) => ['library', 'preview', journeyId],
    eligibility: (journeyId) => ['library', 'eligibility', journeyId],
  },
  cards: {
    byJourney: (journeyId) => ['cards', journeyId],
    byActivity: (activityId) => ['cards', 'activity', activityId],
  },
  sessions: {
    byJourney: (journeyId) => ['sessions', journeyId],
  },
  preferences: (email) => (email ? ['preferences', email] : ['preferences']),
  profile: {
    stats: ['profile', 'stats'],
  },
  dueToday: ['dueToday'],
  failureProfile: (moduleId) => ['failureProfile', moduleId],
  journeyFailureRollup: (journeyId) => ['journeyFailureRollup', journeyId],
  aiQuota: ['aiQuota'],
  planOverrides: {
    all: ['planOverrides'],
    byWeek: (weekKey) => (weekKey ? ['planOverrides', weekKey] : ['planOverrides']),
  },
  studyCommitments: {
    all: ['studyCommitments'],
    byWeek: (weekKey) => (weekKey ? ['studyCommitments', weekKey] : ['studyCommitments']),
    open: ['studyCommitments', 'open'],
  },
  catalog: {
    allModules: ['catalog', 'modules'],
    allActivities: ['catalog', 'activities'],
    allCards: ['catalog', 'cards'],
    allSessions: ['catalog', 'sessions'],
  },
};
