import { describe, it, expect } from 'vitest';
import { allocateJourneyBudgets } from '@/utils/planner/allocation/allocateJourneyBudget';
import { PER_JOURNEY_CAP_MULTI, PER_JOURNEY_CAP_SINGLE } from '@/utils/planner/constants';

const j1 = { journeyId: 'j1', title: 'Bio' };
const j2 = { journeyId: 'j2', title: 'Chem' };

describe('allocateJourneyBudgets', () => {
  it('caps each journey at 40 min when multiple journeys', () => {
    const budgets = allocateJourneyBudgets({
      journeys: [j1, j2],
      modules: [],
      sessions: [],
      globalBudgetMin: 150,
      perJourneyCap: { multi: PER_JOURNEY_CAP_MULTI, single: PER_JOURNEY_CAP_SINGLE },
    });
    expect(budgets.j1).toBeLessThanOrEqual(40);
    expect(budgets.j2).toBeLessThanOrEqual(40);
  });

  it('allows up to 70 min for a single journey', () => {
    const budgets = allocateJourneyBudgets({
      journeys: [j1],
      modules: [],
      sessions: [],
      globalBudgetMin: 150,
      perJourneyCap: { multi: PER_JOURNEY_CAP_MULTI, single: PER_JOURNEY_CAP_SINGLE },
    });
    expect(budgets.j1).toBeLessThanOrEqual(70);
    expect(budgets.j1).toBeGreaterThan(40);
  });

  it('total allocated does not exceed global budget', () => {
    const budgets = allocateJourneyBudgets({
      journeys: [j1, j2, { journeyId: 'j3', title: 'Physics' }],
      modules: [],
      sessions: [],
      globalBudgetMin: 150,
      perJourneyCap: { multi: PER_JOURNEY_CAP_MULTI, single: PER_JOURNEY_CAP_SINGLE },
    });
    const total = Object.values(budgets).reduce((a, b) => a + b, 0);
    expect(total).toBeLessThanOrEqual(150);
  });
});
