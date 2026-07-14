import { resolveModulePrescription } from '@/utils/failures/resolveModulePrescription';
import { getPrescriptionForMode, PRESCRIPTION_TYPES } from '@/utils/failures/prescriptionMatrix';
import { EMERGING_EVIDENCE_HITS } from '@/utils/failures/constants';

const ACTIVITY_FIELD = {
  learningGuide: 'learningGuideActivity',
  practiceQuiz: 'practiceQuizActivity',
  flashcardSet: 'flashcardActivity',
  feynman: 'feynmanActivity',
  freeRecall: 'freeRecallActivity',
};

export const RX_REASON_BY_PRESCRIPTION_TYPE = {
  [PRESCRIPTION_TYPES.understanding_guide]: 'rx_understanding_guide',
  [PRESCRIPTION_TYPES.understanding_quiz]: 'rx_understanding_quiz',
  [PRESCRIPTION_TYPES.transfer_drill]: 'rx_transfer_drill',
  [PRESCRIPTION_TYPES.verbatim_variation]: 'rx_verbatim_variation',
  [PRESCRIPTION_TYPES.verbatim_flashcards]: 'rx_verbatim_flashcards',
  [PRESCRIPTION_TYPES.interference_discrimination]: 'rx_interference_discrimination',
  [PRESCRIPTION_TYPES.pressure_timed_drill]: 'rx_pressure_timed_drill',
  [PRESCRIPTION_TYPES.retention_spaced_review]: 'rx_retention_spaced_review',
};

const VERBATIM_FLASHCARDS_SPEC = {
  prescriptionType: PRESCRIPTION_TYPES.verbatim_flashcards,
  activityType: 'flashcardSet',
  flashcardMode: 'due',
  mixedPhrasing: true,
};

function reasonCodeForSpec(spec) {
  return RX_REASON_BY_PRESCRIPTION_TYPE[spec?.prescriptionType] ?? 'scheduled_quiz';
}

function activityForType(ctx, activityType) {
  const field = ACTIVITY_FIELD[activityType];
  return field ? ctx[field] ?? null : null;
}

function buildQuizConfigFromSpec(spec) {
  if (spec?.activityType !== 'practiceQuiz') return null;
  const config = {
    questionCount: 5,
    focusPreset: 'weakSpots',
    prescriptionDriven: true,
  };
  if (spec.timed) {
    config.strictTimedMode = true;
    config.timedMode = true;
    config.strictMode = true;
    config.instantFeedback = false;
  }
  return config;
}

function buildPrescriptionPayload(resolved, spec) {
  return {
    prescriptionType: spec.prescriptionType,
    primaryMode: resolved.primaryMode,
    summary: resolved.summary,
    spec,
  };
}

function resolveWithFatigue(ctx, options = {}) {
  const resolved = resolveModulePrescription(ctx.module);
  if (!resolved.shouldApply || !resolved.spec) return resolved;

  const moduleId = ctx.module?.moduleId;
  const weekTypes = options.moduleWeekPrescriptionTypes?.[moduleId] ?? [];
  const currentType = resolved.spec.prescriptionType;
  const repeatCount = weekTypes.filter((t) => t === currentType).length;

  if (repeatCount >= 2 && resolved.profile?.secondaryMode) {
    const secondary = resolved.profile.rankedModes?.find(
      (m) => m.modeId === resolved.profile.secondaryMode && m.rawHits >= EMERGING_EVIDENCE_HITS,
    );
    if (secondary) {
      const altSpec = getPrescriptionForMode(secondary.modeId, resolved.stage);
      const altActivity = activityForType(ctx, altSpec?.activityType);
      if (altSpec && altActivity) {
        return {
          ...resolved,
          primaryMode: secondary.modeId,
          spec: altSpec,
          summary: resolved.summary,
          fatigueRotated: true,
        };
      }
    }
  }

  if (
    resolved.primaryMode === 'verbatim_trap'
    && resolved.spec.prescriptionType === PRESCRIPTION_TYPES.verbatim_variation
    && options.preferFlashcards
    && ctx.flashcardActivity
  ) {
    return {
      ...resolved,
      spec: VERBATIM_FLASHCARDS_SPEC,
      summary: 'Flashcards with mixed phrasing',
    };
  }

  return resolved;
}

/**
 * Pick a prescription-driven assignment for a module context.
 * Returns null when no prescription applies or required activity is missing.
 */
export function pickPrescriptionAssignment(ctx, options = {}) {
  if (ctx.stage === 'A' && !ctx.guideComplete) {
    return null;
  }

  const resolved = resolveWithFatigue(ctx, options);
  if (!resolved.shouldApply || !resolved.spec) return null;

  let spec = { ...resolved.spec };

  const activity = activityForType(ctx, spec.activityType);
  if (!activity) return null;

  return {
    activity,
    activityType: spec.activityType,
    reasonCode: reasonCodeForSpec(spec),
    prescriptionType: spec.prescriptionType,
    primaryMode: resolved.primaryMode,
    prescriptionSummary: resolved.summary,
    prescription: buildPrescriptionPayload(resolved, spec),
    quizConfig: buildQuizConfigFromSpec(spec),
    flashcardMode: spec.flashcardMode ?? null,
    mixedPhrasing: spec.mixedPhrasing ?? false,
    timed: spec.timed ?? false,
    prescriptionDriven: true,
  };
}
