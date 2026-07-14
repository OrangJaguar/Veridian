import { describe, it, expect } from 'vitest';
import { computeFailureProfile } from '@/utils/failures/computeFailureProfile';
import { FAILURE_EVIDENCE_VERSION } from '@/utils/failures/constants';

function buildModule(concepts, sessionIds = ['s1']) {
  return {
    moduleId: 'm1',
    knowledgeMap: {
      concepts: [
        { id: 'c1', term: 'Photosynthesis' },
        { id: 'c2', term: 'Respiration' },
      ],
    },
    failureEvidence: JSON.stringify({
      version: FAILURE_EVIDENCE_VERSION,
      concepts,
      moduleLevel: {},
      processedSessionIds: sessionIds,
      updatedAt: Date.now(),
    }),
  };
}

describe('computeFailureProfile', () => {
  const now = Date.now();

  it('returns empty profile when no evidence', () => {
    const profile = computeFailureProfile({ moduleId: 'm1' }, now);
    expect(profile.hasData).toBe(false);
    expect(profile.primaryMode).toBeNull();
    expect(profile.rankedModes).toEqual([]);
  });

  it('ranks modes by hit count and assigns confidence', () => {
    const mod = buildModule({
      c1: {
        conceptId: 'c1',
        modes: {
          transfer_failure: { hits: 5, lastAt: now, samples: [] },
          verbatim_trap: { hits: 2, lastAt: now, samples: [] },
        },
      },
    });

    const profile = computeFailureProfile(mod, now);
    expect(profile.hasData).toBe(true);
    expect(profile.primaryMode).toBe('transfer_failure');
    expect(profile.secondaryMode).toBe('verbatim_trap');
    expect(profile.primaryConfidence).toBe('confirmed');
    expect(profile.rankedModes[0].modeId).toBe('transfer_failure');
  });

  it('excludes modes below emerging threshold from primary', () => {
    const mod = buildModule({
      c1: {
        conceptId: 'c1',
        modes: {
          understanding_gap: { hits: 1, lastAt: now, samples: [] },
        },
      },
    });

    const profile = computeFailureProfile(mod, now);
    expect(profile.hasData).toBe(false);
    expect(profile.primaryMode).toBeNull();
  });

  it('surfaces top concepts with emerging+ hits', () => {
    const mod = buildModule({
      c1: {
        conceptId: 'c1',
        modes: { understanding_gap: { hits: 4, lastAt: now, samples: [] } },
      },
      c2: {
        conceptId: 'c2',
        modes: { retention_decay: { hits: 3, lastAt: now, samples: [] } },
      },
    });

    const profile = computeFailureProfile(mod, now);
    expect(profile.topConcepts.length).toBe(2);
    expect(profile.topConcepts[0].label).toBe('Photosynthesis');
    expect(profile.topConcepts[0].confidence).toBe('confirmed');
  });
});
