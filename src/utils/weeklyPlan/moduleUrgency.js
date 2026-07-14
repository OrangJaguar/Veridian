import {
  QUIZ_ACCURACY_NEEDS_WORK,
  STAGE_C_PROMOTION_THRESHOLD,
} from '@/utils/weeklyPlan/constants';

const STAGE_URGENCY = { B: 0, A: 1, C: 2 };

function resolveMastery(ctx) {
  if (typeof ctx.module.masteryScore === 'number' && ctx.module.masteryScore > 0) {
    return ctx.module.masteryScore;
  }
  if (typeof ctx.quizAccuracy === 'number') return ctx.quizAccuracy;
  return 0;
}

/**
 * Sort modules by urgency: weak mastery, low accuracy, weak concepts, exam proximity, stage.
 * Confirmed failure patterns boost priority.
 */
export function sortModulesByUrgency(contexts, daysUntilExam) {
  return contexts
    .map((ctx) => {
      const mastery = resolveMastery(ctx);
      const accuracy = typeof ctx.quizAccuracy === 'number' ? ctx.quizAccuracy : 0;
      const stagePenalty = ctx.stage === 'A' && !ctx.guideComplete ? 5 : STAGE_URGENCY[ctx.stage] ?? 3;
      const masteryUrgency = mastery < 40 ? -200 : mastery < STAGE_C_PROMOTION_THRESHOLD ? -100 : mastery < 85 ? 0 : 40;
      const accuracyUrgency = accuracy < QUIZ_ACCURACY_NEEDS_WORK ? -80 : accuracy < 75 ? -30 : 0;
      const weakConceptBoost = (ctx.weakConceptLabels?.length ?? 0) > 0 ? -60 : 0;
      const examUrgency = daysUntilExam != null ? Math.min(daysUntilExam, 30) : 15;
      const focusBoost = ctx.focusBoost ?? 0;

      let failureBoost = 0;
      const profile = ctx.failureProfile;
      if (profile?.hasData && profile.primaryConfidence === 'confirmed') {
        failureBoost = -90;
        if (profile.trend === 'worsening') failureBoost -= 50;
      } else if (profile?.hasData && profile.primaryConfidence === 'emerging') {
        failureBoost = -40;
      }

      const urgencyScore = masteryUrgency + accuracyUrgency + weakConceptBoost + failureBoost
        + examUrgency * 10 + stagePenalty - focusBoost * 50;
      return { ...ctx, urgencyScore };
    })
    .sort((a, b) => a.urgencyScore - b.urgencyScore);
}
