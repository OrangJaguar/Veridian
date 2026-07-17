/**
 * Aggregate practice-quiz answers into per-concept results.
 * Pure and deterministic. Does not invent concepts missing from the knowledge map
 * unless they appear on questions.
 */
export function aggregateQuizConceptResults({
  questions = [],
  answers = [],
  concepts = [],
} = {}) {
  const conceptById = {};
  for (const c of concepts) {
    const id = c.id ?? c.conceptId;
    if (!id) continue;
    conceptById[id] = c;
  }

  const answerById = {};
  for (const a of answers) {
    if (a?.questionId) answerById[a.questionId] = a;
  }

  const buckets = {};

  for (const q of questions) {
    const conceptId = q.conceptId;
    if (!conceptId) continue;
    if (!buckets[conceptId]) {
      buckets[conceptId] = {
        conceptId,
        term: conceptById[conceptId]?.term ?? conceptId,
        attempts: 0,
        correct: 0,
        skipped: 0,
        timeSum: 0,
        timeCount: 0,
        questionIds: [],
      };
    }
    const bucket = buckets[conceptId];
    const ans = answerById[q.id];
    bucket.questionIds.push(q.id);

    if (!ans || ans.skipped) {
      bucket.skipped += 1;
      continue;
    }

    bucket.attempts += 1;
    if (ans.correct) bucket.correct += 1;
    if (typeof ans.timeSec === 'number') {
      bucket.timeSum += ans.timeSec;
      bucket.timeCount += 1;
    }
  }

  return Object.values(buckets).map((b) => {
    const accuracy = b.attempts > 0
      ? Math.round((b.correct / b.attempts) * 100)
      : null;
    return {
      conceptId: b.conceptId,
      term: b.term,
      attempts: b.attempts,
      correct: b.correct,
      skipped: b.skipped,
      accuracy,
      avgTimeSec: b.timeCount
        ? Math.round((b.timeSum / b.timeCount) * 10) / 10
        : null,
      status: statusForConcept(accuracy, b.attempts, b.skipped),
      questionIds: b.questionIds,
    };
  }).sort((a, b) => {
    const rank = { needs_work: 0, shaky: 1, skipped: 2, solid: 3 };
    return (rank[a.status] ?? 9) - (rank[b.status] ?? 9)
      || (a.accuracy ?? 101) - (b.accuracy ?? 101)
      || a.term.localeCompare(b.term);
  });
}

function statusForConcept(accuracy, attempts, skipped) {
  if (attempts === 0) return 'skipped';
  if (accuracy == null) return 'skipped';
  if (accuracy >= 80 && attempts >= 1) return 'solid';
  if (accuracy >= 50) return 'shaky';
  return 'needs_work';
}

export function weakConceptIdsFromResults(conceptResults = []) {
  return conceptResults
    .filter((r) => r.status === 'needs_work' || r.status === 'shaky')
    .map((r) => r.conceptId);
}

export function strongConceptIdsFromResults(conceptResults = []) {
  return conceptResults
    .filter((r) => r.status === 'solid')
    .map((r) => r.conceptId);
}
