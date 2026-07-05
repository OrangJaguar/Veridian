/**
 * Per-concept untimed/timed performance and pressure delta.
 */

export function buildConceptPerformanceFromDiagnostic(questions, answers) {
  const answerByQuestionId = {};
  for (const ans of answers) {
    if (ans?.questionId) answerByQuestionId[ans.questionId] = ans;
  }

  const byConcept = {};
  for (const q of questions) {
    const conceptId = q.conceptId;
    if (!conceptId) continue;
    if (!byConcept[conceptId]) {
      byConcept[conceptId] = {
        conceptId,
        untimedAttempts: 0,
        untimedCorrect: 0,
        timedAttempts: 0,
        timedCorrect: 0,
      };
    }
    const entry = byConcept[conceptId];
    entry.untimedAttempts += 1;
    if (answerByQuestionId[q.id]?.correct) entry.untimedCorrect += 1;
  }

  return Object.values(byConcept).map((entry) => ({
    ...entry,
    pressureDelta: computePressureDelta(entry),
  }));
}

export function mergeTimedConceptPerformance(existing, questions, answers) {
  const answerByQuestionId = {};
  for (const ans of answers) {
    if (ans?.questionId) answerByQuestionId[ans.questionId] = ans;
  }

  const byConcept = Object.fromEntries(
    (existing ?? []).map((c) => [c.conceptId, { ...c }]),
  );

  for (const q of questions) {
    const conceptId = q.conceptId;
    if (!conceptId) continue;
    if (!byConcept[conceptId]) {
      byConcept[conceptId] = {
        conceptId,
        untimedAttempts: 0,
        untimedCorrect: 0,
        timedAttempts: 0,
        timedCorrect: 0,
      };
    }
    const entry = byConcept[conceptId];
    entry.timedAttempts += 1;
    if (answerByQuestionId[q.id]?.correct) entry.timedCorrect += 1;
  }

  return Object.values(byConcept).map((entry) => ({
    ...entry,
    pressureDelta: computePressureDelta(entry),
  }));
}

export function computePressureDelta(entry) {
  if (!entry.timedAttempts || !entry.untimedAttempts) return null;
  const timedAcc = Math.round((entry.timedCorrect / entry.timedAttempts) * 100);
  const untimedAcc = Math.round((entry.untimedCorrect / entry.untimedAttempts) * 100);
  return timedAcc - untimedAcc;
}

export function parseDiagnosticSummary(journey) {
  if (!journey?.diagnosticSummary) return null;
  try {
    return JSON.parse(journey.diagnosticSummary);
  } catch {
    return null;
  }
}

export function updateJourneyDiagnosticProfile(journeyId, conceptPerformance) {
  return import('@/api/entities/journeys').then(({ getJourney, updateJourney }) =>
    getJourney(journeyId).then((journey) => {
      const summary = parseDiagnosticSummary(journey);
      if (!summary) return null;
      const next = {
        ...summary,
        conceptPerformance,
        profile: {
          ...summary.profile,
          pressureReadiness: computePressureReadiness(conceptPerformance),
        },
      };
      return updateJourney(journeyId, { diagnosticSummary: JSON.stringify(next) });
    }),
  );
}

export function computePressureReadiness(conceptPerformance) {
  const withDelta = (conceptPerformance ?? []).filter((c) => c.pressureDelta != null);
  if (!withDelta.length) return null;
  const avgDelta = withDelta.reduce((sum, c) => sum + c.pressureDelta, 0) / withDelta.length;
  return Math.max(0, Math.min(100, Math.round(100 + avgDelta)));
}
