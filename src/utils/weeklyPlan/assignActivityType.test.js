import { describe, it, expect } from 'vitest';
import { assignActivityType } from '@/utils/weeklyPlan/assignActivityType';
import { buildModuleContext } from '@/utils/weeklyPlan/moduleContext';
import { FAILURE_EVIDENCE_VERSION } from '@/utils/failures/constants';

const baseActivities = [
  { activityId: 'g1', moduleId: 'm1', type: 'learningGuide', status: 'notGenerated' },
  { activityId: 'q1', moduleId: 'm2', type: 'practiceQuiz', status: 'ready', stats: { avgAccuracy: 40 } },
  { activityId: 'f1', moduleId: 'm2', type: 'flashcardSet', status: 'ready' },
  { activityId: 'q2', moduleId: 'm3', type: 'practiceQuiz', status: 'ready' },
  { activityId: 'fy1', moduleId: 'm3', type: 'feynman', status: 'ready' },
  { activityId: 'fr1', moduleId: 'm3', type: 'freeRecall', status: 'ready' },
];

describe('assignActivityType', () => {
  it('Stage A only returns learning guide', () => {
    const ctx = buildModuleContext(
      { moduleId: 'm1', name: 'A', stage: 'A', order: 0 },
      baseActivities,
      [],
    );
    const pick = assignActivityType(ctx, 0);
    expect(pick.activityType).toBe('learningGuide');
  });

  it('Stage B prefers quiz when weak (heuristic fallback)', () => {
    const ctx = buildModuleContext(
      { moduleId: 'm2', name: 'B', stage: 'B', order: 1, masteryScore: 30 },
      baseActivities,
      [],
    );
    const pick = assignActivityType(ctx, 0);
    expect(pick.activityType).toBe('practiceQuiz');
  });

  it('Stage B can prefer flashcards on alternate touch', () => {
    const ctx = buildModuleContext(
      { moduleId: 'm2', name: 'B', stage: 'B', order: 1, masteryScore: 80 },
      baseActivities,
      [],
    );
    const pick = assignActivityType(ctx, 1, { preferFlashcards: true });
    expect(pick.activityType).toBe('flashcardSet');
  });

  it('prescription overrides heuristic when profile confirmed', () => {
    const mod = {
      moduleId: 'm2',
      name: 'B',
      stage: 'B',
      order: 1,
      masteryScore: 90,
      failureEvidence: JSON.stringify({
        version: FAILURE_EVIDENCE_VERSION,
        concepts: {
          c1: { conceptId: 'c1', modes: { transfer_failure: { hits: 4, lastAt: Date.now() } } },
        },
        moduleLevel: {},
        processedSessionIds: ['s1'],
      }),
    };
    const ctx = buildModuleContext(mod, baseActivities, [], null);
    const pick = assignActivityType(ctx, 0, { preferFlashcards: true });
    expect(pick.activityType).toBe('practiceQuiz');
    expect(pick.prescriptionDriven).toBe(true);
    expect(pick.prescriptionType).toBe('transfer_drill');
  });

  it('Stage C uses prescription freeRecall for transfer_failure', () => {
    const mod = {
      moduleId: 'm3',
      name: 'C',
      stage: 'C',
      order: 2,
      failureEvidence: JSON.stringify({
        version: FAILURE_EVIDENCE_VERSION,
        concepts: {
          c1: { conceptId: 'c1', modes: { transfer_failure: { hits: 4, lastAt: Date.now() } } },
        },
        moduleLevel: {},
        processedSessionIds: ['s1'],
      }),
    };
    const ctx = buildModuleContext(mod, baseActivities, [], null);
    const pick = assignActivityType(ctx, 0);
    expect(pick.activityType).toBe('freeRecall');
    expect(pick.prescriptionDriven).toBe(true);
  });
});
