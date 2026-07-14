import { describe, it, expect } from 'vitest';
import { buildModuleContext } from '@/utils/weeklyPlan/moduleContext';
import { assignActivityType } from '@/utils/weeklyPlan/assignActivityType';
import { buildLaunchSessionData } from '@/utils/planner/buildLaunchSessionData';
import { FAILURE_EVIDENCE_VERSION } from '@/utils/failures/constants';

const activities = [
  { activityId: 'q1', moduleId: 'm1', type: 'practiceQuiz', status: 'ready' },
];

describe('prescriptionPlannerLoop', () => {
  it('transfer_failure evidence → assignment → launch payload', () => {
    const mod = {
      moduleId: 'm1',
      name: 'Cells',
      stage: 'B',
      order: 0,
      failureEvidence: JSON.stringify({
        version: FAILURE_EVIDENCE_VERSION,
        concepts: {
          c1: { conceptId: 'c1', modes: { transfer_failure: { hits: 4, lastAt: Date.now() } } },
        },
        moduleLevel: {},
        processedSessionIds: ['s1', 's2'],
      }),
    };

    const ctx = buildModuleContext(mod, activities, [], null);
    const pick = assignActivityType(ctx, 0);

    expect(pick.prescriptionDriven).toBe(true);
    expect(pick.prescriptionType).toBe('transfer_drill');
    expect(pick.activityType).toBe('practiceQuiz');
    expect(pick.reasonCode).toBe('rx_transfer_drill');

    const launchData = buildLaunchSessionData({
      prescription: pick.prescription,
      quizConfig: pick.quizConfig,
      prescriptionSummary: pick.prescriptionSummary,
    });

    expect(launchData.prescription.primaryMode).toBe('transfer_failure');
    expect(launchData.quizConfig.prescriptionDriven).toBe(true);
  });
});
