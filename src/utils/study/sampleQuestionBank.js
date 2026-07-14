import { normalizeQuizQuestions } from '@/utils/quiz/normalizeQuizQuestions';
import { parseQuizQuestion } from '@/utils/quiz/questionSchemas';

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function slotMatchesQuestion(slot, question) {
  if (slot.type && question.type !== slot.type) return false;
  if (slot.mixCategory && question.mixCategory && question.mixCategory !== slot.mixCategory) return false;
  if (slot.variantType && question.variantType && question.variantType !== slot.variantType) return false;
  if (slot.conceptId && question.conceptId && question.conceptId !== slot.conceptId) return false;
  return true;
}

function scoreBankMatch(slot, question) {
  let score = 0;
  if (question.type === slot.type) score += 4;
  if (slot.mixCategory && question.mixCategory === slot.mixCategory) score += 3;
  if (slot.variantType && question.variantType === slot.variantType) score += 2;
  if (slot.conceptId && question.conceptId === slot.conceptId) score += 2;
  return score;
}

function normalizeBankItem(q) {
  const parsed = parseQuizQuestion(q);
  if (parsed) return parsed;
  return normalizeQuizQuestions({ questions: [q] }, 1)[0] ?? null;
}

/**
 * Fill composition slots from a pre-authored question bank.
 */
export function selectQuestionsFromCompositionPlan(questionBank, compositionPlan, {
  weakConceptIds = [],
} = {}) {
  const valid = (questionBank ?? [])
    .map(normalizeBankItem)
    .filter(Boolean);
  if (!valid.length || !compositionPlan?.slots?.length) return [];

  const used = new Set();
  const selected = [];

  for (const slot of compositionPlan.slots) {
    const candidates = shuffle(valid.filter((q) => !used.has(q.id)));
    const ranked = candidates
      .map((q) => ({ q, score: scoreBankMatch(slot, q) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    let pick = ranked[0]?.q;
    if (!pick && weakConceptIds.length && slot.conceptId) {
      pick = candidates.find((q) => q.conceptId === slot.conceptId);
    }
    if (!pick) {
      pick = candidates.find((q) => slotMatchesQuestion(slot, q)) ?? candidates[0];
    }
    if (!pick) continue;

    used.add(pick.id);
    selected.push({
      ...pick,
      mixCategory: pick.mixCategory ?? slot.mixCategory,
      variantType: pick.variantType ?? slot.variantType,
      conceptId: pick.conceptId ?? slot.conceptId,
    });
  }

  return selected;
}

/**
 * Select practice questions from a pre-authored question bank (certified journeys).
 */
export function selectQuestionsFromBank(questionBank, setupConfig, {
  weakConceptIds = [],
  compositionPlan,
} = {}) {
  if (compositionPlan?.slots?.length) {
    const composed = selectQuestionsFromCompositionPlan(questionBank, compositionPlan, { weakConceptIds });
    if (composed.length >= Math.min(setupConfig.questionCount, compositionPlan.slots.length)) {
      return composed.slice(0, setupConfig.questionCount);
    }
  }

  const valid = (questionBank ?? []).filter((q) => q?.stem && q?.correctAnswer != null);
  if (!valid.length) return [];

  const count = Math.min(Number(setupConfig.questionCount) || 10, valid.length);
  const { focusPreset } = setupConfig;

  let pool = valid;
  if (focusPreset === 'weakSpots' && weakConceptIds.length) {
    const weak = valid.filter((q) => q.conceptId && weakConceptIds.includes(q.conceptId));
    const rest = valid.filter((q) => !q.conceptId || !weakConceptIds.includes(q.conceptId));
    const weakTarget = Math.ceil(count * 0.6);
    const picked = [...shuffle(weak).slice(0, weakTarget), ...shuffle(rest)];
    pool = picked.length >= count ? picked : shuffle(valid);
  } else {
    pool = shuffle(valid);
  }

  const selected = pool.slice(0, count);
  return normalizeQuizQuestions({ questions: selected }, count);
}

export function shouldUseQuestionBank(journey, activity) {
  const bank = activity?.content?.questionBank;
  if (!bank?.length) return false;
  return journey?.isVeridianCertified === true || journey?.clonedFromVeridianCertified === true;
}
