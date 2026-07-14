import { daysUntilExam } from '@/utils/weeklyPlan/weekKey';

/**
 * Score a journey for global budget allocation (lower = more urgent).
 */
export function scoreJourneyUrgency(journey, modules = [], sessions = []) {
  const examDays = daysUntilExam(journey.examDate);
  const examUrgency = examDays != null ? Math.max(0, 30 - Math.min(examDays, 30)) : 5;

  const masteryScores = modules.map((m) => m.masteryScore ?? 0);
  const avgMastery = masteryScores.length
    ? masteryScores.reduce((a, b) => a + b, 0) / masteryScores.length
    : 0;
  const masteryUrgency = avgMastery < 40 ? 30 : avgMastery < 70 ? 15 : 0;

  const journeySessions = sessions.filter((s) => s.journeyId === journey.journeyId && s.status === 'completed');
  const lastStudy = Math.max(
    journey.lastStudiedAt ?? 0,
    ...journeySessions.map((s) => s.endedAt ?? s.startedAt ?? 0),
  );
  const daysSinceStudy = lastStudy
    ? Math.floor((Date.now() - lastStudy) / 86400000)
    : 14;
  const neglectUrgency = Math.min(20, daysSinceStudy * 2);

  const focusBoost = journey.moduleFocusBoosts
    ? Object.values(journey.moduleFocusBoosts).reduce((a, b) => a + (Number(b) || 0), 0)
    : 0;

  return examUrgency * 3 + masteryUrgency + neglectUrgency + focusBoost * 5;
}

/**
 * Distribute global daily minutes across journeys by urgency weights.
 * Keep-sharp journeys get a lower share vs exam-near journeys.
 */
export function allocateJourneyBudgets({
  journeys,
  modules,
  sessions,
  globalBudgetMin,
  perJourneyCap,
  keepSharpByJourneyId = {},
}) {
  if (!journeys.length) return {};

  const single = journeys.length === 1;
  const cap = single ? Math.min(globalBudgetMin, perJourneyCap.single) : perJourneyCap.multi;

  const scores = journeys.map((j) => {
    let score = scoreJourneyUrgency(
      j,
      modules.filter((m) => m.journeyId === j.journeyId),
      sessions,
    );
    if (keepSharpByJourneyId[j.journeyId]) {
      score = Math.max(4, Math.round(score * 0.55));
    }
    return { journeyId: j.journeyId, score };
  });

  const totalScore = scores.reduce((s, x) => s + x.score, 0) || 1;
  const budgets = {};

  for (const { journeyId, score } of scores) {
    const share = score / totalScore;
    const raw = Math.round(globalBudgetMin * share);
    const keepFloor = keepSharpByJourneyId[journeyId] ? (single ? 15 : 8) : (single ? 20 : 10);
    budgets[journeyId] = Math.max(keepFloor, Math.min(cap, raw));
  }

  const allocated = Object.values(budgets).reduce((a, b) => a + b, 0);
  if (allocated > globalBudgetMin) {
    const scale = globalBudgetMin / allocated;
    for (const id of Object.keys(budgets)) {
      budgets[id] = Math.max(10, Math.floor(budgets[id] * scale));
    }
  }

  return budgets;
}
