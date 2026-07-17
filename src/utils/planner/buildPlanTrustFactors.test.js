import { describe, it, expect } from 'vitest';
import { buildPlanTrustFactors } from './buildPlanTrustFactors';

describe('buildPlanTrustFactors', () => {
  it('includes pacing, budget, and week load factors', () => {
    const factors = buildPlanTrustFactors({
      journey: { title: 'Bio', examDate: null },
      modules: [{ masteryScore: 40, name: 'Cells' }],
      moduleContexts: [{ weakConceptLabels: ['Mitosis'] }],
      snapshot: {
        mode: 'normal',
        dailyBudgetMin: 45,
        daysUntilExam: null,
        days: [{ assignments: [{ activityId: 'a1' }] }, { assignments: [] }],
      },
      mode: 'normal',
      fsrsDueCount: 8,
    });

    const ids = factors.map((f) => f.id);
    expect(ids).toContain('pacing');
    expect(ids).toContain('budget');
    expect(ids).toContain('weak_concepts');
    expect(ids).toContain('fsrs');
    expect(ids).toContain('week_load');
    expect(factors.find((f) => f.id === 'budget').value).toContain('45');
  });
});
