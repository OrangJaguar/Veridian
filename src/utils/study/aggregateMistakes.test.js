import { describe, it, expect } from 'vitest';
import { aggregateMistakes } from './aggregateMistakes';

const Q1 = { id: 'q1', stem: 'What is 2+2?', correctAnswer: '4', explanation: 'Basic math' };
const Q2 = { id: 'q2', stem: 'Capital of France?', correctAnswer: 'Paris', explanation: null };

function makeSession(overrides) {
  return {
    status: 'completed',
    activityType: 'practiceQuiz',
    journeyId: 'j1',
    startedAt: Date.now(),
    sessionData: { questions: [Q1, Q2], answers: [] },
    ...overrides,
  };
}

describe('aggregateMistakes', () => {
  it('returns empty for no sessions', () => {
    expect(aggregateMistakes([])).toEqual([]);
  });

  it('extracts wrong answers', () => {
    const s = makeSession({
      sessionData: {
        questions: [Q1],
        answers: [{ questionId: 'q1', correct: false, response: '5' }],
      },
    });
    const result = aggregateMistakes([s]);
    expect(result).toHaveLength(1);
    expect(result[0].stem).toBe('What is 2+2?');
    expect(result[0].userResponse).toBe('5');
    expect(result[0].correctAnswer).toBe('4');
  });

  it('deduplicates by stem', () => {
    const s1 = makeSession({
      startedAt: Date.now(),
      sessionData: {
        questions: [Q1],
        answers: [{ questionId: 'q1', correct: false, response: '5' }],
      },
    });
    const s2 = makeSession({
      startedAt: Date.now() - 10000,
      sessionData: {
        questions: [Q1],
        answers: [{ questionId: 'q1', correct: false, response: '3' }],
      },
    });
    const result = aggregateMistakes([s1, s2]);
    expect(result).toHaveLength(1);
  });

  it('filters by journeyId when provided', () => {
    const s1 = makeSession({ journeyId: 'j1' });
    s1.sessionData = {
      questions: [Q1],
      answers: [{ questionId: 'q1', correct: false, response: 'x' }],
    };
    const s2 = makeSession({ journeyId: 'j2' });
    s2.sessionData = {
      questions: [Q2],
      answers: [{ questionId: 'q2', correct: false, response: 'y' }],
    };
    const result = aggregateMistakes([s1, s2], 'j2');
    expect(result).toHaveLength(1);
    expect(result[0].stem).toBe('Capital of France?');
  });

  it('ignores correct answers', () => {
    const s = makeSession({
      sessionData: {
        questions: [Q1],
        answers: [{ questionId: 'q1', correct: true, response: '4' }],
      },
    });
    const result = aggregateMistakes([s]);
    expect(result).toHaveLength(0);
  });
});
