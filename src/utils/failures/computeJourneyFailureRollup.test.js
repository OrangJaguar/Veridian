import { describe, it, expect } from 'vitest';
import { computeJourneyFailureRollup } from '@/utils/failures/computeJourneyFailureRollup';
import { FAILURE_EVIDENCE_VERSION } from '@/utils/failures/constants';

function moduleWithMode(moduleId, name, modeId, hits) {
  return {
    moduleId,
    name,
    failureEvidence: JSON.stringify({
      version: FAILURE_EVIDENCE_VERSION,
      concepts: {
        c1: {
          conceptId: 'c1',
          modes: { [modeId]: { hits, lastAt: Date.now(), samples: [] } },
        },
      },
      moduleLevel: {},
      processedSessionIds: ['s1'],
      updatedAt: Date.now(),
    }),
    knowledgeMap: { concepts: [{ id: 'c1', term: 'Concept' }] },
  };
}

describe('computeJourneyFailureRollup', () => {
  it('aggregates primary modes across modules', () => {
    const journey = { examDate: '2026-12-01' };
    const modules = [
      moduleWithMode('m1', 'Module A', 'transfer_failure', 4),
      moduleWithMode('m2', 'Module B', 'transfer_failure', 5),
      moduleWithMode('m3', 'Module C', 'retention_decay', 3),
    ];

    const rollup = computeJourneyFailureRollup(journey, modules);
    expect(rollup.hasData).toBe(true);
    expect(rollup.modulesWithEvidence).toBe(3);
    expect(rollup.rankedConcerns[0]).toMatchObject({
      modeId: 'transfer_failure',
      moduleCount: 2,
    });
    expect(rollup.moduleSummaries).toHaveLength(3);
  });

  it('returns empty rollup when no module has evidence', () => {
    const rollup = computeJourneyFailureRollup({ examDate: null }, [
      { moduleId: 'm1', name: 'Empty' },
    ]);
    expect(rollup.hasData).toBe(false);
    expect(rollup.rankedConcerns).toEqual([]);
  });
});
