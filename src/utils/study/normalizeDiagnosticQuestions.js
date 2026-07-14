/**
 * Normalize AI diagnostic output — force correct moduleId tags and ids.
 */
import { extractAiList, coerceStudyAiPayload } from '@/utils/study/normalizeStudyAiResponse';
import { resolveCorrectAnswer } from '@/utils/study/resolveCorrectAnswer';

function extractQuestionList(rawQuestions) {
  if (Array.isArray(rawQuestions)) return rawQuestions;
  const coerced = coerceStudyAiPayload('generateDiagnosticQuestions', rawQuestions);
  return extractAiList(coerced, 'questions');
}

const VARIANT_TYPES = ['verbatim', 'application', 'transfer'];

export function normalizeDiagnosticQuestions(rawQuestions, modules, perModule = 3) {
  const list = extractQuestionList(rawQuestions);
  if (!list.length) return [];

  const moduleById = Object.fromEntries(modules.map((m) => [m.moduleId, m]));
  const moduleByName = Object.fromEntries(
    modules.map((m) => [String(m.name ?? '').trim().toLowerCase(), m]),
  );
  const singleModuleId = modules.length === 1 ? modules[0].moduleId : null;

  const resolveModuleId = (q) => {
    const rawId = String(q?.moduleId ?? '').trim();
    if (rawId && moduleById[rawId]) return rawId;
    if (rawId) {
      const byIdName = moduleByName[rawId.toLowerCase()];
      if (byIdName) return byIdName.moduleId;
    }
    const byName = moduleByName[String(q?.moduleName ?? q?.module ?? '').trim().toLowerCase()];
    if (byName) return byName.moduleId;
    if (singleModuleId) return singleModuleId;
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

    const rawCorrect = q.correctAnswer ?? q.answer ?? q.correct ?? options?.[0];
    const correctAnswer = resolveCorrectAnswer(rawCorrect, options) ?? options?.[0];

    return {
      id: String(q.id ?? `diag-${moduleId ?? 'x'}-${index + 1}`).trim(),
      type,
      stem: String(q.stem ?? q.question ?? q.prompt ?? '').trim(),
      options,
      correctAnswer,
      explanation: String(q.explanation ?? q.rationale ?? '').trim(),
      conceptId: q.conceptId ? String(q.conceptId) : undefined,
      moduleId,
      variantType: VARIANT_TYPES.includes(q.variantType) ? q.variantType : undefined,
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
        variantType: q.variantType ?? VARIANT_TYPES[i] ?? 'application',
      });
    });
  }
  return result;
}
