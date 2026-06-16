/**
 * Aggregate per-module accuracy from challenge answers.
 */
export function computePerModuleAccuracy(questions, answers) {
  const byModule = {};
  const answerMap = {};
  for (const a of answers) {
    if (a?.questionId) answerMap[a.questionId] = a;
  }

  for (const q of questions) {
    const mid = q.moduleId;
    if (!mid) continue;
    if (!byModule[mid]) byModule[mid] = { correct: 0, total: 0 };
    byModule[mid].total += 1;
    const ans = answerMap[q.id];
    if (ans?.correct) byModule[mid].correct += 1;
  }

  const result = {};
  for (const [moduleId, { correct, total }] of Object.entries(byModule)) {
    result[moduleId] = total > 0 ? Math.round((correct / total) * 100) : 0;
  }
  return result;
}

function resolveConceptLabel(conceptId, modules) {
  for (const mod of modules) {
    const concepts = mod.knowledgeMap?.concepts ?? [];
    const match = concepts.find((c) => c.id === conceptId || c.conceptId === conceptId);
    if (match?.term) return match.term;
    if (match?.name) return match.name;
    if (match?.label) return match.label;
  }
  return conceptId;
}

/**
 * Top missed concept label per module.
 */
export function computePerModuleMissedConcept(questions, answers, modules = []) {
  const answerMap = {};
  for (const a of answers) {
    if (a?.questionId) answerMap[a.questionId] = a;
  }

  const misses = {};
  for (const q of questions) {
    const mid = q.moduleId;
    const ans = answerMap[q.id];
    if (!mid || !ans || ans.correct || !q.conceptId) continue;
    if (!misses[mid]) misses[mid] = {};
    misses[mid][q.conceptId] = (misses[mid][q.conceptId] ?? 0) + 1;
  }

  const result = {};
  for (const [moduleId, counts] of Object.entries(misses)) {
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (top) result[moduleId] = resolveConceptLabel(top[0], modules);
  }
  return result;
}

export function computeHardestConcept(questions, answers, modules = []) {
  const answerMap = {};
  for (const a of answers) {
    if (a?.questionId) answerMap[a.questionId] = a;
  }
  const misses = {};
  for (const q of questions) {
    const ans = answerMap[q.id];
    if (!ans || ans.correct || !q.conceptId) continue;
    misses[q.conceptId] = (misses[q.conceptId] ?? 0) + 1;
  }
  const top = Object.entries(misses).sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  return resolveConceptLabel(top[0], modules);
}

export function accuracyDotClass(accuracy) {
  if (accuracy >= 75) return 'good';
  if (accuracy >= 50) return 'mid';
  return 'bad';
}
