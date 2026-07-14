import { describe, it, expect } from 'vitest';
import { resolveModulePrescription } from '@/utils/failures/resolveModulePrescription';
import { FAILURE_EVIDENCE_VERSION } from '@/utils/failures/constants';

describe('resolveModulePrescription', () => {
  it('returns shouldApply false when no evidence', () => {
    const result = resolveModulePrescription({ moduleId: 'm1', stage: 'B' });
    expect(result.shouldApply).toBe(false);
    expect(result.spec).toBeNull();
  });

  it('returns spec when profile has emerging+ confidence', () => {
    const mod = {
      moduleId: 'm1',
      stage: 'B',
      failureEvidence: JSON.stringify({
        version: FAILURE_EVIDENCE_VERSION,
        concepts: {
          c1: { conceptId: 'c1', modes: { verbatim_trap: { hits: 4, lastAt: Date.now() } } },
        },
        moduleLevel: {},
        processedSessionIds: ['s1'],
      }),
    };
    const result = resolveModulePrescription(mod);
    expect(result.shouldApply).toBe(true);
    expect(result.spec?.prescriptionType).toBe('verbatim_variation');
    expect(result.summary).toBeTruthy();
  });
});
