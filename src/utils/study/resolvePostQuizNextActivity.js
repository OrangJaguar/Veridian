import { resolveModulePrescription } from '@/utils/failures/resolveModulePrescription';
import { getPrescriptionSummary } from '@/utils/failures/prescriptionMatrix';
import { getFailureModeMeta } from '@/utils/failures/taxonomy';
import { ACTIVITY_LABELS } from '@/utils/weeklyPlan/constants';
import { formatReasonCopy } from '@/utils/planner/reasonCopy';

function estimateMinutes(activityType, timed = false) {
  if (activityType === 'flashcardSet') return 10;
  if (activityType === 'learningGuide') return 15;
  if (activityType === 'feynman' || activityType === 'freeRecall') return 12;
  return timed ? 12 : 15;
}

function findActivity(activities = [], moduleId, activityType) {
  return (activities ?? []).find(
    (a) => a.moduleId === moduleId
      && a.type === activityType
      && a.status !== 'failed',
  ) ?? null;
}

/**
 * Resolve one structured next activity after a practice quiz.
 * Prefers the module failure-profile prescription; falls back to weak-spots quiz
 * or stage-appropriate practice when evidence is thin.
 * @param {{ module: object, journeyId?: string, activities?: object[], conceptResults?: object[], accuracy?: number, trapDebrief?: object|null }} params
 */
export function resolvePostQuizNextActivity({
  module,
  journeyId,
  activities = [],
  conceptResults = [],
  accuracy = 0,
  trapDebrief = null,
} = {}) {
  if (!module?.moduleId) return null;

  const weak = (conceptResults ?? []).filter(
    (r) => r.status === 'needs_work' || r.status === 'shaky',
  );
  const prescription = resolveModulePrescription(module);

  if (prescription?.shouldApply && prescription.spec?.activityType) {
    const activity = findActivity(activities, module.moduleId, prescription.spec.activityType);
    if (activity) {
      const timed = Boolean(prescription.spec.timed);
      let quizConfig = null;
      if (prescription.spec.activityType === 'practiceQuiz') {
        quizConfig = {
          questionCount: 5,
          focusPreset: 'weakSpots',
          prescriptionDriven: true,
          ...(timed ? {
            strictTimedMode: true,
            timedMode: true,
            strictMode: true,
            instantFeedback: false,
          } : {}),
        };
      }

      const reason = prescription.summary
        ?? getPrescriptionSummary(prescription.spec)
        ?? formatReasonCopy(`rx_${prescription.spec.prescriptionType}`, {
          moduleName: module.name,
        });

      return {
        activityId: activity.activityId,
        activityType: prescription.spec.activityType,
        reasonCode: `rx_${prescription.spec.prescriptionType}`,
        prescriptionType: prescription.spec.prescriptionType,
        primaryMode: prescription.primaryMode ?? trapDebrief?.primaryMode ?? null,
        reason,
        estimatedMin: estimateMinutes(prescription.spec.activityType, timed),
        label: ACTIVITY_LABELS[prescription.spec.activityType]
          ?? prescription.spec.activityType,
        quizConfig,
        flashcardMode: prescription.spec.flashcardMode ?? null,
        mixedPhrasing: Boolean(prescription.spec.mixedPhrasing),
        timed,
        prescription: {
          prescriptionType: prescription.spec.prescriptionType,
          primaryMode: prescription.primaryMode ?? null,
          summary: prescription.summary ?? null,
          spec: prescription.spec,
        },
        moduleId: module.moduleId,
        journeyId,
      };
    }
  }

  if (weak.length) {
    const quiz = findActivity(activities, module.moduleId, 'practiceQuiz');
    if (quiz) {
      return {
        activityId: quiz.activityId,
        activityType: 'practiceQuiz',
        reasonCode: 'weak_concepts',
        prescriptionType: null,
        primaryMode: trapDebrief?.primaryMode ?? null,
        reason: `Practice weak concepts: ${weak.slice(0, 3).map((w) => w.term).join(', ')}`,
        estimatedMin: 15,
        label: ACTIVITY_LABELS.practiceQuiz,
        quizConfig: {
          questionCount: 5,
          focusPreset: 'weakSpots',
        },
        flashcardMode: null,
        mixedPhrasing: false,
        timed: false,
        prescription: null,
        moduleId: module.moduleId,
        journeyId,
      };
    }
  }

  if (accuracy >= 80) {
    const next = findActivity(activities, module.moduleId, 'feynman')
      ?? findActivity(activities, module.moduleId, 'freeRecall')
      ?? findActivity(activities, module.moduleId, 'flashcardSet');
    if (next) {
      return {
        activityId: next.activityId,
        activityType: next.type,
        reasonCode: next.type === 'feynman' ? 'mastery_feynman' : 'mastery_free_recall',
        prescriptionType: null,
        primaryMode: null,
        reason: 'Strong quiz score. Move to retrieval practice.',
        estimatedMin: estimateMinutes(next.type),
        label: ACTIVITY_LABELS[next.type] ?? next.type,
        quizConfig: null,
        flashcardMode: next.type === 'flashcardSet' ? 'due' : null,
        mixedPhrasing: false,
        timed: false,
        prescription: null,
        moduleId: module.moduleId,
        journeyId,
      };
    }
  }

  const quiz = findActivity(activities, module.moduleId, 'practiceQuiz');
  if (!quiz) return null;

  const modeMeta = trapDebrief?.cumulativePrimaryMode
    ? getFailureModeMeta(trapDebrief.cumulativePrimaryMode)
    : null;

  return {
    activityId: quiz.activityId,
    activityType: 'practiceQuiz',
    reasonCode: 'scheduled_quiz',
    prescriptionType: null,
    primaryMode: trapDebrief?.cumulativePrimaryMode ?? null,
    reason: modeMeta
      ? `Another short quiz to keep working on ${modeMeta.title.toLowerCase()}`
      : 'Another short practice quiz to lock this in',
    estimatedMin: 15,
    label: ACTIVITY_LABELS.practiceQuiz,
    quizConfig: {
      questionCount: 5,
      focusPreset: accuracy < 70 ? 'weakSpots' : 'fullReview',
    },
    flashcardMode: null,
    mixedPhrasing: false,
    timed: false,
    prescription: null,
    moduleId: module.moduleId,
    journeyId,
  };
}
