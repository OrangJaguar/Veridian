import { describe, it, expect, vi, beforeEach } from 'vitest';

const updateModuleMock = vi.fn();

vi.mock('@/api/entities/modules', () => ({
  updateModule: (...args) => updateModuleMock(...args),
}));

import {
  ingestSessionEvidence,
  backfillModuleEvidence,
  loadModuleFailureEvidence,
} from '@/api/entities/failureEvidence';
import { FAILURE_EVIDENCE_VERSION } from '@/utils/failures/constants';

describe('ingestSessionEvidence', () => {
  beforeEach(() => {
    updateModuleMock.mockReset();
    updateModuleMock.mockResolvedValue({});
  });

  it('extracts, merges, and saves evidence for a quiz session', async () => {
    const module = {
      moduleId: 'm1',
      knowledgeMap: { concepts: [{ id: 'c1', term: 'A' }] },
    };
    const session = {
      sessionId: 'sess-1',
      activityType: 'practiceQuiz',
      endedAt: Date.now(),
      sessionData: {
        questions: [{ id: 'q1', conceptId: 'c1', variantType: 'transfer' }],
        answers: [{ questionId: 'q1', correct: false }],
      },
    };

    const result = await ingestSessionEvidence({
      module,
      session,
      activity: { type: 'practiceQuiz' },
    });

    expect(result.concepts.c1.modes.transfer_failure.hits).toBe(1);
    expect(result.processedSessionIds).toContain('sess-1');
    expect(updateModuleMock).toHaveBeenCalledWith('m1', expect.objectContaining({
      failureEvidence: expect.any(String),
    }));
  });

  it('skips save when session already processed', async () => {
    const existing = {
      version: FAILURE_EVIDENCE_VERSION,
      concepts: {
        c1: {
          conceptId: 'c1',
          modes: { understanding_gap: { hits: 2, lastAt: Date.now(), samples: [] } },
        },
      },
      moduleLevel: {},
      processedSessionIds: ['sess-dup'],
      updatedAt: Date.now(),
    };

    const module = {
      moduleId: 'm1',
      failureEvidence: JSON.stringify(existing),
    };
    const session = {
      sessionId: 'sess-dup',
      activityType: 'practiceQuiz',
      sessionData: { questions: [], answers: [] },
    };

    await ingestSessionEvidence({ module, session, activity: { type: 'practiceQuiz' } });
    expect(updateModuleMock).not.toHaveBeenCalled();
  });
});

describe('backfillModuleEvidence', () => {
  beforeEach(() => {
    updateModuleMock.mockReset();
    updateModuleMock.mockResolvedValue({});
  });

  it('replays sessions without double-counting', async () => {
    const module = {
      moduleId: 'm1',
      moduleDiagnosticSummary: JSON.stringify({
        variantStats: { verbatim: 30, application: 20, transfer: 15 },
        failureSignals: ['conceptualGap'],
        weakestConceptId: 'c1',
        sessionId: 'diag-1',
      }),
      knowledgeMap: { concepts: [{ id: 'c1', term: 'A' }] },
    };

    const sessions = [
      {
        sessionId: 's1',
        status: 'completed',
        moduleId: 'm1',
        activityType: 'practiceQuiz',
        endedAt: Date.now(),
        sessionData: {
          questions: [{ id: 'q1', conceptId: 'c1' }],
          answers: [{ questionId: 'q1', correct: false }],
        },
      },
      {
        sessionId: 's1',
        status: 'completed',
        moduleId: 'm1',
        activityType: 'practiceQuiz',
        endedAt: Date.now(),
        sessionData: {
          questions: [{ id: 'q1', conceptId: 'c1' }],
          answers: [{ questionId: 'q1', correct: false }],
        },
      },
    ];

    const evidence = await backfillModuleEvidence(module, sessions);
    const loaded = loadModuleFailureEvidence({ failureEvidence: JSON.stringify(evidence) });

    expect(loaded.processedSessionIds.filter((id) => id === 's1')).toHaveLength(1);
    expect(loaded.concepts.c1.modes.understanding_gap.hits).toBeGreaterThanOrEqual(2);
    expect(updateModuleMock).toHaveBeenCalled();
  });
});
