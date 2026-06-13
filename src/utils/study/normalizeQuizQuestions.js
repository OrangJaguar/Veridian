import { ensureUniqueQuestionIds } from '@/utils/study/quizDedup';
import { extractAiList } from '@/utils/study/normalizeStudyAiResponse';

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
  const list = extractAiList(raw, 'questions');
  if (!list.length) return [];

  const normalized = list.slice(0, questionCount).map((q, index) => {
    const type = q.type === 'trueFalse' || q.type === 'shortAnswer'
      ? q.type
      : 'multipleChoice';
    const options = normalizeOptions(q.options, type);

    return {
      id: String(q.id ?? `pq-${index + 1}`).trim(),
      type,
      stem: String(q.stem ?? '').trim(),
      options,
      correctAnswer: q.correctAnswer,
      explanation: String(q.explanation ?? '').trim(),
      conceptId: q.conceptId ? String(q.conceptId) : undefined,
    };
  }).filter((q) => q.stem && q.correctAnswer != null);

  return ensureUniqueQuestionIds(normalized);
}
