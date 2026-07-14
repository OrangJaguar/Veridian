import { describe, it, expect } from 'vitest';
import { gradeQuestionResponse } from '@/utils/quiz/gradeQuestionResponse';

describe('gradeQuestionResponse', () => {
  it('grades MCQ', () => {
    const q = {
      type: 'multipleChoice',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'B',
    };
    expect(gradeQuestionResponse('B', q)).toBe(true);
    expect(gradeQuestionResponse('A', q)).toBe(false);
  });

  it('grades shortAnswer fuzzy', () => {
    const q = { type: 'shortAnswer', correctAnswer: 'photosynthesis', matchMode: 'fuzzy' };
    expect(gradeQuestionResponse('Photosynthesis', q)).toBe(true);
  });

  it('grades ordering', () => {
    const q = { type: 'ordering', correctAnswer: ['a', 'b', 'c'] };
    expect(gradeQuestionResponse(['a', 'b', 'c'], q)).toBe(true);
    expect(gradeQuestionResponse(['c', 'b', 'a'], q)).toBe(false);
  });

  it('grades matching', () => {
    const q = {
      type: 'matching',
      correctAnswer: { Alpha: 'One', Beta: 'Two' },
    };
    expect(gradeQuestionResponse({ Alpha: 'One', Beta: 'Two' }, q)).toBe(true);
    expect(gradeQuestionResponse({ Alpha: 'Two', Beta: 'One' }, q)).toBe(false);
  });

  it('grades multiSelect', () => {
    const q = { type: 'multiSelect', correctAnswer: ['A', 'C'], options: ['A', 'B', 'C'] };
    expect(gradeQuestionResponse(['A', 'C'], q)).toBe(true);
    expect(gradeQuestionResponse(['A'], q)).toBe(false);
  });
});
