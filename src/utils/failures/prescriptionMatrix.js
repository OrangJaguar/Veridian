import { FAILURE_MODE_IDS } from '@/utils/failures/constants';

/** Prescription types — execution in Plan 2+. */
export const PRESCRIPTION_TYPES = {
  understanding_guide: 'understanding_guide',
  understanding_quiz: 'understanding_quiz',
  transfer_drill: 'transfer_drill',
  verbatim_variation: 'verbatim_variation',
  verbatim_flashcards: 'verbatim_flashcards',
  interference_discrimination: 'interference_discrimination',
  pressure_timed_drill: 'pressure_timed_drill',
  retention_spaced_review: 'retention_spaced_review',
};

const STAGES = ['A', 'B', 'C'];

/**
 * failureMode × stage → prescription spec (static config).
 */
const MATRIX = {
  understanding_gap: {
    A: { prescriptionType: PRESCRIPTION_TYPES.understanding_guide, activityType: 'learningGuide' },
    B: { prescriptionType: PRESCRIPTION_TYPES.understanding_quiz, activityType: 'practiceQuiz', questionMix: { understanding: 5 } },
    C: { prescriptionType: PRESCRIPTION_TYPES.understanding_quiz, activityType: 'feynman' },
  },
  verbatim_trap: {
    A: { prescriptionType: PRESCRIPTION_TYPES.understanding_guide, activityType: 'learningGuide' },
    B: { prescriptionType: PRESCRIPTION_TYPES.verbatim_variation, activityType: 'practiceQuiz', questionMix: { application: 3, transfer: 2 } },
    C: { prescriptionType: PRESCRIPTION_TYPES.verbatim_variation, activityType: 'feynman' },
  },
  transfer_failure: {
    A: { prescriptionType: PRESCRIPTION_TYPES.understanding_guide, activityType: 'learningGuide' },
    B: { prescriptionType: PRESCRIPTION_TYPES.transfer_drill, activityType: 'practiceQuiz', questionMix: { transfer: 4, application: 1 } },
    C: { prescriptionType: PRESCRIPTION_TYPES.transfer_drill, activityType: 'freeRecall' },
  },
  interference: {
    A: { prescriptionType: PRESCRIPTION_TYPES.understanding_guide, activityType: 'learningGuide' },
    B: { prescriptionType: PRESCRIPTION_TYPES.interference_discrimination, activityType: 'practiceQuiz', questionMix: { discrimination: 5 } },
    C: { prescriptionType: PRESCRIPTION_TYPES.interference_discrimination, activityType: 'feynman' },
  },
  pressure_collapse: {
    A: { prescriptionType: PRESCRIPTION_TYPES.understanding_guide, activityType: 'learningGuide' },
    B: { prescriptionType: PRESCRIPTION_TYPES.pressure_timed_drill, activityType: 'practiceQuiz', timed: true, questionMix: { review: 5 } },
    C: { prescriptionType: PRESCRIPTION_TYPES.pressure_timed_drill, activityType: 'practiceQuiz', timed: true },
  },
  retention_decay: {
    A: { prescriptionType: PRESCRIPTION_TYPES.understanding_guide, activityType: 'learningGuide' },
    B: { prescriptionType: PRESCRIPTION_TYPES.retention_spaced_review, activityType: 'flashcardSet', flashcardMode: 'due' },
    C: { prescriptionType: PRESCRIPTION_TYPES.retention_spaced_review, activityType: 'flashcardSet', flashcardMode: 'due' },
  },
};

export function getPrescriptionForMode(modeId, stage = 'B') {
  const stageKey = STAGES.includes(stage) ? stage : 'B';
  return MATRIX[modeId]?.[stageKey] ?? null;
}

const SUMMARY_COPY = {
  understanding_guide: 'Revisit the learning guide for core concepts',
  understanding_quiz: 'Targeted quiz on foundational gaps',
  transfer_drill: 'Practice applying ideas in new scenarios',
  verbatim_variation: 'Questions with varied wording on the same concepts',
  verbatim_flashcards: 'Flashcards with mixed phrasing',
  interference_discrimination: 'Side-by-side practice on easily confused topics',
  pressure_timed_drill: 'Short timed drill to build exam readiness',
  retention_spaced_review: 'Spaced review of lapsing material',
};

export function getPrescriptionSummary(spec) {
  if (!spec?.prescriptionType) return 'Personalized study session';
  return SUMMARY_COPY[spec.prescriptionType] ?? 'Personalized study session';
}

export function getFullPrescriptionMatrix() {
  return MATRIX;
}

export function allMatrixCellsFilled() {
  return FAILURE_MODE_IDS.every((modeId) =>
    STAGES.every((stage) => Boolean(MATRIX[modeId]?.[stage])),
  );
}
