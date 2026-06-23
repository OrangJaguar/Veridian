/** Quiz-type sessions that require pre-quiz confidence slider and count toward firstQuizAt. */
export const QUIZ_SESSION_ACTIVITY_TYPES = [
  'practiceQuiz',
  'diagnostic',
  'interleavedReview',
  'journeyChallenge',
  'cramSession',
];

const QUIZ_SET = new Set(QUIZ_SESSION_ACTIVITY_TYPES);

export function isQuizSessionActivityType(activityType) {
  return QUIZ_SET.has(activityType);
}

/** Activity types that use the confidence slider (quiz types + baseline check). */
export const CONFIDENCE_SLIDER_ACTIVITY_TYPES = [
  ...QUIZ_SESSION_ACTIVITY_TYPES,
  'baselineCheck',
];

const CONFIDENCE_SET = new Set(CONFIDENCE_SLIDER_ACTIVITY_TYPES);

export function requiresConfidenceSlider(activityType) {
  return CONFIDENCE_SET.has(activityType);
}
