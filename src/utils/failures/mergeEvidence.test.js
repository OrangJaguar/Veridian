import { describe, it, expect } from 'vitest';
import { mergeEvidence, hasProcessedSession } from '@/utils/failures/mergeEvidence';
import { emptyModuleFailureEvidence } from '@/utils/failures/evidenceSchema';

describe('mergeEvidence', () => {
  const now = 1_700_000_000_000;

  it('accumulates hits additively', () => {
    const base = emptyModuleFailureEvidence(now);
    const delta1 = {
      sessionId: 's1',
      conceptHits: [{ conceptId: 'c1', modeId: 'understanding_gap', weight: 1, sample: { sessionId: 's1', activityType: 'quiz', at: now } }],
      moduleHits: [],
    };
    const delta2 = {
      sessionId: 's2',
      conceptHits: [{ conceptId: 'c1', modeId: 'understanding_gap', weight: 2, sample: { sessionId: 's2', activityType: 'quiz', at: now + 1 } }],
      moduleHits: [],
    };

    const after1 = mergeEvidence(base, delta1, now);
    const after2 = mergeEvidence(after1, delta2, now + 1);

    expect(after2.concepts.c1.modes.understanding_gap.hits).toBe(3);
    expect(after2.processedSessionIds).toEqual(['s1', 's2']);
  });

  it('deduplicates by sessionId', () => {
    const base = emptyModuleFailureEvidence(now);
    const delta = {
      sessionId: 's1',
      conceptHits: [{ conceptId: 'c1', modeId: 'verbatim_trap', weight: 1, sample: { sessionId: 's1', activityType: 'quiz', at: now } }],
      moduleHits: [],
    };

    const first = mergeEvidence(base, delta, now);
    const second = mergeEvidence(first, delta, now + 1);

    expect(second.concepts.c1.modes.verbatim_trap.hits).toBe(1);
    expect(second.processedSessionIds).toEqual(['s1']);
  });

  it('caps samples at MAX_SAMPLES_PER_MODE', () => {
    let evidence = emptyModuleFailureEvidence(now);
    for (let i = 0; i < 8; i += 1) {
      evidence = mergeEvidence(evidence, {
        sessionId: `s${i}`,
        conceptHits: [{
          conceptId: 'c1',
          modeId: 'transfer_failure',
          weight: 1,
          sample: { sessionId: `s${i}`, activityType: 'quiz', at: now + i },
        }],
        moduleHits: [],
      }, now + i);
    }

    expect(evidence.concepts.c1.modes.transfer_failure.samples.length).toBeLessThanOrEqual(5);
  });
});

describe('hasProcessedSession', () => {
  it('returns true when session already processed', () => {
    const evidence = { processedSessionIds: ['s1', 's2'] };
    expect(hasProcessedSession(evidence, 's2')).toBe(true);
    expect(hasProcessedSession(evidence, 's3')).toBe(false);
  });
});
