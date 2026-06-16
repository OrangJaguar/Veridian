import { QUIZ_ACCURACY_NEEDS_WORK } from '@/utils/weeklyPlan/constants';

const STAGE_URGENCY = { B: 0, A: 1, C: 2 };

/**
 * Sort modules by urgency: low accuracy first, then closer exam, then stage B before untouched A.
 */
export function sortModulesByUrgency(contexts, daysUntilExam) {
  return contexts
    .map((ctx) => {
      const accuracy = ctx.quizAccuracy ?? 100;
      const stagePenalty = ctx.stage === 'A' && !ctx.guideComplete ? 5 : STAGE_URGENCY[ctx.stage] ?? 3;
      const accuracyUrgency = accuracy < QUIZ_ACCURACY_NEEDS_WORK ? 0 : accuracy < 75 ? 1 : 2;
      const examUrgency = daysUntilExam != null ? Math.min(daysUntilExam, 30) : 15;
      const focusBoost = ctx.focusBoost ?? 0;
      const urgencyScore = accuracyUrgency * 1000 + examUrgency * 10 + stagePenalty - focusBoost * 50;
      return { ...ctx, urgencyScore };
    })
    .sort((a, b) => a.urgencyScore - b.urgencyScore);
}
