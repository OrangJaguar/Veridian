import { describe, it, expect } from 'vitest';
import { resolveCorrectAnswer, gradeMcqResponse } from '@/utils/study/resolveCorrectAnswer';

const OPTIONS = [
  'Mitochondria produce ATP',
  'Ribosomes synthesize proteins',
  'Golgi packages proteins',
  'Lysosomes digest waste',
];

describe('resolveCorrectAnswer', () => {
  it('returns exact option match', () => {
    expect(resolveCorrectAnswer(OPTIONS[1], OPTIONS)).toBe(OPTIONS[1]);
  });

  it('resolves letter key B to second option', () => {
    expect(resolveCorrectAnswer('B', OPTIONS)).toBe(OPTIONS[1]);
  });

  it('resolves 1-based numeric index', () => {
    expect(resolveCorrectAnswer('2', OPTIONS)).toBe(OPTIONS[1]);
  });

  it('resolves 0-based numeric index', () => {
    expect(resolveCorrectAnswer('0', OPTIONS)).toBe(OPTIONS[0]);
  });

  it('is case-insensitive for exact match', () => {
    expect(resolveCorrectAnswer('mitochondria produce atp', OPTIONS)).toBe(OPTIONS[0]);
  });

  it('strips letter prefix from answer', () => {
    expect(resolveCorrectAnswer('B) Ribosomes synthesize proteins', OPTIONS)).toBe(OPTIONS[1]);
  });

  it('returns null when unresolvable', () => {
    expect(resolveCorrectAnswer('Z', OPTIONS)).toBeNull();
  });

  it('falls back to first option when answer empty and options exist', () => {
    expect(resolveCorrectAnswer('', OPTIONS)).toBe(OPTIONS[0]);
  });
});

describe('gradeMcqResponse', () => {
  it('marks correct when AI returned letter key', () => {
    expect(gradeMcqResponse(OPTIONS[2], 'C', OPTIONS)).toBe(true);
  });

  it('marks wrong when selection does not match resolved answer', () => {
    expect(gradeMcqResponse(OPTIONS[0], 'B', OPTIONS)).toBe(false);
  });
});
