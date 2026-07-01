import { invokeWithRetry } from '@/utils/ai/invokeWithRetry';
import { runChunkedGeneration } from '@/utils/ai/chunkedGeneration';
import { getActiveStudyAiTrace } from '@/utils/study/studyAiTrace';
import { QUIZ_BATCH_SIZE } from '@/utils/study/quizGenerationCheckpoint';
import { generatePracticeQuestions } from '@/api/ai/study';
import { generateCramSession } from '@/api/ai/study';
import { generateJourneyChallenge } from '@/api/ai/study';
import { generateInterleavedQuestions } from '@/api/ai/study';

const BATCH_SIZE = QUIZ_BATCH_SIZE;

function buildCompletedBatchSlices(questions, questionCount, completedBatches) {
  const slices = [];
  for (let batch = 0; batch < completedBatches; batch += 1) {
    const start = batch * BATCH_SIZE;
    const size = Math.min(BATCH_SIZE, questionCount - start);
    slices.push(questions.slice(start, start + size));
  }
  return slices;
}

/**
 * Generate practice-style questions in batches when count > 5.
 */
export async function generatePracticeQuestionsProgressive(
  generateFn,
  basePayload,
  { onBatch, existingQuestions = [], startBatchIndex = 0 } = {},
) {
  const questionCount = Number(basePayload.questionCount ?? 10);
  const priorQuestions = [...existingQuestions];

  if (questionCount <= BATCH_SIZE) {
    const raw = await invokeWithRetry((signal) => generateFn({ ...basePayload, questionCount }, { signal }));
    const questions = raw.questions ?? [];
    const all = [...priorQuestions, ...questions].slice(0, questionCount);
    onBatch?.(questions, 1, 1, all);
    return { questions: all };
  }

  const batchCount = Math.ceil(questionCount / BATCH_SIZE);
  const completedBatches = Math.min(
    startBatchIndex ?? Math.ceil(priorQuestions.length / BATCH_SIZE),
    batchCount,
  );
  const existingBatchResults = buildCompletedBatchSlices(priorQuestions, questionCount, completedBatches);

  const batchResults = await runChunkedGeneration({
    totalChunks: batchCount,
    existingResults: existingBatchResults,
    startIndex: completedBatches,
    tracePrefix: '1b_batch',
    trace: getActiveStudyAiTrace(),
    runChunk: async (batchIndex, priorBatchResults, signal) => {
      const questionsFromPrior = priorBatchResults.flat();
      const remaining = questionCount - questionsFromPrior.length;
      const batchSize = Math.min(BATCH_SIZE, remaining);
      if (batchSize <= 0) return [];

      const raw = await invokeWithRetry((signal) => generateFn({
        ...basePayload,
        questionCount: batchSize,
        batchIndex,
        batchCount,
        excludeStems: questionsFromPrior.map((q) => q.stem ?? q.question).filter(Boolean).slice(-20),
      }, { signal }));

      const batchQuestions = raw.questions ?? [];
      if (!batchQuestions.length) {
        throw new Error(`AI returned no questions for batch ${batchIndex + 1}.`);
      }
      return batchQuestions;
    },
    mapResult: (questions) => questions,
    onChunkComplete: (batchQuestions, index, total, allBatchResults) => {
      const allQuestions = allBatchResults.flat().slice(0, questionCount);
      onBatch?.(batchQuestions, index + 1, total, allQuestions);
    },
  });

  return { questions: batchResults.flat().slice(0, questionCount) };
}

export async function generateCramSessionProgressive(payload, options = {}) {
  const questionCount = Number(payload.questionCount ?? 10);
  if (questionCount <= BATCH_SIZE) {
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
  if (questionCount <= BATCH_SIZE) {
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
  if (questionCount <= BATCH_SIZE) {
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
  if (questionCount <= BATCH_SIZE) {
    return invokeWithRetry((signal) => generatePracticeQuestions(payload, { signal }));
  }
  return generatePracticeQuestionsProgressive(
    (p, opts) => generatePracticeQuestions({ ...payload, ...p }, opts),
    payload,
    options,
  );
}
