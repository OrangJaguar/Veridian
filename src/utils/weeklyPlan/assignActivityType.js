import { failureModeToActivity } from '@/utils/study/diagnosticWeakness';
import { pickPrescriptionAssignment } from '@/utils/planner/pickPrescriptionAssignment';

function pickStageCActivity(ctx, dayIndex, options = {}) {
  const failureSignal = options.failureSignal ?? ctx.failureSignals?.[0];
  const mapped = failureSignal
    ? failureModeToActivity(failureSignal, 'C')
    : null;

  if (mapped === 'feynman' && ctx.feynmanActivity) {
    return {
      activity: ctx.feynmanActivity,
      activityType: 'feynman',
      reasonCode: 'mastery_feynman',
    };
  }
  if (mapped === 'freeRecall' && ctx.freeRecallActivity) {
    return {
      activity: ctx.freeRecallActivity,
      activityType: 'freeRecall',
      reasonCode: 'mastery_free_recall',
    };
  }

  const hasWeak = (ctx.weakConceptLabels?.length ?? 0) > 0;
  if (hasWeak && ctx.feynmanActivity) {
    return {
      activity: ctx.feynmanActivity,
      activityType: 'feynman',
      reasonCode: 'mastery_feynman',
    };
  }
  if (ctx.freeRecallActivity && dayIndex % 2 === 1) {
    return {
      activity: ctx.freeRecallActivity,
      activityType: 'freeRecall',
      reasonCode: 'mastery_free_recall',
    };
  }
  if (ctx.feynmanActivity) {
    return {
      activity: ctx.feynmanActivity,
      activityType: 'feynman',
      reasonCode: 'mastery_feynman',
    };
  }
  if (ctx.freeRecallActivity) {
    return {
      activity: ctx.freeRecallActivity,
      activityType: 'freeRecall',
      reasonCode: 'mastery_free_recall',
    };
  }
  return null;
}

function pickHeuristicActivity(ctx, dayIndex, options = {}) {
  const { stage, guideComplete, quizAccuracy, daysSinceLastQuiz } = ctx;

  if (stage === 'A' && !guideComplete) {
    if (!ctx.learningGuideActivity) return null;
    return {
      activity: ctx.learningGuideActivity,
      activityType: 'learningGuide',
      reasonCode: ctx.guideInProgress ? 'guide_in_progress' : 'guide_not_started',
    };
  }

  if (stage === 'B') {
    const accuracy = quizAccuracy ?? 50;
    const daysSince = daysSinceLastQuiz ?? 99;
    const hasWeakConcepts = (ctx.weakConceptLabels?.length ?? 0) > 0;
    const preferQuiz = !options.preferFlashcards
      && (accuracy < 75 || daysSince >= 3 || hasWeakConcepts);

    if (preferQuiz && ctx.practiceQuizActivity) {
      return {
        activity: ctx.practiceQuizActivity,
        activityType: 'practiceQuiz',
        reasonCode: hasWeakConcepts
          ? 'weak_concepts'
          : accuracy < 50
            ? 'struggling_quiz'
            : 'scheduled_quiz',
      };
    }
    if (ctx.flashcardActivity && (options.preferFlashcards || accuracy >= 75)) {
      return {
        activity: ctx.flashcardActivity,
        activityType: 'flashcardSet',
        reasonCode: 'flashcard_review',
      };
    }
    if (ctx.practiceQuizActivity) {
      return {
        activity: ctx.practiceQuizActivity,
        activityType: 'practiceQuiz',
        reasonCode: 'fallback_quiz',
      };
    }
    if (ctx.flashcardActivity) {
      return {
        activity: ctx.flashcardActivity,
        activityType: 'flashcardSet',
        reasonCode: 'flashcard_review',
      };
    }
  }

  if (stage === 'C') {
    return pickStageCActivity(ctx, dayIndex, options);
  }

  return null;
}

/**
 * Pick activity type for a module given stage and performance data.
 * Stage A + incomplete guide → learningGuide only (hard gate).
 * When failure profile has emerging+ confidence, prescription matrix drives assignment.
 */
export function assignActivityType(ctx, dayIndex = 0, options = {}) {
  if (ctx.stage === 'A' && !ctx.guideComplete) {
    if (!ctx.learningGuideActivity) return null;
    return {
      activity: ctx.learningGuideActivity,
      activityType: 'learningGuide',
      reasonCode: ctx.guideInProgress ? 'guide_in_progress' : 'guide_not_started',
    };
  }

  const prescriptionPick = pickPrescriptionAssignment(ctx, options);
  if (prescriptionPick) return prescriptionPick;

  return pickHeuristicActivity(ctx, dayIndex, options);
}
