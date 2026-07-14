import { describe, it, expect } from 'vitest';
import {
  resolveJourneyPacingMode,
  resolveGlobalPlanMode,
  normalizePlanMode,
  buildPacingMaps,
} from '@/utils/planner/pacingMode';
import { buildGlobalPlan } from '@/utils/planner/buildGlobalPlan';
import { shouldRebuildGlobalPlan } from '@/utils/planner/planStale';

const monday = new Date('2026-07-13T12:00:00'); // Mon

describe('resolveJourneyPacingMode', () => {
  it('null exam → keepSharp', () => {
    expect(resolveJourneyPacingMode(null, monday)).toBe('keepSharp');
  });

  it('past exam → keepSharp', () => {
    const past = new Date('2026-06-01T12:00:00').getTime();
    expect(resolveJourneyPacingMode(past, monday)).toBe('keepSharp');
  });

  it('exam within 7 days → examWeek', () => {
    const soon = new Date('2026-07-16T12:00:00').getTime();
    expect(resolveJourneyPacingMode(soon, monday)).toBe('examWeek');
  });

  it('far future exam → normal', () => {
    const far = new Date('2026-09-01T12:00:00').getTime();
    expect(resolveJourneyPacingMode(far, monday)).toBe('normal');
  });
});

describe('resolveGlobalPlanMode', () => {
  it('examWeek wins over keepSharp', () => {
    const journeys = [
      { journeyId: 'a', examDate: null },
      { journeyId: 'b', examDate: new Date('2026-07-15T12:00:00').getTime() },
    ];
    expect(resolveGlobalPlanMode(journeys, monday)).toBe('examWeek');
  });

  it('all keepSharp → keepSharp', () => {
    const journeys = [
      { journeyId: 'a', examDate: null },
      { journeyId: 'b', examDate: new Date('2026-01-01T12:00:00').getTime() },
    ];
    expect(resolveGlobalPlanMode(journeys, monday)).toBe('keepSharp');
  });
});

describe('normalizePlanMode', () => {
  it('accepts keepSharp and legacy cram', () => {
    expect(normalizePlanMode('keepSharp')).toBe('keepSharp');
    expect(normalizePlanMode('cram')).toBe('examWeek');
  });
});

describe('buildGlobalPlan keepSharp mix', () => {
  it('keeps a 7-day week with mixed keepSharp + examWeek', () => {
    const journeys = [
      {
        journeyId: 'open',
        title: 'Open',
        examDate: null,
        archived: false,
        generationStatus: 'completed',
      },
      {
        journeyId: 'exam',
        title: 'Exam',
        examDate: new Date('2026-07-16T12:00:00').getTime(),
        archived: false,
        generationStatus: 'completed',
      },
    ];
    const modules = [
      {
        moduleId: 'm1',
        journeyId: 'open',
        name: 'M1',
        stage: 'B',
        order: 1,
        knowledgeMap: { concepts: [{ id: 'c1', term: 'T', definition: 'D' }] },
      },
      {
        moduleId: 'm2',
        journeyId: 'exam',
        name: 'M2',
        stage: 'B',
        order: 1,
        knowledgeMap: { concepts: [{ id: 'c2', term: 'T2', definition: 'D2' }] },
      },
    ];
    const activities = [
      { activityId: 'a1', journeyId: 'open', moduleId: 'm1', type: 'practiceQuiz' },
      { activityId: 'a2', journeyId: 'open', moduleId: 'm1', type: 'flashcardSet' },
      { activityId: 'a3', journeyId: 'exam', moduleId: 'm2', type: 'practiceQuiz' },
      { activityId: 'a4', journeyId: 'exam', moduleId: 'm2', type: 'flashcardSet' },
    ];

    const plan = buildGlobalPlan({
      journeys,
      modules,
      activities,
      sessions: [],
      cards: [],
      studyBudgetTier: 'standard',
      now: monday,
    });

    expect(plan.globalSnapshot.days).toHaveLength(7);
    expect(plan.mode).toBe('examWeek');
    expect(plan.journeyProjections.open.mode).toBe('keepSharp');
    expect(plan.journeyProjections.exam.mode).toBe('examWeek');

    const maps = buildPacingMaps(journeys, monday);
    expect(maps.keepSharpByJourneyId.open).toBe(true);
    expect(maps.examWeekByJourneyId.exam).toBe(true);
  });
});

describe('shouldRebuildGlobalPlan keepSharp', () => {
  it('rebuilds when leaving keepSharp for examWeek', () => {
    const prefs = {
      globalPlanWeekKey: '2026-W29',
      globalPlanMode: 'keepSharp',
      globalPlanSnapshot: {
        days: Array.from({ length: 7 }, (_, i) => ({ dayIndex: i })),
        journeyIds: ['j1'],
        journeyModesById: { j1: 'keepSharp' },
      },
    };
    const journeys = [{
      journeyId: 'j1',
      examDate: new Date('2026-07-15T12:00:00').getTime(),
      archived: false,
    }];
    expect(shouldRebuildGlobalPlan(prefs, journeys, monday)).toBe(true);
  });
});
