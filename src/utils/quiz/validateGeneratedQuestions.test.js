import { describe, it, expect } from 'vitest';
import {
  validateGeneratedQuestions,
  collectRejectedStemPreviews,
} from '@/utils/quiz/validateGeneratedQuestions';

function mcq(stem, extras = {}) {
  return {
    type: 'multipleChoice',
    stem,
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    ...extras,
  };
}

describe('validateGeneratedQuestions', () => {
  it('accepts solid MCQs', () => {
    const result = validateGeneratedQuestions([
      mcq('What is the primary purpose of mitochondria in cells?'),
      mcq('How does osmosis differ from simple diffusion across membranes?'),
    ], { expectedCount: 2 });
    expect(result.ok).toBe(true);
    expect(result.questions).toHaveLength(2);
  });

  it('rejects thin stems', () => {
    const result = validateGeneratedQuestions([mcq('Too short')], { expectedCount: 1 });
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('thin_stem');
  });

  it('rejects meta stems', () => {
    const result = validateGeneratedQuestions([
      mcq('As an AI here is a question about mitochondria function in eukaryotic cells'),
    ], { expectedCount: 1 });
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('meta_stem');
  });

  it('rejects duplicate options', () => {
    const result = validateGeneratedQuestions([{
      type: 'multipleChoice',
      stem: 'Which organelle produces most of the cell ATP under aerobic conditions?',
      options: ['mito', 'mito', 'nucleus', 'golgi'],
      correctAnswer: 'mito',
    }], { expectedCount: 1 });
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('duplicate_options');
  });

  it('rejects near-duplicate batch stems', () => {
    const a = 'What is the primary role of mitochondria in eukaryotic animal cells today?';
    const result = validateGeneratedQuestions([mcq(a), mcq(a)], { expectedCount: 2 });
    expect(result.questions.length).toBe(1);
    expect(result.reasons).toContain('near_duplicate_batch');
  });

  it('rejects incomplete matching and ordering', () => {
    const matching = validateGeneratedQuestions([{
      type: 'matching',
      stem: 'Match each organelle to its primary cellular function carefully.',
      leftItems: ['only'],
      rightItems: [],
    }], { expectedCount: 1 });
    expect(matching.reasons).toContain('incomplete_matching');

    const ordering = validateGeneratedQuestions([{
      type: 'ordering',
      stem: 'Put the phases of mitosis into the correct chronological order.',
      items: ['one'],
    }], { expectedCount: 1 });
    expect(ordering.reasons).toContain('incomplete_ordering');
  });

  it('collectRejectedStemPreviews returns truncated stems', () => {
    const rejected = [{ stem: 'x'.repeat(100) }];
    const previews = collectRejectedStemPreviews(rejected, 1);
    expect(previews[0]).toHaveLength(80);
  });
});
