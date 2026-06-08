import { averageStability, stabilityToScore } from '@/utils/fsrs';

const WEIGHTS = {
  quiz: 0.4,
  flashcard: 0.3,
  feynman: 0.15,
  freeRecall: 0.15,
};

function quizScore(sessions) {
  const quizSessions = sessions
    .filter((s) => s.activityType === 'practiceQuiz' && s.status === 'completed')
    .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))
    .slice(0, 3);

  if (!quizSessions.length) return null;

  const scores = quizSessions.map((s) => {
    if (s.score != null) return s.score;
    return s.outcomeSummary?.accuracy ?? 0;
  });
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function flashcardScore(cards) {
  const active = cards.filter((c) => !c.suspended);
  if (!active.length) return null;
  return stabilityToScore(averageStability(active));
}

function feynmanScore(sessions) {
  const latest = sessions
    .filter((s) => s.activityType === 'feynman' && s.status === 'completed')
    .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))[0];

  if (!latest) return null;

  const rating = latest.sessionData?.overallConfidenceRating
    ?? latest.outcomeSummary?.confidence;

  if (rating === 'strong') return 100;
  if (rating === 'partial') return 60;
  if (rating === 'weak') return 20;
  if (latest.score != null) return latest.score;
  return 0;
}

function freeRecallScore(sessions) {
  const latest = sessions
    .filter((s) => s.activityType === 'freeRecall' && s.status === 'completed')
    .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))[0];

  if (!latest) return null;

  return latest.sessionData?.coveragePercent
    ?? latest.outcomeSummary?.itemsCompleted
    ?? latest.score
    ?? 0;
}

/**
 * Weighted composite mastery 0–100 for a module.
 */
export function calculateModuleMastery(module, activities, sessions, cards) {
  const moduleId = module.moduleId;
  const moduleSessions = sessions.filter((s) => s.moduleId === moduleId);
  const moduleCards = cards.filter((c) => {
    const act = activities.find((a) => a.activityId === c.activityId);
    return act?.moduleId === moduleId;
  });

  const components = [
    { key: 'quiz', weight: WEIGHTS.quiz, score: quizScore(moduleSessions) },
    { key: 'flashcard', weight: WEIGHTS.flashcard, score: flashcardScore(moduleCards) },
    { key: 'feynman', weight: WEIGHTS.feynman, score: feynmanScore(moduleSessions) },
    { key: 'freeRecall', weight: WEIGHTS.freeRecall, score: freeRecallScore(moduleSessions) },
  ];

  const withData = components.filter((c) => c.score != null);
  if (!withData.length) return module.masteryScore ?? 0;

  const totalWeight = withData.reduce((acc, c) => acc + c.weight, 0);
  const weighted = withData.reduce(
    (acc, c) => acc + (c.score * c.weight) / totalWeight,
    0,
  );

  return Math.round(Math.min(100, Math.max(0, weighted)));
}

export function averageModuleMastery(modules) {
  if (!modules?.length) return 0;
  const sum = modules.reduce((acc, m) => acc + (m.masteryScore ?? 0), 0);
  return Math.round(sum / modules.length);
}
