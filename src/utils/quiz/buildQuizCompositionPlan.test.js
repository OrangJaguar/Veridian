import { describe, it, expect } from 'vitest';
import { buildQuizCompositionPlan } from '@/utils/quiz/buildQuizCompositionPlan';
import { FAILURE_EVIDENCE_VERSION } from '@/utils/failures/constants';

describe('buildQuizCompositionPlan', () => {
  const concepts = [
    { id: 'c1', term: 'Alpha', definition: 'First step in the process sequence' },
    { id: 'c2', term: 'Beta', definition: 'Second concept' },
  ];

  it('caps types for stage A', () => {
    const plan = buildQuizCompositionPlan({
      module: { stage: 'A' },
      setupConfig: { questionCount: 8 },
      concepts,
    });
    const types = new Set(plan.slots.map((s) => s.type));
    expect(types.size).toBeLessThanOrEqual(2);
    expect(plan.slots).toHaveLength(8);
  });

  it('applies prescription questionMix', () => {
    const mod = {
      stage: 'B',
      failureEvidence: JSON.stringify({
        version: FAILURE_EVIDENCE_VERSION,
        concepts: {
          c1: { conceptId: 'c1', modes: { transfer_failure: { hits: 5, lastAt: Date.now() } } },
        },
        moduleLevel: {},
        processedSessionIds: ['s1'],
      }),
    };
    const plan = buildQuizCompositionPlan({
      module: mod,
      failureProfile: {
        hasData: true,
        primaryMode: 'transfer_failure',
        primaryConfidence: 'confirmed',
      },
      prescriptionSpec: {
        prescriptionType: 'transfer_drill',
        activityType: 'practiceQuiz',
        questionMix: { transfer: 4, application: 1 },
      },
      setupConfig: { questionCount: 5 },
      concepts,
    });
    expect(plan.prescriptionType).toBe('transfer_drill');
    expect(plan.slots.some((s) => s.mixCategory === 'transfer')).toBe(true);
  });
});
