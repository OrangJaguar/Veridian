import { describe, it, expect } from 'vitest';
import { buildGlobalPlan } from '@/utils/planner/buildGlobalPlan';
import { allocateGlobalDay } from '@/utils/planner/allocation/allocateGlobalDay';
import { GLOBAL_FSRS_CARD_CAP } from '@/utils/planner/constants';
import {
  getDateKey,
  isExamWeek,
  normalizePlanMode,
  isExamWeekMode,
} from '@/utils/weeklyPlan/weekKey';
import { buildModuleContext } from '@/utils/weeklyPlan/moduleContext';

describe('normalizePlanMode / isExamWeek', () => {
  it('maps legacy cram to examWeek', () => {
    expect(normalizePlanMode('cram')).toBe('examWeek');
    expect(normalizePlanMode('examWeek')).toBe('examWeek');
    expect(normalizePlanMode('normal')).toBe('normal');
    expect(isExamWeekMode('cram')).toBe(true);
  });

  it('exams within 7 days are exam week', () => {
    const now = new Date('2026-07-13T12:00:00');
    expect(isExamWeek(now.getTime() + 3 * 86400000, now)).toBe(true);
    expect(isExamWeek(now.getTime() + 40 * 86400000, now)).toBe(false);
  });
});

describe('buildGlobalPlan', () => {
  it('respects global FSRS card cap on today', () => {
    const now = new Date('2026-07-13T12:00:00');
    const journey = { journeyId: 'j1', title: 'Test', examDate: now.getTime() + 30 * 86400000 };
    const cards = Array.from({ length: 80 }, (_, i) => ({
      cardId: `c${i}`,
      journeyId: 'j1',
      activityId: 'a1',
      suspended: false,
      fsrsState: { due: now.getTime() - 1000, state: 1, reps: 1 },
    }));
    const built = buildGlobalPlan({
      journeys: [journey],
      modules: [{ moduleId: 'm1', journeyId: 'j1', name: 'M1', stage: 'B', order: 0 }],
      activities: [
        { activityId: 'a1', journeyId: 'j1', moduleId: 'm1', type: 'practiceQuiz', status: 'ready' },
      ],
      sessions: [],
      cards,
      dailyBudgetMin: 150,
      now,
    });

    const todayKey = getDateKey(now);
    const today = built.globalSnapshot.days.find((d) => d.dateKey === todayKey);
    expect(today.fsrsCardCount).toBeLessThanOrEqual(GLOBAL_FSRS_CARD_CAP);
  });

  it('always builds a 7-day week even when a journey is exam week', () => {
    const now = new Date('2026-07-13T12:00:00');
    const near = {
      journeyId: 'j-near',
      title: 'Near Exam',
      examDate: now.getTime() + 3 * 86400000,
    };
    const far = {
      journeyId: 'j-far',
      title: 'Far Exam',
      examDate: now.getTime() + 40 * 86400000,
    };

    const modules = [
      { moduleId: 'm1', journeyId: 'j-near', name: 'N1', stage: 'B', order: 0 },
      { moduleId: 'm2', journeyId: 'j-far', name: 'F1', stage: 'B', order: 0 },
    ];
    const activities = [
      { activityId: 'a1', journeyId: 'j-near', moduleId: 'm1', type: 'practiceQuiz', status: 'ready' },
      { activityId: 'a2', journeyId: 'j-far', moduleId: 'm2', type: 'practiceQuiz', status: 'ready' },
    ];

    const built = buildGlobalPlan({
      journeys: [near, far],
      modules,
      activities,
      sessions: [],
      cards: [],
      dailyBudgetMin: 150,
      now,
    });

    expect(built.globalSnapshot.days).toHaveLength(7);
    expect(built.mode).toBe('examWeek');
    expect(built.journeyProjections['j-near'].mode).toBe('examWeek');
    expect(built.journeyProjections['j-far'].mode).toBe('normal');
    const uniqueKeys = new Set(built.globalSnapshot.days.map((d) => d.dateKey));
    expect(uniqueKeys.size).toBe(7);
  });
});

describe('allocateGlobalDay exam week consecutive skip', () => {
  it('allows consecutive days for exam-week journeys only', () => {
    const nearMod = { moduleId: 'mNear', journeyId: 'j-near', name: 'Near Mod', stage: 'B', order: 0 };
    const farMod = { moduleId: 'mFar', journeyId: 'j-far', name: 'Far Mod', stage: 'B', order: 0 };
    const nearActs = [
      { activityId: 'aNear', journeyId: 'j-near', moduleId: 'mNear', type: 'practiceQuiz', status: 'ready', stats: { avgAccuracy: 40 } },
    ];
    const farActs = [
      { activityId: 'aFar', journeyId: 'j-far', moduleId: 'mFar', type: 'practiceQuiz', status: 'ready', stats: { avgAccuracy: 40 } },
    ];

    const nearCtx = buildModuleContext(nearMod, nearActs, []);
    const farCtx = buildModuleContext(farMod, farActs, []);

    const { assignments } = allocateGlobalDay({
      dayIndex: 1,
      journeyInputs: [
        {
          journey: { journeyId: 'j-near', title: 'Near', examDate: Date.now() + 2 * 86400000 },
          moduleContexts: [nearCtx],
          activities: nearActs,
          modules: [nearMod],
        },
        {
          journey: { journeyId: 'j-far', title: 'Far', examDate: Date.now() + 40 * 86400000 },
          moduleContexts: [farCtx],
          activities: farActs,
          modules: [farMod],
        },
      ],
      journeyBudgets: { 'j-near': 60, 'j-far': 60 },
      daysUntilExamByJourney: { 'j-near': 2, 'j-far': 40 },
      moduleLastAssignedDay: { mNear: 0, mFar: 0 },
      examWeekByJourneyId: { 'j-near': true, 'j-far': false },
    });

    expect(assignments.some((a) => a.moduleId === 'mNear')).toBe(true);
    expect(assignments.some((a) => a.moduleId === 'mFar')).toBe(false);
  });
});
