import { ensureUniqueQuestionIds } from '@/utils/study/quizDedup';
import { extractAiList, coerceStudyAiPayload } from '@/utils/study/normalizeStudyAiResponse';

function normalizeOptions(options, type) {
  if (type === 'trueFalse') return ['True', 'False'];
  const opts = (options ?? []).map((o) => String(o).trim()).filter(Boolean);
  if (type !== 'multipleChoice') return opts.length ? opts : undefined;
  while (opts.length < 4) opts.push(`Option ${opts.length + 1}`);
  return opts.slice(0, 4);
}

/**
 * Normalize AI quiz output for QuizRunner.
 */
export function normalizeQuizQuestions(raw, questionCount) {
  const coerced = coerceStudyAiPayload('generatePracticeQuestions', raw);
  const list = extractAiList(coerced, 'questions');
  if (!list.length) return [];

  const normalized = list.slice(0, questionCount).map((q, index) => {
    const type = q.type === 'trueFalse' || q.type === 'shortAnswer'
      ? q.type
      : 'multipleChoice';
    const options = normalizeOptions(q.options, type);
    const stem = String(q.stem ?? q.question ?? q.prompt ?? '').trim();
    const correctAnswer = q.correctAnswer ?? q.answer ?? q.correct ?? options?.[0];

    return {
      id: String(q.id ?? `pq-${index + 1}`).trim(),
      type,
      stem,
      options,
      correctAnswer,
      explanation: String(q.explanation ?? q.rationale ?? '').trim(),
      conceptId: q.conceptId ? String(q.conceptId) : undefined,
    };
  }).filter((q) => q.stem && q.correctAnswer != null);

  return ensureUniqueQuestionIds(normalized);
}
