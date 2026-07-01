export const QUIZ_BATCH_SIZE = 5;

export function quizBatchCount(questionCount) {
  const count = Number(questionCount ?? 10);
  return count <= QUIZ_BATCH_SIZE ? 1 : Math.ceil(count / QUIZ_BATCH_SIZE);
}

/**
 * Resume state for batched quiz AI generation stored on the session.
 */
export function getQuizGenerationResume(sessionData) {
  const ai = sessionData?.aiGeneration;
  if (ai?.status !== 'generating' || !ai?.partialQuestions?.length) {
    return { existingQuestions: [], startBatchIndex: 0, batchProgress: null };
  }

  const completed = ai.completedBatches ?? 0;
  const total = ai.totalBatches ?? quizBatchCount(ai.questionCount);
  return {
    existingQuestions: ai.partialQuestions,
    startBatchIndex: completed,
    batchProgress: completed > 0 && total > 0
      ? { completed, total, label: 'batches' }
      : null,
  };
}

export function buildPartialQuizGenerationPatch(setupConfig, normalizedQuestions, batchNum, totalBatches) {
  return {
    quizConfig: setupConfig,
    aiGeneration: {
      status: 'generating',
      partialQuestions: normalizedQuestions,
      completedBatches: batchNum,
      totalBatches,
      questionCount: setupConfig.questionCount,
      updatedAt: Date.now(),
    },
  };
}

export function partialQuestionsFromChunkError(err, questionCount) {
  if (!err?.partialResults?.length) return null;
  return err.partialResults.flat().slice(0, Number(questionCount ?? 100));
}

export function batchProgressFromChunkError(err, questionCount) {
  const total = quizBatchCount(questionCount);
  const completed = err?.failedChunkIndex ?? err?.partialResults?.length ?? 0;
  if (!completed || !total) return null;
  return { completed, total, label: 'batches' };
}
