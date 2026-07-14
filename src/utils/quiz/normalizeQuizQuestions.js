import { ensureUniqueQuestionIds } from '@/utils/study/quizDedup';
import { extractAiList, coerceStudyAiPayload } from '@/utils/study/normalizeStudyAiResponse';
import { resolveCorrectAnswer } from '@/utils/study/resolveCorrectAnswer';
import { isQuestionType } from '@/utils/quiz/questionTypes';
import { parseQuizQuestion } from '@/utils/quiz/questionSchemas';

function shuffleItems(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function inferQuestionType(q) {
  if (isQuestionType(q.type)) return q.type;
  const opts = (q.options ?? []).map((o) => String(o).trim().toLowerCase());
  if (opts.length === 2 && opts.includes('true') && opts.includes('false')) {
    return 'trueFalse';
  }
  if (q.leftItems?.length && q.rightItems?.length) return 'matching';
  if (q.items?.length || Array.isArray(q.correctAnswer) && q.correctAnswer.length > 1 && !q.options?.length) {
    if (q.type === 'ordering' || q.items?.length) return 'ordering';
  }
  if (Array.isArray(q.correctAnswer) && q.options?.length) return 'multiSelect';
  if (q.type === 'shortAnswer') return 'shortAnswer';
  return 'multipleChoice';
}

function normalizeOptions(options, type) {
  if (type === 'trueFalse') return ['True', 'False'];
  const opts = (options ?? []).map((o) => String(o).trim()).filter(Boolean);
  if (type !== 'multipleChoice') return opts.length ? opts : undefined;
  while (opts.length < 4) opts.push(`Option ${opts.length + 1}`);
  return opts.slice(0, 4);
}

function buildBaseQuestion(q, index, type, { moduleTargets } = {}) {
  const stem = String(q.stem ?? q.question ?? q.prompt ?? '').trim();
  let moduleId = q.moduleId ? String(q.moduleId) : undefined;
  if (!moduleId && moduleTargets?.length) {
    let cursor = 0;
    for (const t of moduleTargets) {
      cursor += t.count;
      if (index < cursor) {
        moduleId = t.moduleId;
        break;
      }
    }
  }

  return {
    id: String(q.id ?? `pq-${index + 1}`).trim(),
    type,
    stem,
    explanation: String(q.explanation ?? q.rationale ?? '').trim() || 'Review the key concepts.',
    conceptId: q.conceptId ? String(q.conceptId) : undefined,
    moduleId: moduleId ?? (q.moduleId ? String(q.moduleId) : undefined),
    variantType: q.variantType,
    mixCategory: q.mixCategory,
  };
}

function normalizeOneQuestion(q, index, context = {}) {
  const type = inferQuestionType(q);
  const base = buildBaseQuestion(q, index, type, context);

  if (type === 'matching') {
    const leftItems = (q.leftItems ?? q.terms ?? []).map((s) => String(s).trim()).filter(Boolean);
    const rightItems = (q.rightItems ?? q.definitions ?? []).map((s) => String(s).trim()).filter(Boolean);
    const correctAnswer = q.correctAnswer && typeof q.correctAnswer === 'object' && !Array.isArray(q.correctAnswer)
      ? Object.fromEntries(Object.entries(q.correctAnswer).map(([k, v]) => [String(k), String(v)]))
      : {};
    if (!Object.keys(correctAnswer).length && leftItems.length && rightItems.length) {
      leftItems.forEach((left, i) => {
        if (rightItems[i]) correctAnswer[left] = rightItems[i];
      });
    }
    return parseQuizQuestion({
      ...base,
      leftItems,
      rightItems: shuffleItems(rightItems),
      correctAnswer,
    });
  }

  if (type === 'ordering') {
    const rawItems = q.items ?? q.options ?? (Array.isArray(q.correctAnswer) ? q.correctAnswer : []);
    const items = (Array.isArray(rawItems) ? rawItems : []).map((s) => String(s).trim()).filter(Boolean);
    const correctOrder = (Array.isArray(q.correctAnswer) ? q.correctAnswer : items)
      .map((s) => String(s).trim())
      .filter(Boolean);
    return parseQuizQuestion({
      ...base,
      items: items.length ? items : correctOrder,
      options: shuffleItems(items.length ? items : correctOrder),
      correctAnswer: correctOrder,
    });
  }

  if (type === 'multiSelect') {
    const opts = normalizeOptions(q.options, 'multipleChoice') ?? [];
    const rawCorrect = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
    const correctAnswer = rawCorrect
      .map((ans) => resolveCorrectAnswer(ans, opts) ?? String(ans).trim())
      .filter(Boolean);
    return parseQuizQuestion({
      ...base,
      type: 'multiSelect',
      options: opts,
      correctAnswer,
    });
  }

  if (type === 'shortAnswer') {
    const correctAnswer = String(q.correctAnswer ?? q.answer ?? '').trim();
    return parseQuizQuestion({
      ...base,
      correctAnswer,
      acceptableAnswers: (q.acceptableAnswers ?? []).map((s) => String(s).trim()).filter(Boolean),
      matchMode: q.matchMode === 'exact' ? 'exact' : 'fuzzy',
    });
  }

  const options = normalizeOptions(q.options, type);
  const rawCorrect = q.correctAnswer ?? q.answer ?? q.correct ?? options?.[0];
  const correctAnswer = resolveCorrectAnswer(rawCorrect, options) ?? options?.[0];

  return parseQuizQuestion({
    ...base,
    options,
    correctAnswer,
  });
}

/**
 * Normalize AI or bank quiz output for QuizRunner.
 */
export function normalizeQuizQuestions(raw, questionCount, context = {}) {
  const coerced = coerceStudyAiPayload('generatePracticeQuestions', raw);
  const list = extractAiList(coerced, 'questions');
  if (!list.length) return [];

  const normalized = list
    .slice(0, questionCount)
    .map((q, index) => normalizeOneQuestion(q, index, context))
    .filter(Boolean);

  return ensureUniqueQuestionIds(normalized);
}
