const STATUS_WEIGHT = {
  covered: 1,
  partial: 0.4,
  missed: 0,
  incorrect: 0,
};

const HINT_PENALTY_PER = 8;
const MAX_HINT_PENALTY = 24;

/**
 * Deterministic coverage from per-concept AI statuses.
 */
export function computeCoverageFromConcepts(conceptCoverage = []) {
  if (!conceptCoverage.length) return null;
  const total = conceptCoverage.reduce(
    (sum, c) => sum + (STATUS_WEIGHT[c.status] ?? 0),
    0,
  );
  return Math.round((total / conceptCoverage.length) * 100);
}

export function applyHintPenalty(coveragePercent, hintsUsed = 0) {
  const penalty = Math.min(MAX_HINT_PENALTY, hintsUsed * HINT_PENALTY_PER);
  return Math.max(0, Math.round(coveragePercent - penalty));
}

/**
 * Normalize AI free-recall grade output with server-side coverage math.
 */
export function finalizeFreeRecallGrade(raw, hintsUsed = 0) {
  const obj = raw && typeof raw === 'object' ? raw : {};
  const conceptCoverage = Array.isArray(obj.conceptCoverage) ? obj.conceptCoverage : [];
  const computed = computeCoverageFromConcepts(conceptCoverage);
  let coveragePercent = computed ?? Number(obj.coveragePercent ?? 0);
  coveragePercent = applyHintPenalty(coveragePercent, hintsUsed);

  const missedFromConcepts = conceptCoverage
    .filter((c) => c.status === 'missed' || c.status === 'incorrect')
    .map((c) => c.term || c.conceptId)
    .filter(Boolean);

  return {
    coveragePercent,
    coverageEstimate: String(obj.coverageEstimate ?? ''),
    conceptCoverage,
    missedIdeas: missedFromConcepts.length
      ? missedFromConcepts.slice(0, 6)
      : (obj.missedIdeas ?? []),
    incorrectIdeas: obj.incorrectIdeas ?? [],
    hintsUsedNote: String(obj.hintsUsedNote ?? ''),
    nextConceptToRevisit: String(obj.nextConceptToRevisit ?? ''),
    feedback: String(obj.feedback ?? ''),
  };
}
