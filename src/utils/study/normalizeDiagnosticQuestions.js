/**
 * Normalize AI diagnostic output — force correct moduleId tags and ids.
 */
export function normalizeDiagnosticQuestions(rawQuestions, modules, perModule = 3) {
  const list = rawQuestions?.questions ?? rawQuestions;
  if (!Array.isArray(list)) return [];

  const moduleById = Object.fromEntries(modules.map((m) => [m.moduleId, m]));
  const moduleByName = Object.fromEntries(
    modules.map((m) => [String(m.name ?? '').trim().toLowerCase(), m]),
  );

  const resolveModuleId = (q) => {
    if (q?.moduleId && moduleById[q.moduleId]) return q.moduleId;
    const byName = moduleByName[String(q?.moduleName ?? q?.module ?? '').trim().toLowerCase()];
    if (byName) return byName.moduleId;
    return null;
  };

  const normalized = list.map((q, index) => {
    const moduleId = resolveModuleId(q);
    const type = q.type === 'trueFalse' || q.type === 'shortAnswer' ? q.type : 'multipleChoice';
    let options = q.options;
    if (type === 'trueFalse') options = ['True', 'False'];
    if (type === 'multipleChoice' && Array.isArray(options) && options.length < 4) {
      while (options.length < 4) options.push(`Option ${options.length + 1}`);
    }

    return {
      id: String(q.id ?? `diag-${moduleId ?? 'x'}-${index + 1}`).trim(),
      type,
      stem: String(q.stem ?? '').trim(),
      options,
      correctAnswer: q.correctAnswer,
      explanation: String(q.explanation ?? '').trim(),
      conceptId: q.conceptId ? String(q.conceptId) : undefined,
      moduleId,
    };
  }).filter((q) => q.stem && q.correctAnswer != null && q.moduleId);

  const byModule = Object.fromEntries(modules.map((m) => [m.moduleId, []]));
  for (const q of normalized) {
    byModule[q.moduleId]?.push(q);
  }

  const result = [];
  for (const mod of modules) {
    const bucket = byModule[mod.moduleId] ?? [];
    bucket.slice(0, perModule).forEach((q, i) => {
      result.push({
        ...q,
        id: q.id || `diag-${mod.moduleId}-${i + 1}`,
        moduleId: mod.moduleId,
      });
    });
  }
  return result;
}
