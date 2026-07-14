import { describe, it, expect } from 'vitest';
import { parseQuizQuestion } from '@/utils/quiz/questionSchemas';

describe('questionSchemas', () => {
  it('parses multipleChoice', () => {
    const q = parseQuizQuestion({
      id: 'q1',
      type: 'multipleChoice',
      stem: 'What is X?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      explanation: 'Because',
    });
    expect(q?.type).toBe('multipleChoice');
  });

  it('parses ordering', () => {
    const q = parseQuizQuestion({
      id: 'q2',
      type: 'ordering',
      stem: 'Order steps',
      items: ['a', 'b', 'c'],
      correctAnswer: ['a', 'b', 'c'],
      explanation: 'Sequence',
    });
    expect(q?.type).toBe('ordering');
    expect(q?.correctAnswer).toEqual(['a', 'b', 'c']);
  });

  it('parses matching', () => {
    const q = parseQuizQuestion({
      id: 'q3',
      type: 'matching',
      stem: 'Match terms',
      leftItems: ['Term A', 'Term B'],
      rightItems: ['Def A', 'Def B'],
      correctAnswer: { 'Term A': 'Def A', 'Term B': 'Def B' },
      explanation: 'Pairs',
    });
    expect(q?.type).toBe('matching');
  });

  it('rejects invalid question', () => {
    expect(parseQuizQuestion({ id: 'x', type: 'bogus' })).toBeNull();
  });
});
