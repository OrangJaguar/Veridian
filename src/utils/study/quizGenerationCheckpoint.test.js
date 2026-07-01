import { describe, expect, it } from 'vitest';
import {
  buildPartialQuizGenerationPatch,
  getQuizGenerationResume,
  quizBatchCount,
} from './quizGenerationCheckpoint';

describe('quizGenerationCheckpoint', () => {
  it('computes batch count for common quiz sizes', () => {
    expect(quizBatchCount(5)).toBe(1);
    expect(quizBatchCount(10)).toBe(2);
    expect(quizBatchCount(25)).toBe(5);
  });

  it('returns resume state from partial session data', () => {
    const sessionData = {
      quizConfig: { questionCount: 10 },
      aiGeneration: {
        status: 'generating',
        partialQuestions: [{ id: 'q1' }, { id: 'q2' }],
        completedBatches: 1,
        totalBatches: 2,
        questionCount: 10,
      },
    };

    const resume = getQuizGenerationResume(sessionData);
    expect(resume.existingQuestions).toHaveLength(2);
    expect(resume.startBatchIndex).toBe(1);
    expect(resume.batchProgress).toEqual({ completed: 1, total: 2, label: 'batches' });
  });

  it('builds partial generation patch', () => {
    const setupConfig = { questionCount: 10, focusPreset: 'weakSpots' };
    const questions = [{ id: 'q1' }];
    const patch = buildPartialQuizGenerationPatch(setupConfig, questions, 1, 2);

    expect(patch.quizConfig).toEqual(setupConfig);
    expect(patch.aiGeneration.status).toBe('generating');
    expect(patch.aiGeneration.partialQuestions).toEqual(questions);
    expect(patch.aiGeneration.completedBatches).toBe(1);
    expect(patch.aiGeneration.totalBatches).toBe(2);
  });
});
