import { describe, it, expect } from 'vitest';
import { buildNormalWeekPlan } from '@/utils/weeklyPlan/buildNormalWeekPlan';
import { buildModuleContext } from '@/utils/weeklyPlan/moduleContext';
import { sortModulesByUrgency } from '@/utils/weeklyPlan/moduleUrgency';
import { selectCardsForToday, staggerNewCardDueDates } from '@/utils/fsrs/dueTodaySchedule';
import { shouldRebuildPlan } from '@/utils/weeklyPlan/planStale';
import { buildCramDayPlan } from '@/utils/weeklyPlan/buildCramDayPlan';

const journey = { journeyId: 'j1', title: 'Test', examDate: Date.now() + 14 * 86400000 };
const modules = [
  { moduleId: 'm1', name: 'Module One', stage: 'A', order: 0 },
  { moduleId: 'm2', name: 'Module Two', stage: 'B', order: 1, masteryScore: 40 },
];
const activities = [
  { activityId: 'a1', moduleId: 'm1', type: 'learningGuide', status: 'notGenerated', journeyId: 'j1' },
  { activityId: 'a2', moduleId: 'm2', type: 'practiceQuiz', status: 'ready', journeyId: 'j1', stats: { avgAccuracy: 45 } },
];

describe('buildNormalWeekPlan', () => {
  it('assigns Stage A modules only learning guide', () => {
    const contexts = modules.map((m) => buildModuleContext(m, activities, []));
    const plan = buildNormalWeekPlan({ journey, moduleContexts: contexts, cards: [] });
    const allAssignments = plan.days.flatMap((d) => d.assignments);
    const stageAAssignments = allAssignments.filter((a) => a.moduleId === 'm1');
    expect(stageAAssignments.every((a) => a.activityType === 'learningGuide')).toBe(true);
  });

  it('does not assign same module twice on one day', () => {
    const contexts = modules.map((m) => buildModuleContext(m, activities, []));
    const plan = buildNormalWeekPlan({ journey, moduleContexts: contexts, cards: [] });
    for (const day of plan.days) {
      const ids = day.assignments.map((a) => a.moduleId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('buildCramDayPlan', () => {
  it('allows up to 2 non-FSRS assignments', () => {
    const contexts = modules.map((m) => buildModuleContext(m, activities, []));
    const cramJourney = { ...journey, examDate: Date.now() + 3 * 86400000 };
    const plan = buildCramDayPlan({ journey: cramJourney, moduleContexts: contexts, cards: [] });
    const today = plan.days.find((d) => d.assignments.length > 0) ?? plan.days[0];
    expect(today.assignments.length).toBeLessThanOrEqual(2);
  });
});

describe('moduleUrgency', () => {
  it('sorts lower accuracy first', () => {
    const contexts = modules.map((m) => buildModuleContext(m, activities, []));
    const sorted = sortModulesByUrgency(contexts, 14);
    expect(sorted[0].module.moduleId).toBe('m2');
  });
});

describe('dueTodaySchedule', () => {
  it('caps cards at 30', () => {
    const cards = Array.from({ length: 50 }, (_, i) => ({
      cardId: `c${i}`,
      suspended: false,
      fsrsState: { due: Date.now(), reps: 1, state: 1 },
    }));
    const { todayCards } = selectCardsForToday(cards);
    expect(todayCards.length).toBeLessThanOrEqual(30);
  });

  it('staggers new card due dates', () => {
    const dues = staggerNewCardDueDates(20);
    expect(dues).toHaveLength(20);
    expect(dues[0]).toBeLessThanOrEqual(dues[10]);
  });
});

describe('planStale', () => {
  it('rebuilds when snapshot missing', () => {
    expect(shouldRebuildPlan({})).toBe(true);
  });
});
