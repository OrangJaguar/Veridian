import { describe, it, expect } from 'vitest';
import { aggregateQuizConceptResults } from './aggregateQuizConceptResults';

describe('aggregateQuizConceptResults', () => {
  const concepts = [
    { id: 'c1', term: 'Mitosis', definition: 'Cell division' },
    { id: 'c2', term: 'Meiosis', definition: 'Gamete division' },
  ];

  it('aggregates accuracy and status per concept', () => {
    const questions = [
      { id: 'q1', conceptId: 'c1' },
      { id: 'q2', conceptId: 'c1' },
      { id: 'q3', conceptId: 'c2' },
    ];
    const answers = [
      { questionId: 'q1', correct: true, timeSec: 4 },
      { questionId: 'q2', correct: false, timeSec: 6 },
      { questionId: 'q3', correct: false, timeSec: 5 },
    ];

    const rows = aggregateQuizConceptResults({ questions, answers, concepts });
    expect(rows).toHaveLength(2);
    expect(rows[0].conceptId).toBe('c2');
    expect(rows[0].status).toBe('needs_work');
    expect(rows[1].conceptId).toBe('c1');
    expect(rows[1].accuracy).toBe(50);
    expect(rows[1].status).toBe('shaky');
    expect(rows[1].avgTimeSec).toBe(5);
  });

  it('marks unanswered concepts as skipped', () => {
    const questions = [{ id: 'q1', conceptId: 'c1' }];
    const answers = [{ questionId: 'q1', correct: false, skipped: true }];
    const rows = aggregateQuizConceptResults({ questions, answers, concepts });
    expect(rows[0].status).toBe('skipped');
    expect(rows[0].attempts).toBe(0);
  });

  it('ignores questions without conceptId', () => {
    const rows = aggregateQuizConceptResults({
      questions: [{ id: 'q1' }],
      answers: [{ questionId: 'q1', correct: true }],
      concepts,
    });
    expect(rows).toHaveLength(0);
  });
});
