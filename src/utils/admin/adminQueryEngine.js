/**
 * Client-side reference for admin query intents (server is source of truth).
 */
export const ADMIN_QUERY_EXAMPLES = [
  'How many users signed up this week?',
  'What is the most popular subject?',
  'What is the average mastery score across all users?',
  'How many quiz sessions were completed yesterday?',
  'Which modules have the lowest completion rates?',
];

export function matchAdminQueryIntent(question) {
  const q = String(question ?? '').toLowerCase().trim();
  if (/sign(ed)?\s*up|registration|new\s+user/.test(q) && /week/.test(q)) return 'signupsWeek';
  if (/sign(ed)?\s*up|registration|new\s+user/.test(q) && /month/.test(q)) return 'signupsMonth';
  if (/sign(ed)?\s*up|registration|new\s+user/.test(q)) return 'signupsTotal';
  if (/popular|most\s+common/.test(q) && /subject/.test(q)) return 'popularSubject';
  if (/average|avg/.test(q) && /mastery/.test(q)) return 'avgMastery';
  if (/quiz/.test(q) && /yesterday/.test(q)) return 'quizYesterday';
  if (/quiz/.test(q) && /session|completed/.test(q)) return 'quizTotal';
  if (/flashcard/.test(q) && /session/.test(q)) return 'flashcardTotal';
  if (/feynman/.test(q)) return 'feynmanTotal';
  if (/free\s*recall/.test(q)) return 'freeRecallTotal';
  if (/learning\s*guide/.test(q)) return 'guideTotal';
  if (/how\s+many\s+user|total\s+user|registered/.test(q)) return 'totalUsers';
  if (/active/.test(q) && /7/.test(q)) return 'active7';
  if (/active/.test(q) && /30/.test(q)) return 'active30';
  if (/journey/.test(q) && /how\s+many|total|count/.test(q)) return 'totalJourneys';
  if (/module/.test(q) && /how\s+many|total|count/.test(q)) return 'totalModules';
  if (/lowest|completion|complete/.test(q) && /module/.test(q)) return 'lowCompletionModules';
  return 'unknown';
}

export function formatAdminAnswer(text) {
  return String(text ?? '').trim();
}

export function normalizeQuizSetupConfig(config = {}) {
  return {
    questionCount: Number(config.questionCount) || 10,
    focusPreset: config.focusPreset ?? 'weakSpots',
    strictMode: config.strictMode ?? config.strictTimedMode ?? false,
    strictSecondsPerQuestion: config.strictSecondsPerQuestion ?? 60,
    instantFeedback: config.instantFeedback ?? !(config.strictMode ?? config.strictTimedMode),
    uiPreset: config.uiPreset === 'apClassroom' ? 'apClassroom' : 'classic',
    questionStyle: config.questionStyle === 'apStyle' ? 'apStyle' : 'standard',
  };
}
