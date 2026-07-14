import { describe, it, expect } from 'vitest';
import { getDueTodayItems } from '@/utils/dueToday/getDueTodayItems';
import { getDateKey } from '@/utils/weeklyPlan/weekKey';

describe('getDueTodayItems', () => {
  it('total estimated minutes stays within global daily budget', () => {
    const now = new Date();
    const dateKey = getDateKey(now);
    const journey = { journeyId: 'j1', title: 'Bio', subject: 'Science' };
    const globalSnapshot = {
      dailyBudgetMin: 150,
      days: [{
        dateKey,
        assignments: [
          {
            journeyId: 'j1',
            moduleId: 'm1',
            moduleName: 'Cells',
            activityId: 'a1',
            activityType: 'practiceQuiz',
            reasonCode: 'scheduled_quiz',
            estimatedMin: 20,
          },
          {
            journeyId: 'j1',
            moduleId: 'm2',
            moduleName: 'Genetics',
            activityId: 'a2',
            activityType: 'learningGuide',
            reasonCode: 'guide_not_started',
            estimatedMin: 25,
          },
        ],
        fsrsByJourney: { j1: 10 },
      }],
    };

    const items = getDueTodayItems({
      journeys: [journey],
      modules: [],
      activities: [],
      cards: [],
      sessions: [],
      globalSnapshot,
    });

    const totalMin = items.reduce((sum, i) => sum + i.estimatedMin, 0);
    expect(totalMin).toBeLessThanOrEqual(150);
    expect(items.some((i) => i.reasonText)).toBe(true);
  });

  it('passes prescription fields from plan assignments', () => {
    const now = new Date();
    const dateKey = getDateKey(now);
    const journey = { journeyId: 'j1', title: 'Bio', subject: 'Science' };
    const globalSnapshot = {
      dailyBudgetMin: 150,
      days: [{
        dateKey,
        assignments: [{
          journeyId: 'j1',
          moduleId: 'm1',
          moduleName: 'Cells',
          activityId: 'a1',
          activityType: 'practiceQuiz',
          reasonCode: 'rx_transfer_drill',
          estimatedMin: 15,
          prescriptionType: 'transfer_drill',
          primaryMode: 'transfer_failure',
          prescriptionSummary: 'Practice applying ideas in new scenarios',
          prescriptionDriven: true,
          quizConfig: { questionCount: 5, prescriptionDriven: true },
        }],
        fsrsByJourney: {},
      }],
    };

    const items = getDueTodayItems({
      journeys: [journey],
      modules: [],
      activities: [],
      cards: [],
      sessions: [],
      globalSnapshot,
    });

    const rxItem = items.find((i) => i.prescriptionType === 'transfer_drill');
    expect(rxItem).toBeTruthy();
    expect(rxItem.prescriptionDriven).toBe(true);
    expect(rxItem.quizConfig).toBeTruthy();
    expect(rxItem.reasonText).toContain('Practice applying');
  });
});
