import { describe, it, expect } from 'vitest';
import {
  computeCoverageFromConcepts,
  applyHintPenalty,
  finalizeFreeRecallGrade,
} from '@/utils/study/finalizeFreeRecallGrade';

describe('finalizeFreeRecallGrade', () => {
  it('computes coverage from concept statuses', () => {
    const coverage = computeCoverageFromConcepts([
      { conceptId: 'c1', term: 'A', status: 'covered' },
      { conceptId: 'c2', term: 'B', status: 'missed' },
    ]);
    expect(coverage).toBe(50);
  });

  it('applies hint penalty', () => {
    expect(applyHintPenalty(80, 2)).toBe(64);
    expect(applyHintPenalty(80, 10)).toBe(56);
  });

  it('penalizes copy-paste style all-covered scores when concepts are partial', () => {
    const result = finalizeFreeRecallGrade({
      coveragePercent: 100,
      conceptCoverage: [
        { conceptId: 'c1', term: 'Photosynthesis', status: 'partial' },
        { conceptId: 'c2', term: 'Chloroplast', status: 'missed' },
      ],
      coverageEstimate: 'Partial',
      missedIdeas: [],
      incorrectIdeas: [],
      hintsUsedNote: '',
      nextConceptToRevisit: 'Chloroplast',
      feedback: 'Keep going',
    }, 0);
    expect(result.coveragePercent).toBeLessThan(60);
    expect(result.missedIdeas).toContain('Chloroplast');
  });
});
