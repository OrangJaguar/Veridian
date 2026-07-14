import { describe, it, expect } from 'vitest';
import { normalizeQuizQuestions } from '@/utils/quiz/normalizeQuizQuestions';

describe('normalizeQuizQuestions', () => {
  it('preserves variantType and mixCategory', () => {
    const result = normalizeQuizQuestions({
      questions: [{
        id: 'q1',
        type: 'multipleChoice',
        stem: 'Apply concept',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        explanation: 'Because',
        variantType: 'transfer',
        mixCategory: 'transfer',
        conceptId: 'c1',
      }],
    }, 1);
    expect(result[0].variantType).toBe('transfer');
    expect(result[0].mixCategory).toBe('transfer');
  });

  it('normalizes matching questions', () => {
    const result = normalizeQuizQuestions({
      questions: [{
        id: 'm1',
        type: 'matching',
        stem: 'Match',
        leftItems: ['A', 'B'],
        rightItems: ['1', '2'],
        correctAnswer: { A: '1', B: '2' },
        explanation: 'Pairs',
      }],
    }, 1);
    expect(result[0].type).toBe('matching');
    expect(result[0].leftItems).toHaveLength(2);
  });

  it('normalizes ordering questions', () => {
    const result = normalizeQuizQuestions({
      questions: [{
        id: 'o1',
        type: 'ordering',
        stem: 'Order',
        items: ['first', 'second', 'third'],
        correctAnswer: ['first', 'second', 'third'],
        explanation: 'Steps',
      }],
    }, 1);
    expect(result[0].type).toBe('ordering');
    expect(result[0].correctAnswer).toEqual(['first', 'second', 'third']);
  });
});
