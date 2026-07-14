import { buildLaunchSessionData } from '@/utils/planner/buildLaunchSessionData';
import { ACTIVITY_LABELS } from '@/utils/weeklyPlan/constants';

/**
 * Resolve a launchable item for the module profile "Start tonight's practice" CTA.
 * Prefers a matching Due Today item; otherwise builds a synthetic item from prescription + activities.
 *
 * @returns {null | {
 *   item: object,
 *   source: 'dueToday' | 'fallback',
 *   activityType: string,
 *   ctaLabel: string,
 * }}
 */
export function resolveTonightPrescriptionLaunch({
  moduleId,
  journeyId,
  journeyTitle,
  moduleName,
  prescription,
  dueItems = [],
  activities = [],
} = {}) {
  if (!moduleId || !journeyId || !prescription?.shouldApply || !prescription?.spec?.activityType) {
    return null;
  }

  const activityType = prescription.spec.activityType;
  const dueMatch = (dueItems ?? []).find((item) => {
    if (item.moduleId !== moduleId) return false;
    if (item.activityType !== activityType) return false;
    if (item.prescriptionDriven) return true;
    if (item.prescriptionType && prescription.spec.prescriptionType) {
      return item.prescriptionType === prescription.spec.prescriptionType;
    }
    return true;
  }) ?? (dueItems ?? []).find((item) => item.moduleId === moduleId && item.activityType === activityType);

  if (dueMatch) {
    return {
      item: dueMatch,
      source: 'dueToday',
      activityType,
      ctaLabel: activityType === 'learningGuide' ? "Continue tonight's practice" : "Start tonight's practice",
    };
  }

  const activity = (activities ?? []).find(
    (a) => a.moduleId === moduleId
      && a.type === activityType
      && a.status !== 'failed',
  );
  if (!activity) return null;

  let quizConfig = prescription.spec.quizConfig ?? null;
  if (!quizConfig && activityType === 'practiceQuiz') {
    quizConfig = {
      questionCount: 5,
      focusPreset: 'weakSpots',
      prescriptionDriven: true,
    };
    if (prescription.spec.timed) {
      quizConfig.strictTimedMode = true;
      quizConfig.timedMode = true;
      quizConfig.strictMode = true;
      quizConfig.instantFeedback = false;
    }
  }

  const item = {
    id: `rx-launch-${moduleId}-${activity.activityId}`,
    journeyId,
    journeyTitle: journeyTitle ?? '',
    moduleId,
    moduleName: moduleName ?? '',
    activityId: activity.activityId,
    activityType,
    activityLabel: ACTIVITY_LABELS[activityType] ?? activityType,
    prescriptionType: prescription.spec.prescriptionType ?? null,
    primaryMode: prescription.primaryMode ?? null,
    prescriptionSummary: prescription.summary ?? null,
    prescription: {
      prescriptionType: prescription.spec.prescriptionType,
      primaryMode: prescription.primaryMode ?? null,
      summary: prescription.summary ?? null,
      spec: prescription.spec,
    },
    quizConfig,
    flashcardMode: prescription.spec.flashcardMode ?? null,
    mixedPhrasing: Boolean(prescription.spec.mixedPhrasing),
    timed: Boolean(prescription.spec.timed),
    prescriptionDriven: true,
    estimatedMin: activityType === 'flashcardSet' ? 10 : 15,
  };

  // Ensure initialSessionData can be built
  buildLaunchSessionData(item);

  return {
    item,
    source: 'fallback',
    activityType,
    ctaLabel: activityType === 'learningGuide' ? "Continue tonight's practice" : "Start tonight's practice",
  };
}
