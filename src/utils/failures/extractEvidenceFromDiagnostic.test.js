import { describe, it, expect } from 'vitest';
import {
  detectFailureModesFromVariants,
  extractEvidenceFromDiagnostic,
  extractEvidenceFromDiagnosticSummary,
} from '@/utils/failures/extractEvidenceFromDiagnostic';

describe('detectFailureModesFromVariants', () => {
  it('detects verbatim_trap when verbatim high but application/transfer low', () => {
    const modes = detectFailureModesFromVariants({
      verbatimAcc: 80,
      applicationAcc: 40,
      transferAcc: 30,
    });
    expect(modes).toContain('verbatim_trap');
  });

  it('detects transfer_failure when transfer low with decent verbatim', () => {
    const modes = detectFailureModesFromVariants({
      verbatimAcc: 60,
      applicationAcc: 55,
      transferAcc: 40,
    });
    expect(modes).toContain('transfer_failure');
  });

  it('detects understanding_gap when all variant accuracies are low', () => {
    const modes = detectFailureModesFromVariants({
      verbatimAcc: 30,
      applicationAcc: 25,
      transferAcc: 20,
    });
    expect(modes).toContain('understanding_gap');
  });
});

describe('extractEvidenceFromDiagnostic', () => {
  const placement = {
    moduleResults: [{
      moduleId: 'm1',
      variantStats: { verbatim: 80, application: 40, transfer: 35 },
      failureSignals: ['verbatimTrap'],
      weakestConceptId: 'c1',
    }],
  };

  it('returns concept and module hits for detected modes', () => {
    const result = extractEvidenceFromDiagnostic({
      placement,
      moduleId: 'm1',
      sessionId: 's1',
    });

    expect(result.conceptHits.length).toBeGreaterThan(0);
    expect(result.conceptHits[0]).toMatchObject({
      conceptId: 'c1',
      modeId: 'verbatim_trap',
      weight: 2,
    });
    expect(result.moduleHits.some((h) => h.modeId === 'verbatim_trap')).toBe(true);
    expect(result.sessionId).toBe('s1');
  });

  it('returns empty hits when module not in placement', () => {
    const result = extractEvidenceFromDiagnostic({
      placement,
      moduleId: 'missing',
      sessionId: 's1',
    });
    expect(result.conceptHits).toEqual([]);
    expect(result.moduleHits).toEqual([]);
  });
});

describe('extractEvidenceFromDiagnosticSummary', () => {
  it('backfills from legacy moduleDiagnosticSummary', () => {
    const summary = {
      variantStats: { verbatim: 30, application: 25, transfer: 20 },
      failureSignals: ['conceptualGap'],
      weakestConceptId: 'term-a',
      completedAt: 1000,
    };

    const result = extractEvidenceFromDiagnosticSummary(summary, { moduleId: 'm1' });
    expect(result.conceptHits).toEqual(expect.arrayContaining([
      expect.objectContaining({ conceptId: 'term-a', modeId: 'understanding_gap' }),
    ]));
    expect(result.moduleHits.length).toBeGreaterThan(0);
  });
});
