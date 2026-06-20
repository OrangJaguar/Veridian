import { normalizeQuizQuestions } from '@/utils/study/normalizeQuizQuestions';

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Select practice questions from a pre-authored question bank (certified journeys).
 */
export function selectQuestionsFromBank(questionBank, setupConfig, { weakConceptIds = [] } = {}) {
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
  } else if (focusPreset === 'newMaterial') {
    pool = shuffle(valid);
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
