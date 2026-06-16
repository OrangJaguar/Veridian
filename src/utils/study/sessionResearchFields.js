/**
 * Build optional research telemetry fields for Session records.
 * Pure helper — does not touch study/FSRS logic.
 */
export function buildSessionResearchFields({
  sessionData,
  outcomeSummary,
  startedAt,
  endedAt,
  status,
}) {
  const end = endedAt ?? Date.now();
  const start = startedAt ?? null;
  const sessionDurationMs = start ? Math.max(0, end - start) : undefined;

  const hintsUsed = typeof sessionData?.hintsUsed === 'number'
    ? sessionData.hintsUsed
    : undefined;

  const answers = Array.isArray(sessionData?.answers) ? sessionData.answers : [];
  const questionsAnswered = answers.length > 0 ? answers.length : undefined;

  let accuracyPercent = typeof outcomeSummary?.accuracy === 'number'
    ? outcomeSummary.accuracy
    : undefined;
  if (accuracyPercent == null && answers.length > 0) {
    const correct = answers.filter((a) => a.correct).length;
    accuracyPercent = Math.round((correct / answers.length) * 100);
  }

  const timePerQuestion = answers
    .map((a) => (typeof a.timeSec === 'number' ? Math.round(a.timeSec * 1000) : null))
    .filter((ms) => ms != null);

  const fields = {
    ...(sessionDurationMs != null ? { sessionDurationMs } : {}),
    ...(hintsUsed != null ? { hintsUsed } : {}),
    ...(questionsAnswered != null ? { questionsAnswered } : {}),
    ...(accuracyPercent != null ? { accuracyPercent } : {}),
    ...(timePerQuestion.length > 0 ? { timePerQuestion } : {}),
    ...(status === 'abandoned' ? { abandonedAt: end } : {}),
  };

  return fields;
}
