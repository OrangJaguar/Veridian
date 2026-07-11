import { invokeWithRetry } from '@/utils/ai/invokeWithRetry';
import { generatePracticeQuestions } from '@/api/ai/study';
import { generateCramSession } from '@/api/ai/study';
import { generateJourneyChallenge } from '@/api/ai/study';
import { generateInterleavedQuestions } from '@/api/ai/study';

/**
 * All quiz modes generate the full question set in ONE AI call
 * (DeepSeek handles the full count reliably; the old 5-question batching
 * existed for Gemma output limits). Options like onBatch/existingQuestions
 * from the batched era are accepted and ignored for caller compatibility.
 */
async function generateAllQuestions(generateFn, payload) {
  const questionCount = Number(payload.questionCount ?? 10);
  const raw = await invokeWithRetry((signal) => generateFn({ ...payload, questionCount }, { signal }));
  const questions = raw.questions ?? [];
  if (!questions.length) {
    throw new Error('AI returned no questions. Try again.');
  }
  return { ...raw, questions: questions.slice(0, questionCount) };
}

export function generatePracticeQuestionsBatched(payload, _options = {}) {
  return generateAllQuestions(generatePracticeQuestions, payload);
}

export function generateCramSessionProgressive(payload, _options = {}) {
  return generateAllQuestions(generateCramSession, payload);
}

export function generateJourneyChallengeProgressive(payload, _options = {}) {
  return generateAllQuestions(generateJourneyChallenge, payload);
}

export function generateInterleavedQuestionsProgressive(payload, _options = {}) {
  return generateAllQuestions(generateInterleavedQuestions, payload);
}
