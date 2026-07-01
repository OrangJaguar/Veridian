import { invokeWithRetry } from '@/utils/ai/invokeWithRetry';
import { generatePracticeQuestions } from '@/api/ai/study';
import { generateCramSession } from '@/api/ai/study';
import { generateJourneyChallenge } from '@/api/ai/study';
import { generateInterleavedQuestions } from '@/api/ai/study';

const BATCH_SIZE = 5;

/**
 * Generate practice-style questions in batches when count > 5.
 */
export async function generatePracticeQuestionsProgressive(
  generateFn,
  basePayload,
  { onBatch, existingQuestions = [] } = {},
) {
  const questionCount = Number(basePayload.questionCount ?? 10);
  const allQuestions = [...existingQuestions];

  if (questionCount <= BATCH_SIZE) {
    const raw = await invokeWithRetry((signal) => generateFn({ ...basePayload, questionCount }, { signal }));
    const questions = raw.questions ?? [];
    onBatch?.(questions, 1, 1, questions);
    return { questions };
  }

  const batchCount = Math.ceil(questionCount / BATCH_SIZE);
  let generated = allQuestions.length;

  for (let batch = 0; batch < batchCount; batch += 1) {
    const remaining = questionCount - generated;
    const batchSize = Math.min(BATCH_SIZE, remaining);
    if (batchSize <= 0) break;

    const raw = await invokeWithRetry((signal) => generateFn({
      ...basePayload,
      questionCount: batchSize,
      batchIndex: batch,
      batchCount,
      excludeStems: allQuestions.map((q) => q.stem ?? q.question).filter(Boolean).slice(-20),
    }, { signal }));

    const batchQuestions = raw.questions ?? [];
    if (!batchQuestions.length) {
      throw new Error(`AI returned no questions for batch ${batch + 1}.`);
    }
    allQuestions.push(...batchQuestions);
    generated = allQuestions.length;
    onBatch?.(batchQuestions, batch + 1, batchCount, allQuestions);
  }

  return { questions: allQuestions.slice(0, questionCount) };
}

export async function generateCramSessionProgressive(payload, options = {}) {
  const questionCount = Number(payload.questionCount ?? 10);
  if (questionCount <= 5) {
    return invokeWithRetry((signal) => generateCramSession(payload, { signal }));
  }
  return generatePracticeQuestionsProgressive(
    (p, opts) => generateCramSession({ ...payload, ...p }, opts),
    payload,
    options,
  );
}

export async function generateJourneyChallengeProgressive(payload, options = {}) {
  const questionCount = Number(payload.questionCount ?? 10);
  if (questionCount <= 5) {
    return invokeWithRetry((signal) => generateJourneyChallenge(payload, { signal }));
  }
  return generatePracticeQuestionsProgressive(
    (p, opts) => generateJourneyChallenge({ ...payload, ...p }, opts),
    payload,
    options,
  );
}

export async function generateInterleavedQuestionsProgressive(payload, options = {}) {
  const questionCount = Number(payload.questionCount ?? 10);
  if (questionCount <= 5) {
    return invokeWithRetry((signal) => generateInterleavedQuestions(payload, { signal }));
  }
  return generatePracticeQuestionsProgressive(
    (p, opts) => generateInterleavedQuestions({ ...payload, ...p }, opts),
    payload,
    options,
  );
}

export async function generatePracticeQuestionsBatched(payload, options = {}) {
  const questionCount = Number(payload.questionCount ?? 10);
  if (questionCount <= 5) {
    return invokeWithRetry((signal) => generatePracticeQuestions(payload, { signal }));
  }
  return generatePracticeQuestionsProgressive(
    (p, opts) => generatePracticeQuestions({ ...payload, ...p }, opts),
    payload,
    options,
  );
}
