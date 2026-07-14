import { describe, expect, it } from 'vitest';
import {
  selectQuestionsFromBank,
  selectQuestionsFromCompositionPlan,
  shouldUseQuestionBank,
} from '@/utils/study/sampleQuestionBank';

const BANK = [
  { id: 'q1', stem: 'Q1', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', conceptId: 'c1' },
  { id: 'q2', stem: 'Q2', options: ['A', 'B', 'C', 'D'], correctAnswer: 'B', conceptId: 'c2' },
  { id: 'q3', stem: 'Q3', options: ['A', 'B', 'C', 'D'], correctAnswer: 'C', conceptId: 'c1' },
];

describe('shouldUseQuestionBank', () => {
  it('returns true for certified journeys with a bank', () => {
    expect(shouldUseQuestionBank(
      { isVeridianCertified: true },
      { content: { questionBank: BANK } },
    )).toBe(true);
  });

  it('returns true for certified clones with a bank', () => {
    expect(shouldUseQuestionBank(
      { clonedFromVeridianCertified: true },
      { content: { questionBank: BANK } },
    )).toBe(true);
  });

  it('returns false without a bank', () => {
    expect(shouldUseQuestionBank({ isVeridianCertified: true }, { content: {} })).toBe(false);
  });
});

describe('selectQuestionsFromBank', () => {
  it('returns up to questionCount normalized questions', () => {
    const result = selectQuestionsFromBank(BANK, { questionCount: 2, focusPreset: 'fullReview' });
    expect(result).toHaveLength(2);
    expect(result[0].stem).toBeTruthy();
    expect(result[0].options).toHaveLength(4);
  });

  it('prefers weak concepts when focusPreset is weakSpots', () => {
    const result = selectQuestionsFromBank(
      BANK,
      { questionCount: 2, focusPreset: 'weakSpots' },
      { weakConceptIds: ['c1'] },
    );
    const weakHits = result.filter((q) => q.conceptId === 'c1');
    expect(weakHits.length).toBeGreaterThanOrEqual(1);
  });

  it('fills composition slots from tagged bank items', () => {
    const bank = [
      ...BANK,
      {
        id: 'm1',
        type: 'matching',
        stem: 'Match',
        leftItems: ['A', 'B'],
        rightItems: ['1', '2'],
        correctAnswer: { A: '1', B: '2' },
        explanation: 'Pairs',
        mixCategory: 'discrimination',
        conceptId: 'c1',
      },
    ];
    const plan = {
      slots: [
        { type: 'matching', mixCategory: 'discrimination', conceptId: 'c1' },
        { type: 'multipleChoice', mixCategory: 'understanding', conceptId: 'c2' },
      ],
    };
    const result = selectQuestionsFromCompositionPlan(bank, plan);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('matching');
  });
});
