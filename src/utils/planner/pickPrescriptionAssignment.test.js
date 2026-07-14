import { describe, it, expect } from 'vitest';
import { pickPrescriptionAssignment } from '@/utils/planner/pickPrescriptionAssignment';
import { buildModuleContext } from '@/utils/weeklyPlan/moduleContext';
import { FAILURE_EVIDENCE_VERSION } from '@/utils/failures/constants';
import { PRESCRIPTION_TYPES } from '@/utils/failures/prescriptionMatrix';

const activities = [
  { activityId: 'g1', moduleId: 'm1', type: 'learningGuide', status: 'ready', content: { sections: [{ id: 's1' }], progress: { completedSectionIds: ['s1'] } } },
  { activityId: 'q1', moduleId: 'm1', type: 'practiceQuiz', status: 'ready' },
  { activityId: 'f1', moduleId: 'm1', type: 'flashcardSet', status: 'ready' },
  { activityId: 'fy1', moduleId: 'm1', type: 'feynman', status: 'ready' },
  { activityId: 'fr1', moduleId: 'm1', type: 'freeRecall', status: 'ready' },
];

function moduleWithMode(modeId, hits = 4, stage = 'B') {
  return {
    moduleId: 'm1',
    name: 'Test',
    stage,
    order: 0,
    failureEvidence: JSON.stringify({
      version: FAILURE_EVIDENCE_VERSION,
      concepts: {
        c1: { conceptId: 'c1', modes: { [modeId]: { hits, lastAt: Date.now() } } },
      },
      moduleLevel: {},
      processedSessionIds: ['s1'],
    }),
  };
}

describe('pickPrescriptionAssignment', () => {
  it('returns null for Stage A incomplete guide', () => {
    const mod = { moduleId: 'm1', name: 'A', stage: 'A', order: 0 };
    const ctx = buildModuleContext(mod, activities, [], null);
    expect(pickPrescriptionAssignment(ctx)).toBeNull();
  });

  it('returns null when no failure profile', () => {
    const mod = { moduleId: 'm1', name: 'B', stage: 'B', order: 0 };
    const ctx = buildModuleContext(mod, activities, [], null);
    expect(pickPrescriptionAssignment(ctx)).toBeNull();
  });

  it.each([
    ['transfer_failure', PRESCRIPTION_TYPES.transfer_drill, 'practiceQuiz'],
    ['verbatim_trap', PRESCRIPTION_TYPES.verbatim_variation, 'practiceQuiz'],
    ['retention_decay', PRESCRIPTION_TYPES.retention_spaced_review, 'flashcardSet'],
    ['pressure_collapse', PRESCRIPTION_TYPES.pressure_timed_drill, 'practiceQuiz'],
  ])('assigns %s at stage B', (modeId, rxType, activityType) => {
    const ctx = buildModuleContext(moduleWithMode(modeId), activities, [], null);
    const pick = pickPrescriptionAssignment(ctx);
    expect(pick).toBeTruthy();
    expect(pick.prescriptionType).toBe(rxType);
    expect(pick.activityType).toBe(activityType);
    expect(pick.prescriptionDriven).toBe(true);
    expect(pick.reasonCode).toMatch(/^rx_/);
  });

  it('assigns transfer_failure stage C to freeRecall', () => {
    const ctx = buildModuleContext(moduleWithMode('transfer_failure', 4, 'C'), activities, [], null);
    const pick = pickPrescriptionAssignment(ctx);
    expect(pick.activityType).toBe('freeRecall');
  });

  it('rotates to secondary mode after prescription fatigue', () => {
    const mod = {
      ...moduleWithMode('transfer_failure'),
      failureEvidence: JSON.stringify({
        version: FAILURE_EVIDENCE_VERSION,
        concepts: {
          c1: {
            conceptId: 'c1',
            modes: {
              transfer_failure: { hits: 5, lastAt: Date.now() },
              interference: { hits: 3, lastAt: Date.now() },
            },
          },
        },
        moduleLevel: {},
        processedSessionIds: ['s1', 's2'],
      }),
    };
    const ctx = buildModuleContext(mod, activities, [], null);
    const pick = pickPrescriptionAssignment(ctx, {
      moduleWeekPrescriptionTypes: {
        m1: ['transfer_drill', 'transfer_drill'],
      },
    });
    expect(pick.primaryMode).toBe('interference');
    expect(pick.prescriptionType).toBe(PRESCRIPTION_TYPES.interference_discrimination);
  });

  it('uses verbatim flashcards when preferFlashcards', () => {
    const ctx = buildModuleContext(moduleWithMode('verbatim_trap'), activities, [], null);
    const pick = pickPrescriptionAssignment(ctx, { preferFlashcards: true });
    expect(pick.activityType).toBe('flashcardSet');
    expect(pick.prescriptionType).toBe(PRESCRIPTION_TYPES.verbatim_flashcards);
    expect(pick.mixedPhrasing).toBe(true);
  });
});
