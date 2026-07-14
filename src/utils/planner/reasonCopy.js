const REASON_COPY = {
  guide_not_started: 'Start the learning guide for {module}',
  guide_in_progress: 'Continue the learning guide for {module}',
  weak_concepts: 'Recent quiz misses on {module} — practice quiz',
  struggling_quiz: 'Quiz scores are low on {module}',
  scheduled_quiz: 'Scheduled practice quiz for {module}',
  flashcard_review: 'Flashcard review for {module}',
  fallback_quiz: 'Practice quiz for {module}',
  mastery_feynman: 'Explain concepts aloud — Feynman for {module}',
  mastery_free_recall: 'Free recall brain dump for {module}',
  fallback_spread: 'Catch up on {module}',
  min_touch: 'Keep momentum on {module}',
  exam_urgency: 'Exam soon — prioritizing {module}',
  diagnostic_weakest_signal: 'Diagnostic priority on {module}',
  profile_focus: 'Confirmed learning pattern on {module}',
  rx_understanding_guide: 'Core concepts for {module} — learning guide',
  rx_understanding_quiz: 'Foundational gaps on {module} — targeted quiz',
  rx_transfer_drill: 'Transfer fix for {module} — new-scenario practice',
  rx_verbatim_variation: 'Wording variation drill for {module}',
  rx_verbatim_flashcards: 'Mixed phrasing flashcards for {module}',
  rx_interference_discrimination: 'Discrimination practice for {module}',
  rx_pressure_timed_drill: 'Timed drill for {module} — build exam readiness',
  rx_retention_spaced_review: 'Spaced review for {module} — lapsing material',
};

export function formatReasonCopy(reasonCode, { moduleName, concepts } = {}) {
  const template = REASON_COPY[reasonCode] ?? 'Study {module}';
  return template
    .replace('{module}', moduleName ?? 'this module')
    .replace('{concepts}', concepts?.join(', ') ?? '');
}

export function formatPrescriptionReasonCopy({
  reasonCode,
  moduleName,
  prescriptionSummary,
  includeModule = false,
}) {
  if (prescriptionSummary) {
    return includeModule && moduleName
      ? `${prescriptionSummary} · ${moduleName}`
      : prescriptionSummary;
  }
  return formatReasonCopy(reasonCode, { moduleName });
}

export function formatWeekStrategy(strategy) {
  return strategy ?? '';
}
